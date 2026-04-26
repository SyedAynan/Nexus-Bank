import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function PublicLayout() {
    const { isAuthenticated } = useAuth()
    const { pathname } = useLocation()

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Nebula Background */}
            <div className="nx-nebula-bg" />

            {/* Navbar */}
            <nav style={{
                background: 'rgba(10, 15, 46, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(34, 211, 238, 0.08)',
                position: 'relative', zIndex: 10,
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'radial-gradient(circle, rgba(34,211,238,0.3), rgba(15,23,62,0.8))',
                                border: '1px solid rgba(34,211,238,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 15px rgba(34,211,238,0.2)',
                            }}
                        >
                            <span style={{ color: '#22d3ee', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-display)' }}>NX</span>
                        </motion.div>
                        <span style={{ color: 'var(--nx-text)', fontWeight: 700, fontSize: 16, letterSpacing: '0.14em', fontFamily: 'var(--font-display)' }}>NEXUS</span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        {[{ to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' }].map(link => (
                            <Link key={link.to} to={link.to} style={{
                                color: pathname === link.to ? 'var(--nx-cyan)' : 'var(--nx-text-muted)',
                                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                                transition: 'color 0.2s',
                                textShadow: pathname === link.to ? '0 0 10px rgba(34,211,238,0.4)' : 'none',
                            }}>{link.label}</Link>
                        ))}
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="nx-btn nx-btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                <Zap size={14} /> Dashboard
                            </Link>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Link to="/login" className="nx-btn nx-btn-outline">Sign In</Link>
                                <Link to="/register" className="nx-btn nx-btn-primary">Get Started</Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main style={{ flex: 1, position: 'relative', zIndex: 1 }}><Outlet /></main>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(34,211,238,0.06)',
                padding: '1.5rem',
                textAlign: 'center',
                position: 'relative', zIndex: 1,
                background: 'rgba(5, 8, 22, 0.5)',
            }}>
                <p style={{ fontSize: 12, color: 'var(--nx-text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                    © 2026 NEXUS — The Future of Intelligent Finance. All rights reserved.
                </p>
            </footer>
        </div>
    )
}
