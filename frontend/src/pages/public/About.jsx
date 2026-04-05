import { motion } from 'framer-motion'
import { Building2, Shield, FileCheck, Globe } from 'lucide-react'

export default function About() {
    const sections = [
        { title: 'The Platform', icon: Building2, color: '#22d3ee', items: ['Enterprise digital banking infrastructure', 'Real-time payment processing', 'Multi-currency account management', 'Scalable microservices architecture'] },
        { title: 'Security', icon: Shield, color: '#a78bfa', items: ['Multi-factor authentication', 'Role-based access control', 'Continuous threat monitoring', 'End-to-end encryption'] },
        { title: 'Compliance', icon: FileCheck, color: '#34d399', items: ['Built-in KYC verification', 'AML transaction monitoring', 'Complete audit trails', 'Regulatory reporting'] },
        { title: 'Global', icon: Globe, color: '#fbbf24', items: ['Multi-region deployment', '99.9% availability SLA', '24/7 operations center', 'ISO 27001 aligned'] },
    ]

    return (
        <div className="animate-in" style={{ padding: '5rem 1.5rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--nx-text)', marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                        ABOUT <span className="nx-cyan nx-text-glow-cyan">NEXA</span>
                    </h1>
                    <p style={{ color: 'var(--nx-text-muted)', fontSize: 15, marginBottom: 40, maxWidth: 560 }}>
                        An enterprise digital banking platform built for trust, compliance, and intelligent financial management.
                    </p>
                </motion.div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {sections.map((s, i) => (
                        <motion.div key={i} className="nx-card"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                            whileHover={{ borderColor: `${s.color}30` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={18} color={s.color} />
                                </div>
                                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{s.title}</h2>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {s.items.map((item, j) => (
                                    <li key={j} style={{ fontSize: 13, color: 'var(--nx-text-muted)', padding: '0.375rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}60`, flexShrink: 0 }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
