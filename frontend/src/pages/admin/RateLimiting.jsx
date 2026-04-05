import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Shield, Activity, AlertTriangle, Clock, Globe,
    Ban, CheckCircle, BarChart3, TrendingUp, Zap, RefreshCw
} from 'lucide-react'

/* ── Simulated rate limiting data ── */
function genData() {
    const endpoints = [
        { path: '/api/auth/login', method: 'POST', limit: '5/min', current: Math.floor(Math.random() * 6), blocked: Math.floor(Math.random() * 3) },
        { path: '/api/auth/register', method: 'POST', limit: '3/min', current: Math.floor(Math.random() * 4), blocked: Math.floor(Math.random() * 2) },
        { path: '/api/banking/transfer', method: 'POST', limit: '10/min', current: Math.floor(Math.random() * 11), blocked: Math.floor(Math.random() * 4) },
        { path: '/api/banking/accounts', method: 'GET', limit: '30/min', current: Math.floor(Math.random() * 31), blocked: 0 },
        { path: '/api/intelligence/fraud', method: 'GET', limit: '20/min', current: Math.floor(Math.random() * 21), blocked: Math.floor(Math.random() * 2) },
        { path: '/api/admin/users', method: 'GET', limit: '15/min', current: Math.floor(Math.random() * 16), blocked: 0 },
        { path: '/api/analytics/kpi', method: 'GET', limit: '30/min', current: Math.floor(Math.random() * 31), blocked: 0 },
        { path: '/api/auth/otp/verify', method: 'POST', limit: '3/min', current: Math.floor(Math.random() * 4), blocked: Math.floor(Math.random() * 5) },
    ]

    const blockedIPs = [
        { ip: '192.168.1.42', reason: 'Brute force login', attempts: 47, blockedAt: '2 min ago', expiresIn: '58 min', severity: 'critical' },
        { ip: '10.0.0.155', reason: 'API rate exceeded', attempts: 31, blockedAt: '8 min ago', expiresIn: '52 min', severity: 'high' },
        { ip: '172.16.0.89', reason: 'OTP brute force', attempts: 15, blockedAt: '23 min ago', expiresIn: '37 min', severity: 'critical' },
        { ip: '203.0.113.44', reason: 'Scraping attempt', attempts: 120, blockedAt: '1 hr ago', expiresIn: '28 min', severity: 'medium' },
    ]

    return { endpoints, blockedIPs }
}

const sCard = {
    background: 'var(--nx-card-bg)',
    border: '1px solid var(--nx-border)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
}

const severityColors = { critical: '#ef4444', high: '#f59e0b', medium: '#22d3ee', low: '#34d399' }

export default function RateLimiting() {
    const [data, setData] = useState(genData)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => {
            setData(genData())
            setLastRefresh(new Date())
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const totalRequests = data.endpoints.reduce((s, e) => s + e.current, 0)
    const totalBlocked = data.endpoints.reduce((s, e) => s + e.blocked, 0)
    const blockedIPs = data.blockedIPs.length

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{
                    fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)',
                    letterSpacing: '0.1em', color: 'var(--nx-text)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <Shield size={28} color="#ef4444" />
                    RATE LIMITING
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>
                        Real-time API throttle metrics and blocked IP management
                    </p>
                    <span style={{ fontSize: 10, color: 'var(--nx-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={10} /> Auto-refreshes every 10s · Last: {lastRefresh.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Active Requests/min', value: totalRequests, color: '#22d3ee', icon: Activity },
                    { label: 'Blocked Requests', value: totalBlocked, color: '#ef4444', icon: Ban },
                    { label: 'Blocked IPs', value: blockedIPs, color: '#f59e0b', icon: AlertTriangle },
                    { label: 'Endpoints Monitored', value: data.endpoints.length, color: '#34d399', icon: Globe },
                    { label: 'Avg Utilization', value: `${Math.round(data.endpoints.reduce((s, e) => s + (e.current / parseInt(e.limit)) * 100, 0) / data.endpoints.length)}%`, color: '#a78bfa', icon: BarChart3 },
                ].map(s => {
                    const I = s.icon
                    return (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ ...sCard, textAlign: 'center', padding: '1rem' }}
                        >
                            <I size={18} color={s.color} style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginTop: 2, letterSpacing: '0.04em' }}>{s.label}</div>
                        </motion.div>
                    )
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Endpoint Rate Limits */}
                <div style={{ ...sCard }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} color="#22d3ee" /> ENDPOINT THROTTLES
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.endpoints.map((ep, i) => {
                            const limit = parseInt(ep.limit)
                            const pct = (ep.current / limit) * 100
                            const barColor = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#22d3ee'
                            return (
                                <motion.div
                                    key={ep.path}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ background: 'var(--nx-bg-2)', padding: '10px 12px', borderRadius: 8 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                fontSize: 9, padding: '1px 6px', borderRadius: 4,
                                                background: ep.method === 'POST' ? '#f59e0b22' : '#22d3ee22',
                                                color: ep.method === 'POST' ? '#f59e0b' : '#22d3ee',
                                                fontWeight: 700, fontFamily: 'var(--font-mono)',
                                            }}>{ep.method}</span>
                                            <span style={{ fontSize: 11, color: 'var(--nx-text)', fontFamily: 'var(--font-mono)' }}>{ep.path}</span>
                                        </div>
                                        <span style={{ fontSize: 10, color: barColor, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                            {ep.current}/{limit}
                                        </span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--nx-bg-1)', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, pct)}%` }}
                                            transition={{ duration: 0.5 }}
                                            style={{ height: '100%', background: barColor, borderRadius: 2 }}
                                        />
                                    </div>
                                    {ep.blocked > 0 && (
                                        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Ban size={10} /> {ep.blocked} blocked in last hour
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Blocked IPs */}
                <div style={{ ...sCard }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Ban size={16} color="#ef4444" /> BLOCKED IPs
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.blockedIPs.map((ip, i) => (
                            <motion.div
                                key={ip.ip}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'var(--nx-bg-2)', padding: '12px', borderRadius: 8,
                                    borderLeft: `3px solid ${severityColors[ip.severity]}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-mono)' }}>{ip.ip}</span>
                                    <span style={{
                                        fontSize: 9, padding: '2px 8px', borderRadius: 10,
                                        background: severityColors[ip.severity] + '18',
                                        color: severityColors[ip.severity],
                                        fontWeight: 700, textTransform: 'uppercase',
                                    }}>{ip.severity}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginBottom: 4 }}>{ip.reason}</div>
                                <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--nx-text-dim)' }}>
                                    <span>Attempts: <strong style={{ color: '#ef4444' }}>{ip.attempts}</strong></span>
                                    <span>Blocked: {ip.blockedAt}</span>
                                    <span>Expires: {ip.expiresIn}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Throttle Rules */}
                    <div style={{ marginTop: 20, padding: '12px', background: '#f59e0b08', borderRadius: 8, border: '1px solid #f59e0b18' }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 8 }}>
                            ACTIVE RULES
                        </h3>
                        {[
                            'Login: 5 attempts / minute per IP',
                            'OTP Verify: 3 attempts / minute per IP',
                            'Registration: 3 requests / minute per IP',
                            'Transfer: 10 requests / minute per user',
                            'General API: 30 requests / minute per user',
                            'IP auto-ban after 50 failed requests / hour',
                        ].map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 11, color: 'var(--nx-text-muted)' }}>
                                <CheckCircle size={10} color="#34d399" /> {r}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
