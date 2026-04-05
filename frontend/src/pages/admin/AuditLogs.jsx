import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { ScrollText, Filter, Clock } from 'lucide-react'

export default function AuditLogs() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => { api.get('/admin/security-events').then(r => { setEvents(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [])

    const types = ['all', ...new Set(events.map(e => e.type))]
    const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

    if (loading) return <div className="animate-in">{[...Array(8)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 40, marginBottom: 6 }} />)}</div>

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>AUDIT LOGS</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Complete event trail · {events.length} entries</p>
            </div>

            <div className="nx-tabs" style={{ marginBottom: 16, display: 'inline-flex', flexWrap: 'wrap' }}>
                {types.slice(0, 8).map(t => (
                    <button key={t} onClick={() => setFilter(t)} className={`nx-tab ${filter === t ? 'active' : ''}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                        {t === 'all' && <Filter size={10} style={{ marginRight: 4 }} />}{t.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            <motion.div className="nx-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <table className="nx-table">
                    <thead><tr><th>Event</th><th>User</th><th>IP</th><th>Time</th><th>Details</th></tr></thead>
                    <tbody>
                        {filtered.slice(0, 50).map((e, i) => (
                            <tr key={i}>
                                <td><span className="nx-badge nx-badge-cyan" style={{ fontSize: 10 }}>{e.type?.replace(/_/g, ' ')}</span></td>
                                <td style={{ fontWeight: 500 }}>{e.username}</td>
                                <td style={{ color: 'var(--nx-text-muted)', fontSize: 12 }} className="nx-mono">{e.ip}</td>
                                <td style={{ fontSize: 12, color: 'var(--nx-text-dim)' }} className="nx-mono">{new Date(e.created_at).toLocaleString()}</td>
                                <td style={{ fontSize: 12, color: 'var(--nx-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.details || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    )
}
