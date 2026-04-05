import { motion } from 'framer-motion'
import { Settings, Cpu, Database, Shield, Bell, Globe } from 'lucide-react'

export default function SystemSettings() {
    const settingGroups = [
        {
            title: 'Platform', icon: Cpu, color: '#22d3ee',
            items: [
                { label: 'Application Name', value: 'NEXA' },
                { label: 'Version', value: '3.0.0' },
                { label: 'Environment', value: 'Production' },
                { label: 'API Base URL', value: 'https://api.nexa.io' },
            ]
        },
        {
            title: 'Database', icon: Database, color: '#a78bfa',
            items: [
                { label: 'Engine', value: 'PostgreSQL 15' },
                { label: 'Connection Pool', value: '20 connections' },
                { label: 'Cache', value: 'Redis 7 (256MB)' },
                { label: 'Migrations', value: 'Alembic' },
            ]
        },
        {
            title: 'Security', icon: Shield, color: '#34d399',
            items: [
                { label: 'MFA', value: 'TOTP Enabled' },
                { label: 'Rate Limiting', value: '60 req/min' },
                { label: 'Session Timeout', value: '30 minutes' },
                { label: 'Password Policy', value: '8+ chars, mixed' },
            ]
        },
        {
            title: 'Notifications', icon: Bell, color: '#fbbf24',
            items: [
                { label: 'WebSocket', value: 'Enabled' },
                { label: 'Security Alerts', value: 'Email + Dashboard' },
                { label: 'Transaction Alerts', value: 'Dashboard' },
                { label: 'Login Notifications', value: 'Enabled' },
            ]
        },
    ]

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>SYSTEM SETTINGS</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Platform configuration</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {settingGroups.map((g, i) => (
                    <motion.div key={i} className="nx-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${g.color}12`, border: `1px solid ${g.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <g.icon size={16} color={g.color} />
                            </div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{g.title}</h3>
                        </div>
                        {g.items.map((item, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: j < g.items.length - 1 ? '1px solid var(--nx-border)' : 'none' }}>
                                <span style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>{item.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--nx-text)' }} className="nx-mono">{item.value}</span>
                            </div>
                        ))}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
