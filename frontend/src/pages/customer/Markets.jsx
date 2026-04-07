import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap, RefreshCw } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

/* ═══════ Simulated Market Data ═══════ */

const STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 218.45, change: 2.34, pct: 1.08 },
    { symbol: 'MSFT', name: 'Microsoft', price: 472.80, change: 5.12, pct: 1.09 },
    { symbol: 'GOOGL', name: 'Alphabet', price: 186.23, change: -1.45, pct: -0.77 },
    { symbol: 'AMZN', name: 'Amazon', price: 225.10, change: 3.67, pct: 1.66 },
    { symbol: 'TSLA', name: 'Tesla', price: 342.18, change: -8.92, pct: -2.54 },
    { symbol: 'NVDA', name: 'NVIDIA', price: 1042.50, change: 18.30, pct: 1.79 },
    { symbol: 'META', name: 'Meta', price: 612.30, change: 4.20, pct: 0.69 },
    { symbol: 'BRK.B', name: 'Berkshire B', price: 475.90, change: -2.10, pct: -0.44 },
]

const INDICES = [
    { name: 'S&P 500', value: '5,842.30', change: '+0.82%', up: true },
    { name: 'NASDAQ', value: '18,420.15', change: '+1.24%', up: true },
    { name: 'DOW', value: '42,180.60', change: '+0.45%', up: true },
    { name: 'FTSE 100', value: '8,320.40', change: '-0.18%', up: false },
    { name: 'BTC/USD', value: '$97,240', change: '+3.14%', up: true },
    { name: 'ETH/USD', value: '$3,820', change: '+2.08%', up: true },
    { name: 'Gold', value: '$2,680.50', change: '-0.32%', up: false },
    { name: 'EUR/USD', value: '1.0842', change: '+0.12%', up: true },
]

function generateChartData(range) {
    const counts = { '1D': 24, '1W': 7, '1M': 30, '3M': 90, '1Y': 12 }
    const n = counts[range] || 30
    let base = 5600 + Math.random() * 200
    return Array.from({ length: n }, (_, i) => {
        base += (Math.random() - 0.48) * 30
        return { t: i, value: Math.round(base * 100) / 100 }
    })
}

function generateCandlestickData() {
    let base = 218
    return Array.from({ length: 30 }, (_, i) => {
        const open = base + (Math.random() - 0.5) * 5
        const close = open + (Math.random() - 0.48) * 8
        const high = Math.max(open, close) + Math.random() * 3
        const low = Math.min(open, close) - Math.random() * 3
        base = close
        return { d: i + 1, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2) }
    })
}

/* ═══════ Candlestick Chart SVG ═══════ */
function CandlestickChart({ data }) {
    if (!data.length) return null
    const w = 600, h = 220, pad = 20
    const allVals = data.flatMap(d => [d.high, d.low])
    const minV = Math.min(...allVals), maxV = Math.max(...allVals)
    const range = maxV - minV || 1
    const barW = (w - pad * 2) / data.length * 0.6
    const gap = (w - pad * 2) / data.length

    const yScale = (v) => h - pad - ((v - minV) / range) * (h - pad * 2)

    return (
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(f => (
                <line key={f} x1={pad} x2={w - pad} y1={pad + f * (h - pad * 2)} y2={pad + f * (h - pad * 2)}
                    stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
            ))}
            {data.map((d, i) => {
                const x = pad + i * gap + gap / 2
                const bullish = d.close >= d.open
                const bodyTop = yScale(Math.max(d.open, d.close))
                const bodyBot = yScale(Math.min(d.open, d.close))
                const bodyH = Math.max(bodyBot - bodyTop, 1)
                return (
                    <g key={i}>
                        <line x1={x} x2={x} y1={yScale(d.high)} y2={yScale(d.low)}
                            className={bullish ? 'nx-candle-wick-green' : 'nx-candle-wick-red'} />
                        <rect x={x - barW / 2} y={bodyTop} width={barW} height={bodyH}
                            className={bullish ? 'nx-candle-green' : 'nx-candle-red'} rx={1}
                            style={{ filter: `drop-shadow(0 0 3px ${bullish ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)'})` }}
                        />
                    </g>
                )
            })}
        </svg>
    )
}

/* ═══════ Sentiment Meter ═══════ */
function SentimentMeter({ value = 68 }) {
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--nx-text-dim)', marginBottom: 6 }}>
                <span>Bearish</span><span>Neutral</span><span>Bullish</span>
            </div>
            <div className="nx-sentiment-meter">
                <div className="nx-sentiment-needle" style={{ left: `calc(${value}% - 7px)` }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: value > 60 ? 'var(--nx-emerald)' : value > 40 ? 'var(--nx-amber)' : 'var(--nx-rose)', marginTop: 8, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                {value > 60 ? 'BULLISH' : value > 40 ? 'NEUTRAL' : 'BEARISH'} ({value}%)
            </div>
        </div>
    )
}

/* ═══════ Main Markets Page ═══════ */
export default function Markets() {
    const [timeRange, setTimeRange] = useState('1M')
    const [chartData, setChartData] = useState(() => generateChartData('1M'))
    const [candleData] = useState(() => generateCandlestickData())
    const [chartType, setChartType] = useState('area')
    const [lastUpdate, setLastUpdate] = useState(new Date())

    useEffect(() => {
        setChartData(generateChartData(timeRange))
    }, [timeRange])

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => setLastUpdate(new Date()), 15000)
        return () => clearInterval(interval)
    }, [])

    const gainers = STOCKS.filter(s => s.change > 0).sort((a, b) => b.pct - a.pct)
    const losers = STOCKS.filter(s => s.change < 0).sort((a, b) => a.pct - b.pct)

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
            >
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Activity size={26} color="#22d3ee" /> MARKET INTELLIGENCE
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        Real-time market data & AI-powered insights
                    </p>
                </div>
                <div className="nx-live-indicator">
                    <div className="dot" />
                    Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </motion.div>

            {/* Market Ticker Strip */}
            <motion.div className="nx-ticker-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: 20 }}>
                <div className="nx-ticker-track">
                    {[...INDICES, ...INDICES].map((idx, i) => (
                        <div className="nx-ticker-item" key={i}>
                            <span style={{ color: 'var(--nx-text-muted)', fontWeight: 600, fontSize: 11 }}>{idx.name}</span>
                            <span style={{ color: 'var(--nx-text)', fontWeight: 500 }}>{idx.value}</span>
                            <span style={{ color: idx.up ? 'var(--nx-emerald)' : 'var(--nx-rose)', fontWeight: 600, fontSize: 11 }}>
                                {idx.change}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Main Chart + Sidebar */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Chart Container */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                                S&P 500 INDEX
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                                <span className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-cyan)' }}>5,842.30</span>
                                <span className="nx-mono" style={{ fontSize: 13, color: 'var(--nx-emerald)' }}>+47.52 (+0.82%)</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {/* Chart type toggle */}
                            <div className="nx-time-filters">
                                <button className={`nx-time-pill ${chartType === 'area' ? 'active' : ''}`} onClick={() => setChartType('area')}>Area</button>
                                <button className={`nx-time-pill ${chartType === 'candle' ? 'active' : ''}`} onClick={() => setChartType('candle')}>Candle</button>
                            </div>
                            {/* Time ranges */}
                            <div className="nx-time-filters">
                                {['1D', '1W', '1M', '3M', '1Y'].map(r => (
                                    <button key={r} className={`nx-time-pill ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>{r}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {chartType === 'area' ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="t" hide />
                                <YAxis domain={['auto', 'auto']} tick={{ fill: '#4a5578', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{
                                    background: 'rgba(15,23,62,0.95)', backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12,
                                }} />
                                <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#mktGrad)" strokeWidth={2}
                                    dot={false} style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.4))' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <CandlestickChart data={candleData} />
                    )}
                </motion.div>

                {/* Sentiment + AI Insight */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 12 }}>
                            MARKET SENTIMENT
                        </h3>
                        <SentimentMeter value={68} />
                    </motion.div>

                    <motion.div className="nx-ai-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Zap size={14} color="#a78bfa" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI INSIGHT</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', lineHeight: 1.7 }}>
                            Tech sector showing strong momentum. NVDA leading with +1.79%.
                            AI models predict continued bullish trend through Q2.
                            Consider rebalancing if equity allocation exceeds 75%.
                        </p>
                    </motion.div>

                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                        style={{ padding: '1rem 1.25rem' }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 8 }}>
                            FEAR & GREED INDEX
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span className="nx-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-emerald)' }}>72</span>
                            <span style={{ fontSize: 11, color: 'var(--nx-emerald)', fontWeight: 600 }}>GREED</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <div className="nx-progress" style={{ height: 6 }}>
                                <motion.div className="nx-progress-bar" style={{ background: 'linear-gradient(90deg, #fb7185, #fbbf24, #34d399)', width: '72%', boxShadow: '0 0 8px rgba(52,211,153,0.4)' }} initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1, delay: 0.8 }} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Gainers / Losers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Top Gainers */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-emerald)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={16} /> TOP GAINERS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {gainers.map(s => (
                            <div key={s.symbol} className="nx-market-card gainer" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{s.symbol}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{s.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="nx-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)' }}>${s.price.toFixed(2)}</div>
                                    <div className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-emerald)' }}>+{s.pct.toFixed(2)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Top Losers */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-rose)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingDown size={16} /> TOP LOSERS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {losers.map(s => (
                            <div key={s.symbol} className="nx-market-card loser" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{s.symbol}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{s.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="nx-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)' }}>${s.price.toFixed(2)}</div>
                                    <div className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-rose)' }}>{s.pct.toFixed(2)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
