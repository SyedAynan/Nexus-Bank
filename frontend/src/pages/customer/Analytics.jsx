import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PieChart as PieIcon, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Sparkles, ArrowRight, Coffee, Home, Car, Gamepad2, Heart, Utensils, Zap, Wifi } from 'lucide-react'

/* ═══════ Simulated Spending Data ═══════ */
const CATEGORIES = [
    { name: 'Housing', amount: 2800, budget: 3000, color: '#22d3ee', icon: Home },
    { name: 'Food & Dining', amount: 1240, budget: 1000, color: '#a78bfa', icon: Utensils },
    { name: 'Transport', amount: 680, budget: 800, color: '#34d399', icon: Car },
    { name: 'Entertainment', amount: 420, budget: 500, color: '#fbbf24', icon: Gamepad2 },
    { name: 'Health', amount: 350, budget: 400, color: '#fb7185', icon: Heart },
    { name: 'Subscriptions', amount: 180, budget: 200, color: '#3b82f6', icon: Wifi },
    { name: 'Coffee & Drinks', amount: 145, budget: 100, color: '#f59e0b', icon: Coffee },
    { name: 'Shopping', amount: 890, budget: 600, color: '#ec4899', icon: ShoppingBag },
]

const MONTHLY_DATA = [
    { month: 'Sep', spending: 6200, income: 12500 },
    { month: 'Oct', spending: 7100, income: 12500 },
    { month: 'Nov', spending: 6800, income: 13200 },
    { month: 'Dec', spending: 8900, income: 13200 },
    { month: 'Jan', spending: 7400, income: 12500 },
    { month: 'Feb', spending: 6705, income: 12500 },
]

const MERCHANTS = [
    { name: 'Whole Foods Market', category: 'Food', amount: 482, txCount: 12, trend: 8.2 },
    { name: 'Amazon Prime', category: 'Shopping', amount: 367, txCount: 8, trend: -12.5 },
    { name: 'Uber', category: 'Transport', amount: 284, txCount: 18, trend: 5.1 },
    { name: 'Netflix', category: 'Subscriptions', amount: 22.99, txCount: 1, trend: 0 },
    { name: 'Starbucks', category: 'Coffee', amount: 145, txCount: 22, trend: 15.3 },
    { name: 'Shell Gas', category: 'Transport', amount: 196, txCount: 6, trend: -3.8 },
]

const AI_INSIGHTS = [
    { type: 'warning', text: 'Food & Dining is **24% over budget** this month. Consider meal prepping to save ~$200/month.', color: '#fbbf24' },
    { type: 'success', text: 'Transport spending is **down 15%** from last month. Great job using public transit!', color: '#34d399' },
    { type: 'info', text: 'Your Starbucks visits increased by **38%**. That\'s $145/month — $1,740/year.', color: '#22d3ee' },
]

/* ═══════ Circular Progress Ring ═══════ */
function BudgetRing({ spent, budget, color, size = 48 }) {
    const pct = Math.min((spent / budget) * 100, 100)
    const overBudget = spent > budget
    const r = (size - 6) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={overBudget ? '#fb7185' : color} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 4px ${overBudget ? '#fb7185' : color}60)` }}
            />
        </svg>
    )
}

/* ═══════ Main Analytics Page ═══════ */
export default function Analytics() {
    const totalSpent = CATEGORIES.reduce((s, c) => s + c.amount, 0)
    const totalBudget = CATEGORIES.reduce((s, c) => s + c.budget, 0)
    const income = 12500
    const savingsRate = (((income - totalSpent) / income) * 100).toFixed(1)
    const [hoveredCat, setHoveredCat] = useState(null)

    const pieData = CATEGORIES.map(c => ({ name: c.name, value: c.amount }))

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <PieIcon size={26} color="#a78bfa" /> SPENDING ANALYTICS
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        AI-powered spending intelligence — {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="nx-badge nx-badge-violet"><Sparkles size={10} style={{ marginRight: 4 }} /> AI Enhanced</span>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, sub: `of $${totalBudget.toLocaleString()} budget`, accent: 'cyan', icon: DollarSign },
                    { label: 'Income', value: `$${income.toLocaleString()}`, sub: 'This month', accent: 'emerald', icon: TrendingUp },
                    { label: 'Savings Rate', value: `${savingsRate}%`, sub: savingsRate > 20 ? 'Above target ✓' : 'Below 20% target', accent: savingsRate > 20 ? 'emerald' : 'amber', icon: TrendingUp },
                    { label: 'Categories Over', value: CATEGORIES.filter(c => c.amount > c.budget).length.toString(), sub: `of ${CATEGORIES.length} categories`, accent: 'rose', icon: TrendingDown },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={16} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 8 }} className="nx-mono">{k.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4 }}>{k.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Chart Row: Donut + Monthly Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, marginBottom: 20 }}>
                {/* Donut Chart */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>
                        SPENDING BREAKDOWN
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2} stroke="transparent"
                                onMouseEnter={(_, i) => setHoveredCat(i)} onMouseLeave={() => setHoveredCat(null)}>
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={CATEGORIES[i].color} opacity={hoveredCat === null || hoveredCat === i ? 1 : 0.3}
                                        style={{ filter: hoveredCat === i ? `drop-shadow(0 0 8px ${CATEGORIES[i].color})` : 'none', transition: 'all 0.3s' }} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'rgba(15,23,62,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12 }}
                                formatter={(v) => [`$${v.toLocaleString()}`, 'Amount']} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -20%)', textAlign: 'center', pointerEvents: 'none' }}>
                        <div className="nx-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--nx-text)' }}>${totalSpent.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', letterSpacing: '0.06em' }}>TOTAL</div>
                    </div>
                </motion.div>

                {/* Monthly Trend */}
                <motion.div className="nx-chart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            INCOME VS SPENDING — 6 MONTHS
                        </h3>
                        <span className="nx-badge nx-badge-cyan">Trend</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={MONTHLY_DATA}>
                            <XAxis dataKey="month" tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#7c8db5', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ background: 'rgba(15,23,62,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12 }}
                                formatter={(v) => [`$${v.toLocaleString()}`, '']} />
                            <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} opacity={0.3} />
                            <Bar dataKey="spending" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Category Budgets + Merchants + AI */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 16 }}>
                {/* Budget Breakdown */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16 }}>
                        BUDGET TRACKER
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {CATEGORIES.map((c, i) => {
                            const pct = Math.round((c.amount / c.budget) * 100)
                            const over = c.amount > c.budget
                            const Icon = c.icon
                            return (
                                <motion.div key={c.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.05 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BudgetRing spent={c.amount} budget={c.budget} color={c.color} size={36} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Icon size={12} color={c.color} />
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{c.name}</span>
                                            </div>
                                            <span className="nx-mono" style={{ fontSize: 11, color: over ? 'var(--nx-rose)' : 'var(--nx-text-muted)' }}>
                                                ${c.amount.toLocaleString()} / ${c.budget.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="nx-progress" style={{ height: 4 }}>
                                            <motion.div className="nx-progress-bar"
                                                style={{ background: over ? '#fb7185' : c.color, boxShadow: `0 0 6px ${over ? '#fb718560' : c.color + '60'}` }}
                                                initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                                                transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }} />
                                        </div>
                                        {over && <div style={{ fontSize: 9, color: 'var(--nx-rose)', marginTop: 2 }}>Over by ${(c.amount - c.budget).toLocaleString()}</div>}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Top Merchants */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingBag size={14} color="#22d3ee" /> TOP MERCHANTS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {MERCHANTS.map((m, i) => (
                            <motion.div key={m.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.06 }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(10,15,46,0.4)', border: '1px solid var(--nx-border)' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{m.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{m.category} · {m.txCount} transactions</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="nx-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>${m.amount.toLocaleString()}</div>
                                    <div className="nx-mono" style={{ fontSize: 10, color: m.trend > 0 ? 'var(--nx-rose)' : m.trend < 0 ? 'var(--nx-emerald)' : 'var(--nx-text-dim)' }}>
                                        {m.trend > 0 ? '↑' : m.trend < 0 ? '↓' : '—'}{Math.abs(m.trend)}%
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Insights */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <div className="nx-ai-summary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Sparkles size={14} color="#a78bfa" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI INSIGHTS</span>
                        </div>
                        {AI_INSIGHTS.map((insight, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '8px 10px', borderRadius: 8, background: `${insight.color}08`, border: `1px solid ${insight.color}15` }}>
                                <Zap size={12} color={insight.color} style={{ flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}
                                    dangerouslySetInnerHTML={{ __html: insight.text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:' + insight.color + '">$1</strong>') }} />
                            </div>
                        ))}
                    </div>

                    <div className="nx-card-static" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-emerald)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>
                            SAVINGS POTENTIAL
                        </div>
                        <div className="nx-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-emerald)' }}>$340</div>
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginTop: 4 }}>Estimated monthly savings if you follow AI recommendations</div>
                        <div className="nx-progress" style={{ height: 4, marginTop: 10 }}>
                            <motion.div className="nx-progress-bar" style={{ background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.4)' }}
                                initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1, delay: 1.2 }} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
