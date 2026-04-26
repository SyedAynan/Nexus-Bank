import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PieChart as PieIcon, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, Sparkles, Activity, Zap, Target, RefreshCw } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { getLiveStocks, getPerformanceChart } from '../../data/simulationEngine'

export default function Investments() {
    const [stocks, setStocks] = useState(getLiveStocks())
    const [perfData, setPerfData] = useState(getPerformanceChart())
    const [lastUpdate, setLastUpdate] = useState(new Date())

    // Real-time data refresh
    useEffect(() => {
        const intv = setInterval(() => {
            setStocks(getLiveStocks())
            setPerfData(getPerformanceChart())
            setLastUpdate(new Date())
        }, 5000)
        return () => clearInterval(intv)
    }, [])

    const totalValue = stocks.reduce((s, st) => s + st.price * (st.sector === 'Technology' ? 20 : 15), 0)
    const totalCost = stocks.reduce((s, st) => s + st.basePrice * (st.sector === 'Technology' ? 20 : 15), 0)
    const totalReturn = totalValue - totalCost
    const returnPct = (totalReturn / totalCost * 100)
    const dayChange = stocks.reduce((s, st) => s + st.change * (st.sector === 'Technology' ? 20 : 15), 0)

    const bySector = stocks.reduce((acc, s) => {
        const shares = s.sector === 'Technology' ? 20 : 15
        acc[s.sector] = (acc[s.sector] || 0) + s.price * shares
        return acc
    }, {})
    const sectorColors = { Technology: '#22d3ee', Finance: '#a78bfa', Consumer: '#34d399', Automotive: '#fbbf24', Healthcare: '#fb7185' }
    const sectorData = Object.entries(bySector).map(([name, value]) => ({ name, value: Math.round(value) }))

    const insights = [
        { text: 'NVDA showing strong momentum — AI sector demand driving growth.', color: '#34d399', type: 'Bullish' },
        { text: 'Consider diversifying from tech (57%) to reduce concentration risk.', color: '#fbbf24', type: 'Advisory' },
        { text: 'Healthcare sector underweight at 4.2% vs benchmark 13%.', color: '#fb7185', type: 'Action' },
    ]

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PieIcon size={22} color="#22d3ee" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>INVESTMENT INTELLIGENCE</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>Real-time portfolio tracking & AI-powered analytics</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="nx-live-indicator"><div className="dot" /> Live · {lastUpdate.toLocaleTimeString()}</div>
                    <span className="nx-badge nx-badge-violet"><Sparkles size={10} style={{ marginRight: 4 }} /> AI Enhanced</span>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Portfolio Value', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, accent: 'cyan' },
                    { label: 'Total Return', value: `${totalReturn >= 0 ? '+' : ''}$${Math.abs(totalReturn).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`, icon: totalReturn >= 0 ? TrendingUp : TrendingDown, accent: totalReturn >= 0 ? 'emerald' : 'rose' },
                    { label: "Today's P&L", value: `${dayChange >= 0 ? '+' : ''}$${Math.abs(dayChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: dayChange >= 0 ? ArrowUpRight : ArrowDownRight, accent: dayChange >= 0 ? 'emerald' : 'rose' },
                    { label: 'Holdings', value: stocks.length.toString(), sub: `${Object.keys(bySector).length} sectors`, icon: BarChart3, accent: 'violet' },
                ].map((card, i) => (
                    <motion.div key={i} className={`nx-kpi ${card.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{card.label}</div>
                            <card.icon size={16} color={`var(--nx-${card.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${card.accent})`, marginTop: 8 }} className="nx-mono">{card.value}</div>
                        {card.sub && <div style={{ fontSize: 11, color: `var(--nx-${card.accent})`, marginTop: 4 }}>{card.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Performance Chart */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>PORTFOLIO PERFORMANCE — 12M</h3>
                        <span className="nx-badge nx-badge-cyan" style={{ fontSize: 10 }}>YTD +{returnPct.toFixed(1)}%</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={perfData}>
                            <defs>
                                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fill: 'var(--nx-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--nx-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }}
                                formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
                            <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#perfGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Sector Donut */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} style={{ position: 'relative' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>SECTOR ALLOCATION</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={sectorData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3} stroke="transparent">
                                {sectorData.map((entry, i) => <Cell key={i} fill={sectorColors[entry.name] || '#666'} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }}
                                formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                        {sectorData.map(s => (
                            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--nx-text-muted)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: sectorColors[s.name] || '#666' }} />
                                {s.name} <span className="nx-mono" style={{ color: 'var(--nx-text)' }}>{((s.value / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom: Holdings + AI Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Holdings Table */}
                <motion.div className="nx-card-static" style={{ overflowX: 'auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>LIVE HOLDINGS</h3>
                        <div className="nx-live-indicator"><div className="dot" /> Updates 5s</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--nx-border)' }}>
                                {['Symbol', 'Price', 'Change', 'Sector'].map(h => (
                                    <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Symbol' ? 'left' : 'right', fontSize: 10, color: 'var(--nx-text-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((s, i) => (
                                <motion.tr key={s.symbol} style={{ borderBottom: '1px solid var(--nx-border)' }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + i * 0.03 }}>
                                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)', fontSize: 11 }}>
                                        {s.symbol}
                                        <div style={{ fontSize: 9, color: 'var(--nx-text-dim)', fontWeight: 400, fontFamily: 'var(--font-sans)' }}>{s.name}</div>
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-mono)' }}>${s.price.toFixed(2)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.pct >= 0 ? 'var(--nx-emerald)' : 'var(--nx-rose)' }}>
                                        {s.pct >= 0 ? '+' : ''}{s.pct}%
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${sectorColors[s.sector] || '#666'}15`, color: sectorColors[s.sector] || '#666', fontWeight: 600 }}>{s.sector}</span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>

                {/* AI Insights */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <div className="nx-ai-summary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Sparkles size={14} color="#a78bfa" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI INVESTMENT INSIGHTS</span>
                        </div>
                        {insights.map((ins, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: `${ins.color}08`, border: `1px solid ${ins.color}15` }}>
                                <Zap size={12} color={ins.color} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: ins.color, letterSpacing: '0.08em', marginBottom: 2 }}>{ins.type.toUpperCase()}</div>
                                    <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>{ins.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Metrics */}
                    <div className="nx-card-static">
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 12 }}>RISK METRICS</div>
                        {[
                            { label: 'Sharpe Ratio', value: '1.42', color: 'var(--nx-emerald)' },
                            { label: 'Beta', value: '1.18', color: 'var(--nx-cyan)' },
                            { label: 'Max Drawdown', value: '-8.3%', color: 'var(--nx-rose)' },
                            { label: 'Dividend Yield', value: '1.8%', color: 'var(--nx-amber)' },
                        ].map((m, i) => (
                            <div key={i} className="nx-stat-row">
                                <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{m.label}</span>
                                <span className="nx-mono" style={{ fontSize: 13, fontWeight: 600, color: m.color }}>{m.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
