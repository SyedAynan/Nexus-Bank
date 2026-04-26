import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Shield, Activity, Zap, CreditCard, Target, ArrowRight, Sparkles, BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts'
import { getCreditData } from '../../data/simulationEngine'

export default function Loans() {
    const [data, setData] = useState(getCreditData())
    const [lastUpdate, setLastUpdate] = useState(new Date())

    useEffect(() => {
        const intv = setInterval(() => { setData(getCreditData()); setLastUpdate(new Date()) }, 10000)
        return () => clearInterval(intv)
    }, [])

    const utilization = ((data.utilized / data.totalCredit) * 100).toFixed(1)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const repaymentData = months.map((m, i) => ({
        month: m,
        principal: Math.round(1200 + Math.sin(i * 0.8) * 400),
        interest: Math.round(400 + Math.cos(i * 0.5) * 150),
    }))

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={22} color="#34d399" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>CREDIT & LOANS</h1>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>Intelligent loan management & credit monitoring</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="nx-live-indicator"><div className="dot" /> Live · {lastUpdate.toLocaleTimeString()}</div>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total Credit Limit', value: `$${data.totalCredit.toLocaleString()}`, accent: 'cyan', icon: DollarSign },
                    { label: 'Utilized', value: `$${data.utilized.toLocaleString()}`, sub: `${utilization}%`, accent: 'rose', icon: Activity },
                    { label: 'Available', value: `$${data.available.toLocaleString()}`, accent: 'emerald', icon: Target },
                    { label: 'Credit Score', value: data.creditScore.toString(), sub: 'Good', accent: 'violet', icon: Shield },
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Credit Breakdown Pie */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>CREDIT BREAKDOWN</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={data.breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} stroke="transparent">
                                {data.breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }} formatter={v => [`${v}%`, '']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 4 }}>
                        {data.breakdown.map(b => (
                            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--nx-text-muted)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} /> {b.name} {b.value}%
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Repayment Flow */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16 }}>REPAYMENT FLOW — 12M</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={repaymentData}>
                            <defs>
                                <linearGradient id="repPrin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="repInt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fill: 'var(--nx-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--nx-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--nx-border)', borderRadius: 10, fontSize: 12 }} />
                            <Area type="monotone" dataKey="principal" stroke="#34d399" fill="url(#repPrin)" strokeWidth={2} name="Principal" />
                            <Area type="monotone" dataKey="interest" stroke="#a78bfa" fill="url(#repInt)" strokeWidth={2} name="Interest" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Bottom: Loan Cards + Credit Score + Data Flow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Active Loans */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>ACTIVE LOANS</h3>
                    {data.activeLoans.map((loan, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + i * 0.08 }}
                            style={{ padding: '14px', background: 'rgba(34,211,238,0.02)', border: '1px solid var(--nx-border)', borderRadius: 10, marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>{loan.type}</span>
                                <span className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-cyan)' }}>{loan.rate}% APR</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>Remaining</span>
                                <span className="nx-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>${loan.remaining.toLocaleString()}</span>
                            </div>
                            <div className="nx-progress">
                                <motion.div className="nx-progress-bar" style={{ background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.4)' }}
                                    initial={{ width: 0 }} animate={{ width: `${(1 - loan.remaining / loan.principal) * 100}%` }} transition={{ duration: 1, delay: 0.8 + i * 0.1 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                <span style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>${(loan.principal - loan.remaining).toLocaleString()} paid</span>
                                <span style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>${loan.principal.toLocaleString()} total</span>
                            </div>
                            {loan.emi > 0 && <div style={{ fontSize: 10, color: 'var(--nx-emerald)', marginTop: 4 }}>EMI: ${loan.emi}/mo · {loan.term}mo term</div>}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Credit Score Gauge */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>CREDIT SCORE</h3>
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <svg width="180" height="100" viewBox="0 0 180 100">
                            <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
                            <motion.path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" strokeWidth="12" strokeLinecap="round"
                                stroke="url(#creditGrad)"
                                strokeDasharray={`${(data.creditScore / 850) * 248} 300`}
                                initial={{ strokeDasharray: '0 300' }}
                                animate={{ strokeDasharray: `${(data.creditScore / 850) * 248} 300` }}
                                transition={{ duration: 1.5 }} />
                            <defs>
                                <linearGradient id="creditGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#fb7185" />
                                    <stop offset="50%" stopColor="#fbbf24" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                            </defs>
                            <text x="90" y="65" textAnchor="middle" fill="var(--nx-text)" fontSize="28" fontWeight="700" fontFamily="var(--font-mono)">{data.creditScore}</text>
                            <text x="90" y="85" textAnchor="middle" fill="var(--nx-emerald)" fontSize="10" fontWeight="600" fontFamily="var(--font-display)" letterSpacing="0.1em">
                                {data.creditScore >= 740 ? 'EXCELLENT' : data.creditScore >= 680 ? 'GOOD' : 'FAIR'}
                            </text>
                        </svg>
                    </div>
                    {[
                        { label: 'Payment History', value: 'On Time (100%)', color: 'var(--nx-emerald)' },
                        { label: 'Credit Age', value: '7.2 years', color: 'var(--nx-cyan)' },
                        { label: 'Hard Inquiries', value: '2 (last 12mo)', color: 'var(--nx-amber)' },
                        { label: 'Utilization', value: `${utilization}%`, color: parseFloat(utilization) > 50 ? 'var(--nx-rose)' : 'var(--nx-emerald)' },
                    ].map((r, i) => (
                        <div key={i} className="nx-stat-row">
                            <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.value}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Data Flow Viz */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>DATA FLOW PIPELINE</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { step: 'Application', status: 'Complete', color: '#34d399' },
                            { step: 'Credit Check', status: 'Processing', color: '#22d3ee' },
                            { step: 'Risk Engine', status: 'AI Analysis', color: '#a78bfa' },
                            { step: 'Approval', status: 'Pending', color: '#fbbf24' },
                            { step: 'Disbursement', status: 'Queued', color: '#4a5578' },
                        ].map((node, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: `${node.color}08`, border: `1px solid ${node.color}20` }}>
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                                        style={{ width: 10, height: 10, borderRadius: '50%', background: node.color, boxShadow: `0 0 8px ${node.color}60`, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{node.step}</span>
                                    </div>
                                    <span style={{ fontSize: 10, color: node.color, fontWeight: 600 }}>{node.status}</span>
                                </div>
                                {i < 4 && (
                                    <div style={{ width: 2, height: 16, background: `linear-gradient(to bottom, ${node.color}40, transparent)`, marginLeft: 16 }} />
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
