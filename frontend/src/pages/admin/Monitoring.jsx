import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, HardDrive, Wifi, Clock, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react'

const METRICS = {
    cpu: { current: 34, peak: 72, avg: 28, history: [25, 28, 32, 45, 38, 34, 29, 27, 31, 34] },
    memory: { current: 62, peak: 85, avg: 58, total: '16 GB', used: '9.9 GB' },
    disk: { current: 45, total: '500 GB', used: '225 GB' },
    network: { in: '2.4 MB/s', out: '1.1 MB/s', connections: 847 },
    uptime: '99.97%',
    responseTime: { p50: '42ms', p95: '156ms', p99: '340ms' },
}

const ALERTS = [
    { time: '2 min ago', level: 'info', message: 'Scheduled backup completed successfully', service: 'backup' },
    { time: '15 min ago', level: 'warning', message: 'Memory usage exceeded 80% threshold', service: 'monitor' },
    { time: '1 hour ago', level: 'info', message: 'SSL certificate renewed (expires in 90 days)', service: 'ssl' },
    { time: '3 hours ago', level: 'error', message: 'Rate limit exceeded for IP 203.0.113.42', service: 'firewall' },
    { time: '6 hours ago', level: 'info', message: 'Database index optimization completed', service: 'database' },
    { time: '12 hours ago', level: 'warning', message: 'Unusual login pattern detected from new region', service: 'security' },
]

const SERVICES = [
    { name: 'API Server', status: 'healthy', uptime: '99.99%', latency: '42ms', icon: Cpu },
    { name: 'Database', status: 'healthy', uptime: '99.97%', latency: '12ms', icon: HardDrive },
    { name: 'Redis Cache', status: 'healthy', uptime: '99.99%', latency: '2ms', icon: Activity },
    { name: 'WebSocket', status: 'healthy', uptime: '99.95%', latency: '8ms', icon: Wifi },
    { name: 'Email Service', status: 'simulation', uptime: '100%', latency: '—', icon: Clock },
    { name: 'OAuth Service', status: 'simulation', uptime: '100%', latency: '—', icon: CheckCircle },
]

export default function Monitoring() {
    const [tick, setTick] = useState(0)
    useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 5000); return () => clearInterval(t) }, [])

    const alertColor = { info: '#22d3ee', warning: '#f59e0b', error: '#ef4444' }
    const statusColor = { healthy: '#34d399', degraded: '#f59e0b', down: '#ef4444', simulation: '#a78bfa' }

    const MiniBar = ({ values, color }) => (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }}>
            {values.map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: color, borderRadius: 2, opacity: 0.3 + (i / values.length) * 0.7, transition: 'height 0.5s ease' }} />
            ))}
        </div>
    )

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>MONITORING</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>System health, performance metrics & APM</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--nx-text-muted)' }}>
                    <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }} /> Live
                </div>
            </div>

            {/* System Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'CPU Usage', value: `${METRICS.cpu.current}%`, sub: `Peak: ${METRICS.cpu.peak}%`, color: '#22d3ee', chart: METRICS.cpu.history },
                    { label: 'Memory', value: METRICS.memory.used, sub: `of ${METRICS.memory.total} (${METRICS.memory.current}%)`, color: '#a78bfa' },
                    { label: 'Disk', value: METRICS.disk.used, sub: `of ${METRICS.disk.total} (${METRICS.disk.current}%)`, color: '#f59e0b' },
                    { label: 'Uptime', value: METRICS.uptime, sub: 'Last 30 days', color: '#34d399' },
                ].map((m, i) => (
                    <motion.div key={i} className="nx-card-static" style={{ padding: '1.2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginBottom: 6 }}>{m.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: 'var(--font-display)' }}>{m.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>{m.sub}</div>
                        {m.chart && <div style={{ marginTop: 8 }}><MiniBar values={m.chart} color={m.color} /></div>}
                        {!m.chart && (
                            <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'var(--nx-border)' }}>
                                <div style={{ width: `${m.label === 'Memory' ? METRICS.memory.current : m.label === 'Disk' ? METRICS.disk.current : 100}%`, height: '100%', borderRadius: 3, background: m.color, transition: 'width 0.5s ease' }} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Response Times */}
            <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Response Times</h3>
                <div style={{ display: 'flex', gap: 24 }}>
                    {[
                        { label: 'P50', value: METRICS.responseTime.p50, color: '#34d399' },
                        { label: 'P95', value: METRICS.responseTime.p95, color: '#f59e0b' },
                        { label: 'P99', value: METRICS.responseTime.p99, color: '#ef4444' },
                    ].map(p => (
                        <div key={p.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginBottom: 4 }}>{p.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: p.color, fontFamily: 'var(--font-display)' }}>{p.value}</div>
                        </div>
                    ))}
                    <div style={{ borderLeft: '1px solid var(--nx-border)', paddingLeft: 24 }}>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginBottom: 4 }}>Active Connections</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#22d3ee', fontFamily: 'var(--font-display)' }}>{METRICS.network.connections}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginBottom: 4 }}>Network In/Out</div>
                        <div style={{ fontSize: 14, color: 'var(--nx-text)' }}>{METRICS.network.in} ↓ · {METRICS.network.out} ↑</div>
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Services */}
                <motion.div className="nx-card-static" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Services</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {SERVICES.map((s, i) => (
                            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--nx-bg-3)', borderRadius: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[s.status] }} />
                                <s.icon size={14} color="var(--nx-text-muted)" />
                                <span style={{ flex: 1, fontSize: 13, color: 'var(--nx-text)' }}>{s.name}</span>
                                <span style={{ fontSize: 11, color: statusColor[s.status], fontWeight: 600, textTransform: 'uppercase' }}>{s.status}</span>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', minWidth: 50, textAlign: 'right' }}>{s.latency}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Alerts */}
                <motion.div className="nx-card-static" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Recent Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ALERTS.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: `${alertColor[a.level]}08`, borderRadius: 8, borderLeft: `3px solid ${alertColor[a.level]}` }}>
                                <AlertTriangle size={14} color={alertColor[a.level]} style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: 'var(--nx-text)' }}>{a.message}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>{a.time} · {a.service}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
