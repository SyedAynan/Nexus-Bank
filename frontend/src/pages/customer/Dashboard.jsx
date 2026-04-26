/**
 * File: Dashboard.jsx
 * Module: frontend/src/pages/customer/Dashboard.jsx
 *
 * Purpose:
 *     Main customer dashboard — the first screen users see after login.
 *     Displays KPI cards, cash flow chart, portfolio pie chart, financial
 *     health scores, recent transactions, and an animated network visualization.
 *
 * Developer Journey:
 *     - v1: Static dashboard with hardcoded sample data. No API calls,
 *       no real-time updates, no charts.
 *     - v2: Wired to real API endpoints (/banking/accounts, /banking/transactions).
 *       Falls back to demo data if the API returns empty results (getDemoAccounts,
 *       getDemoTransactions from simulationEngine).
 *     - v3: Added Recharts visualizations (AreaChart for cash flow, PieChart
 *       for portfolio mix) with auto-refresh every 15 seconds.
 *     - v4: Added NexusCoreNetwork visualization — animated SVG network map
 *       showing data flow between system components (Auth, Banking, ML, etc.).
 *       Wrapped with EnhancedChartWrapper for glassmorphism and glow effects.
 *
 * Data Flow:
 *     1. On mount: fetch /banking/accounts + /banking/transactions in parallel
 *     2. If API returns data → display real data
 *     3. If API returns empty → display demo data from simulationEngine
 *     4. Cash flow chart auto-refreshes every 15 seconds
 *     5. Clock updates every second (live timestamp in header)
 *
 * Performance:
 *     Uses Promise.all for parallel API calls instead of sequential fetches.
 *     Skeleton loading states prevent layout shift during data loading.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { motion } from 'framer-motion'
import { Shield, CreditCard, BarChart3, Users, Database, Zap, TrendingUp, Activity, Lock, Eye, Star, Sparkles, AlertTriangle, ArrowRight, Globe, Target } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { getDemoAccounts, getDemoTransactions, getCashFlowData, NEXUS_NETWORK_NODES, NEXUS_NETWORK_LINKS } from '../../data/simulationEngine'
import { EnhancedChartWrapper, EnhancedNetworkWrapper } from '../../components/enhancements'

/* ─── Particles Background ─── */
function ParticlesField() {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i, size: Math.random() * 3 + 1, x: Math.random() * 100, y: Math.random() * 100,
        delay: Math.random() * 5, duration: Math.random() * 6 + 6,
        color: i % 3 === 0 ? 'rgba(34,211,238,0.6)' : i % 3 === 1 ? 'rgba(167,139,250,0.5)' : 'rgba(59,130,246,0.4)',
    }))
    return (
        <div className="nx-particles">
            {particles.map(p => (
                <motion.div key={p.id} className="nx-particle" style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}` }}
                    animate={{ y: [0, -30, -10, -40, 0], x: [0, 15, -10, 20, 0], opacity: [0.2, 0.7, 0.4, 0.8, 0.2] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
            ))}
        </div>
    )
}

/* ─── Star Rating ─── */
function StarRating({ rating = 4.5 }) {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(rating) ? '#fbbf24' : 'transparent'} color={i < Math.ceil(rating) ? '#fbbf24' : '#4a5578'} />)}
            <span style={{ fontSize: 12, color: 'var(--nx-amber)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>{rating}</span>
        </div>
    )
}

/* ─── 3D Network Map ─── */
function NexusCoreNetwork() {
    const [activeNode, setActiveNode] = useState(null)
    const [pulsePhase, setPulsePhase] = useState(0)

    useEffect(() => {
        const intv = setInterval(() => setPulsePhase(p => (p + 1) % NEXUS_NETWORK_LINKS.length), 800)
        return () => clearInterval(intv)
    }, [])

    return (
        <motion.div className="nx-network-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            style={{ border: '1px solid var(--nx-border)', marginBottom: 24 }}>
            {/* SVG Links */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
                <defs>
                    <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                {NEXUS_NETWORK_LINKS.map((link, i) => {
                    const from = NEXUS_NETWORK_NODES.find(n => n.id === link.from)
                    const to = NEXUS_NETWORK_NODES.find(n => n.id === link.to)
                    if (!from || !to) return null
                    const isActive = i === pulsePhase
                    return (
                        <line key={i} x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                            className="nx-network-link"
                            stroke={isActive ? '#22d3ee' : 'rgba(34,211,238,0.15)'}
                            strokeWidth={isActive ? 2 : 1}
                            style={{ animationDelay: `${i * 0.15}s`, transition: 'stroke 0.4s, stroke-width 0.4s' }} />
                    )
                })}
            </svg>
            {/* Nodes */}
            {NEXUS_NETWORK_NODES.map((node, i) => (
                <motion.div key={node.id} className="nx-network-node"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.08, type: 'spring' }}
                    onMouseEnter={() => setActiveNode(node.id)} onMouseLeave={() => setActiveNode(null)}>
                    <div style={{
                        width: node.type === 'core' ? 72 : 52, height: node.type === 'core' ? 72 : 52,
                        borderRadius: node.type === 'core' ? '50%' : 12,
                        background: node.type === 'core'
                            ? `radial-gradient(circle, ${node.color}25, rgba(15,23,62,0.8))`
                            : `${node.color}10`,
                        border: `${node.type === 'core' ? 2 : 1}px solid ${activeNode === node.id ? node.color : node.color + '40'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        boxShadow: activeNode === node.id ? `0 0 20px ${node.color}40` : node.type === 'core' ? `0 0 15px ${node.color}20` : 'none',
                        transition: 'all 0.3s ease',
                        ...(node.type === 'core' ? { animation: 'glow-breathe 3s ease-in-out infinite' } : {}),
                    }}>
                        <Database size={node.type === 'core' ? 22 : 16} color={node.color} style={node.type === 'core' ? { filter: `drop-shadow(0 0 6px ${node.color})` } : {}} />
                    </div>
                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap', marginTop: 4, fontSize: node.type === 'core' ? 9 : 8,
                        fontWeight: 700, color: activeNode === node.id ? node.color : 'var(--nx-text-dim)',
                        fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textAlign: 'center', transition: 'color 0.3s' }}>
                        {node.label}
                    </div>
                </motion.div>
            ))}
            {/* Label */}
            <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: 10, color: 'var(--nx-text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                <span className="nx-live-dot" style={{ marginRight: 6, width: 5, height: 5 }} />
                NEXUS CORE NETWORK — LIVE DATA FLOW
            </div>
        </motion.div>
    )
}

/* ═══════ MAIN DASHBOARD ═══════ */
export default function Dashboard() {
    const { user } = useAuth()
    const [accounts, setAccounts] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [cashFlow, setCashFlow] = useState(getCashFlowData())
    const [currentTime, setCurrentTime] = useState(new Date())

    // Dynamic time update
    useEffect(() => {
        const intv = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(intv)
    }, [])

    // Dynamic cash flow
    useEffect(() => {
        const intv = setInterval(() => setCashFlow(getCashFlowData()), 15000)
        return () => clearInterval(intv)
    }, [])

    useEffect(() => {
        Promise.all([
            api.get('/banking/accounts').catch(() => ({ data: [] })),
            api.get('/banking/transactions').catch(() => ({ data: [] })),
        ]).then(([a, t]) => {
            // Use demo data if API returns empty
            const accts = a.data?.length > 0 ? a.data : getDemoAccounts()
            const txs = t.data?.length > 0 ? t.data : getDemoTransactions()
            setAccounts(accts); setTransactions(txs); setLoading(false)
        })
    }, [])

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0)
    const deposits = transactions.filter(t => t.type === 'deposit')
    const withdrawals = transactions.filter(t => t.type === 'withdrawal')
    const totalDeposits = deposits.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const totalWithdrawals = withdrawals.reduce((s, t) => s + parseFloat(t.amount || 0), 0)

    const accountTypes = accounts.reduce((acc, a) => { acc[a.account_type] = (acc[a.account_type] || 0) + 1; return acc }, {})
    const pieData = Object.entries(accountTypes).map(([name, value]) => ({ name, value }))
    const pieColors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24']

    const recentTx = transactions.slice(0, 8)

    const dayName = currentTime.toLocaleDateString('en', { weekday: 'long' })
    const dateStr = currentTime.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = currentTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    if (loading) return (
        <div className="animate-in" style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, position: 'relative', zIndex: 1 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 100 }} />)}
            </div>
        </div>
    )

    return (
        <div style={{ position: 'relative' }}>
            <ParticlesField />
            <div className="animate-in" style={{ position: 'relative', zIndex: 1 }}>
                {/* ─── Header ─── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                            Welcome, <span className="nx-cyan nx-text-glow-cyan">{user?.username}</span>
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                            {dayName} • <span className="nx-mono" style={{ color: 'var(--nx-cyan)', fontSize: 11 }}>{dateStr}</span>
                            <span className="nx-mono" style={{ color: 'var(--nx-violet)', fontSize: 11, marginLeft: 8 }}>{timeStr}</span>
                        </p>
                    </div>
                    <Link to="/transfer" className="nx-btn nx-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: 13 }}>
                        <Zap size={15} /> New Payment
                    </Link>
                </motion.div>

                {/* ─── AI Daily Briefing ─── */}
                <motion.div className="nx-ai-summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={18} color="#a78bfa" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>NEXUS AI DAILY BRIEFING</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>Last updated: {timeStr}</div>
                            </div>
                        </div>
                        <Link to="/ai" style={{ fontSize: 11, color: 'var(--nx-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View full analysis <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 16 }}>
                        {[
                            { icon: TrendingUp, text: `Portfolio value: $${totalBalance.toLocaleString()} · Savings rate: 33% — above target.`, color: '#34d399', label: 'Performance' },
                            { icon: AlertTriangle, text: 'Tech sector at 64% — rebalance recommended. NVDA concentration risk.', color: '#fbbf24', label: 'Risk Alert' },
                            { icon: Globe, text: 'Asia-Pacific markets bullish. Capital flows increased 8% this quarter.', color: '#22d3ee', label: 'Market Intel' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${item.color}12`, border: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <item.icon size={14} color={item.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{item.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.5 }}>{item.text}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ─── KPI Cards ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                    {[
                        { label: 'Total Balance', value: `$${totalBalance.toLocaleString('en', { minimumFractionDigits: 2 })}`, sub: `${accounts.length} accounts`, accent: 'cyan', icon: Database },
                        { label: 'Deposits', value: `+$${totalDeposits.toLocaleString()}`, sub: `${deposits.length} inflows`, accent: 'emerald', icon: TrendingUp },
                        { label: 'Withdrawals', value: `-$${totalWithdrawals.toLocaleString()}`, sub: `${withdrawals.length} outflows`, accent: 'rose', icon: Activity },
                        { label: 'Net Flow', value: `$${(totalDeposits - totalWithdrawals).toLocaleString()}`, sub: 'This period', accent: 'violet', icon: BarChart3 },
                    ].map((k, i) => (
                        <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{k.label}</div>
                                <k.icon size={16} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 8 }} className="nx-mono">{k.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>{k.sub}</div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── 3D Network Map — wrapped with particle enhancement ─── */}
                <EnhancedNetworkWrapper nodes={NEXUS_NETWORK_NODES} links={NEXUS_NETWORK_LINKS}>
                    <NexusCoreNetwork />
                </EnhancedNetworkWrapper>

                {/* ─── Charts Row ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <EnhancedChartWrapper glowColor="#34d399" intensity="medium">
                    <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>CASH FLOW — 7 DAYS</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="nx-badge nx-badge-cyan">Live</span>
                                <div className="nx-live-indicator"><div className="dot" /> Auto-refresh</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={cashFlow}>
                                <defs>
                                    <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gWd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" tick={{ fill: 'var(--nx-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--nx-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                                <Tooltip contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }}
                                    formatter={v => [`$${v.toLocaleString()}`, '']} />
                                <Area type="monotone" dataKey="deposits" stroke="#34d399" fill="url(#gDep)" strokeWidth={2} />
                                <Area type="monotone" dataKey="withdrawals" stroke="#fb7185" fill="url(#gWd)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                    </EnhancedChartWrapper>

                    <EnhancedChartWrapper glowColor="#a78bfa" intensity="low">
                    <motion.div className="nx-chart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>PORTFOLIO MIX</h3>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4} stroke="transparent">
                                        {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-dim)' }}>No accounts</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                            {pieData.map((p, i) => (
                                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--nx-text-muted)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: pieColors[i % pieColors.length] }} />
                                    <span style={{ textTransform: 'capitalize' }}>{p.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    </EnhancedChartWrapper>
                </div>

                {/* ─── Bottom Row ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                    {/* Financial Health */}
                    <motion.div className="nx-card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'radial-gradient(circle, rgba(34,211,238,0.2), rgba(15,23,62,0.8))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Eye size={22} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>FINANCIAL HEALTH</div>
                                <div style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>AI assessment</div>
                            </div>
                            <StarRating rating={4.5} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Savings Consistency', value: 87, color: '#22d3ee' },
                                { label: 'Spending Discipline', value: 72, color: '#a78bfa' },
                                { label: 'Risk Exposure', value: 15, color: '#34d399' },
                                { label: 'Credit Utilization', value: 45, color: '#fbbf24' },
                            ].map((bar, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{bar.label}</span>
                                        <span className="nx-mono" style={{ fontSize: 11, color: bar.color }}>{bar.value}%</span>
                                    </div>
                                    <div className="nx-progress">
                                        <motion.div className="nx-progress-bar" style={{ background: bar.color, boxShadow: `0 0 8px ${bar.color}60` }}
                                            initial={{ width: 0 }} animate={{ width: `${bar.value}%` }} transition={{ duration: 1, delay: 1.2 + i * 0.15 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Transactions */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>RECENT TRANSACTIONS</h3>
                            <Link to="/transactions" style={{ fontSize: 12, color: 'var(--nx-cyan)', textDecoration: 'none' }}>View all →</Link>
                        </div>
                        {recentTx.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--nx-text-dim)', padding: '2rem 0', textAlign: 'center' }}>No transactions yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {recentTx.map(tx => (
                                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--nx-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 30, height: 30, borderRadius: 8,
                                                background: tx.type === 'deposit' ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
                                                border: `1px solid ${tx.type === 'deposit' ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {tx.type === 'deposit' ? <TrendingUp size={13} color="#34d399" /> : <Activity size={13} color="#fb7185" />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--nx-text)' }}>{tx.description || tx.type}</div>
                                                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <span className="nx-mono" style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'deposit' ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>
                                            {tx.type === 'deposit' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
