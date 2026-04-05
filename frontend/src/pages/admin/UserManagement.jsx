import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Users, UserCheck, Lock, Search } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => { api.get('/admin/users').then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [])

    const handleUpdate = async (id, body) => {
        try { await api.patch(`/admin/users/${id}`, body); setUsers(users.map(u => u.id === id ? { ...u, ...body } : u)) } catch { }
    }

    const filtered = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="animate-in">{[...Array(5)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 48, marginBottom: 8 }} />)}</div>

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>USER MANAGEMENT</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Platform user administration</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { label: 'Total', value: users.length, accent: 'cyan' },
                        { label: 'Active', value: users.filter(u => u.is_active).length, accent: 'emerald' },
                        { label: 'Locked', value: users.filter(u => u.is_locked).length, accent: 'rose' },
                    ].map((k, i) => (
                        <div key={i} className={`nx-kpi ${k.accent}`} style={{ padding: '0.5rem 1rem', minWidth: 80 }}>
                            <div style={{ fontSize: 9, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: `var(--nx-${k.accent})` }}>{k.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 16, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--nx-text-dim)' }} />
                <input className="nx-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>

            <motion.div className="nx-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <table className="nx-table">
                    <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 500 }}>{u.username}</td>
                                <td style={{ color: 'var(--nx-text-muted)', fontSize: 12 }}>{u.email}</td>
                                <td>
                                    <select className="nx-select" style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', fontSize: 11, minWidth: 120 }}
                                        value={u.role} onChange={e => handleUpdate(u.id, { role: e.target.value })}>
                                        {['super_admin', 'compliance_admin', 'support_admin', 'analytics_admin', 'admin', 'analyst', 'user'].map(r =>
                                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <span className={`nx-badge ${u.is_locked ? 'nx-badge-red' : u.is_active ? 'nx-badge-green' : 'nx-badge-muted'}`}>
                                        {u.is_locked ? 'Locked' : u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleUpdate(u.id, { is_locked: !u.is_locked })} className="nx-btn nx-btn-ghost" style={{ fontSize: 11 }}>
                                        {u.is_locked ? <><UserCheck size={12} /> Unlock</> : <><Lock size={12} /> Lock</>}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    )
}
