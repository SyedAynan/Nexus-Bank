import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Flag, ToggleLeft, ToggleRight, Sliders, Plus, Trash2, Edit3, Save, X } from 'lucide-react'

export default function FeatureFlags() {
    const [flags, setFlags] = useState([])
    const [summary, setSummary] = useState({})
    const [editing, setEditing] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [showCreate, setShowCreate] = useState(false)
    const [createForm, setCreateForm] = useState({ key: '', name: '', description: '', enabled: false, rollout_pct: 0, category: 'other' })

    useEffect(() => { fetchFlags() }, [])

    const fetchFlags = () => {
        api.get('/services/flags').then(r => setFlags(r.data || [])).catch(() => { })
        api.get('/services/flags/summary').then(r => setSummary(r.data || {})).catch(() => { })
    }

    const toggleFlag = (key, current) => {
        api.put(`/services/flags/${key}`, { enabled: !current }).then(fetchFlags)
    }

    const updateRollout = (key) => {
        api.put(`/services/flags/${key}`, editForm).then(() => { fetchFlags(); setEditing(null) })
    }

    const createFlag = () => {
        api.post('/services/flags', createForm).then(() => { fetchFlags(); setShowCreate(false); setCreateForm({ key: '', name: '', description: '', enabled: false, rollout_pct: 0, category: 'other' }) })
    }

    const deleteFlag = (key) => { api.delete(`/services/flags/${key}`).then(fetchFlags) }

    const catColors = { ui: '#22d3ee', ai: '#a78bfa', security: '#f59e0b', banking: '#34d399', premium: '#ec4899', compliance: '#64748b', analytics: '#3b82f6', other: '#888' }

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>FEATURE FLAGS</h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>A/B testing & gradual rollout management</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="nx-btn nx-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> New Flag
                </button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total Flags', value: summary.total || 0, color: '#22d3ee' },
                    { label: 'Enabled', value: summary.enabled || 0, color: '#34d399' },
                    { label: 'Disabled', value: summary.disabled || 0, color: '#ef4444' },
                    { label: 'Full Rollout', value: summary.full_rollout || 0, color: '#a78bfa' },
                    { label: 'Partial', value: summary.partial_rollout || 0, color: '#f59e0b' },
                ].map((c, i) => (
                    <motion.div key={i} className="nx-card-static" style={{ padding: '1rem', textAlign: 'center' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-muted)', marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: c.color, fontFamily: 'var(--font-display)' }}>{c.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Create Form */}
            {showCreate && (
                <motion.div className="nx-card-static" style={{ padding: '1.5rem', marginBottom: 20 }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, fontFamily: 'var(--font-display)', color: 'var(--nx-text)' }}>Create Flag</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <div><label className="nx-label">Key</label><input className="nx-input" value={createForm.key} onChange={e => setCreateForm(f => ({ ...f, key: e.target.value }))} placeholder="feature_name" /></div>
                        <div><label className="nx-label">Name</label><input className="nx-input" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Feature Name" /></div>
                        <div><label className="nx-label">Category</label>
                            <select className="nx-select" value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}>
                                {Object.keys(catColors).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div><label className="nx-label">Rollout %</label><input type="number" className="nx-input" value={createForm.rollout_pct} onChange={e => setCreateForm(f => ({ ...f, rollout_pct: parseInt(e.target.value) || 0 }))} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowCreate(false)} className="nx-btn">Cancel</button>
                        <button onClick={createFlag} disabled={!createForm.key || !createForm.name} className="nx-btn nx-btn-primary">Create</button>
                    </div>
                </motion.div>
            )}

            {/* Flags List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {flags.map((f, i) => (
                    <motion.div key={f.key} className="nx-card-static" style={{ padding: '1.2rem' }}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <button onClick={() => toggleFlag(f.key, f.enabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                {f.enabled ? <ToggleRight size={28} color="#34d399" /> : <ToggleLeft size={28} color="#64748b" />}
                            </button>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-text)' }}>{f.name}</span>
                                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${catColors[f.category] || '#888'}18`, color: catColors[f.category] || '#888', fontWeight: 600, textTransform: 'uppercase' }}>{f.category}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 2 }}>{f.description}</div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 4, fontFamily: 'var(--font-mono, monospace)' }}>{f.key}</div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 100 }}>
                                {editing === f.key ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input type="number" min="0" max="100" value={editForm.rollout_pct} onChange={e => setEditForm(ef => ({ ...ef, rollout_pct: parseInt(e.target.value) || 0 }))}
                                            style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--nx-border)', background: 'var(--nx-bg-3)', color: 'var(--nx-text)', fontSize: 13 }} />
                                        <button onClick={() => updateRollout(f.key)} style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}><Save size={14} color="#22d3ee" /></button>
                                        <button onClick={() => setEditing(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}><X size={14} color="#ef4444" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: f.enabled ? '#34d399' : '#64748b', fontFamily: 'var(--font-display)' }}>{f.rollout_pct}%</div>
                                        <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--nx-border)', marginTop: 4 }}>
                                            <div style={{ width: `${f.rollout_pct}%`, height: '100%', borderRadius: 2, background: f.enabled ? '#34d399' : '#64748b', transition: 'width 0.3s ease' }} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => { setEditing(f.key); setEditForm({ rollout_pct: f.rollout_pct }) }} style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 6, padding: '6px', cursor: 'pointer' }}><Edit3 size={14} color="#22d3ee" /></button>
                                <button onClick={() => deleteFlag(f.key)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
