import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Globe, Shield, Key, CheckCircle, XCircle, Clock, Server, Zap, Users } from 'lucide-react'

const API_ENDPOINTS = [
    { path: '/api/v1/accounts', method: 'GET', status: 'active', latency: '45ms', calls: '12.4k', desc: 'List accounts' },
    { path: '/api/v1/accounts/{id}', method: 'GET', status: 'active', latency: '32ms', calls: '8.2k', desc: 'Get account' },
    { path: '/api/v1/transactions', method: 'GET', status: 'active', latency: '67ms', calls: '24.8k', desc: 'List transactions' },
    { path: '/api/v1/transactions', method: 'POST', status: 'active', latency: '89ms', calls: '6.1k', desc: 'Create transaction' },
    { path: '/api/v1/balances', method: 'GET', status: 'active', latency: '28ms', calls: '18.9k', desc: 'Get balances' },
    { path: '/api/v1/consents', method: 'POST', status: 'beta', latency: '120ms', calls: '0.3k', desc: 'Create consent' },
    { path: '/api/v1/consents/{id}', method: 'DELETE', status: 'beta', latency: '95ms', calls: '0.1k', desc: 'Revoke consent' },
    { path: '/api/v1/payments/initiate', method: 'POST', status: 'planned', latency: '—', calls: '—', desc: 'Initiate payment' },
]

const PARTNERS = [
    { name: 'Plaid', status: 'architecture_ready', type: 'aggregator', logo: '🔗' },
    { name: 'Stripe', status: 'architecture_ready', type: 'payments', logo: '💳' },
    { name: 'Yodlee', status: 'planned', type: 'aggregator', logo: '📊' },
    { name: 'TrueLayer', status: 'planned', type: 'openbanking', logo: '🏦' },
]

export default function OpenBanking() {
    const [services, setServices] = useState(null)

    useEffect(() => {
        api.get('/services/status').then(r => setServices(r.data)).catch(() => { })
    }, [])

    const statusBadge = (s) => {
        const cfg = { active: { bg: '#22c55e18', color: '#22c55e', icon: CheckCircle }, beta: { bg: '#f59e0b18', color: '#f59e0b', icon: Clock }, planned: { bg: '#64748b18', color: '#64748b', icon: XCircle }, architecture_ready: { bg: '#22d3ee18', color: '#22d3ee', icon: Zap } }
        const c = cfg[s] || cfg.planned
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <c.icon size={11} /> {s.replace('_', ' ')}
            </span>
        )
    }

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>OPEN BANKING</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>PSD2 compliant API management & third-party integrations</p>
            </div>

            {/* KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'API Endpoints', value: API_ENDPOINTS.length, icon: Server, color: '#22d3ee' },
                    { label: 'Active', value: API_ENDPOINTS.filter(e => e.status === 'active').length, icon: CheckCircle, color: '#34d399' },
                    { label: 'Partners', value: PARTNERS.length, icon: Users, color: '#a78bfa' },
                    { label: 'Compliance', value: 'PSD2', icon: Shield, color: '#f59e0b' },
                ].map((c, i) => (
                    <motion.div key={i} className="nx-card-static" style={{ padding: '1.2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}18`, border: `1px solid ${c.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <c.icon size={18} color={c.color} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)' }}>{c.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* API Endpoints */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 24, overflowX: 'auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>API Endpoints</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--nx-border)' }}>
                            {['Method', 'Endpoint', 'Description', 'Status', 'Latency', 'Calls/day'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--nx-text-dim)', fontWeight: 600 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {API_ENDPOINTS.map((ep, i) => {
                            const methodColor = { GET: '#34d399', POST: '#3b82f6', DELETE: '#ef4444', PUT: '#f59e0b' }
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid var(--nx-border)' }}>
                                    <td style={{ padding: '8px 12px' }}><span style={{ background: `${methodColor[ep.method]}18`, color: methodColor[ep.method], padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{ep.method}</span></td>
                                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--nx-text)' }}>{ep.path}</td>
                                    <td style={{ padding: '8px 12px', color: 'var(--nx-text-muted)' }}>{ep.desc}</td>
                                    <td style={{ padding: '8px 12px' }}>{statusBadge(ep.status)}</td>
                                    <td style={{ padding: '8px 12px', color: 'var(--nx-cyan)', fontFamily: 'var(--font-display)' }}>{ep.latency}</td>
                                    <td style={{ padding: '8px 12px', color: 'var(--nx-text)' }}>{ep.calls}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </motion.div>

            {/* Partners */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Integration Partners</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {PARTNERS.map((p, i) => (
                        <motion.div key={p.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                            style={{ padding: '16px', background: 'var(--nx-bg-3)', borderRadius: 10, border: '1px solid var(--nx-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>{p.logo}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', textTransform: 'capitalize' }}>{p.type}</div>
                            </div>
                            {statusBadge(p.status)}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
