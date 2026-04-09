import { useState, useEffect } from 'react'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CheckCircle, AlertCircle, Clock, Zap, Shield, Globe, CreditCard, Users, DollarSign } from 'lucide-react'
import { getDemoAccounts } from '../../data/simulationEngine'

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000, 5000]
const RECENT_RECIPIENTS = [
    { name: 'Sarah K.', account: 'NX-4821', avatar: 'SK', color: '#a78bfa' },
    { name: 'James M.', account: 'NX-7392', avatar: 'JM', color: '#22d3ee' },
    { name: 'ACME Corp', account: 'NX-1058', avatar: 'AC', color: '#34d399' },
    { name: 'David L.', account: 'NX-9284', avatar: 'DL', color: '#fbbf24' },
]

export default function Transfer() {
    const [accounts, setAccounts] = useState([])
    const [tab, setTab] = useState('deposit')
    const [form, setForm] = useState({ account_id: '', amount: '', to_account: '', description: '' })
    const [msg, setMsg] = useState(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('form') // form | confirm | success

    useEffect(() => {
        api.get('/banking/accounts').then(r => {
            setAccounts(r.data?.length > 0 ? r.data : getDemoAccounts())
        }).catch(() => setAccounts(getDemoAccounts()))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (step === 'form') { setStep('confirm'); return }
        setLoading(true); setMsg(null)
        try {
            const payload = tab === 'transfer'
                ? { from_account_id: parseInt(form.account_id), to_account_id: parseInt(form.to_account), amount: parseFloat(form.amount), type: 'transfer', description: form.description || 'Transfer' }
                : { account_id: parseInt(form.account_id), amount: parseFloat(form.amount), type: tab, description: form.description || tab }
            await api.post(tab === 'transfer' ? '/banking/transfer' : '/banking/transactions', payload)
            setStep('success')
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.detail || 'Transaction failed' })
            setStep('form')
        } finally { setLoading(false) }
    }

    const resetForm = () => { setStep('form'); setForm({ ...form, amount: '', description: '' }); setMsg(null) }
    const tabIcons = { deposit: ArrowDownLeft, withdrawal: ArrowUpRight, transfer: ArrowLeftRight }
    const tabColors = { deposit: '#34d399', withdrawal: '#fb7185', transfer: '#22d3ee' }
    const selectedAccount = accounts.find(a => a.id?.toString() === form.account_id)

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={22} color="#22d3ee" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>PAYMENTS</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>Send, receive, and manage funds securely</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={12} color="var(--nx-emerald)" />
                    <span style={{ fontSize: 10, color: 'var(--nx-emerald)', fontFamily: 'var(--font-display)' }}>AES-256 ENCRYPTED</span>
                </div>
            </motion.div>

            {/* Tab Selector */}
            <div className="nx-tabs" style={{ marginBottom: 24, display: 'inline-flex' }}>
                {['deposit', 'withdrawal', 'transfer'].map(t => {
                    const Icon = tabIcons[t]
                    return (
                        <button key={t} onClick={() => { setTab(t); resetForm() }} className={`nx-tab ${tab === t ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                            <Icon size={13} /> {t}
                        </button>
                    )
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Left: Payment Form */}
                <div>
                    {msg && <div className={`nx-alert ${msg.type === 'success' ? 'nx-alert-success' : 'nx-alert-error'}`} style={{ marginBottom: 16 }}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

                    <AnimatePresence mode="wait">
                        {step === 'success' ? (
                            <motion.div key="success" className="nx-card-static" style={{ padding: '3rem', textAlign: 'center' }}
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                <div className="nx-success-icon">
                                    <CheckCircle size={36} color="#34d399" />
                                </div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginTop: 20 }}>
                                    {tab.toUpperCase()} COMPLETE
                                </h2>
                                <div className="nx-mono" style={{ fontSize: 32, fontWeight: 700, color: tabColors[tab], marginTop: 8 }}>
                                    ${parseFloat(form.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--nx-text-dim)', marginTop: 8 }}>{form.description || 'Transaction processed'}</p>
                                <motion.button onClick={resetForm} className="nx-btn nx-btn-primary" style={{ marginTop: 20 }} whileHover={{ scale: 1.02 }}>
                                    New Transaction
                                </motion.button>
                            </motion.div>
                        ) : step === 'confirm' ? (
                            <motion.div key="confirm" className="nx-card-static" style={{ padding: '2rem' }}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 20, textAlign: 'center' }}>
                                    CONFIRM {tab.toUpperCase()}
                                </h3>
                                <div style={{ padding: '16px', borderRadius: 12, background: `${tabColors[tab]}08`, border: `1px solid ${tabColors[tab]}20`, textAlign: 'center', marginBottom: 20 }}>
                                    <div className="nx-mono" style={{ fontSize: 36, fontWeight: 700, color: tabColors[tab] }}>
                                        ${parseFloat(form.amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>{tab === 'deposit' ? 'Deposit to' : tab === 'withdrawal' ? 'Withdraw from' : 'Transfer'}</div>
                                </div>
                                {[
                                    { label: 'Account', value: selectedAccount?.account_number || form.account_id },
                                    { label: 'Type', value: tab.charAt(0).toUpperCase() + tab.slice(1) },
                                    { label: 'Description', value: form.description || 'None' },
                                ].map((r, i) => (
                                    <div key={i} className="nx-stat-row">
                                        <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{r.label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{r.value}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                    <button onClick={() => setStep('form')} className="nx-btn nx-btn-outline" style={{ flex: 1 }}>Back</button>
                                    <motion.button onClick={handleSubmit} disabled={loading} className="nx-btn nx-btn-primary" style={{ flex: 2 }} whileHover={{ scale: 1.02 }}>
                                        {loading ? <><Clock size={14} /> Processing...</> : <><Send size={14} /> Confirm</>}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="form" className="nx-card-static" style={{ padding: '2rem' }}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label className="nx-label">{tab === 'transfer' ? 'From Account' : 'Account'}</label>
                                        <select className="nx-select" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required>
                                            <option value="">Select account</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} — ${parseFloat(a.balance).toLocaleString()}</option>)}
                                        </select>
                                    </div>
                                    {tab === 'transfer' && (
                                        <div>
                                            <label className="nx-label">To Account</label>
                                            <select className="nx-select" value={form.to_account} onChange={e => setForm({ ...form, to_account: e.target.value })} required>
                                                <option value="">Select recipient</option>
                                                {accounts.filter(a => a.id?.toString() !== form.account_id).map(a => <option key={a.id} value={a.id}>{a.account_number}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="nx-label">Amount (USD)</label>
                                        <input type="number" className="nx-input nx-mono" style={{ fontSize: 24, padding: '1rem', textAlign: 'center' }}
                                            placeholder="0.00" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                        {/* Quick amount chips */}
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                            {QUICK_AMOUNTS.map(amt => (
                                                <button key={amt} type="button" onClick={() => setForm({ ...form, amount: amt.toString() })}
                                                    style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${form.amount === amt.toString() ? tabColors[tab] + '50' : 'var(--nx-border)'}`,
                                                        background: form.amount === amt.toString() ? `${tabColors[tab]}10` : 'transparent',
                                                        cursor: 'pointer', fontSize: 11, color: form.amount === amt.toString() ? tabColors[tab] : 'var(--nx-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                    ${amt.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="nx-label">Description</label>
                                        <input type="text" className="nx-input" placeholder="Optional note" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                    <motion.button type="submit" className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: 14 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Send size={15} /> Review {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </motion.button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Quick Access + Security */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Recent Recipients */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 14 }}>
                            <Users size={14} color="var(--nx-cyan)" style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            RECENT RECIPIENTS
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {RECENT_RECIPIENTS.map((r, i) => (
                                <motion.div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,211,238,0.02)', border: '1px solid var(--nx-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                                    whileHover={{ borderColor: 'rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.04)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${r.color}15`, border: `1px solid ${r.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: r.color }}>{r.avatar}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{r.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{r.account}</div>
                                    </div>
                                    <Send size={12} color="var(--nx-text-dim)" />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Payment Stats */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 14 }}>
                            PAYMENT STATS
                        </h3>
                        {[
                            { label: 'This Month', value: '$12,450', color: 'var(--nx-cyan)' },
                            { label: 'Avg Transaction', value: '$380', color: 'var(--nx-violet)' },
                            { label: 'Success Rate', value: '99.8%', color: 'var(--nx-emerald)' },
                            { label: 'Pending', value: '0', color: 'var(--nx-amber)' },
                        ].map((s, i) => (
                            <div key={i} className="nx-stat-row">
                                <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{s.label}</span>
                                <span className="nx-mono" style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Security Banner */}
                    <motion.div className="nx-ai-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Shield size={12} color="#34d399" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>SECURE PAYMENTS</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>
                            All payments are processed via <strong style={{ color: 'var(--nx-cyan)' }}>NEXUS Secure Gateway</strong> with
                            end-to-end encryption, MFA verification, and real-time fraud monitoring.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
