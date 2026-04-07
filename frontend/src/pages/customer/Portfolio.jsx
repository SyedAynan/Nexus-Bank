import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { Briefcase, TrendingUp, TrendingDown, Shield, Zap, Target, DollarSign, BarChart3, AlertTriangle } from 'lucide-react'

/* ═══════ Simulated Portfolio Data ═══════ */
const HOLDINGS = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgCost: 185.20, current: 218.45, alloc: 18 },
    { symbol: 'MSFT', name: 'Microsoft', shares: 25, avgCost: 420.00, current: 472.80, alloc: 20 },
    { symbol: 'NVDA', name: 'NVIDIA', shares: 15, avgCost: 850.00, current: 1042.50, alloc: 26 },
    { symbol: 'AMZN', name: 'Amazon', shares: 30, avgCost: 195.00, current: 225.10, alloc: 11 },
    { symbol: 'BTC', name: 'Bitcoin', shares: 0.5, avgCost: 68000, current: 97240, alloc: 8 },
    { symbol: 'BONDS', name: 'Bond ETF', shares: 100, avgCost: 95.00, current: 97.30, alloc: 17 },
]

const ALLOC_DATA = [
    { name: 'Tech', value: 64, color: '#22d3ee' },
    { name: 'Crypto', value: 8, color: '#a78bfa' },
    { name: 'Bonds', value: 17, color: '#34d399' },
    { name: 'Other', value: 11, color: '#fbbf24' },
]

function generatePerfData() {
    let base = 180000
    return Array.from({ length: 12 }, (_, i) => {
        base += (Math.random() - 0.42) * 8000
        return { month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], value: Math.round(base) }
    })
}

/* ═══════ Risk Gauge SVG ═══════ */
function RiskGauge({ score = 7.2 }) {
    const angle = (score / 10) * 180
    const rad = (angle - 90) * (Math.PI / 180)
    const nx = 60 + 40 * Math.cos(rad)
    const ny = 55 + 40 * Math.sin(rad)
    const color = score > 7 ? '#fb7185' : score > 4 ? '#fbbf24' : '#34d399'
    const label = score > 7 ? 'HIGH' : score > 4 ? 'MODERATE' : 'LOW'

    return (
        <div style={{ textAlign: 'center' }}>
            <svg viewBox="0 0 120 70" width="140" height="80">
                <path d="M 15 55 A 45 45 0 0 1 105 55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                <motion.path d={`M 15 55 A 45 45 0 0 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth="8"
                    strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.5 }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
                <text x="60" y="48" textAnchor="middle" fill="var(--nx-text)" fontSize="18" fontWeight="700" fontFamily="var(--font-mono)">
                    {score}
                </text>
                <text x="60" y="60" textAnchor="middle" fill="var(--nx-text-dim)" fontSize="6" fontFamily="var(--font-display)" letterSpacing="0.1em">
                    /10
                </text>
            </svg>
            <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginTop: -4 }}>{label} RISK</div>
        </div>
    )
}

/* ═══════ Main Portfolio Page ═══════ */
export default function Portfolio() {
    const [perfData] = useState(() => generatePerfData())
    const totalValue = HOLDINGS.reduce((s, h) => s + h.current * h.shares, 0)
    const totalCost = HOLDINGS.reduce((s, h) => s + h.avgCost * h.shares, 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPct = ((totalPnL / totalCost) * 100).toFixed(2)

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Briefcase size={26} color="#22d3ee" /> PORTFOLIO INTELLIGENCE
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        AI-powered portfolio analytics & risk management
                    </p>
                </div>
                <div className="nx-live-indicator"><div className="dot" /> Real-time</div>
            </motion.div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                    { label: 'Portfolio Value', value: `$${totalValue.toLocaleString('en', { minimumFractionDigits: 0 })}`, accent: 'cyan', icon: DollarSign },
                    { label: 'Total P&L', value: `${totalPnL > 0 ? '+' : ''}$${totalPnL.toLocaleString('en', { minimumFractionDigits: 0 })}`, sub: `${totalPnLPct}%`, accent: totalPnL > 0 ? 'emerald' : 'rose', icon: totalPnL > 0 ? TrendingUp : TrendingDown },
                    { label: 'Risk Score', value: '7.2 / 10', accent: 'amber', icon: Shield },
                    { label: 'AI Score', value: '82 / 100', sub: 'Good', accent: 'violet', icon: Target },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.accent}`}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={16} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 8 }} className="nx-mono">{k.value}</div>
                        {k.sub && <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>{k.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Performance Chart + Allocation */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            PORTFOLIO PERFORMANCE — 12 MONTHS
                        </h3>
                        <span className="nx-badge nx-badge-cyan">YTD +{totalPnLPct}%</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={perfData}>
                            <defs>
                                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fill: '#4a5578', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#4a5578', fontSize: 10 }} axisLine={false} tickLine={false}
                                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{
                                background: 'rgba(15,23,62,0.95)', backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12,
                            }} formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
                            <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#perfGrad)" strokeWidth={2}
                                dot={false} style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.4))' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Allocation Pie */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 8 }}>
                            ASSET ALLOCATION
                        </h3>
                        <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                                <Pie data={ALLOC_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={55}
                                    dataKey="value" paddingAngle={3} stroke="transparent">
                                    {ALLOC_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                            {ALLOC_DATA.map(a => (
                                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: 2, background: a.color }} />
                                    <span style={{ color: 'var(--nx-text-dim)' }}>{a.name} {a.value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Risk Gauge */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 4 }}>
                            RISK ASSESSMENT
                        </h3>
                        <RiskGauge score={7.2} />
                    </motion.div>
                </div>
            </div>

            {/* Holdings Table + AI Suggestions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                {/* Holdings */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 14 }}>
                        HOLDINGS
                    </h3>
                    <table className="nx-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Asset</th><th>Shares</th><th>Avg Cost</th><th>Current</th><th>P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {HOLDINGS.map(h => {
                                const pnl = (h.current - h.avgCost) * h.shares
                                const pnlPct = ((h.current - h.avgCost) / h.avgCost * 100).toFixed(1)
                                const up = pnl > 0
                                return (
                                    <tr key={h.symbol}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--nx-text)' }}>{h.symbol}</div>
                                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{h.name}</div>
                                        </td>
                                        <td className="nx-mono" style={{ fontSize: 12 }}>{h.shares}</td>
                                        <td className="nx-mono" style={{ fontSize: 12 }}>${h.avgCost.toLocaleString()}</td>
                                        <td className="nx-mono" style={{ fontSize: 12 }}>${h.current.toLocaleString()}</td>
                                        <td>
                                            <span className="nx-mono" style={{ fontSize: 12, fontWeight: 600, color: up ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>
                                                {up ? '+' : ''}{pnlPct}%
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </motion.div>

                {/* AI Suggestions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <motion.div className="nx-ai-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Zap size={14} color="#a78bfa" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI RECOMMENDATIONS</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { text: 'Rebalance: Tech allocation (64%) exceeds target (55%)', level: 'medium' },
                                { text: 'Consider: Increase bond allocation to reduce risk', level: 'low' },
                                { text: 'Alert: NVDA concentration risk at 26%', level: 'high' },
                            ].map((r, i) => (
                                <div key={i} className={`nx-risk-alert ${r.level}`}>
                                    <AlertTriangle size={13} />
                                    <span style={{ fontSize: 11 }}>{r.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}
                        style={{ padding: '1rem 1.25rem' }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 10 }}>
                            QUICK METRICS
                        </h3>
                        {[
                            { label: 'Sharpe Ratio', value: '1.42', color: 'var(--nx-emerald)' },
                            { label: 'Max Drawdown', value: '-8.3%', color: 'var(--nx-rose)' },
                            { label: 'Beta', value: '1.15', color: 'var(--nx-cyan)' },
                            { label: 'Dividend Yield', value: '1.8%', color: 'var(--nx-amber)' },
                        ].map(m => (
                            <div key={m.label} className="nx-stat-row">
                                <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{m.label}</span>
                                <span className="nx-mono" style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.value}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
