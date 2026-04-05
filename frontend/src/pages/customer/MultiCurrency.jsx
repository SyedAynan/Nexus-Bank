import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Wallet, Globe, RefreshCw, TrendingUp } from 'lucide-react'

export default function MultiCurrency() {
    const [wallet, setWallet] = useState({ holdings: [], total_usd: 0 })
    const [currencies, setCurrencies] = useState([])
    const [fromCurr, setFromCurr] = useState('USD')
    const [toCurr, setToCurr] = useState('EUR')
    const [amount, setAmount] = useState('1000')
    const [result, setResult] = useState(null)

    useEffect(() => {
        api.get('/services/fx/wallet').then(r => setWallet(r.data || { holdings: [], total_usd: 0 })).catch(() => { })
        api.get('/services/fx/currencies').then(r => setCurrencies(r.data || [])).catch(() => { })
    }, [])

    const convert = () => {
        if (!amount) return
        api.get(`/services/fx/convert?amount=${amount}&from_currency=${fromCurr}&to_currency=${toCurr}`)
            .then(r => setResult(r.data))
            .catch(() => { })
    }

    const swap = () => { setFromCurr(toCurr); setToCurr(fromCurr); setResult(null) }

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>MULTI-CURRENCY</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>FX converter & multi-currency wallet</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Converter */}
                <motion.div className="nx-card-static" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeftRight size={20} color="var(--nx-cyan)" />
                        </div>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>Currency Converter</div></div>
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
                                </select>
                            </div>
                            <button onClick={swap} style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8, padding: 8, cursor: 'pointer', marginBottom: 2 }}>
                                <RefreshCw size={16} color="#a78bfa" />
                            </button>
                            <div>
                                <label className="nx-label">To</label>
                                <select className="nx-select" value={toCurr} onChange={e => { setToCurr(e.target.value); setResult(null) }}>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={convert} className="nx-btn nx-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <ArrowLeftRight size={16} /> Convert
                        </button>
                    </div>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, padding: 16, background: 'rgba(34,211,238,0.05)', borderRadius: 10, border: '1px solid rgba(34,211,238,0.2)' }}>
                            <div style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginBottom: 4 }}>{result.from_info?.flag} {parseFloat(amount).toLocaleString()} {fromCurr} =</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)' }}>
                                {result.to_info?.flag} {result.to_info?.symbol}{result.converted?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurr}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 6 }}>
                                Rate: 1 {fromCurr} = {result.rate} {toCurr} · Inverse: 1 {toCurr} = {result.inverse_rate} {fromCurr}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Wallet */}
                <motion.div className="nx-card-static" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={20} color="#a78bfa" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>Multi-Currency Wallet</div>
                            <div style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>Total: ${wallet.total_usd?.toLocaleString()}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {wallet.holdings?.map((h, i) => (
                            <motion.div key={h.currency} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--nx-bg-3)', borderRadius: 8, border: '1px solid var(--nx-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 22 }}>{h.flag}</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{h.currency}</div>
                                        <div style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{h.name}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>{h.symbol}{h.balance?.toLocaleString()}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>${h.usd_value?.toLocaleString()} · {h.percentage}%</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* FX Rates */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', overflowX: 'auto' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Globe size={18} color="var(--nx-cyan)" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>Exchange Rates (USD Base)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {currencies.map((c, i) => (
                        <motion.div key={c.code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                            style={{ padding: '10px 12px', background: 'var(--nx-bg-3)', borderRadius: 8, border: '1px solid var(--nx-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{c.flag}</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{c.code}</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)' }}>{c.rate}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
