import { motion } from 'framer-motion'
import { FileCheck, Shield, Fingerprint, Scale, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default function Compliance() {
    const areas = [
        { title: 'KYC Verification', icon: Fingerprint, status: 'Active', color: '#22d3ee', items: ['Identity document check', 'Biometric verification', 'Address proof', 'Sanctions screening'] },
        { title: 'AML Monitoring', icon: Shield, status: 'Active', color: '#a78bfa', items: ['Transaction pattern analysis', 'Suspicious activity detection', 'Network analysis', 'Risk scoring'] },
        { title: 'Regulatory Reporting', icon: Scale, status: 'Scheduled', color: '#fbbf24', items: ['SAR filing', 'CTR generation', 'Quarterly compliance report', 'Annual audit preparation'] },
    ]

    const policies = [
        { name: 'Privacy Policy', status: 'Current', date: '2026-01-15' },
        { name: 'Terms of Service', status: 'Current', date: '2026-01-15' },
        { name: 'KYC/AML Policy', status: 'Current', date: '2026-02-01' },
        { name: 'Risk Management', status: 'Review', date: '2026-03-01' },
        { name: 'Audit Logging', status: 'Current', date: '2026-01-20' },
    ]

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>COMPLIANCE</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Regulatory compliance & policy management</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Compliance Score', value: '94%', icon: FileCheck, accent: 'emerald' },
                    { label: 'KYC Verified', value: '98%', icon: CheckCircle, accent: 'cyan' },
                    { label: 'AML Alerts', value: '3', icon: AlertTriangle, accent: 'amber' },
                    { label: 'Next Audit', value: '14d', icon: Clock, accent: 'violet' },
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {areas.map((a, i) => (
                        <motion.div key={i} className="nx-card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}12`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <a.icon size={16} color={a.color} />
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{a.title}</span>
                                </div>
                                <span className="nx-badge nx-badge-green">{a.status}</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {a.items.map((item, j) => (
                                    <li key={j} style={{ fontSize: 12, color: 'var(--nx-text-muted)', padding: '0.25rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: a.color, boxShadow: `0 0 4px ${a.color}60`, flexShrink: 0 }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                <motion.div className="nx-card-static" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>POLICY DOCUMENTS</h3>
                    {policies.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < policies.length - 1 ? '1px solid var(--nx-border)' : 'none' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-text)' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{p.date}</div>
                            </div>
                            <span className={`nx-badge ${p.status === 'Current' ? 'nx-badge-green' : 'nx-badge-amber'}`}>{p.status}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
