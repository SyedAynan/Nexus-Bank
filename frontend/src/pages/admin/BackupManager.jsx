import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Clock, Download, Upload, CheckCircle, AlertTriangle, Calendar, HardDrive, RefreshCw, Shield } from 'lucide-react'

const BACKUPS = [
    { id: 'bk-001', type: 'Full', status: 'completed', size: '2.4 GB', created: '2026-03-01 02:00', duration: '12m 34s', retention: '30 days' },
    { id: 'bk-002', type: 'Incremental', status: 'completed', size: '340 MB', created: '2026-02-28 02:00', duration: '3m 12s', retention: '30 days' },
    { id: 'bk-003', type: 'Incremental', status: 'completed', size: '280 MB', created: '2026-02-27 02:00', duration: '2m 48s', retention: '30 days' },
    { id: 'bk-004', type: 'Full', status: 'completed', size: '2.3 GB', created: '2026-02-24 02:00', duration: '11m 56s', retention: '90 days' },
    { id: 'bk-005', type: 'Incremental', status: 'completed', size: '195 MB', created: '2026-02-23 02:00', duration: '2m 10s', retention: '30 days' },
    { id: 'bk-006', type: 'Full', status: 'completed', size: '2.1 GB', created: '2026-02-17 02:00', duration: '10m 22s', retention: '90 days' },
]

const SCHEDULE = [
    { type: 'Incremental', frequency: 'Daily at 02:00 UTC', retention: '30 days', next: '2026-03-02 02:00' },
    { type: 'Full', frequency: 'Weekly (Sunday) at 02:00 UTC', retention: '90 days', next: '2026-03-08 02:00' },
    { type: 'Archive', frequency: 'Monthly (1st) at 04:00 UTC', retention: '1 year', next: '2026-04-01 04:00' },
]

export default function BackupManager() {
    const [restoring, setRestoring] = useState(null)

    const handleRestore = (id) => {
        setRestoring(id)
        setTimeout(() => setRestoring(null), 3000)
    }

    const totalSize = '8.2 GB'
    const statusColors = { completed: '#34d399', running: '#22d3ee', failed: '#ef4444' }

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>BACKUP MANAGER</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Database backup strategy & point-in-time recovery</p>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total Backups', value: BACKUPS.length, icon: Database, color: '#22d3ee' },
                    { label: 'Storage Used', value: totalSize, icon: HardDrive, color: '#a78bfa' },
                    { label: 'Last Backup', value: '8h ago', icon: Clock, color: '#34d399' },
                    { label: 'Success Rate', value: '100%', icon: CheckCircle, color: '#34d399' },
                    { label: 'Encryption', value: 'AES-256', icon: Shield, color: '#f59e0b' },
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

            {/* Schedule */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Backup Schedule</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                    {SCHEDULE.map((s, i) => (
                        <div key={i} style={{ padding: '14px 16px', background: 'var(--nx-bg-3)', borderRadius: 10, border: '1px solid var(--nx-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Calendar size={14} color="var(--nx-cyan)" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{s.type} Backup</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--nx-text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span>Frequency: {s.frequency}</span>
                                <span>Retention: {s.retention}</span>
                                <span style={{ color: 'var(--nx-cyan)' }}>Next: {s.next}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Backup History */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', overflowX: 'auto' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Backup History</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--nx-border)' }}>
                            {['ID', 'Type', 'Status', 'Size', 'Created', 'Duration', 'Retention', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--nx-text-dim)', fontWeight: 600 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {BACKUPS.map((b, i) => (
                            <motion.tr key={b.id} style={{ borderBottom: '1px solid var(--nx-border)' }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--nx-text-dim)' }}>{b.id}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: 4, background: b.type === 'Full' ? '#22d3ee18' : '#a78bfa18', color: b.type === 'Full' ? '#22d3ee' : '#a78bfa', fontSize: 11, fontWeight: 600 }}>{b.type}</span>
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: statusColors[b.status] }}>
                                        <CheckCircle size={12} /> {b.status}
                                    </span>
                                </td>
                                <td style={{ padding: '10px 12px', color: 'var(--nx-text)', fontWeight: 600 }}>{b.size}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--nx-text-muted)' }}>{b.created}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--nx-text-muted)' }}>{b.duration}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--nx-text-dim)' }}>{b.retention}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => handleRestore(b.id)} disabled={restoring === b.id}
                                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.1)', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {restoring === b.id ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Restoring</> : <><Upload size={11} /> Restore</>}
                                        </button>
                                        <button style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid var(--nx-border)', background: 'var(--nx-bg-3)', color: 'var(--nx-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Download size={11} /> Download
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    )
}
