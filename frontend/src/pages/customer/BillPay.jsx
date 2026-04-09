import { useState, useEffect } from 'react'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CreditCard, Plus, Pause, Play, X, Check, Clock, DollarSign, RefreshCw, Receipt, Sparkles, Zap, TrendingDown, Shield, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getDemoBillPayData } from '../../data/simulationEngine'

const CATEGORY_COLORS = {
    entertainment: '#a78bfa',
    utilities: '#fbbf24',
    telecom: '#22d3ee',
    health: '#34d399',
    insurance: '#3b82f6',
    tech: '#fb7185',
    shopping: '#f59e0b',
    other: '#4a5578',
}

export default function BillPay() {
    const [payments, setPayments] = useState([])
    const [payees, setPayees] = useState([])
    const [summary, setSummary] = useState({})
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ payee_id: '', payee_name: '', amount: '', frequency: 'monthly', next_date: '', auto_pay: false, category: 'other', logo: '📄' })
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(new Date())

    useEffect(() => { fetchAll() }, [])

    // Auto-refresh time display
    useEffect(() => {
        const intv = setInterval(() => setLastUpdate(new Date()), 30000)
        return () => clearInterval(intv)
    }, [])

    const fetchAll = () => {
        setLoading(true)
        Promise.all([
            api.get('/services/billpay/scheduled').catch(() => ({ data: [] })),
            api.get('/services/billpay/payees').catch(() => ({ data: [] })),
            api.get('/services/billpay/summary').catch(() => ({ data: {} })),
        ]).then(([p, py, s]) => {
            const demo = getDemoBillPayData()
            setPayments(p.data?.length > 0 ? p.data : demo.payments)
            setPayees(py.data?.length > 0 ? py.data : demo.payees)
            setSummary(Object.keys(s.data || {}).length > 0 ? s.data : demo.summary)
            setLoading(false)
        })
    }

    const handleSchedule = () => {
        api.post('/services/billpay/schedule', form).then(() => { fetchAll(); setShowForm(false); setForm({ payee_id: '', payee_name: '', amount: '', frequency: 'monthly', next_date: '', auto_pay: false, category: 'other', logo: '📄' }) }).catch(() => {
            // Fallback: add to local state
            const newPayment = { id: Date.now(), ...form, amount: parseFloat(form.amount), status: 'active' }
            setPayments(prev => [newPayment, ...prev])
            setShowForm(false)
            setForm({ payee_id: '', payee_name: '', amount: '', frequency: 'monthly', next_date: '', auto_pay: false, category: 'other', logo: '📄' })
        })
    }

    const handleAction = (id, action) => {
        api.post(`/services/billpay/${id}/${action}`).then(fetchAll).catch(() => {
            // Fallback: update local state
            setPayments(prev => prev.map(p => {
                if (p.id !== id) return p
                if (action === 'pause') return { ...p, status: 'paused' }
                if (action === 'resume') return { ...p, status: 'active' }
                if (action === 'cancel') return { ...p, status: 'cancelled' }
                return p
            }))
        })
    }

    const selectPayee = (p) => { setForm(f => ({ ...f, payee_id: p.id, payee_name: p.name, category: p.category, logo: p.logo })) }

    const freqLabel = { monthly: 'Monthly', weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }
    const statusColors = { active: '#34d399', paused: '#fbbf24', cancelled: '#fb7185' }

    // Category breakdown for pie chart
    const categoryTotals = payments.filter(p => p.status === 'active').reduce((acc, p) => {
        const cat = p.category || 'other'
        acc[cat] = (acc[cat] || 0) + (p.amount || 0)
        return acc
    }, {})
    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value * 100) / 100,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other,
    }))

    // Upcoming payment (next one due)
    const upcoming = [...payments].filter(p => p.status === 'active').sort((a, b) => new Date(a.next_date) - new Date(b.next_date))[0]
    const daysUntilNext = upcoming ? Math.max(0, Math.ceil((new Date(upcoming.next_date) - new Date()) / (1000 * 60 * 60 * 24))) : null

    if (loading) return (
        <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 100 }} />)}
            </div>
        </div>
    )

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Receipt size={22} color="#a78bfa" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>BILL PAY INTELLIGENCE</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>Smart payment scheduling & spending automation</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="nx-live-indicator"><div className="dot" /> Live · {lastUpdate.toLocaleTimeString()}</div>
                    <motion.button onClick={() => setShowForm(!showForm)} className="nx-btn nx-btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Plus size={15} /> Schedule Payment
                    </motion.button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Active Payments', value: summary.active || payments.filter(p => p.status === 'active').length, icon: Check, accent: 'cyan' },
                    { label: 'Monthly Total', value: `$${(summary.monthly_total || payments.filter(p => p.status === 'active').reduce((s, p) => s + (p.amount || 0), 0)).toLocaleString()}`, icon: DollarSign, accent: 'violet' },
                    { label: 'Auto-Pay Active', value: summary.auto_pay_count || payments.filter(p => p.auto_pay && p.status === 'active').length, icon: RefreshCw, accent: 'emerald' },
                    { label: 'Total Paid (LTD)', value: `$${(summary.total_paid_all_time || 12680).toLocaleString()}`, icon: CreditCard, accent: 'amber' },
                ].map((card, i) => (
                    <motion.div key={i} className={`nx-kpi ${card.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{card.label}</div>
                            <card.icon size={16} color={`var(--nx-${card.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${card.accent})`, marginTop: 8 }} className="nx-mono">{card.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts + AI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Spending Breakdown Donut */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>SPENDING BY CATEGORY</h3>
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} stroke="transparent">
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }}
                                        formatter={v => [`$${v.toLocaleString()}`, 'Monthly']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
                                {pieData.map(s => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--nx-text-muted)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                                        {s.name} <span className="nx-mono" style={{ color: 'var(--nx-text)' }}>${s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-dim)' }}>No active bills</div>
                    )}
                </motion.div>

                {/* AI Insights + Next Payment */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    {/* Next Payment Card */}
                    {upcoming && (
                        <div className="nx-card-glow" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <Clock size={12} color="#22d3ee" />
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>NEXT PAYMENT DUE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 28 }}>{upcoming.logo}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)' }}>{upcoming.payee_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{upcoming.next_date}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="nx-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--nx-cyan)' }}>${upcoming.amount?.toLocaleString()}</div>
                                    <div className="nx-mono" style={{ fontSize: 11, color: daysUntilNext <= 3 ? 'var(--nx-rose)' : 'var(--nx-emerald)' }}>{daysUntilNext}d remaining</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Insights */}
                    <div className="nx-ai-summary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Sparkles size={14} color="#a78bfa" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI BILL INSIGHTS</span>
                        </div>
                        {[
                            { text: `Entertainment spending is $${(categoryTotals.entertainment || 0).toFixed(0)}/mo — 12% below average. Keep it up!`, color: '#34d399', type: 'Savings' },
                            { text: 'Switch to annual billing on Netflix & Spotify to save $48/year.', color: '#22d3ee', type: 'Optimize' },
                            { text: 'AWS Cloud bill is paused — resume or cancel to keep accounts clean.', color: '#fbbf24', type: 'Action' },
                        ].map((ins, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: `${ins.color}08`, border: `1px solid ${ins.color}15` }}>
                                <Zap size={12} color={ins.color} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: ins.color, letterSpacing: '0.08em', marginBottom: 2 }}>{ins.type.toUpperCase()}</div>
                                    <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.5 }}>{ins.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* New Payment Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 20 }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>SCHEDULE NEW PAYMENT</h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-text-dim)' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {payees.map(p => (
                                <motion.button key={p.id} onClick={() => selectPayee(p)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{
                                    padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                    border: form.payee_id === p.id ? '1px solid var(--nx-cyan)' : '1px solid var(--nx-border)',
                                    background: form.payee_id === p.id ? 'rgba(34,211,238,0.1)' : 'rgba(10,15,46,0.4)',
                                    color: form.payee_id === p.id ? 'var(--nx-cyan)' : 'var(--nx-text-muted)',
                                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: form.payee_id === p.id ? 600 : 400,
                                }}>{p.logo} {p.name}</motion.button>
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
                            <button onClick={() => setShowForm(false)} className="nx-btn nx-btn-outline" style={{ fontSize: 13 }}>Cancel</button>
                            <motion.button onClick={handleSchedule} disabled={!form.payee_name && !form.payee_id || !form.amount || !form.next_date}
                                className="nx-btn nx-btn-primary" style={{ fontSize: 13 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Zap size={13} /> Schedule
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payments List */}
            <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>SCHEDULED PAYMENTS</h3>
                    <span className="nx-badge nx-badge-cyan" style={{ fontSize: 10 }}>{payments.filter(p => p.status === 'active').length} active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {payments.map((p, i) => {
                        const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other
                        return (
                            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.04 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                                    borderRadius: 10, background: 'rgba(10,15,46,0.3)', border: '1px solid var(--nx-border)',
                                    position: 'relative', overflow: 'hidden', flexWrap: 'wrap',
                                }}>
                                {/* Category accent bar */}
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: catColor, borderRadius: '3px 0 0 3px' }} />

                                <span style={{ fontSize: 26, flexShrink: 0 }}>{p.logo || '📄'}</span>
                                <div style={{ flex: 1, minWidth: 120 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{p.payee_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> {p.next_date}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {freqLabel[p.frequency] || p.frequency}</span>
                                        {p.auto_pay && <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={10} /> Auto</span>}
                                        <span className="nx-badge" style={{ fontSize: 8, padding: '1px 6px', background: `${catColor}15`, color: catColor }}>{p.category || 'other'}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 80 }}>
                                    <div className="nx-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--nx-text)' }}>${p.amount?.toLocaleString()}</div>
                                    <div style={{ fontSize: 10, color: statusColors[p.status] || '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.status}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    {p.status === 'active' && (
                                        <motion.button onClick={() => handleAction(p.id, 'pause')} title="Pause" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                                            <Pause size={13} color="#fbbf24" />
                                        </motion.button>
                                    )}
                                    {p.status === 'paused' && (
                                        <motion.button onClick={() => handleAction(p.id, 'resume')} title="Resume" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                                            <Play size={13} color="#22d3ee" />
                                        </motion.button>
                                    )}
                                    {p.status !== 'cancelled' && (
                                        <motion.button onClick={() => handleAction(p.id, 'cancel')} title="Cancel" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                                            <X size={13} color="#fb7185" />
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                    {payments.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--nx-text-dim)' }}>
                            <Receipt size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            <p>No scheduled payments yet. Click "Schedule Payment" to get started.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
