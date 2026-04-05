import { useState, useEffect } from 'react'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, DollarSign, TrendingUp, Shield, Eye, Lock, Unlock, CreditCard } from 'lucide-react'

export default function Accounts() {
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ account_type: 'savings', currency: 'USD' })

    useEffect(() => { api.get('/banking/accounts').then(r => { setAccounts(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [])

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0)
    const activeCount = accounts.filter(a => a.status === 'active').length

    const handleCreate = async (e) => {
        e.preventDefault()
        try { const r = await api.post('/banking/accounts', form); setAccounts([...accounts, r.data]); setShowForm(false) } catch { }
    }

    const typeColors = { savings: '#22d3ee', checking: '#a78bfa', investment: '#34d399' }
    const typeIcons = { savings: Wallet, checking: CreditCard, investment: TrendingUp }

    if (loading) return (
        <div className="animate-in">
            <div className="nx-skeleton" style={{ height: 80, marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 140 }} />)}
            </div>
        </div>
    )

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>ACCOUNTS</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {activeCount} active
                    </p>
                </div>
                <motion.button onClick={() => setShowForm(!showForm)} className="nx-btn nx-btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Plus size={15} /> Open New Account
                </motion.button>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <motion.div className="nx-kpi cyan" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Total Balance</div>
                        <DollarSign size={16} color="var(--nx-cyan)" style={{ opacity: 0.6 }} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-cyan)' }} className="nx-mono">${totalBalance.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>Across all accounts</div>
                </motion.div>

                <motion.div className="nx-kpi emerald" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Active Accounts</div>
                        <Shield size={16} color="var(--nx-emerald)" style={{ opacity: 0.6 }} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-emerald)' }} className="nx-mono">{activeCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>All secured & verified</div>
                </motion.div>

                <motion.div className="nx-kpi violet" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Currencies</div>
                        <TrendingUp size={16} color="var(--nx-violet)" style={{ opacity: 0.6 }} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-violet)' }} className="nx-mono">{new Set(accounts.map(a => a.currency)).size}</div>
                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>Unique currencies</div>
                </motion.div>
            </div>

            {/* Open New Account Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div className="nx-card-static" style={{ marginBottom: 20, padding: '1.5rem' }}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    >
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>OPEN NEW ACCOUNT</h3>
                        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label className="nx-label">Account Type</label>
                                <select className="nx-select" value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })}>
                                    <option value="savings">Savings</option>
                                    <option value="checking">Checking</option>
                                    <option value="investment">Investment</option>
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label className="nx-label">Currency</label>
                                <select className="nx-select" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="JPY">JPY</option>
                                </select>
                            </div>
                            <motion.button type="submit" className="nx-btn nx-btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Plus size={14} /> Create Account
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Account Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {accounts.map((a, i) => {
                    const color = typeColors[a.account_type] || '#22d3ee'
                    const Icon = typeIcons[a.account_type] || Wallet
                    return (
                        <motion.div key={a.id} className="nx-card"
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                            whileHover={{ borderColor: `${color}40`, scale: 1.01 }}
                            style={{ padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: `${color}12`, border: `1px solid ${color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={18} color={color} />
                                    </div>
                                    <div>
                                        <div className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-muted)', letterSpacing: 1 }}>{a.account_number}</div>
                                        <div style={{ fontSize: 11, textTransform: 'capitalize', color: 'var(--nx-text-dim)' }}>{a.account_type} · {a.currency}</div>
                                    </div>
                                </div>
                                <span className={`nx-badge ${a.status === 'active' ? 'nx-badge-green' : 'nx-badge-red'}`}>{a.status}</span>
                            </div>

                            {/* Balance */}
                            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', marginBottom: 12 }} className="nx-mono">
                                ${parseFloat(a.balance).toLocaleString('en', { minimumFractionDigits: 2 })}
                            </div>

                            {/* Mini sparkline */}
                            <svg width="100%" height="24" style={{ opacity: 0.5 }}>
                                <defs>
                                    <linearGradient id={`acg${a.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <polygon points="0,24 20,18 60,20 100,12 140,15 180,8 220,10 260,6 300,4 300,24" fill={`url(#acg${a.id})`} />
                                <polyline points="20,18 60,20 100,12 140,15 180,8 220,10 260,6 300,4" fill="none" stroke={color} strokeWidth="1.5" />
                            </svg>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button className="nx-btn nx-btn-outline" style={{ fontSize: 11, padding: '0.35rem 0.75rem' }}>
                                    <Eye size={12} /> View Details
                                </button>
                                <button className="nx-btn nx-btn-outline" style={{ fontSize: 11, padding: '0.35rem 0.75rem', borderColor: 'rgba(251,113,133,0.3)', color: 'var(--nx-rose)' }}>
                                    <Lock size={12} /> Freeze
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {accounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Wallet size={40} color="var(--nx-cyan)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <p style={{ fontSize: 14, color: 'var(--nx-text-muted)', marginBottom: 12 }}>No accounts yet</p>
                    <button onClick={() => setShowForm(true)} className="nx-btn nx-btn-primary">
                        <Plus size={14} /> Open Your First Account
                    </button>
                </div>
            )}
        </div>
    )
}
