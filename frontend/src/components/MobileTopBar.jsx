/**
 * MobileTopBar — Compact top bar for mobile viewport.
 * Shows: user avatar | NEXUS brand | notification bell
 * Matches the fintech reference design.
 */
import { useState, useRef, useEffect } from 'react'
import { Bell, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileTopBar({ notifications = [], onNotifClick }) {
    const { user } = useAuth()
    const unread = notifications.filter(n => n.unread).length

    return (
        <div className="nx-mobile-topbar">
            {/* Avatar */}
            <div className="nx-mobile-topbar-avatar">
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(34,211,238,0.3), rgba(15,23,62,0.9))',
                    border: '2px solid rgba(34,211,238,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#22d3ee',
                    fontFamily: 'var(--font-display)',
                    boxShadow: '0 0 12px rgba(34,211,238,0.25)',
                }}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
            </div>

            {/* Brand */}
            <div className="nx-mobile-topbar-brand">
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 16,
                    letterSpacing: '0.18em',
                    color: 'var(--nx-cyan)',
                    textShadow: '0 0 20px rgba(34,211,238,0.3)',
                }}>
                    NEXUS
                </span>
            </div>

            {/* Right — Admin badge + Bell */}
            <div className="nx-mobile-topbar-actions">
                {user?.role === 'admin' && (
                    <span style={{
                        fontSize: 9, fontWeight: 700, color: '#a78bfa',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontFamily: 'var(--font-display)',
                        padding: '2px 6px',
                        border: '1px solid rgba(167,139,250,0.3)',
                        borderRadius: 4,
                    }}>
                        ADMIN
                    </span>
                )}
                <button
                    className="nx-mobile-bell"
                    onClick={onNotifClick}
                    style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                    <Bell size={20} color="var(--nx-cyan)" />
                    {unread > 0 && (
                        <span style={{
                            position: 'absolute', top: -2, right: -2,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#fb7185', fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', border: '2px solid var(--nx-bg)',
                        }}>
                            {unread}
                        </span>
                    )}
                </button>
            </div>
        </div>
    )
}
