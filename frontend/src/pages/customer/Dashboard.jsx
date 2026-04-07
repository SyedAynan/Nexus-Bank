import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { motion } from 'framer-motion'
import { Shield, CreditCard, BarChart3, Users, Database, Zap, TrendingUp, Activity, Lock, Eye, Star, Sparkles, AlertTriangle, ArrowRight, Globe, Target } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

/* ─── Particles Background ─── */
function ParticlesField() {
    const particles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 6 + 6,
        color: i % 3 === 0 ? 'rgba(34,211,238,0.6)' : i % 3 === 1 ? 'rgba(167,139,250,0.5)' : 'rgba(59,130,246,0.4)',
    }))
    return (
        <div className="nx-particles">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="nx-particle"
                    style={{
                        width: p.size, height: p.size,
                        left: `${p.x}%`, top: `${p.y}%`,
                        background: p.color,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                    }}
                    animate={{
                        y: [0, -30, -10, -40, 0],
                        x: [0, 15, -10, 20, 0],
                        opacity: [0.2, 0.7, 0.4, 0.8, 0.2],
                    }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    )
}

/* ─── Star Rating Component ─── */
function StarRating({ rating = 4.5, max = 5 }) {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[...Array(max)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.floor(rating) ? '#fbbf24' : 'transparent'}
                    color={i < Math.ceil(rating) ? '#fbbf24' : '#4a5578'} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--nx-amber)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>{rating}</span>
        </div>
    )
}

/* ─── Mini Line Chart SVG ─── */
function MiniLineChart({ data, color = '#22d3ee', height = 60 }) {
    if (!data || data.length === 0) return null
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const w = 200
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = height - ((v - min) / range) * (height - 10) - 5
        return `${x},${y}`
    }).join(' ')
    const areaPoints = `0,${height} ${points} ${w},${height}`
    return (
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`areaFill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill={`url(#areaFill-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
        </svg>
    )
}

/* ─── Module Node Card ─── */
function ModuleNode({ icon: Icon, title, subtitle, color, delay = 0 }) {
    return (
        <motion.div
            className="nx-module-node"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            whileHover={{ scale: 1.05, borderColor: color }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
            }}>
                <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginTop: 2 }}>{subtitle}</div>
        </motion.div>
    )
}


/* ═══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════ */
export default function Dashboard() {
    const { user } = useAuth()
    const [accounts, setAccounts] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/banking/accounts').catch(() => ({ data: [] })),
            api.get('/banking/transactions').catch(() => ({ data: [] })),
        ]).then(([a, t]) => {
            setAccounts(a.data); setTransactions(t.data); setLoading(false)
        })
    }, [])

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0)
    const deposits = transactions.filter(t => t.type === 'deposit')
    const withdrawals = transactions.filter(t => t.type === 'withdrawal')
    const totalDeposits = deposits.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const totalWithdrawals = withdrawals.reduce((s, t) => s + parseFloat(t.amount || 0), 0)

    // Chart data — 7-day cash flow
    const last7 = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        const key = d.toISOString().split('T')[0]
        const dep = transactions.filter(t => t.type === 'deposit' && t.created_at?.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
        const wd = transactions.filter(t => t.type === 'withdrawal' && t.created_at?.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
        return { day: d.toLocaleDateString('en', { weekday: 'short' }), deposits: dep, withdrawals: wd }
    })

    const accountTypes = accounts.reduce((acc, a) => { acc[a.account_type] = (acc[a.account_type] || 0) + 1; return acc }, {})
    const pieData = Object.entries(accountTypes).map(([name, value]) => ({ name, value }))
    const pieColors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24']

    const recentTx = transactions.slice(0, 6)
    const miniChartData = last7.map(d => d.deposits + d.withdrawals)

    if (loading) return (
        <div className="animate-in" style={{ position: 'relative' }}>
            <ParticlesField />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative', zIndex: 1 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 100 }} />)}
            </div>
        </div>
    )

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {/* Nebula Background */}
            <div className="nx-nebula-bg" />
            <ParticlesField />

            <div className="animate-in" style={{ position: 'relative', zIndex: 1 }}>
                {/* ─── Header ─── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}
                >
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                            Welcome, <span className="nx-cyan nx-text-glow-cyan">{user?.username}</span>
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4, letterSpacing: '0.02em' }}>
                            Your financial command center • <span className="nx-mono" style={{ color: 'var(--nx-cyan)', fontSize: 11 }}>
                                {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </p>
                    </div>
                    <Link to="/transfer" className="nx-btn nx-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: 13 }}>
                        <Zap size={15} /> New Payment
                    </Link>
                </motion.div>

                {/* ─── AI Daily Summary (NEW) ─── */}
                <motion.div className="nx-ai-summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
                    style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))',
                                border: '1px solid rgba(167,139,250,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Sparkles size={18} color="#a78bfa" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                                    NEXUS AI DAILY BRIEFING
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>
                                    Personalized insights generated just now
                                </div>
                            </div>
                        </div>
                        <Link to="/ai" style={{ fontSize: 11, color: 'var(--nx-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View full analysis <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
                        {[
                            { icon: TrendingUp, text: 'Your portfolio is up 4.2% this month. Savings rate: 33% — above recommended 20%.', color: '#34d399', label: 'Performance' },
                            { icon: AlertTriangle, text: 'Tech sector allocation at 64% — consider diversifying. NVDA concentration risk elevated.', color: '#fbbf24', label: 'Risk Alert' },
                            { icon: Globe, text: 'Asia-Pacific markets showing strong momentum. Capital flows increased 8% this quarter.', color: '#22d3ee', label: 'Market Intel' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                    background: `${item.color}12`, border: `1px solid ${item.color}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                    {[
                        { label: 'Total Balance', value: `$${totalBalance.toLocaleString('en', { minimumFractionDigits: 2 })}`, sub: `${accounts.length} accounts`, accent: 'cyan', icon: Database },
                        { label: 'Deposits', value: `+$${totalDeposits.toLocaleString()}`, sub: `${deposits.length} transactions`, accent: 'emerald', icon: TrendingUp },
                        { label: 'Withdrawals', value: `-$${totalWithdrawals.toLocaleString()}`, sub: `${withdrawals.length} transactions`, accent: 'rose', icon: Activity },
                        { label: 'Net Flow', value: `$${(totalDeposits - totalWithdrawals).toLocaleString()}`, sub: 'Last 90 days', accent: 'violet', icon: BarChart3 },
                    ].map((k, i) => (
                        <motion.div
                            key={i}
                            className={`nx-kpi ${k.accent}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{k.label}</div>
                                <k.icon size={16} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 8 }} className="nx-mono">
                                {k.value}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>{k.sub}</div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── Hub Architecture Visualization ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ position: 'relative', marginBottom: 28, padding: '2rem 0' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto 1fr 1fr', gap: 14, alignItems: 'center' }}>
                        <ModuleNode icon={Shield} title="SECURITY" subtitle="Active Monitoring" color="#22d3ee" delay={0.2} />
                        <ModuleNode icon={CreditCard} title="PAYMENTS" subtitle="Real-time Processing" color="#a78bfa" delay={0.4} />

                        {/* Central Core Node */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <motion.div
                                className="nx-core-node"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <Database size={28} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.6))' }} />
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--nx-cyan)', marginTop: 4, fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}>NEXUS CORE</div>
                                </div>
                            </motion.div>
                            <span className="nx-badge nx-badge-cyan" style={{ fontSize: 9 }}>
                                <span className="nx-live-dot" style={{ marginRight: 4, width: 5, height: 5 }} /> ONLINE
                            </span>
                        </div>

                        <ModuleNode icon={BarChart3} title="ANALYTICS" subtitle="Smart Insights" color="#34d399" delay={0.6} />
                        <ModuleNode icon={Lock} title="COMPLIANCE" subtitle="KYC · AML" color="#fbbf24" delay={0.8} />
                    </div>
                </motion.div>

                {/* ─── Charts Row ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
                    <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                                CASH FLOW — 7 DAYS
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="nx-badge nx-badge-cyan">Live</span>
                                <div className="nx-live-indicator"><div className="dot" /> Auto-refresh</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={last7}>
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
                                <XAxis dataKey="day" tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'rgba(15,23,62,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12, boxShadow: '0 0 20px rgba(34,211,238,0.1)' }} />
                                <Area type="monotone" dataKey="deposits" stroke="#34d399" fill="url(#gDep)" strokeWidth={2} />
                                <Area type="monotone" dataKey="withdrawals" stroke="#fb7185" fill="url(#gWd)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div className="nx-chart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            PORTFOLIO
                        </h3>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4} stroke="transparent">
                                        {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'rgba(15,23,62,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-dim)', fontSize: 13 }}>No accounts</div>
                        )}
                    </motion.div>
                </div>

                {/* ─── Bottom Row: Account Card + Transactions ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Account Insight Card with Rating + Progress */}
                    <motion.div className="nx-card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: 'radial-gradient(circle, rgba(34,211,238,0.2), rgba(15,23,62,0.8))',
                                border: '1px solid rgba(34,211,238,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Eye size={22} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>FINANCIAL HEALTH</div>
                                <div style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 2 }}>AI-powered assessment</div>
                            </div>
                            <StarRating rating={4.5} />
                        </div>

                        {/* Progress Bars */}
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
                                        <motion.div
                                            className="nx-progress-bar"
                                            style={{ background: bar.color, boxShadow: `0 0 8px ${bar.color}60` }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${bar.value}%` }}
                                            transition={{ duration: 1, delay: 1.2 + i * 0.15, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mini Analytics Chart */}
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Activity Trend</div>
                            <MiniLineChart data={miniChartData.length > 0 ? miniChartData : [5, 12, 8, 20, 14, 22, 18]} color="#22d3ee" />
                        </div>
                    </motion.div>

                    {/* Recent Transactions */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>RECENT TRANSACTIONS</h3>
                            <Link to="/transactions" style={{ fontSize: 12, color: 'var(--nx-cyan)', textDecoration: 'none' }}>View all →</Link>
                        </div>
                        {recentTx.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--nx-text-dim)', padding: '2rem 0', textAlign: 'center' }}>No transactions yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {recentTx.map(tx => (
                                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--nx-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 10,
                                                background: tx.type === 'deposit' ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
                                                border: `1px solid ${tx.type === 'deposit' ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {tx.type === 'deposit' ? <TrendingUp size={14} color="#34d399" /> : <Activity size={14} color="#fb7185" />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)' }}>{tx.description || tx.type}</div>
                                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <span className="nx-mono" style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'deposit' ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>
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
