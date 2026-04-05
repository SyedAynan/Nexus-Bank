import { useState, useEffect } from 'react'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CreditCard, Plus, Pause, Play, X, Check, Clock, DollarSign, RefreshCw } from 'lucide-react'

export default function BillPay() {
    const [payments, setPayments] = useState([])
    const [payees, setPayees] = useState([])
    const [summary, setSummary] = useState({})
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ payee_id: '', payee_name: '', amount: '', frequency: 'monthly', next_date: '', auto_pay: false, category: 'other', logo: '📄' })
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchAll() }, [])

    const fetchAll = () => {
        setLoading(true)
        Promise.all([
            api.get('/services/billpay/scheduled').catch(() => ({ data: [] })),
            api.get('/services/billpay/payees').catch(() => ({ data: [] })),
            api.get('/services/billpay/summary').catch(() => ({ data: {} })),
        ]).then(([p, py, s]) => {
            setPayments(p.data || [])
            setPayees(py.data || [])
            setSummary(s.data || {})
            setLoading(false)
        })
    }

    const handleSchedule = () => {
        api.post('/services/billpay/schedule', form).then(() => { fetchAll(); setShowForm(false); setForm({ payee_id: '', payee_name: '', amount: '', frequency: 'monthly', next_date: '', auto_pay: false, category: 'other', logo: '📄' }) })
    }

    const handleAction = (id, action) => { api.post(`/services/billpay/${id}/${action}`).then(fetchAll) }

    const selectPayee = (p) => { setForm(f => ({ ...f, payee_id: p.id, payee_name: p.name, category: p.category, logo: p.logo })) }

    const freqLabel = { monthly: 'Monthly', weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }
    const statusColors = { active: '#22d3ee', paused: '#f59e0b', cancelled: '#ef4444' }

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>BILL PAY</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Scheduled payments & recurring transfers</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="nx-btn nx-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> Schedule Payment
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Active Payments', value: summary.active || 0, icon: Check, color: '#22d3ee' },
                    { label: 'Monthly Total', value: `$${(summary.monthly_total || 0).toLocaleString()}`, icon: DollarSign, color: '#a78bfa' },
                    { label: 'Auto-Pay', value: summary.auto_pay_count || 0, icon: RefreshCw, color: '#34d399' },
                    { label: 'Total Paid', value: `$${(summary.total_paid_all_time || 0).toLocaleString()}`, icon: CreditCard, color: '#f59e0b' },
                ].map((card, i) => (
                    <motion.div key={i} className="nx-card-static" style={{ padding: '1.2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}18`, border: `1px solid ${card.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <card.icon size={18} color={card.color} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{card.label}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>{card.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* New Payment Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 24 }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Schedule New Payment</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {payees.map(p => (
                                <button key={p.id} onClick={() => selectPayee(p)} style={{
                                    padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: form.payee_id === p.id ? '1px solid var(--nx-cyan)' : '1px solid var(--nx-border)',
                                    background: form.payee_id === p.id ? 'rgba(34,211,238,0.1)' : 'var(--nx-bg-3)', color: 'var(--nx-text)', display: 'flex', alignItems: 'center', gap: 6
                                }}>{p.logo} {p.name}</button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            <div>
                                <label className="nx-label">Amount ($)</label>
                                <input type="number" className="nx-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="nx-label">Frequency</label>
                                <select className="nx-select" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <label className="nx-label">Next Payment Date</label>
                                <input type="date" className="nx-input" value={form.next_date} onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--nx-text-muted)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.auto_pay} onChange={e => setForm(f => ({ ...f, auto_pay: e.target.checked }))} /> Auto-pay
                            </label>
                            <div style={{ flex: 1 }} />
                            <button onClick={() => setShowForm(false)} className="nx-btn" style={{ fontSize: 13 }}>Cancel</button>
                            <button onClick={handleSchedule} disabled={!form.payee_id || !form.amount || !form.next_date} className="nx-btn nx-btn-primary" style={{ fontSize: 13 }}>Schedule</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {payments.map((p, i) => (
                    <motion.div key={p.id} className="nx-card-static" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: 16 }}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ fontSize: 28 }}>{p.logo || '📄'}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)' }}>{p.payee_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--nx-text-muted)', display: 'flex', gap: 12, marginTop: 4 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {p.next_date}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {freqLabel[p.frequency] || p.frequency}</span>
                                {p.auto_pay && <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={11} /> Auto</span>}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)' }}>${p.amount?.toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: statusColors[p.status] || '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.status}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {p.status === 'active' && <button onClick={() => handleAction(p.id, 'pause')} title="Pause" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}><Pause size={14} color="#f59e0b" /></button>}
                            {p.status === 'paused' && <button onClick={() => handleAction(p.id, 'resume')} title="Resume" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}><Play size={14} color="#22d3ee" /></button>}
                            {p.status !== 'cancelled' && <button onClick={() => handleAction(p.id, 'cancel')} title="Cancel" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}><X size={14} color="#ef4444" /></button>}
                        </div>
                    </motion.div>
                ))}
                {!loading && payments.length === 0 && (
                    <div className="nx-card-static" style={{ padding: 40, textAlign: 'center', color: 'var(--nx-text-muted)' }}>No scheduled payments yet. Click "Schedule Payment" to get started.</div>
                )}
            </div>
        </div>
    )
}
