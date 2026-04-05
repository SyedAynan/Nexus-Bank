import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PieChart, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const PORTFOLIO = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 25, avgCost: 178.50, current: 192.30, change: +2.15, sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 10, avgCost: 141.20, current: 153.80, change: +1.82, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 15, avgCost: 380.00, current: 415.60, change: -0.45, sector: 'Technology' },
    { symbol: 'JPM', name: 'JPMorgan Chase', shares: 20, avgCost: 172.30, current: 185.40, change: +0.92, sector: 'Finance' },
    { symbol: 'AMZN', name: 'Amazon.com', shares: 12, avgCost: 165.40, current: 178.90, change: +1.34, sector: 'Consumer' },
    { symbol: 'TSLA', name: 'Tesla Inc.', shares: 8, avgCost: 245.00, current: 238.50, change: -1.78, sector: 'Automotive' },
    { symbol: 'V', name: 'Visa Inc.', shares: 18, avgCost: 265.80, current: 282.10, change: +0.67, sector: 'Finance' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 5, avgCost: 720.00, current: 885.30, change: +3.42, sector: 'Technology' },
]

export default function Investments() {
    const [tab, setTab] = useState('portfolio')

    const totalValue = PORTFOLIO.reduce((s, p) => s + p.current * p.shares, 0)
    const totalCost = PORTFOLIO.reduce((s, p) => s + p.avgCost * p.shares, 0)
    const totalReturn = totalValue - totalCost
    const returnPct = (totalReturn / totalCost * 100)
    const dayChange = PORTFOLIO.reduce((s, p) => s + (p.current * p.change / 100) * p.shares, 0)

    const bySector = PORTFOLIO.reduce((acc, p) => {
        const val = p.current * p.shares
        acc[p.sector] = (acc[p.sector] || 0) + val
        return acc
    }, {})

    const sectorColors = { Technology: '#22d3ee', Finance: '#a78bfa', Consumer: '#34d399', Automotive: '#f59e0b' }

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>INVESTMENTS</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Portfolio tracking & performance analytics</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Portfolio Value', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: '#22d3ee' },
                    { label: 'Total Return', value: `${totalReturn >= 0 ? '+' : ''}$${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`, icon: totalReturn >= 0 ? TrendingUp : TrendingDown, color: totalReturn >= 0 ? '#34d399' : '#ef4444' },
                    { label: "Today's Change", value: `${dayChange >= 0 ? '+' : ''}$${dayChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: dayChange >= 0 ? ArrowUpRight : ArrowDownRight, color: dayChange >= 0 ? '#34d399' : '#ef4444' },
                    { label: 'Holdings', value: PORTFOLIO.length, icon: BarChart3, color: '#a78bfa' },
                ].map((card, i) => (
                    <motion.div key={i} className="nx-card-static" style={{ padding: '1.2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}18`, border: `1px solid ${card.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <card.icon size={18} color={card.color} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{card.label}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: card.color, fontFamily: 'var(--font-display)' }}>{card.value}</div>
                        {card.sub && <div style={{ fontSize: 12, color: card.color, marginTop: 2 }}>{card.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Sector Allocation */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Sector Allocation</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {Object.entries(bySector).map(([sector, val]) => (
                        <div key={sector} style={{ flex: val / totalValue, height: 8, borderRadius: 4, background: sectorColors[sector] || '#666', minWidth: 8, transition: 'flex 0.3s ease' }} title={`${sector}: ${(val / totalValue * 100).toFixed(1)}%`} />
                    ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {Object.entries(bySector).map(([sector, val]) => (
                        <div key={sector} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: sectorColors[sector] || '#666' }} />
                            <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{sector}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{(val / totalValue * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Holdings Table */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', overflowX: 'auto' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Holdings</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--nx-border)' }}>
                            {['Symbol', 'Name', 'Shares', 'Avg Cost', 'Current', 'P/L', 'P/L %', 'Value'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Symbol' || h === 'Name' ? 'left' : 'right', fontSize: 11, color: 'var(--nx-text-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {PORTFOLIO.map((s, i) => {
                            const pl = (s.current - s.avgCost) * s.shares
                            const plPct = ((s.current - s.avgCost) / s.avgCost * 100)
                            return (
                                <motion.tr key={s.symbol} style={{ borderBottom: '1px solid var(--nx-border)' }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)' }}>{s.symbol}</td>
                                    <td style={{ padding: '10px 12px', color: 'var(--nx-text)' }}>{s.name}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--nx-text)' }}>{s.shares}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--nx-text-muted)' }}>${s.avgCost.toFixed(2)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--nx-text)' }}>${s.current.toFixed(2)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: pl >= 0 ? '#34d399' : '#ef4444' }}>{pl >= 0 ? '+' : ''}${pl.toFixed(0)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', color: plPct >= 0 ? '#34d399' : '#ef4444' }}>{plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>${(s.current * s.shares).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </motion.tr>
                            )
                        })}
                    </tbody>
                </table>
            </motion.div>
        </div>
    )
}
