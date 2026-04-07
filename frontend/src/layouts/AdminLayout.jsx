import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Users, ArrowLeftRight, Shield, FileCheck, ScrollText, Settings, ArrowLeft, Bell, Sun, Moon, ShieldCheck, AlertTriangle, Activity, CheckCircle, Database, Gauge, BarChart3, Flag, Globe, HardDrive, Map, Code2 } from 'lucide-react'

/* ─── Demo Notifications ─── */
const ADMIN_NOTIFICATIONS = [
    { id: 1, type: 'alert', title: 'High-risk transaction flagged', desc: 'TX-4821 — $12,400 flagged for review', time: '5m ago', unread: true, icon: AlertTriangle, color: '#fb7185' },
    { id: 2, type: 'security', title: 'Brute force attempt blocked', desc: 'IP 192.168.42.15 — 5 failed logins', time: '22m ago', unread: true, icon: Shield, color: '#fbbf24' },
    { id: 3, type: 'system', title: 'New user registered', desc: 'marcus_williams joined NEXUS', time: '1h ago', unread: true, icon: Users, color: '#22d3ee' },
    { id: 4, type: 'compliance', title: 'KYC verification complete', desc: 'emily_chen passed identity check', time: '2h ago', unread: false, icon: CheckCircle, color: '#34d399' },
    { id: 5, type: 'system', title: 'System health: Optimal', desc: 'All services running normally', time: '4h ago', unread: false, icon: Activity, color: '#a78bfa' },
]

function NotificationCenter() {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState(ADMIN_NOTIFICATIONS)
    const ref = useRef(null)
    const unread = items.filter(n => n.unread).length

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <motion.div className="nx-notif-bell" onClick={() => setOpen(!open)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Bell size={16} color="var(--nx-text-muted)" />
                {unread > 0 && <span className="nx-notif-badge">{unread}</span>}
            </motion.div>
            <AnimatePresence>
                {open && (
                    <motion.div className="nx-notif-dropdown" initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.2 }}>
                        <div className="nx-notif-header">
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>ADMIN ALERTS</span>
                            {unread > 0 && <button onClick={() => setItems(items.map(n => ({ ...n, unread: false })))} style={{ background: 'none', border: 'none', color: 'var(--nx-violet)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>Mark all read</button>}
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

function ThemeToggle() {
    const [dark, setDark] = useState(true)
    return (
        <motion.div className="nx-theme-toggle" onClick={() => setDark(!dark)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Moon size={15} /> : <Sun size={15} color="#fbbf24" />}
        </motion.div>
    )
}

export default function AdminLayout() {
    const { user } = useAuth()

    const sections = [
        { label: 'Overview', to: '/admin', icon: LayoutDashboard },
        { label: 'Users', to: '/admin/users', icon: Users },
        { label: 'Transactions', to: '/admin/transactions', icon: ArrowLeftRight },
        { label: 'Risk & Security', to: '/admin/security', icon: Shield },
        { label: 'Compliance', to: '/admin/compliance', icon: FileCheck },
        { label: 'Audit Logs', to: '/admin/logs', icon: ScrollText },
        { label: 'Settings', to: '/admin/settings', icon: Settings },
    ]

    const engineeringNav = [
        { label: 'DSA Showcase', to: '/admin/dsa', icon: Database },
        { label: 'Rate Limiting', to: '/admin/rate-limiting', icon: Gauge },
        { label: 'Monitoring', to: '/admin/monitoring', icon: BarChart3 },
        { label: 'Feature Flags', to: '/admin/features', icon: Flag },
    ]

    const infraNav = [
        { label: 'Backups', to: '/admin/backups', icon: HardDrive },
        { label: 'Open Banking', to: '/admin/open-banking', icon: Globe },
        { label: 'Roadmap', to: '/admin/roadmap', icon: Map },
        { label: 'Project', to: '/admin/project', icon: Code2 },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            <div className="nx-nebula-bg" />

            {/* Sidebar */}
            <aside className="nx-sidebar" style={{ borderRightColor: 'rgba(167,139,250,0.1)', position: 'relative', zIndex: 2 }}>
                <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--nx-border)' }}>
                    <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <motion.div
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(167,139,250,0.4)' }}
                            style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'radial-gradient(circle, rgba(167,139,250,0.25), rgba(15,23,62,0.8))',
                                border: '1px solid rgba(167,139,250,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 12px rgba(167,139,250,0.15)',
                            }}
                        >
                            <span style={{ color: 'var(--nx-violet)', fontWeight: 800, fontSize: 12, fontFamily: 'var(--font-display)' }}>NX</span>
                        </motion.div>
                        <div>
                            <span style={{ color: 'var(--nx-text)', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>NEXUS</span>
                            <span className="nx-badge nx-badge-violet" style={{ marginLeft: 8, fontSize: 9 }}>ADMIN</span>
                        </div>
                    </Link>
                </div>

                <div className="nx-sidebar-section">Console</div>
                <nav>
                    {sections.map(s => (
                        <NavLink key={s.to} to={s.to} end={s.to === '/admin'} className={({ isActive }) => `nx-sidebar-link ${isActive ? 'active' : ''}`}>
                            <s.icon size={16} /> {s.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="nx-sidebar-section" style={{ marginTop: 8 }}>Engineering</div>
                <nav>
                    {engineeringNav.map(s => (
                        <NavLink key={s.to} to={s.to} className={({ isActive }) => `nx-sidebar-link ${isActive ? 'active' : ''}`}>
                            <s.icon size={16} /> {s.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="nx-sidebar-section" style={{ marginTop: 8 }}>Infrastructure</div>
                <nav style={{ flex: 1 }}>
                    {infraNav.map(s => (
                        <NavLink key={s.to} to={s.to} className={({ isActive }) => `nx-sidebar-link ${isActive ? 'active' : ''}`}>
                            <s.icon size={16} /> {s.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid var(--nx-border)', padding: '1rem 1.5rem' }}>
                    <Link to="/dashboard" className="nx-btn nx-btn-outline" style={{ width: '100%', fontSize: 12, textDecoration: 'none' }}>
                        <ArrowLeft size={14} /> Back to Banking
                    </Link>
                </div>
            </aside>

            <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
                    padding: '0.75rem 2rem',
                    borderBottom: '1px solid var(--nx-border)',
                    background: 'rgba(10, 15, 46, 0.3)',
                    backdropFilter: 'blur(8px)',
                }}>
                    <ThemeToggle />
                    <NotificationCenter />
                </div>
                <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
