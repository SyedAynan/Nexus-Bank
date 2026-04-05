import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Activity, Eye } from 'lucide-react'

export default function FraudMonitoring() {
    const [alerts, setAlerts] = useState([])
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/admin/fraud-alerts').catch(() => ({ data: [] })),
            api.get('/admin/security-events').catch(() => ({ data: [] })),
        ]).then(([a, e]) => { setAlerts(a.data); setEvents(e.data); setLoading(false) })
    }, [])

    const highRisk = alerts.filter(a => a.severity === 'high').length
    const medRisk = alerts.filter(a => a.severity === 'medium').length

    if (loading) return <div className="animate-in">{[...Array(3)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 80, marginBottom: 12 }} />)}</div>

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                    RISK & <span className="nx-rose">SECURITY</span>
                </h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Threat monitoring & alert management</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total Alerts', value: alerts.length, icon: AlertTriangle, accent: 'amber' },
                    { label: 'High Risk', value: highRisk, icon: Shield, accent: 'rose' },
                    { label: 'Medium Risk', value: medRisk, icon: Eye, accent: 'amber' },
                    { label: 'Events', value: events.length, icon: Activity, accent: 'cyan' },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.accent}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={14} color={`var(--nx-${k.accent})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: `var(--nx-${k.accent})`, marginTop: 4 }}>{k.value}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <motion.div className="nx-card-static" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>ACTIVE ALERTS</h3>
                    {alerts.length === 0 ? <p style={{ fontSize: 13, color: 'var(--nx-text-dim)', textAlign: 'center', padding: '2rem' }}>No alerts</p> : alerts.slice(0, 8).map((a, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--nx-border)' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)' }}>{a.alert_type?.replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>User: {a.username}</div>
                            </div>
                            <span className={`nx-badge ${a.severity === 'high' ? 'nx-badge-red' : 'nx-badge-amber'}`}>{a.severity}</span>
                        </div>
                    ))}
                </motion.div>

                <motion.div className="nx-card-static" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>SECURITY EVENTS</h3>
                    {events.slice(0, 8).map((e, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--nx-border)' }}>
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
