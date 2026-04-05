import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { ScrollText, TrendingUp, Activity, ArrowLeftRight, Filter, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Transactions() {
    const [transactions, setTransactions] = useState([])
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const perPage = 15

    useEffect(() => { api.get('/banking/transactions').then(r => { setTransactions(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [])

    const types = ['all', ...new Set(transactions.map(t => t.type))]
    const filtered = transactions
        .filter(t => filter === 'all' || t.type === filter)
        .filter(t => !search || (t.description || '').toLowerCase().includes(search.toLowerCase()))
    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)
    const typeIcon = { deposit: TrendingUp, withdrawal: Activity, transfer: ArrowLeftRight }

    const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + parseFloat(t.amount || 0), 0)

    if (loading) return <div className="animate-in">{[...Array(8)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 48, marginBottom: 8 }} />)}</div>

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>TRANSACTIONS</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>{transactions.length} total transactions</p>
                </div>
                <motion.button className="nx-btn nx-btn-outline" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Download size={14} /> Export CSV
                </motion.button>
            </div>

            {/* Mini KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
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
                <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                    <Search size={14} color="var(--nx-text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text" className="nx-input" placeholder="Search transactions..."
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                        style={{ paddingLeft: 32 }}
                    />
                </div>
                <div className="nx-tabs" style={{ display: 'inline-flex' }}>
                    {types.map(t => (
                        <button key={t} onClick={() => { setFilter(t); setPage(1) }} className={`nx-tab ${filter === t ? 'active' : ''}`} style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {t === 'all' ? <Filter size={11} /> : null} {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transaction Table */}
            <motion.div className="nx-card-static" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {paginated.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <ScrollText size={32} color="var(--nx-text-dim)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p style={{ fontSize: 13, color: 'var(--nx-text-dim)' }}>No transactions found</p>
                    </div>
                ) : (
                    <table className="nx-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((tx, i) => {
                                const Icon = typeIcon[tx.type] || ScrollText
                                const isCredit = tx.type === 'deposit'
                                return (
                                    <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                        <td className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 8,
                                                    background: isCredit ? 'rgba(52,211,153,0.1)' : tx.type === 'transfer' ? 'rgba(34,211,238,0.1)' : 'rgba(251,113,133,0.1)',
                                                    border: `1px solid ${isCredit ? 'rgba(52,211,153,0.2)' : tx.type === 'transfer' ? 'rgba(34,211,238,0.2)' : 'rgba(251,113,133,0.2)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    <Icon size={12} color={isCredit ? '#34d399' : tx.type === 'transfer' ? '#22d3ee' : '#fb7185'} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)' }}>{tx.description || tx.type}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`nx-badge ${isCredit ? 'nx-badge-green' : tx.type === 'transfer' ? 'nx-badge-cyan' : 'nx-badge-red'}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="nx-mono" style={{ fontSize: 14, fontWeight: 600, color: isCredit ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>
                                                {isCredit ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td><span className="nx-badge nx-badge-green" style={{ fontSize: 9 }}>Completed</span></td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid var(--nx-border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--nx-text-dim)' }}>
                            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="nx-btn nx-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: 11 }}>
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="nx-btn nx-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: 11 }}>
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
