import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, TrendingUp, CreditCard, Sparkles, AlertTriangle, CheckCircle, X, Check, Trash2, Settings, Filter, Eye } from 'lucide-react'

/* ═══════ Simulated Notifications ═══════ */
const NOTIFICATIONS = [
    { id: 1, type: 'transaction', title: 'Deposit received', desc: '+$3,200.00 — Freelance payment from Acme Corp', time: '2 min ago', date: 'Today', unread: true, icon: CreditCard, color: '#34d399' },
    { id: 2, type: 'security', title: 'Login from new device', desc: 'Windows 11 · Chrome 124 · New York, US', time: '15 min ago', date: 'Today', unread: true, icon: Shield, color: '#22d3ee' },
    { id: 3, type: 'ai', title: 'Portfolio rebalance recommended', desc: 'Tech sector allocation at 64% — exceeds target by 9%. Consider diversifying into bonds.', time: '32 min ago', date: 'Today', unread: true, icon: Sparkles, color: '#a78bfa' },
    { id: 4, type: 'alert', title: 'Unusual spending detected', desc: '$1,200 at Electronics Store — above your typical spending pattern in this category', time: '1h ago', date: 'Today', unread: true, icon: AlertTriangle, color: '#fbbf24' },
    { id: 5, type: 'transaction', title: 'Transfer completed', desc: '$500.00 to Savings Account (NB-002) — Auto-save rule triggered', time: '2h ago', date: 'Today', unread: false, icon: CheckCircle, color: '#34d399' },
    { id: 6, type: 'ai', title: 'Savings milestone reached!', desc: 'Your Emergency Fund is now 75% funded — $7,500 of $10,000 goal', time: '4h ago', date: 'Today', unread: false, icon: Sparkles, color: '#a78bfa' },
    { id: 7, type: 'security', title: 'Password changed successfully', desc: 'Your account password was updated. If this wasn\'t you, contact support immediately.', time: '6h ago', date: 'Yesterday', unread: false, icon: Shield, color: '#22d3ee' },
    { id: 8, type: 'transaction', title: 'Bill payment processed', desc: '$89.99 — Netflix, Spotify, iCloud subscriptions auto-renewed', time: '18h ago', date: 'Yesterday', unread: false, icon: CreditCard, color: '#34d399' },
    { id: 9, type: 'alert', title: 'Credit score updated', desc: 'Your credit score increased by 12 points to 754. Keep up the great work!', time: '1 day ago', date: 'Yesterday', unread: false, icon: TrendingUp, color: '#22d3ee' },
    { id: 10, type: 'ai', title: 'Weekly spending report', desc: 'You spent $1,842 this week — 8% less than last week. Food & Dining down 15%.', time: '2 days ago', date: 'This Week', unread: false, icon: Sparkles, color: '#a78bfa' },
    { id: 11, type: 'security', title: 'Session expired', desc: 'Your session on iPad Pro was automatically logged out after 24h of inactivity.', time: '3 days ago', date: 'This Week', unread: false, icon: Shield, color: '#22d3ee' },
    { id: 12, type: 'transaction', title: 'International transfer received', desc: '+€2,400.00 (≈$2,592) — Wire from Deutsche Bank, Frankfurt', time: '4 days ago', date: 'This Week', unread: false, icon: CreditCard, color: '#34d399' },
]

const TABS = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'transaction', label: 'Transactions', icon: CreditCard },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'ai', label: 'AI Insights', icon: Sparkles },
    { key: 'alert', label: 'Alerts', icon: AlertTriangle },
]

export default function Notifications() {
    const [items, setItems] = useState(NOTIFICATIONS)
    const [activeTab, setActiveTab] = useState('all')
    const [showSettings, setShowSettings] = useState(false)

    const filtered = activeTab === 'all' ? items : items.filter(n => n.type === activeTab)
    const unreadCount = items.filter(n => n.unread).length

    const markAllRead = () => setItems(items.map(n => ({ ...n, unread: false })))
    const markRead = (id) => setItems(items.map(n => n.id === id ? { ...n, unread: false } : n))
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
