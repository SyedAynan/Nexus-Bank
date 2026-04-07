import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, TrendingUp, Sparkles, Calendar, DollarSign, Zap, X, Plane, Home, GraduationCap, Shield, Palmtree, PiggyBank, Star } from 'lucide-react'

/* ═══════ Goal Data ═══════ */
const INITIAL_GOALS = [
    { id: 1, name: 'Emergency Fund', icon: Shield, target: 10000, current: 7500, deadline: '2026-08-01', color: '#22d3ee', type: 'emergency', contributions: [500, 500, 500, 600, 700, 500, 500, 800, 400, 500, 600, 900] },
    { id: 2, name: 'Japan Vacation', icon: Plane, target: 5000, current: 2800, deadline: '2026-12-15', color: '#a78bfa', type: 'vacation', contributions: [200, 200, 300, 250, 200, 350, 300, 200, 300, 200, 300, 0] },
    { id: 3, name: 'Down Payment', icon: Home, target: 50000, current: 18500, deadline: '2028-06-01', color: '#34d399', type: 'home', contributions: [1000, 1200, 1000, 1500, 1000, 1200, 1400, 1000, 1200, 1100, 1400, 1500] },
    { id: 4, name: 'Education Fund', icon: GraduationCap, target: 25000, current: 12000, deadline: '2027-09-01', color: '#fbbf24', type: 'education', contributions: [800, 1000, 800, 900, 1000, 800, 1000, 900, 800, 1000, 1000, 900] },
]

const GOAL_TYPES = [
    { value: 'emergency', label: 'Emergency Fund', icon: Shield, color: '#22d3ee' },
    { value: 'vacation', label: 'Vacation', icon: Palmtree, color: '#a78bfa' },
    { value: 'home', label: 'Home', icon: Home, color: '#34d399' },
    { value: 'education', label: 'Education', icon: GraduationCap, color: '#fbbf24' },
    { value: 'custom', label: 'Custom', icon: Target, color: '#fb7185' },
]

/* ═══════ Animated Progress Ring ═══════ */
function GoalRing({ pct, color, size = 120 }) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (Math.min(pct, 100) / 100) * circ
    const milestones = [25, 50, 75, 100].filter(m => m <= pct)

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
                {/* Milestone dots */}
                {[25, 50, 75, 100].map(m => {
                    const angle = (m / 100) * 360 - 90
                    const rad = (angle * Math.PI) / 180
                    const cx = size / 2 + r * Math.cos(rad)
                    const cy = size / 2 + r * Math.sin(rad)
                    const hit = pct >= m
                    return (
                        <circle key={m} cx={cx} cy={cy} r={hit ? 4 : 2.5}
                            fill={hit ? color : 'rgba(255,255,255,0.15)'}
                            stroke={hit ? 'none' : 'rgba(255,255,255,0.1)'} strokeWidth="1"
                            style={{ filter: hit ? `drop-shadow(0 0 4px ${color})` : 'none' }} />
                    )
                })}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)' }}>{Math.round(pct)}%</span>
                <span style={{ fontSize: 9, color: 'var(--nx-text-dim)', letterSpacing: '0.08em' }}>FUNDED</span>
            </div>
        </div>
    )
}

/* ═══════ Mini Sparkline ═══════ */
function ContributionSparkline({ data, color, height = 40 }) {
    if (!data || data.length === 0) return null
    const max = Math.max(...data)
    const w = 180
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = height - (v / (max || 1)) * (height - 8) - 4
        return `${x},${y}`
    }).join(' ')
    const area = `0,${height} ${points} ${w},${height}`

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#spark-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
        </svg>
    )
}

/* ═══════ Main Goals Page ═══════ */
export default function Goals() {
    const [goals, setGoals] = useState(INITIAL_GOALS)
    const [showForm, setShowForm] = useState(false)
    const [selectedGoal, setSelectedGoal] = useState(null)
    const [form, setForm] = useState({ name: '', target: '', deadline: '', type: 'emergency' })

    const totalSaved = goals.reduce((s, g) => s + g.current, 0)
    const totalTarget = goals.reduce((s, g) => s + g.target, 0)
    const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

    const handleCreate = (e) => {
        e.preventDefault()
        const goalType = GOAL_TYPES.find(t => t.value === form.type) || GOAL_TYPES[4]
        const newGoal = {
            id: Date.now(), name: form.name || 'New Goal', icon: goalType.icon,
            target: parseFloat(form.target) || 1000, current: 0, deadline: form.deadline || '2027-01-01',
            color: goalType.color, type: form.type, contributions: Array(12).fill(0),
        }
        setGoals([...goals, newGoal])
        setShowForm(false)
        setForm({ name: '', target: '', deadline: '', type: 'emergency' })
    }

    const daysUntil = (deadline) => {
        const diff = new Date(deadline) - new Date()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    const dailyNeeded = (goal) => {
        const days = daysUntil(goal.deadline)
        return days > 0 ? ((goal.target - goal.current) / days).toFixed(2) : '0.00'
    }

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Target size={26} color="#34d399" /> SAVINGS GOALS
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        Track, manage & hit your financial milestones
                    </p>
                </div>
                <motion.button className="nx-btn nx-btn-primary" onClick={() => setShowForm(!showForm)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Plus size={15} /> New Goal
                </motion.button>
            </motion.div>

            {/* Overall Progress */}
            <motion.div className="nx-card-glow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 28 }}>
                <GoalRing pct={overallPct} color="#22d3ee" size={100} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 6 }}>
                        OVERALL PROGRESS
                    </div>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved</div>
                            <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-cyan)' }}>${totalSaved.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</div>
                            <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text-muted)' }}>${totalTarget.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remaining</div>
                            <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-violet)' }}>${(totalTarget - totalSaved).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="nx-progress" style={{ height: 6 }}>
                        <motion.div className="nx-progress-bar" style={{ background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', boxShadow: '0 0 8px rgba(34,211,238,0.4)' }}
                            initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                    </div>
                </div>
                {/* AI Tip */}
                <div style={{ maxWidth: 220, padding: '0.75rem', borderRadius: 10, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <Sparkles size={12} color="#a78bfa" />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa' }}>AI TIP</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.5 }}>
                        Increase monthly contributions by <strong style={{ color: '#22d3ee' }}>$150</strong> to reach all goals <strong style={{ color: '#34d399' }}>3 months earlier</strong>.
                    </p>
                </div>
            </motion.div>

            {/* Create Goal Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div className="nx-card-static" style={{ marginBottom: 20, padding: '1.5rem' }}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>CREATE NEW GOAL</h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-text-dim)' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label className="nx-label">Goal Type</label>
                                <select className="nx-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1.5, minWidth: 160 }}>
                                <label className="nx-label">Goal Name</label>
                                <input className="nx-input" placeholder="e.g. New Car" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label className="nx-label">Target Amount</label>
                                <input className="nx-input" type="number" placeholder="10000" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label className="nx-label">Deadline</label>
                                <input className="nx-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                            </div>
                            <motion.button type="submit" className="nx-btn nx-btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Plus size={14} /> Create
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {goals.map((goal, i) => {
                    const pct = (goal.current / goal.target) * 100
                    const days = daysUntil(goal.deadline)
                    const Icon = goal.icon
                    const milestoneHit = pct >= 75

                    return (
                        <motion.div key={goal.id} className="nx-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }} whileHover={{ borderColor: `${goal.color}40`, scale: 1.01 }}
                            style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <GoalRing pct={pct} color={goal.color} size={80} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${goal.color}12`, border: `1px solid ${goal.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={14} color={goal.color} />
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{goal.name}</span>
                                        {milestoneHit && <Star size={14} color="#fbbf24" fill="#fbbf24" />}
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 9, color: 'var(--nx-text-dim)', textTransform: 'uppercase' }}>Saved</div>
                                            <div className="nx-mono" style={{ fontSize: 16, fontWeight: 700, color: goal.color }}>${goal.current.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 9, color: 'var(--nx-text-dim)', textTransform: 'uppercase' }}>Target</div>
                                            <div className="nx-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--nx-text-muted)' }}>${goal.target.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="nx-progress" style={{ height: 4, marginBottom: 12 }}>
                                <motion.div className="nx-progress-bar"
                                    style={{ background: goal.color, boxShadow: `0 0 6px ${goal.color}60` }}
                                    initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }} />
                            </div>

                            {/* Stats Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--nx-text-dim)' }}>
                                    <Calendar size={11} /> {days} days left
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: goal.color }}>
                                    <DollarSign size={11} /> ${dailyNeeded(goal)}/day needed
                                </div>
                            </div>

                            {/* Contribution Sparkline */}
                            <div style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginBottom: 4, letterSpacing: '0.04em' }}>CONTRIBUTION HISTORY</div>
                                <ContributionSparkline data={goal.contributions} color={goal.color} />
                            </div>

                            {/* Milestones */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                {[25, 50, 75, 100].map(m => (
                                    <div key={m} style={{
                                        flex: 1, padding: '4px 0', textAlign: 'center', borderRadius: 4,
                                        background: pct >= m ? `${goal.color}12` : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${pct >= m ? goal.color + '30' : 'var(--nx-border)'}`,
                                        fontSize: 9, fontWeight: 600,
                                        color: pct >= m ? goal.color : 'var(--nx-text-dim)',
                                    }}>
                                        {m}%
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
