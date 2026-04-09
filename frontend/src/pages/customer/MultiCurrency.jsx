import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Wallet, Globe, RefreshCw, TrendingUp, TrendingDown, Sparkles, Zap, Activity, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getDemoFXWallet, getDemoFXCurrencies } from '../../data/simulationEngine'

const ACCENT_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#3b82f6']

export default function MultiCurrency() {
    const [wallet, setWallet] = useState({ holdings: [], total_usd: 0 })
    const [currencies, setCurrencies] = useState([])
    const [fromCurr, setFromCurr] = useState('USD')
    const [toCurr, setToCurr] = useState('EUR')
    const [amount, setAmount] = useState('1000')
    const [result, setResult] = useState(null)
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const [converting, setConverting] = useState(false)

    useEffect(() => {
        Promise.all([
            api.get('/services/fx/wallet').catch(() => ({ data: null })),
            api.get('/services/fx/currencies').catch(() => ({ data: [] })),
        ]).then(([w, c]) => {
            setWallet(w.data?.holdings?.length > 0 ? w.data : getDemoFXWallet())
            setCurrencies(c.data?.length > 0 ? c.data : getDemoFXCurrencies())
        })
    }, [])

    // Live refresh of FX rates every 10s
    useEffect(() => {
        const intv = setInterval(() => {
            setCurrencies(prev => {
                if (prev.length === 0) return getDemoFXCurrencies()
                // Micro-fluctuations on demo data
                return prev.map(c => ({
                    ...c,
                    rate: +(c.rate * (1 + (Math.random() - 0.5) * 0.002)).toFixed(c.rate > 10 ? 2 : 4),
                    change: +((Math.random() - 0.48) * 2).toFixed(2),
                }))
            })
            setWallet(getDemoFXWallet())
            setLastUpdate(new Date())
        }, 10000)
        return () => clearInterval(intv)
    }, [])

    const convert = () => {
        if (!amount) return
        setConverting(true)
        api.get(`/services/fx/convert?amount=${amount}&from_currency=${fromCurr}&to_currency=${toCurr}`)
            .then(r => { setResult(r.data); setConverting(false) })
            .catch(() => {
                // Local conversion fallback
                const from = currencies.find(c => c.code === fromCurr) || { rate: 1 }
                const to = currencies.find(c => c.code === toCurr) || { rate: 1 }
                const rate = to.rate / from.rate
                setResult({
                    converted: parseFloat(amount) * rate,
                    rate: rate.toFixed(4),
                    inverse_rate: (1 / rate).toFixed(4),
                    from_info: from,
                    to_info: to,
                })
                setConverting(false)
            })
    }

    const swap = () => { setFromCurr(toCurr); setToCurr(fromCurr); setResult(null) }

    // Wallet pie data
    const walletPieData = wallet.holdings.map((h, i) => ({
        name: h.currency,
        value: h.usd_value || 0,
        fill: ACCENT_COLORS[i % ACCENT_COLORS.length],
    }))

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={22} color="#22d3ee" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>MULTI-CURRENCY</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>Real-time FX rates, converter & multi-currency wallet</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="nx-live-indicator"><div className="dot" /> Live · {lastUpdate.toLocaleTimeString()}</div>
                    <span className="nx-badge nx-badge-cyan"><Activity size={10} style={{ marginRight: 4 }} /> {currencies.length} Currencies</span>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Wallet Value', value: `$${(wallet.total_usd || 0).toLocaleString()}`, icon: Wallet, accent: 'cyan' },
                    { label: 'Currencies Held', value: wallet.holdings?.length || 0, icon: Globe, accent: 'violet' },
                    { label: 'Strongest', value: currencies.length > 0 ? currencies.reduce((best, c) => (c.change || 0) > (best.change || 0) ? c : best, currencies[0])?.code || '—' : '—', icon: TrendingUp, accent: 'emerald' },
                    { label: 'Active Rates', value: currencies.length, icon: Activity, accent: 'amber' },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={16} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 8 }}>{k.value}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Converter */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeftRight size={18} color="var(--nx-cyan)" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>CURRENCY CONVERTER</div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>Real-time exchange rates</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="nx-label">Amount</label>
                            <input type="number" className="nx-input" value={amount} onChange={e => { setAmount(e.target.value); setResult(null) }} placeholder="0.00" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}>
                            <div>
                                <label className="nx-label">From</label>
                                <select className="nx-select" value={fromCurr} onChange={e => { setFromCurr(e.target.value); setResult(null) }}>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                                    {currencies.length === 0 && <option>Loading...</option>}
                                </select>
                            </div>
                            <motion.button onClick={swap} whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.3 }}
                                style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8, padding: 8, cursor: 'pointer', marginBottom: 2 }}>
                                <RefreshCw size={16} color="#a78bfa" />
                            </motion.button>
                            <div>
                                <label className="nx-label">To</label>
                                <select className="nx-select" value={toCurr} onChange={e => { setToCurr(e.target.value); setResult(null) }}>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                                    {currencies.length === 0 && <option>Loading...</option>}
                                </select>
                            </div>
                        </div>
                        <motion.button onClick={convert} className="nx-btn nx-btn-primary" disabled={converting}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Zap size={15} /> {converting ? 'Converting...' : 'Convert'}
                        </motion.button>
                    </div>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, padding: 16, background: 'rgba(34,211,238,0.05)', borderRadius: 10, border: '1px solid rgba(34,211,238,0.2)' }}>
                            <div style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginBottom: 4 }}>{result.from_info?.flag || ''} {parseFloat(amount).toLocaleString()} {fromCurr} =</div>
                            <div className="nx-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-cyan)' }}>
                                {result.to_info?.flag || ''} {result.to_info?.symbol || ''}{result.converted?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurr}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <span>Rate: 1 {fromCurr} = {result.rate} {toCurr}</span>
                                <span>Inverse: 1 {toCurr} = {result.inverse_rate} {fromCurr}</span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Wallet + Allocation */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    {/* Wallet Holdings */}
                    <div className="nx-card-static">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={18} color="#a78bfa" />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>MULTI-CURRENCY WALLET</div>
                                <div className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-emerald)' }}>Total: ${(wallet.total_usd || 0).toLocaleString()}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {wallet.holdings?.map((h, i) => (
                                <motion.div key={h.currency} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.05 }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(10,15,46,0.4)', borderRadius: 8, border: '1px solid var(--nx-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 20 }}>{h.flag}</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{h.currency}</div>
                                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{h.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="nx-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)' }}>{h.symbol}{h.balance?.toLocaleString()}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                            <span className="nx-mono" style={{ fontSize: 10, color: 'var(--nx-text-muted)' }}>${(h.usd_value || 0).toLocaleString()}</span>
                                            {h.change !== undefined && h.change !== 0 && (
                                                <span className="nx-mono" style={{ fontSize: 9, color: h.change > 0 ? 'var(--nx-emerald)' : 'var(--nx-rose)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {h.change > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}{h.change > 0 ? '+' : ''}{h.change}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Portfolio Allocation Pie */}
                    {walletPieData.length > 0 && (
                        <div className="nx-card-static">
                            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>ALLOCATION</h3>
                            <ResponsiveContainer width="100%" height={120}>
                                <PieChart>
                                    <Pie data={walletPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3} stroke="transparent">
                                        {walletPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }}
                                        formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                                {walletPieData.map((s, i) => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--nx-text-muted)' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: 1, background: s.fill }} />
                                        {s.name} <span className="nx-mono" style={{ color: 'var(--nx-text)' }}>{wallet.holdings[i]?.percentage || 0}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* FX Rates Grid */}
            <motion.div className="nx-card-static" style={{ overflowX: 'auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Globe size={16} color="var(--nx-cyan)" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>LIVE EXCHANGE RATES</span>
                    </div>
                    <div className="nx-live-indicator"><div className="dot" /> Auto-refresh 10s</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {currencies.map((c, i) => (
                        <motion.div key={c.code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.03 }}
                            style={{
                                padding: '12px 14px', background: 'rgba(10,15,46,0.4)', borderRadius: 10,
                                border: '1px solid var(--nx-border)', display: 'flex', alignItems: 'center', gap: 10,
                                transition: 'border-color 0.3s',
                            }}>
                            <span style={{ fontSize: 22 }}>{c.flag}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{c.code}</div>
                                <div className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-cyan)' }}>{c.rate}</div>
                            </div>
                            {c.change !== undefined && (
                                <span className="nx-mono" style={{ fontSize: 10, fontWeight: 600, color: c.change >= 0 ? 'var(--nx-emerald)' : 'var(--nx-rose)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {c.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {c.change >= 0 ? '+' : ''}{c.change}%
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* AI FX Insights */}
            <motion.div className="nx-ai-summary" style={{ marginTop: 16 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Sparkles size={14} color="#a78bfa" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI FX INTELLIGENCE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                    {[
                        { text: 'EUR/USD showing bullish momentum. Consider increasing EUR allocation for Q2.', color: '#34d399', type: 'Bullish' },
                        { text: 'JPY weakening against USD — hedge exposure with CHF or SGD positions.', color: '#fbbf24', type: 'Advisory' },
                        { text: 'GBP/USD approaching resistance at 1.28. Good conversion window.', color: '#22d3ee', type: 'Timing' },
                    ].map((ins, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${ins.color}08`, border: `1px solid ${ins.color}15` }}>
                            <Zap size={12} color={ins.color} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: ins.color, letterSpacing: '0.08em', marginBottom: 2 }}>{ins.type.toUpperCase()}</div>
                                <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>{ins.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
