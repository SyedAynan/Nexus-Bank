import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, TrendingDown, Shield, Sparkles, Activity, Target, RefreshCw, Zap } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { getLivePortfolio, getPerformanceChart, getLiveIndices } from '../../data/simulationEngine'

export default function Portfolio() {
    const [portfolio, setPortfolio] = useState(getLivePortfolio())
    const [perfData, setPerfData] = useState(getPerformanceChart())
    const [benchmarks, setBenchmarks] = useState(getLiveIndices().slice(0, 3))
    const [lastUpdate, setLastUpdate] = useState(new Date())

    useEffect(() => {
        const intv = setInterval(() => {
            setPortfolio(getLivePortfolio())
            setPerfData(getPerformanceChart())
            setBenchmarks(getLiveIndices().slice(0, 3))
            setLastUpdate(new Date())
        }, 5000)
        return () => clearInterval(intv)
    }, [])

    const { holdings, totalValue, totalCost, pnl, pnlPct } = portfolio
    const allocData = [
        { name: 'Tech', value: 64, color: '#22d3ee' },
        { name: 'Crypto', value: 8, color: '#a78bfa' },
        { name: 'Bonds', value: 17, color: '#34d399' },
        { name: 'Other', value: 11, color: '#fbbf24' },
    ]
    const riskScore = 7.2
    const aiScore = 82

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase size={22} color="#a78bfa" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>PORTFOLIO INTELLIGENCE</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>AI-powered analytics & risk management — Real-time</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="nx-live-indicator"><div className="dot" /> Live · {lastUpdate.toLocaleTimeString()}</div>
                    <span className="nx-badge nx-badge-cyan">Real-time</span>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Portfolio Value', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, accent: 'cyan', icon: Briefcase },
                    { label: 'Total P&L', value: `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`, accent: pnl >= 0 ? 'emerald' : 'rose', icon: pnl >= 0 ? TrendingUp : TrendingDown },
                    { label: 'Risk Score', value: `${riskScore} / 10`, accent: 'amber', icon: Shield },
                    { label: 'AI Score', value: `${aiScore} / 100`, sub: 'Good', accent: 'violet', icon: Sparkles },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={16} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 8 }}>{k.value}</div>
                        {k.sub && <div style={{ fontSize: 11, color: `var(--nx-${k.accent})`, marginTop: 4 }}>{k.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Performance */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            PORTFOLIO PERFORMANCE — 12 MONTHS
                        </h3>
                        <span className="nx-badge nx-badge-cyan" style={{ fontSize: 10 }}>YTD +{pnlPct.toFixed(1)}%</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={perfData}>
                            <defs>
                                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fill: 'var(--nx-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--nx-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }} formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
                            <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#portGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Asset Allocation */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>ASSET ALLOCATION</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={allocData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3} stroke="transparent">
                                {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }} formatter={v => [`${v}%`, '']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                        {allocData.map(a => (
                            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--nx-text-muted)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color }} /> {a.name} {a.value}%
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom: Risk + Holdings + Benchmarks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Risk Assessment */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16 }}>RISK ASSESSMENT</h3>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <svg width="140" height="80" viewBox="0 0 140 80">
                            <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
                            <motion.path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#fbbf24" strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={`${(riskScore/10)*188} 300`} initial={{ strokeDasharray: '0 300' }}
                                animate={{ strokeDasharray: `${(riskScore/10)*188} 300` }} transition={{ duration: 1.2 }}
                                style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }} />
                            <text x="70" y="55" textAnchor="middle" fill="var(--nx-text)" fontSize="22" fontWeight="700" fontFamily="var(--font-mono)">{riskScore}</text>
                            <text x="70" y="72" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="600" fontFamily="var(--font-display)" letterSpacing="0.1em">MODERATE</text>
                        </svg>
                    </div>
                    {[
                        { label: 'Volatility', value: 'Medium', color: 'var(--nx-amber)' },
                        { label: 'Concentration', value: 'High', color: 'var(--nx-rose)' },
                        { label: 'Liquidity', value: 'Good', color: 'var(--nx-emerald)' },
                        { label: 'Diversification', value: 'Fair', color: 'var(--nx-cyan)' },
                    ].map((r, i) => (
                        <div key={i} className="nx-stat-row">
                            <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.value}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Holdings */}
                <motion.div className="nx-card-static" style={{ overflowX: 'auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>LIVE HOLDINGS</h3>
                        <div className="nx-live-indicator"><div className="dot" /> 5s</div>
                    </div>
                    {holdings.map((h, i) => {
                        const pl = (h.price - h.avgCost) * h.shares
                        const plPct = ((h.price - h.avgCost) / h.avgCost * 100)
                        return (
                            <motion.div key={h.symbol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.05 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--nx-border)', flexWrap: 'wrap', gap: 4 }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)' }}>{h.symbol}</div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{h.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="nx-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>${h.price?.toFixed?.(2) || h.price?.toLocaleString?.()}</div>
                                    <div className="nx-mono" style={{ fontSize: 10, color: pl >= 0 ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>
                                        {pl >= 0 ? '+' : ''}{isNaN(plPct) ? '0.00' : plPct.toFixed(2)}%
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* Benchmarks */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16 }}>BENCHMARKS</h3>
                    {benchmarks.map((b, i) => (
                        <div key={b.symbol} className="nx-stat-row" style={{ padding: '12px 0' }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{b.name}</div>
                                <div className="nx-mono" style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{b.value}</div>
                            </div>
                            <span className="nx-mono" style={{ fontSize: 13, fontWeight: 600, color: b.up ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>{b.change}</span>
                        </div>
                    ))}

                    <div style={{ marginTop: 16 }}>
                        <div className="nx-ai-summary" style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Sparkles size={12} color="#a78bfa" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)' }}>AI RECOMMENDATION</span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>
                                Portfolio outperforming S&P by <strong style={{ color: 'var(--nx-emerald)' }}>+2.3%</strong>. 
                                Consider increasing bond allocation to 20% for better risk-adjusted returns.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
