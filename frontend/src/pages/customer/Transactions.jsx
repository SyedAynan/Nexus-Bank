import { useState, useEffect } from 'react'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText, TrendingUp, Activity, ArrowLeftRight, Filter, Search, Download, ChevronLeft, ChevronRight, Globe, Zap, Clock, MapPin } from 'lucide-react'
import { generateGlobalTransactions, getDemoTransactions, GLOBAL_CITIES } from '../../data/simulationEngine'

export default function Transactions() {
    const [transactions, setTransactions] = useState([])
    const [globalTx, setGlobalTx] = useState(generateGlobalTransactions(30))
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [view, setView] = useState('personal') // personal | global
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const perPage = 12

    useEffect(() => {
        api.get('/banking/transactions').then(r => {
            setTransactions(r.data?.length > 0 ? r.data : getDemoTransactions())
            setLoading(false)
        }).catch(() => { setTransactions(getDemoTransactions()); setLoading(false) })
    }, [])

    // Real-time global tx refresh
    useEffect(() => {
        const intv = setInterval(() => {
            setGlobalTx(generateGlobalTransactions(30))
            setLastUpdate(new Date())
        }, 8000)
        return () => clearInterval(intv)
    }, [])

    const types = ['all', ...new Set(transactions.map(t => t.type))]
    const filtered = transactions
        .filter(t => filter === 'all' || t.type === filter)
        .filter(t => !search || (t.description || '').toLowerCase().includes(search.toLowerCase()))
    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)
    const typeIcon = { deposit: TrendingUp, withdrawal: Activity, transfer: ArrowLeftRight }

    const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + parseFloat(t.amount || 0), 0)

    const globalStats = {
        total: globalTx.length,
        volume: globalTx.reduce((s, t) => s + t.amount, 0),
        avgTime: (globalTx.reduce((s, t) => s + t.processing_time, 0) / globalTx.length).toFixed(1),
        cities: new Set([...globalTx.map(t => t.from.city), ...globalTx.map(t => t.to.city)]).size,
    }
    const statusColors = { completed: 'nx-badge-green', processing: 'nx-badge-cyan', pending: 'nx-badge-amber', verified: 'nx-badge-violet' }

    if (loading) return <div className="animate-in">{[...Array(8)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 48, marginBottom: 8 }} />)}</div>

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScrollText size={22} color="#22d3ee" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>TRANSACTIONS</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>
                            {view === 'personal' ? `${transactions.length} personal transactions` : `${globalTx.length} global transactions processing`}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="nx-tabs" style={{ display: 'inline-flex' }}>
                        <button onClick={() => setView('personal')} className={`nx-tab ${view === 'personal' ? 'active' : ''}`}><ScrollText size={11} /> Personal</button>
                        <button onClick={() => setView('global')} className={`nx-tab ${view === 'global' ? 'active' : ''}`}><Globe size={11} /> Global</button>
                    </div>
                    <button className="nx-btn nx-btn-outline" style={{ fontSize: 11, padding: '0.5rem 0.75rem' }}><Download size={13} /> Export</button>
                </div>
            </motion.div>

            {view === 'global' ? (
                /* ═══════ GLOBAL VIEW ═══════ */
                <>
                    {/* Global KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Live Transactions', value: globalStats.total, accent: 'cyan', icon: Zap },
                            { label: 'Total Volume', value: `$${(globalStats.volume / 1000).toFixed(0)}K`, accent: 'emerald', icon: TrendingUp },
                            { label: 'Avg Processing', value: `${globalStats.avgTime}s`, accent: 'violet', icon: Clock },
                            { label: 'Active Cities', value: globalStats.cities, accent: 'amber', icon: MapPin },
                        ].map((k, i) => (
                            <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                                    <k.icon size={14} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                                </div>
                                <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 4 }}>{k.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div className="nx-live-indicator"><div className="dot" /> Live — Updated {lastUpdate.toLocaleTimeString()}</div>
                        <span style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>Auto-refresh: 8s</span>
                    </div>

                    {/* Global Transactions Feed */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {globalTx.map((tx, i) => (
                                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--nx-border)', flexWrap: 'wrap' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Globe size={14} color="var(--nx-cyan)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 150 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{tx.type}</div>
                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                            <span style={{ color: 'var(--nx-cyan)' }}>{tx.from.city}</span> → <span style={{ color: 'var(--nx-violet)' }}>{tx.to.city}</span>
                                            <span style={{ color: 'var(--nx-text-dim)' }}>· {tx.processing_time}s</span>
                                        </div>
                                    </div>
                                    <div className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-dim)' }}>{tx.id}</div>
                                    <div className="nx-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-emerald)', minWidth: 80, textAlign: 'right' }}>${tx.amount.toLocaleString()}</div>
                                    <span className={`nx-badge ${statusColors[tx.status]}`} style={{ textTransform: 'capitalize', fontSize: 9 }}>{tx.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </>
            ) : (
                /* ═══════ PERSONAL VIEW ═══════ */
                <>
                    {/* Mini KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                        <motion.div className="nx-kpi cyan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Total Txns</div>
                            <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-cyan)' }}>{transactions.length}</div>
                        </motion.div>
                        <motion.div className="nx-kpi emerald" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Deposits</div>
                            <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-emerald)' }}>+${totalDeposits.toLocaleString()}</div>
                        </motion.div>
                        <motion.div className="nx-kpi rose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Withdrawals</div>
                            <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-rose)' }}>-${totalWithdrawals.toLocaleString()}</div>
                        </motion.div>
                    </div>

                    {/* Filter Bar */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 280, minWidth: 180 }}>
                            <Search size={14} color="var(--nx-text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="text" className="nx-input" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ paddingLeft: 32 }} />
                        </div>
                        <div className="nx-tabs" style={{ display: 'inline-flex' }}>
                            {types.map(t => (
                                <button key={t} onClick={() => { setFilter(t); setPage(1) }} className={`nx-tab ${filter === t ? 'active' : ''}`} style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {t === 'all' ? <Filter size={11} /> : null} {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Existing Transaction Table */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ overflowX: 'auto' }}>
                        {paginated.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <ScrollText size={32} color="var(--nx-text-dim)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                <p style={{ fontSize: 13, color: 'var(--nx-text-dim)' }}>No transactions found</p>
                            </div>
                        ) : (
                            <table className="nx-table">
                                <thead>
                                    <tr><th>Date</th><th>Description</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {paginated.map((tx, i) => {
                                        const Icon = typeIcon[tx.type] || ScrollText
                                        const isCredit = tx.type === 'deposit'
                                        return (
                                            <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                                <td className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isCredit ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)', border: `1px solid ${isCredit ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Icon size={12} color={isCredit ? '#34d399' : '#fb7185'} />
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)' }}>{tx.description || tx.type}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`nx-badge ${isCredit ? 'nx-badge-green' : 'nx-badge-red'}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>{tx.type}</span></td>
                                                <td style={{ textAlign: 'right' }}><span className="nx-mono" style={{ fontSize: 14, fontWeight: 600, color: isCredit ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>{isCredit ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}</span></td>
                                                <td><span className="nx-badge nx-badge-green" style={{ fontSize: 9 }}>Completed</span></td>
                                            </motion.tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid var(--nx-border)', flexWrap: 'wrap', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--nx-text-dim)' }}>
                                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="nx-btn nx-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: 11 }}><ChevronLeft size={14} /> Prev</button>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="nx-btn nx-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: 11 }}>Next <ChevronRight size={14} /></button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    )
}
