import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Shield, Eye, Lock, Fingerprint, CheckCircle, Smartphone, Monitor, Globe, Key, Mail, Bell, Laptop, RefreshCw, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import api from '../../api'

/* ─── Toggle Switch ─── */
function Toggle({ on, onToggle }) {
    return (
        <div className={`nx-toggle${on ? ' on' : ''}`} onClick={onToggle}>
            <div className="nx-toggle-knob" />
        </div>
    )
}

/* ─── Device Icon Helper ─── */
function getDeviceIcon(deviceName) {
    if (!deviceName) return Monitor
    const d = deviceName.toLowerCase()
    if (d.includes('iphone') || d.includes('android')) return Smartphone
    if (d.includes('ipad')) return Laptop
    if (d.includes('macos') || d.includes('mac')) return Laptop
    return Monitor
}

/* ─── Time Ago Helper ─── */
function timeAgo(dateString) {
    if (!dateString) return 'Unknown'
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Active now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
}

export default function Profile() {
    const { user } = useAuth()
    const [mfaEnabled, setMfaEnabled] = useState(true)
    const [loginAlerts, setLoginAlerts] = useState(true)
    const [txAlerts, setTxAlerts] = useState(true)
    const [biometric, setBiometric] = useState(false)

    // Session management state
    const [sessions, setSessions] = useState([])
    const [sessionsLoading, setSessionsLoading] = useState(true)
    const [sessionsError, setSessionsError] = useState(null)
    const [revokingId, setRevokingId] = useState(null)
    const [revokingAll, setRevokingAll] = useState(false)

    const connectedAccounts = [
        { provider: 'Google', email: 'user@gmail.com', connected: true, color: '#4285F4', icon: '🔵' },
        { provider: 'Apple', email: 'Not connected', connected: false, color: '#fff', icon: '🍎' },
        { provider: 'Microsoft', email: 'Not connected', connected: false, color: '#00A4EF', icon: '🟦' },
    ]

    // ── Fetch Sessions ──
    const fetchSessions = useCallback(async () => {
        try {
            setSessionsError(null)
            const res = await api.get('/auth/sessions')
            setSessions(res.data)
        } catch (err) {
            console.error('Failed to fetch sessions:', err)
            setSessionsError('Failed to load sessions')
            // Fallback to demo data if API not available
            setSessions([
                { id: 0, device_name: 'Chrome — Windows', ip_address: '127.0.0.1', location: null, created_at: new Date().toISOString(), last_active: new Date().toISOString(), is_current: true },
            ])
        } finally {
            setSessionsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSessions()
    }, [fetchSessions])

    // ── Revoke Single Session ──
    const revokeSession = async (sessionId) => {
        setRevokingId(sessionId)
        try {
            await api.delete(`/auth/sessions/${sessionId}`)
            setSessions(prev => prev.filter(s => s.id !== sessionId))
        } catch (err) {
            console.error('Failed to revoke session:', err)
            alert(err?.response?.data?.detail || 'Failed to revoke session')
        } finally {
            setRevokingId(null)
        }
    }

    // ── Revoke All Sessions ──
    const revokeAllSessions = async () => {
        setRevokingAll(true)
        try {
            await api.delete('/auth/sessions')
            setSessions(prev => prev.filter(s => s.is_current))
        } catch (err) {
            console.error('Failed to revoke all sessions:', err)
            alert(err?.response?.data?.detail || 'Failed to revoke sessions')
        } finally {
            setRevokingAll(false)
        }
    }

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>PROFILE</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Account, security & connected services</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Account Info */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>ACCOUNT INFORMATION</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(34,211,238,0.2), rgba(15,23,62,0.8))',
                            border: '1px solid rgba(34,211,238,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 700, color: 'var(--nx-cyan)',
                            fontFamily: 'var(--font-display)',
                            boxShadow: '0 0 15px rgba(34,211,238,0.15)',
                        }}>
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--nx-text)' }}>{user?.username}</div>
                            <span className="nx-badge nx-badge-cyan" style={{ textTransform: 'uppercase' }}>{user?.role}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Username', value: user?.username, icon: User },
                            { label: 'Role', value: user?.role, icon: Shield, capitalize: true },
                            { label: 'MFA', badge: true, icon: Fingerprint },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < 2 ? '1px solid var(--nx-border)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <item.icon size={13} color="var(--nx-text-dim)" />
                                    <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{item.label}</span>
                                </div>
                                {item.badge ? <span className="nx-badge nx-badge-green"><CheckCircle size={10} style={{ marginRight: 3 }} />Enabled</span>
                                    : <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)', textTransform: item.capitalize ? 'capitalize' : 'none' }}>{item.value}</span>}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Security Settings */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>SECURITY SETTINGS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'Two-Factor Authentication', desc: 'TOTP via authenticator app', icon: Key, color: '#22d3ee', on: mfaEnabled, set: setMfaEnabled },
                            { label: 'Login Alerts', desc: 'Email on new device login', icon: Mail, color: '#34d399', on: loginAlerts, set: setLoginAlerts },
                            { label: 'Transaction Alerts', desc: 'Notify on large transactions', icon: Bell, color: '#fbbf24', on: txAlerts, set: setTxAlerts },
                            { label: 'Biometric Login', desc: 'Fingerprint or Face ID', icon: Fingerprint, color: '#a78bfa', on: biometric, set: setBiometric },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid var(--nx-border)' : 'none' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <s.icon size={14} color={s.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{s.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{s.desc}</div>
                                </div>
                                <Toggle on={s.on} onToggle={() => s.set(!s.on)} />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Connected Accounts */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>CONNECTED ACCOUNTS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {connectedAccounts.map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.625rem', borderRadius: 'var(--radius-sm)', background: 'rgba(10,15,46,0.4)', border: '1px solid var(--nx-border)' }}>
                                <span style={{ fontSize: 20 }}>{a.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{a.provider}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{a.email}</div>
                                </div>
                                <button className={`nx-btn ${a.connected ? 'nx-btn-outline' : 'nx-btn-primary'}`} style={{ fontSize: 11, padding: '0.3rem 0.8rem' }}>
                                    {a.connected ? 'Disconnect' : 'Connect'}
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Active Sessions — Connected to Real API */}
                <motion.div className="nx-card-static" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>ACTIVE SESSIONS</h3>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                className="nx-btn nx-btn-outline"
                                style={{ fontSize: 10, padding: '0.25rem 0.5rem' }}
                                onClick={fetchSessions}
                                disabled={sessionsLoading}
                                title="Refresh sessions"
                            >
                                <RefreshCw size={11} style={{ opacity: sessionsLoading ? 0.5 : 1 }} />
                            </button>
                            {sessions.filter(s => !s.is_current).length > 0 && (
                                <button
                                    className="nx-btn nx-btn-outline"
                                    style={{ fontSize: 10, padding: '0.25rem 0.6rem', color: 'var(--nx-rose)' }}
                                    onClick={revokeAllSessions}
                                    disabled={revokingAll}
                                >
                                    {revokingAll ? <Loader2 size={11} className="animate-spin" /> : 'Revoke All'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error State */}
                    {sessionsError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', marginBottom: 12 }}>
                            <AlertTriangle size={12} color="var(--nx-rose)" />
                            <span style={{ fontSize: 11, color: 'var(--nx-rose)' }}>{sessionsError}</span>
                        </div>
                    )}

                    {/* Loading State */}
                    {sessionsLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: 8 }}>
                            <Loader2 size={16} color="var(--nx-cyan)" className="animate-spin" />
                            <span style={{ fontSize: 12, color: 'var(--nx-text-dim)' }}>Loading sessions...</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <AnimatePresence mode="popLayout">
                                {sessions.map((s) => {
                                    const DeviceIcon = getDeviceIcon(s.device_name)
                                    return (
                                        <motion.div
                                            key={s.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -30, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`nx-session-item${s.is_current ? ' current' : ''}`}
                                        >
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: s.is_current ? 'rgba(52,211,153,0.1)' : 'rgba(10,15,46,0.6)', border: `1px solid ${s.is_current ? 'rgba(52,211,153,0.25)' : 'var(--nx-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <DeviceIcon size={14} color={s.is_current ? '#34d399' : 'var(--nx-text-dim)'} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {s.device_name || 'Unknown Device'}
                                                    {s.is_current && <span className="nx-badge nx-badge-green" style={{ fontSize: 8 }}>Current</span>}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>
                                                    {s.location || 'Local'} · <span className="nx-mono">{s.ip_address || '—'}</span> · {timeAgo(s.last_active || s.created_at)}
                                                </div>
                                            </div>
                                            {!s.is_current && (
                                                <button
                                                    className="nx-btn nx-btn-outline"
                                                    style={{ fontSize: 10, padding: '0.2rem 0.5rem', color: 'var(--nx-rose)', borderColor: 'rgba(251,113,133,0.2)' }}
                                                    onClick={() => revokeSession(s.id)}
                                                    disabled={revokingId === s.id}
                                                    title="Revoke this session"
                                                >
                                                    {revokingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                                </button>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                            {sessions.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', fontSize: 12, color: 'var(--nx-text-dim)' }}>
                                    No active sessions
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
