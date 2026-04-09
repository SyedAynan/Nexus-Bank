import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Wallet, Globe, Users, Activity, Shield, TrendingUp, MapPin, Clock, Eye, Zap } from 'lucide-react'
import { getDemoAccounts, GLOBAL_CITIES, CURRENCIES } from '../../data/simulationEngine'

function seededRandom(seed) {
    let s = seed % 2147483647; if (s <= 0) s += 2147483646
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export default function Accounts() {
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('personal')
    const [lastUpdate, setLastUpdate] = useState(new Date())

    useEffect(() => {
        api.get('/banking/accounts').then(r => {
            setAccounts(r.data?.length > 0 ? r.data : getDemoAccounts()); setLoading(false)
        }).catch(() => { setAccounts(getDemoAccounts()); setLoading(false) })
    }, [])

    // Simulated global accounts
    const rng = seededRandom(Math.floor(Date.now() / 30000))
    const globalAccounts = GLOBAL_CITIES.map((city, i) => ({
        city: city.city, country: city.country,
        activeUsers: Math.round(2000 + rng() * 48000),
        transactions: Math.round(500 + rng() * 15000),
        volume: Math.round(100000 + rng() * 4900000),
        status: rng() > 0.1 ? 'active' : 'maintenance',
        currency: CURRENCIES[Math.min(i, CURRENCIES.length - 1)],
        uptime: (99 + rng() * 0.99).toFixed(2),
    }))

    useEffect(() => {
        const intv = setInterval(() => setLastUpdate(new Date()), 10000)
        return () => clearInterval(intv)
    }, [])

    const totalGlobalUsers = globalAccounts.reduce((s, a) => s + a.activeUsers, 0)
    const totalVolume = globalAccounts.reduce((s, a) => s + a.volume, 0)
    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0)
    const typeColors = { checking: '#22d3ee', savings: '#34d399', investment: '#a78bfa' }

    if (loading) return <div className="animate-in">{[...Array(3)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 120, marginBottom: 12 }} />)}</div>

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(52,211,153,0.1))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet size={22} color="#22d3ee" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>ACCOUNTS</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>
                            {view === 'personal' ? `${accounts.length} personal accounts` : `${globalAccounts.length} global nodes`}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="nx-tabs" style={{ display: 'inline-flex' }}>
                        <button onClick={() => setView('personal')} className={`nx-tab ${view === 'personal' ? 'active' : ''}`}><Wallet size={11} /> My Accounts</button>
                        <button onClick={() => setView('global')} className={`nx-tab ${view === 'global' ? 'active' : ''}`}><Globe size={11} /> Global Network</button>
                    </div>
                </div>
            </motion.div>

            {view === 'global' ? (
                <>
                    {/* Global KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                        {[
                            { label: 'Active Nodes', value: globalAccounts.length, accent: 'cyan', icon: Globe },
                            { label: 'Global Users', value: totalGlobalUsers.toLocaleString(), accent: 'violet', icon: Users },
                            { label: 'Total Volume', value: `$${(totalVolume / 1e6).toFixed(1)}M`, accent: 'emerald', icon: TrendingUp },
                            { label: 'Avg Uptime', value: '99.97%', accent: 'amber', icon: Activity },
                        ].map((k, i) => (
                            <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                                    <k.icon size={14} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                                </div>
                                <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 4 }}>{k.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div className="nx-live-indicator"><div className="dot" /> Admin Monitor — {lastUpdate.toLocaleTimeString()}</div>
                    </div>

                    {/* Global Account Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {globalAccounts.map((ga, i) => (
                            <motion.div key={ga.city} className="nx-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                                style={{ position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ga.status === 'active' ? 'linear-gradient(90deg, #34d399, #22d3ee)' : '#fbbf24' }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <MapPin size={14} color="var(--nx-cyan)" />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{ga.city}</div>
                                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{ga.currency.flag} {ga.currency.code}</div>
                                        </div>
                                    </div>
                                    <span className={`nx-badge ${ga.status === 'active' ? 'nx-badge-green' : 'nx-badge-amber'}`} style={{ fontSize: 9, textTransform: 'capitalize' }}>{ga.status}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                                    <div>
                                        <div style={{ color: 'var(--nx-text-dim)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Users</div>
                                        <div className="nx-mono" style={{ fontWeight: 600, color: 'var(--nx-text)' }}>{ga.activeUsers.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--nx-text-dim)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transactions</div>
                                        <div className="nx-mono" style={{ fontWeight: 600, color: 'var(--nx-text)' }}>{ga.transactions.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--nx-text-dim)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Volume</div>
                                        <div className="nx-mono" style={{ fontWeight: 600, color: 'var(--nx-emerald)' }}>${(ga.volume / 1000).toFixed(0)}K</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--nx-text-dim)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Uptime</div>
                                        <div className="nx-mono" style={{ fontWeight: 600, color: 'var(--nx-cyan)' }}>{ga.uptime}%</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* Personal KPI */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                        <motion.div className="nx-kpi cyan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>Total Balance</div>
                            <div className="nx-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-cyan)', marginTop: 4 }}>${totalBalance.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                        </motion.div>
                    </div>

                    {/* Account Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                        {accounts.map((acc, i) => (
                            <motion.div key={acc.id} className="nx-card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                style={{ position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: typeColors[acc.account_type] || '#22d3ee' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{acc.account_type}</div>
                                        <div className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 2 }}>{acc.account_number}</div>
                                    </div>
                                    <span className={`nx-badge ${acc.status === 'active' ? 'nx-badge-green' : 'nx-badge-red'}`} style={{ fontSize: 9 }}>{acc.status}</span>
                                </div>
                                <div className="nx-mono" style={{ fontSize: 28, fontWeight: 700, color: typeColors[acc.account_type] || 'var(--nx-text)', marginBottom: 8 }}>
                                    ${parseFloat(acc.balance || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{acc.currency || 'USD'}</div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
