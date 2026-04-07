import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Wallet, CreditCard, ScrollText, TrendingUp, User, Shield, LogOut, Bell, Sun, Moon, ShieldCheck, AlertTriangle, DollarSign, CheckCircle, X, Activity, Globe, Briefcase, Sparkles, Zap, Receipt, Coins, PieChart, Target } from 'lucide-react'
import NexusCopilot from '../components/NexusCopilot'

/* ─── Demo Notifications ─── */
const DEMO_NOTIFICATIONS = [
    { id: 1, type: 'ai', title: 'AI Insight: Portfolio rebalance', desc: 'Tech allocation exceeds target by 9%', time: '1m ago', unread: true, icon: Sparkles, color: '#a78bfa' },
    { id: 2, type: 'security', title: 'Login from new device', desc: 'Windows · Chrome · New York, US', time: '2m ago', unread: true, icon: ShieldCheck, color: '#22d3ee' },
    { id: 3, type: 'transaction', title: 'Deposit received', desc: '+$3,200.00 — Freelance payment', time: '15m ago', unread: true, icon: DollarSign, color: '#34d399' },
    { id: 4, type: 'market', title: 'Market Alert: NVDA +1.8%', desc: 'NVIDIA surged on AI demand forecast', time: '30m ago', unread: true, icon: TrendingUp, color: '#22d3ee' },
    { id: 5, type: 'alert', title: 'Unusual activity detected', desc: 'Transaction flagged for review', time: '1h ago', unread: false, icon: AlertTriangle, color: '#fbbf24' },
    { id: 6, type: 'transaction', title: 'Transfer completed', desc: '$500.00 to Savings account', time: '3h ago', unread: false, icon: CheckCircle, color: '#a78bfa' },
]

/* ─── Notification Center ─── */
function NotificationCenter() {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState(DEMO_NOTIFICATIONS)
    const ref = useRef(null)
    const unread = items.filter(n => n.unread).length

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const markAllRead = () => setItems(items.map(n => ({ ...n, unread: false })))

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <motion.div
                className="nx-notif-bell"
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Bell size={16} color="var(--nx-text-muted)" />
                {unread > 0 && <span className="nx-notif-badge">{unread}</span>}
            </motion.div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="nx-notif-dropdown"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="nx-notif-header">
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                                NOTIFICATIONS
                            </span>
                            {unread > 0 && (
                                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--nx-cyan)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="nx-notif-list">
                            {items.map(n => (
                                <div key={n.id} className={`nx-notif-item${n.unread ? ' unread' : ''}`}>
                                    <div className="nx-notif-icon" style={{ background: `${n.color}12`, border: `1px solid ${n.color}25` }}>
                                        <n.icon size={14} color={n.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{n.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>{n.desc}</div>
                                    </div>
                                    <span style={{ fontSize: 10, color: 'var(--nx-text-dim)', whiteSpace: 'nowrap' }}>{n.time}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── Theme Toggle ─── */
function ThemeToggle() {
    const [dark, setDark] = useState(true)

    return (
        <motion.div
            className="nx-theme-toggle"
            onClick={() => setDark(!dark)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {dark ? <Moon size={15} /> : <Sun size={15} color="#fbbf24" />}
        </motion.div>
    )
}

/* ─── Live Toast ─── */
function LiveToast({ notifications }) {
    return (
        <AnimatePresence>
            {notifications.length > 0 && (
                <motion.div className="nx-toast" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="nx-live-dot" />
                        <span style={{ fontSize: 13 }}>{notifications[notifications.length - 1]}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function DashboardLayout() {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const [wsNotifs, setWsNotifs] = useState([])
    const wsRef = useRef(null)

    useEffect(() => {
        try {
            const ws = new WebSocket(`ws://${window.location.host}/ws/dashboard`)
            wsRef.current = ws
            ws.onmessage = (e) => {
                setWsNotifs(prev => [...prev.slice(-4), e.data])
                setTimeout(() => setWsNotifs(prev => prev.slice(1)), 4000)
            }
            return () => ws.close()
        } catch { }
    }, [])

    const handleLogout = () => { logout(); navigate('/') }

    const bankingNav = [
        { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/transfer', icon: CreditCard, label: 'Payments' },
        { to: '/cards', icon: CreditCard, label: 'Cards' },
        { to: '/first-transaction', icon: Zap, label: 'Quick TX' },
        { to: '/transactions', icon: ScrollText, label: 'Transactions' },
        { to: '/loans', icon: TrendingUp, label: 'Credit' },
        { to: '/profile', icon: User, label: 'Profile' },
    ]

    const intelligenceNav = [
        { to: '/markets', icon: Activity, label: 'Markets' },
        { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
        { to: '/investments', icon: PieChart, label: 'Investments' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/globe', icon: Globe, label: 'Global Finance' },
        { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
    ]

    const servicesNav = [
        { to: '/bill-pay', icon: Receipt, label: 'Bill Pay' },
        { to: '/multi-currency', icon: Coins, label: 'Multi-Currency' },
        { to: '/goals', icon: Target, label: 'Savings Goals' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            <div className="nx-nebula-bg" />
            <LiveToast notifications={wsNotifs} />

            {/* Sidebar */}
            <aside className="nx-sidebar" style={{ position: 'relative', zIndex: 2 }}>
                {/* Logo */}
                <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--nx-border)' }}>
                    <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <motion.div
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34,211,238,0.4)' }}
                            style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'radial-gradient(circle, rgba(34,211,238,0.3), rgba(15,23,62,0.8))',
                                border: '1px solid rgba(34,211,238,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 12px rgba(34,211,238,0.2)',
                            }}
                        >
                            <span style={{ color: '#22d3ee', fontWeight: 800, fontSize: 11, fontFamily: 'var(--font-display)' }}>NX</span>
                        </motion.div>
                        <div>
                            <span style={{ color: 'var(--nx-text)', fontWeight: 700, fontSize: 15, letterSpacing: '0.12em', fontFamily: 'var(--font-display)' }}>NEXUS</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span className="nx-live-dot" />
                                <span style={{ fontSize: 10, color: 'var(--nx-cyan)' }}>Online</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Banking Nav */}
                <div className="nx-sidebar-section">Banking</div>
                <nav>
                    {bankingNav.map(item => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nx-sidebar-link ${isActive ? 'active' : ''}`}>
                            <item.icon size={16} /> {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Intelligence Nav — NEXUS Upgrade */}
                <div className="nx-sidebar-section" style={{ marginTop: 8 }}>Intelligence</div>
                <nav>
                    {intelligenceNav.map(item => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nx-sidebar-link ${isActive ? 'active' : ''}`}>
                            <item.icon size={16} /> {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Services Nav */}
                <div className="nx-sidebar-section" style={{ marginTop: 8 }}>Services</div>
                <nav>
                    {servicesNav.map(item => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nx-sidebar-link ${isActive ? 'active' : ''}`}>
                            <item.icon size={16} /> {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Admin Link */}
                {isAdmin && (
                    <div style={{ padding: '0.5rem 0' }}>
                        <div className="nx-sidebar-section">Administration</div>
                        <NavLink to="/admin" className="nx-sidebar-link" style={{ color: 'var(--nx-violet)' }}>
                            <Shield size={16} /> Admin Console
                        </NavLink>
                    </div>
                )}

                {/* User Info */}
                <div style={{ borderTop: '1px solid var(--nx-border)', padding: '1rem 1.5rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(34,211,238,0.2), rgba(15,23,62,0.8))',
                            border: '1px solid rgba(34,211,238,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'var(--nx-cyan)',
                            fontFamily: 'var(--font-display)',
                        }}>
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{user?.username}</div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>{user?.role}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="nx-btn nx-btn-outline" style={{ width: '100%', fontSize: 12 }}>
                        <LogOut size={13} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar with Notifications + Theme */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
                    padding: '0.75rem 2rem',
                    borderBottom: '1px solid var(--nx-border)',
                    background: 'rgba(10, 15, 46, 0.3)',
                    backdropFilter: 'blur(8px)',
                }}>
                    <div className="nx-live-indicator" style={{ marginRight: 'auto' }}>
                        <div className="dot" /> NEXUS Intelligence Active
                    </div>
                    <ThemeToggle />
                    <NotificationCenter />
                </div>
                <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
                    <Outlet />
                </div>
            </main>

            {/* NEXUS Copilot — Floating AI Assistant */}
            <NexusCopilot />
        </div>
    )
}
