import { useState, useEffect } from 'react'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Plus, FileText, DollarSign, Percent, Clock, Shield } from 'lucide-react'

/* Credit Score Gauge */
function CreditGauge({ score = 700 }) {
    const pct = Math.min(100, Math.max(0, ((score - 300) / 550) * 100))
    const color = score >= 740 ? '#34d399' : score >= 670 ? '#fbbf24' : '#fb7185'
    const label = score >= 740 ? 'Excellent' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor'
    const dashLen = 188 * (pct / 100)
    return (
        <div style={{ textAlign: 'center' }}>
            <svg width="140" height="80" viewBox="0 0 140 80">
                <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
                <motion.path
                    d="M 10 70 A 60 60 0 0 1 130 70"
                    fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${dashLen} 300`}
                    initial={{ strokeDasharray: '0 300' }}
                    animate={{ strokeDasharray: `${dashLen} 300` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
                />
                <text x="70" y="55" textAnchor="middle" fill="var(--nx-text)" fontSize="22" fontWeight="700" fontFamily="var(--font-mono)">{score}</text>
                <text x="70" y="72" textAnchor="middle" fill={color} fontSize="9" fontWeight="600" fontFamily="var(--font-display)" letterSpacing="0.1em">{label.toUpperCase()}</text>
            </svg>
        </div>
    )
}

export default function Loans() {
    const [loans, setLoans] = useState([])
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ account_id: '', principal: '', interest_rate: '5.5', term_months: '12', credit_score: '700', debt_to_income: '0.35' })
    const [msg, setMsg] = useState(null)

    useEffect(() => {
        Promise.all([api.get('/banking/loans').catch(() => ({ data: [] })), api.get('/banking/accounts').catch(() => ({ data: [] }))])
            .then(([l, a]) => { setLoans(l.data); setAccounts(a.data); setLoading(false) })
    }, [])

    const handleApply = async (e) => {
        e.preventDefault(); setMsg(null)
        try {
            const payload = { account_id: parseInt(form.account_id), principal: parseFloat(form.principal), interest_rate: parseFloat(form.interest_rate), term_months: parseInt(form.term_months), credit_score: parseInt(form.credit_score), debt_to_income: parseFloat(form.debt_to_income) }
            const r = await api.post('/banking/loans', payload)
            setLoans([...loans, r.data]); setShowForm(false); setMsg({ type: 'success', text: 'Application submitted successfully' })
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.detail || 'Application failed' }) }
    }

    const statusColor = { pending: 'nx-badge-amber', approved: 'nx-badge-green', rejected: 'nx-badge-red', active: 'nx-badge-cyan', closed: 'nx-badge-muted' }
    const totalOutstanding = loans.filter(l => l.status === 'active' || l.status === 'approved').reduce((s, l) => s + parseFloat(l.principal || 0), 0)

    if (loading) return <div className="animate-in"><div className="nx-skeleton" style={{ height: 60, marginBottom: 12 }} /><div className="nx-skeleton" style={{ height: 200 }} /></div>

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>CREDIT & LOANS</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Manage credit applications and active loans</p>
                </div>
                <motion.button onClick={() => setShowForm(!showForm)} className="nx-btn nx-btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Plus size={15} /> Apply for Credit
                </motion.button>
            </div>

            {msg && <div className={`nx-alert ${msg.type === 'success' ? 'nx-alert-success' : 'nx-alert-error'}`} style={{ marginBottom: 16 }}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

            {/* Overview Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 200px', gap: 14, marginBottom: 20 }}>
                <motion.div className="nx-kpi cyan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Active Loans</div>
                    <div className="nx-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-cyan)', marginTop: 4 }}>{loans.filter(l => l.status === 'active').length}</div>
                </motion.div>
                <motion.div className="nx-kpi violet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Outstanding</div>
                    <div className="nx-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-violet)', marginTop: 4 }}>${totalOutstanding.toLocaleString()}</div>
                </motion.div>
                <motion.div className="nx-kpi emerald" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Applications</div>
                    <div className="nx-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-emerald)', marginTop: 4 }}>{loans.length}</div>
                </motion.div>
                <motion.div className="nx-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>Credit Score</div>
                    <CreditGauge score={720} />
                </motion.div>
            </div>

            {/* Application Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div className="nx-card-static" style={{ marginBottom: 20, padding: '1.5rem' }}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>NEW APPLICATION</h3>
                        <form onSubmit={handleApply} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            <div><label className="nx-label">Account</label><select className="nx-select" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required><option value="">Select</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.account_number}</option>)}</select></div>
                            <div><label className="nx-label">Amount ($)</label><input type="number" className="nx-input nx-mono" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} placeholder="10,000" required /></div>
                            <div><label className="nx-label">Rate (%)</label><input type="number" className="nx-input nx-mono" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} step="0.1" /></div>
                            <div><label className="nx-label">Term (months)</label><input type="number" className="nx-input nx-mono" value={form.term_months} onChange={e => setForm({ ...form, term_months: e.target.value })} /></div>
                            <div><label className="nx-label">Credit Score</label><input type="number" className="nx-input nx-mono" value={form.credit_score} onChange={e => setForm({ ...form, credit_score: e.target.value })} /></div>
                            <div><label className="nx-label">Debt-to-Income</label><input type="number" className="nx-input nx-mono" value={form.debt_to_income} onChange={e => setForm({ ...form, debt_to_income: e.target.value })} step="0.01" /></div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <motion.button type="submit" className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.75rem' }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                                    <FileText size={14} /> Submit Application
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loans Table */}
            <motion.div className="nx-card-static" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <table className="nx-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Amount</th><th>Rate</th><th>Term</th><th>EMI</th><th>Status</th><th>Approval</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--nx-text-dim)' }}>
                                <TrendingUp size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><br />No credit applications yet
                            </td></tr>
                        ) : loans.map(l => (
                            <tr key={l.id}>
                                <td className="nx-mono" style={{ fontSize: 12 }}>#{l.id}</td>
                                <td className="nx-mono" style={{ fontWeight: 600, color: 'var(--nx-text)' }}>${parseFloat(l.principal).toLocaleString()}</td>
                                <td className="nx-mono">{parseFloat(l.interest_rate)}%</td>
                                <td>{l.term_months}mo</td>
                                <td className="nx-mono">${parseFloat(l.emi_amount || 0).toLocaleString()}</td>
                                <td><span className={`nx-badge ${statusColor[l.status] || 'nx-badge-muted'}`} style={{ textTransform: 'capitalize' }}>{l.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div className="nx-progress" style={{ width: 60 }}>
                                            <div className="nx-progress-bar" style={{
                                                width: `${(parseFloat(l.approval_probability || 0) * 100)}%`,
                                                background: parseFloat(l.approval_probability || 0) > 0.7 ? 'var(--nx-emerald)' : parseFloat(l.approval_probability || 0) > 0.4 ? 'var(--nx-amber)' : 'var(--nx-rose)',
                                            }} />
                                        </div>
                                        <span className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>
                                            {Math.round((parseFloat(l.approval_probability || 0)) * 100)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    )
}
