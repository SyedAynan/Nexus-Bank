import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, TrendingUp, CreditCard, Sparkles, AlertTriangle, CheckCircle, X, Check, Trash2, Settings, Filter, Eye } from 'lucide-react'
import api from '../../api'

/* Type → icon/color mapping shared with the backend NotificationType values */
const TYPE_META = {
    transaction: { icon: CreditCard, color: '#34d399' },
    security: { icon: Shield, color: '#22d3ee' },
    ai: { icon: Sparkles, color: '#a78bfa' },
    alert: { icon: AlertTriangle, color: '#fbbf24' },
    info: { icon: Bell, color: '#22d3ee' },
}

function toUi(n) {
    const meta = TYPE_META[n.type] || TYPE_META.info
    const created = n.created_at ? new Date(n.created_at) : null
    const sameDay = created && new Date().toDateString() === created.toDateString()
    const yesterday = created && new Date(Date.now() - 86400000).toDateString() === created.toDateString()
    return {
        id: n.id,
        type: n.type in TYPE_META ? n.type : 'info',
        title: n.title,
        desc: n.message,
        time: created ? created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        date: sameDay ? 'Today' : yesterday ? 'Yesterday' : 'This Week',
        unread: !n.is_read,
        icon: meta.icon,
        color: meta.color,
    }
}

const TABS = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'transaction', label: 'Transactions', icon: CreditCard },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'ai', label: 'AI Insights', icon: Sparkles },
    { key: 'alert', label: 'Alerts', icon: AlertTriangle },
]

export default function Notifications() {
    const [items, setItems] = useState([])
    const [activeTab, setActiveTab] = useState('all')
    const [showSettings, setShowSettings] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/notifications/')
            .then(r => setItems((r.data || []).map(toUi)))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const filtered = activeTab === 'all' ? items : items.filter(n => n.type === activeTab)
    const unreadCount = items.filter(n => n.unread).length

    const markAllRead = () => {
        api.patch('/notifications/read-all').catch(() => { })
        setItems(items.map(n => ({ ...n, unread: false })))
    }
    const markRead = (id) => {
        api.patch(`/notifications/${id}/read`).catch(() => { })
        setItems(items.map(n => n.id === id ? { ...n, unread: false } : n))
    }
    // Dismiss only hides locally — deletion is an admin operation on the backend
    const deleteNotif = (id) => setItems(items.filter(n => n.id !== id))
    const clearAll = () => setItems([])

    // Group by date
    const grouped = filtered.reduce((acc, n) => {
        if (!acc[n.date]) acc[n.date] = []
        acc[n.date].push(n)
        return acc
    }, {})

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bell size={26} color="#22d3ee" /> NOTIFICATIONS
                        {unreadCount > 0 && <span className="nx-badge nx-badge-cyan" style={{ fontSize: 11 }}>{unreadCount} new</span>}
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        Transaction alerts, security updates & AI insights
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {unreadCount > 0 && (
                        <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 12 }} onClick={markAllRead} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Check size={14} /> Mark All Read
                        </motion.button>
                    )}
                    <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 12, borderColor: 'rgba(251,113,133,0.3)', color: 'var(--nx-rose)' }}
                        onClick={clearAll} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Trash2 size={14} /> Clear All
                    </motion.button>
                </div>
            </motion.div>

            {/* AI Digest Card */}
            <motion.div className="nx-ai-summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={16} color="#a78bfa" />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>DAILY DIGEST</div>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>AI-summarized activity for today</div>
                    </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', lineHeight: 1.7, marginTop: 12 }}>
                    📊 <strong style={{ color: '#22d3ee' }}>3 transactions</strong> totaling <strong style={{ color: '#34d399' }}>+$5,292.00</strong> received today.
                    🛡️ One new device login detected and verified.
                    💡 Portfolio rebalance alert — action recommended.
                    Your account security score is <strong style={{ color: '#34d399' }}>98/100</strong>.
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                {/* Main List */}
                <div>
                    {/* Filter Tabs */}
                    <div className="nx-tabs" style={{ marginBottom: 16, display: 'inline-flex' }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                className={`nx-tab ${activeTab === t.key ? 'active' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, textTransform: 'capitalize' }}>
                                <t.icon size={12} /> {t.label}
                                {t.key !== 'all' && <span style={{ fontSize: 9, opacity: 0.6 }}>({items.filter(n => n.type === t.key).length})</span>}
                            </button>
                        ))}
                    </div>

                    {/* Notification Groups */}
                    {Object.keys(grouped).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <Bell size={40} color="var(--nx-text-dim)" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <p style={{ fontSize: 14, color: 'var(--nx-text-dim)' }}>No notifications</p>
                        </div>
                    ) : Object.entries(grouped).map(([date, notifs]) => (
                        <div key={date} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 8, paddingLeft: 4 }}>
                                {date}
                            </div>
                            <AnimatePresence mode="popLayout">
                                {notifs.map(n => {
                                    const Icon = n.icon
                                    return (
                                        <motion.div key={n.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50, height: 0 }}
                                            style={{
                                                display: 'flex', alignItems: 'start', gap: 12, padding: '14px 16px', marginBottom: 6,
                                                borderRadius: 10, background: n.unread ? 'rgba(34,211,238,0.04)' : 'var(--glass-bg)',
                                                border: `1px solid ${n.unread ? 'rgba(34,211,238,0.15)' : 'var(--nx-border)'}`,
                                                transition: 'all 0.2s',
                                            }}
                                            whileHover={{ borderColor: `${n.color}30` }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                background: `${n.color}12`, border: `1px solid ${n.color}25`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={16} color={n.color} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ fontSize: 13, fontWeight: n.unread ? 700 : 500, color: 'var(--nx-text)' }}>{n.title}</div>
                                                    <span style={{ fontSize: 10, color: 'var(--nx-text-dim)', whiteSpace: 'nowrap', marginLeft: 12 }}>{n.time}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 4, lineHeight: 1.5 }}>{n.desc}</p>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                    {n.unread && (
                                                        <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', color: 'var(--nx-cyan)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <Eye size={10} /> Mark read
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteNotif(n.id)} style={{ background: 'none', border: 'none', color: 'var(--nx-text-dim)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <X size={10} /> Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                            {n.unread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', flexShrink: 0, marginTop: 6, boxShadow: '0 0 6px rgba(34,211,238,0.5)' }} />}
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Summary Stats */}
                    <div className="nx-card-static" style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 12 }}>
                            SUMMARY
                        </h3>
                        {[
                            { label: 'Transactions', count: items.filter(n => n.type === 'transaction').length, color: '#34d399' },
                            { label: 'Security', count: items.filter(n => n.type === 'security').length, color: '#22d3ee' },
                            { label: 'AI Insights', count: items.filter(n => n.type === 'ai').length, color: '#a78bfa' },
                            { label: 'Alerts', count: items.filter(n => n.type === 'alert').length, color: '#fbbf24' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--nx-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                                    <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{s.label}</span>
                                </div>
                                <span className="nx-mono" style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Notification Preferences */}
                    <div className="nx-card-static" style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 12 }}>
                            <Settings size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> PREFERENCES
                        </h3>
                        {[
                            { label: 'Push Notifications', on: true },
                            { label: 'Email Digests', on: true },
                            { label: 'SMS Alerts', on: false },
                            { label: 'AI Recommendations', on: true },
                        ].map(p => (
                            <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{p.label}</span>
                                <div style={{
                                    width: 32, height: 18, borderRadius: 9, cursor: 'pointer',
                                    background: p.on ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)',
                                    border: `1px solid ${p.on ? 'rgba(34,211,238,0.4)' : 'var(--nx-border)'}`,
                                    position: 'relative', transition: 'all 0.2s',
                                }}>
                                    <div style={{
                                        width: 12, height: 12, borderRadius: '50%', position: 'absolute', top: 2,
                                        left: p.on ? 16 : 2, background: p.on ? '#22d3ee' : 'var(--nx-text-dim)',
                                        transition: 'all 0.2s', boxShadow: p.on ? '0 0 6px rgba(34,211,238,0.5)' : 'none',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
