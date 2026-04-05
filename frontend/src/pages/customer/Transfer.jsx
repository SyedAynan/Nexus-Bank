import { useState, useEffect } from 'react'
import api from '../../api'
import { motion } from 'framer-motion'
import { Send, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'

export default function Transfer() {
    const [accounts, setAccounts] = useState([])
    const [tab, setTab] = useState('deposit')
    const [form, setForm] = useState({ account_id: '', amount: '', to_account: '', description: '' })
    const [msg, setMsg] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => { api.get('/banking/accounts').then(r => setAccounts(r.data)).catch(() => { }) }, [])

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setMsg(null)
        try {
            const payload = tab === 'transfer'
                ? { from_account_id: parseInt(form.account_id), to_account_id: parseInt(form.to_account), amount: parseFloat(form.amount), type: 'transfer', description: form.description || 'Transfer' }
                : { account_id: parseInt(form.account_id), amount: parseFloat(form.amount), type: tab, description: form.description || tab }
            await api.post(tab === 'transfer' ? '/banking/transfer' : '/banking/transactions', payload)
            setMsg({ type: 'success', text: `${tab.charAt(0).toUpperCase() + tab.slice(1)} completed successfully` })
            setForm({ ...form, amount: '', description: '' })
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.detail || 'Transaction failed' }) }
        finally { setLoading(false) }
    }

    const tabIcons = { deposit: ArrowDownLeft, withdrawal: ArrowUpRight, transfer: ArrowLeftRight }

    return (
        <div className="animate-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>PAYMENTS</h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>Send, receive, and manage your funds</p>
            </div>

            <div className="nx-tabs" style={{ marginBottom: 24, display: 'inline-flex' }}>
                {['deposit', 'withdrawal', 'transfer'].map(t => {
                    const Icon = tabIcons[t]
                    return (
                        <button key={t} onClick={() => setTab(t)} className={`nx-tab ${tab === t ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                            <Icon size={13} /> {t}
                        </button>
                    )
                })}
            </div>

            {msg && <div className={`nx-alert ${msg.type === 'success' ? 'nx-alert-success' : 'nx-alert-error'}`} style={{ marginBottom: 16 }}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

            <motion.div className="nx-card-static" style={{ maxWidth: 500, padding: '2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label className="nx-label">{tab === 'transfer' ? 'From Account' : 'Account'}</label>
                        <select className="nx-select" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required>
                            <option value="">Select account</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} — ${parseFloat(a.balance).toLocaleString()}</option>)}
                        </select>
                    </div>
                    {tab === 'transfer' && (
                        <div>
                            <label className="nx-label">To Account</label>
                            <select className="nx-select" value={form.to_account} onChange={e => setForm({ ...form, to_account: e.target.value })} required>
                                <option value="">Select recipient</option>
                                {accounts.filter(a => a.id.toString() !== form.account_id).map(a => <option key={a.id} value={a.id}>{a.account_number}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="nx-label">Amount (USD)</label>
                        <input type="number" className="nx-input nx-mono" style={{ fontSize: 18 }} placeholder="0.00" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                    <div>
                        <label className="nx-label">Description</label>
                        <input type="text" className="nx-input" placeholder="Optional note" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <motion.button type="submit" disabled={loading} className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.8rem' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Send size={14} /> {loading ? 'Processing...' : `Submit ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}
