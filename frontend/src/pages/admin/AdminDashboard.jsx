import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Users, UserCheck, Lock, AlertTriangle, Activity, Shield } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function AdminDashboard() {
    const [users, setUsers] = useState([])
    const [events, setEvents] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('overview')

    useEffect(() => {
        Promise.all([
            api.get('/admin/users').catch(() => ({ data: [] })),
            api.get('/admin/security-events').catch(() => ({ data: [] })),
            api.get('/admin/fraud-alerts').catch(() => ({ data: [] })),
        ]).then(([u, e, a]) => { setUsers(u.data); setEvents(e.data); setAlerts(a.data); setLoading(false) })
    }, [])

    const activeUsers = users.filter(u => u.is_active).length
    const lockedUsers = users.filter(u => u.is_locked).length
    const recentEvents = events.slice(0, 8)
    const highAlerts = alerts.filter(a => a.severity === 'high').length

    const weekData = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        const key = d.toISOString().split('T')[0]
        return {
            day: d.toLocaleDateString('en', { weekday: 'short' }),
            events: events.filter(e => e.created_at?.startsWith(key)).length,
            alerts: alerts.filter(a => a.created_at?.startsWith(key)).length,
            users: Math.floor(Math.random() * 10) + activeUsers,
        }
    })

    const tabs = ['overview', 'users', 'transactions', 'risk', 'compliance']

    if (loading) return (
        <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 80 }} />)}
            </div>
        </div>
    )

    return (
        <div className="animate-in">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                    ADMIN <span className="nx-violet nx-text-glow-violet">CONSOLE</span>
                </h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Platform overview & monitoring</p>
            </motion.div>

            {/* Analytics Tabs */}
            <div className="nx-tabs" style={{ marginBottom: 20, display: 'inline-flex' }}>
                {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`nx-tab ${tab === t ? 'active' : ''}`} style={{ textTransform: 'capitalize' }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total Users', value: users.length, icon: Users, accent: 'cyan' },
                    { label: 'Active', value: activeUsers, icon: UserCheck, accent: 'emerald' },
                    { label: 'Locked', value: lockedUsers, icon: Lock, accent: 'rose' },
                    { label: 'Risk Alerts', value: highAlerts, icon: AlertTriangle, accent: 'amber' },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.accent}`}
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={15} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 4 }}>{k.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <motion.div className="nx-chart" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            {tab === 'risk' ? 'THREAT DETECTION' : tab === 'users' ? 'USER ACTIVITY' : 'SECURITY EVENTS'} — 7 DAYS
                        </h3>
                        <span className="nx-badge nx-badge-violet">Live</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        {tab === 'risk' || tab === 'users' ? (
                            <AreaChart data={weekData}>
                                <defs>
                                    <linearGradient id="gAdmin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'rgba(15,23,62,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, fontSize: 12 }} />
                                <Area type="monotone" dataKey={tab === 'users' ? 'users' : 'alerts'} stroke="#a78bfa" fill="url(#gAdmin)" strokeWidth={2} />
                            </AreaChart>
                        ) : (
                            <BarChart data={weekData}>
                                <XAxis dataKey="day" tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#7c8db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'rgba(15,23,62,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, fontSize: 12 }} />
                                <Bar dataKey="events" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </motion.div>

                <motion.div className="nx-card-static" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>RECENT EVENTS</h3>
                        <Activity size={15} color="var(--nx-violet)" style={{ opacity: 0.6 }} />
                    </div>
                    {recentEvents.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--nx-text-dim)', textAlign: 'center', padding: '2rem' }}>No events</p>
                    ) : recentEvents.map((e, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < recentEvents.length - 1 ? '1px solid var(--nx-border)' : 'none' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)' }}>{e.type?.replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{e.username} · {e.ip}</div>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }} className="nx-mono">{new Date(e.created_at).toLocaleTimeString()}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
