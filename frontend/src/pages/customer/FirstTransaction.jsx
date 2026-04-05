import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap, ArrowDownLeft, ArrowUpRight, CheckCircle2, Sparkles,
    Wallet, Clock, Shield, ArrowRight, Receipt, Hash, DollarSign,
    TrendingUp, Activity, Layers
} from 'lucide-react'

/* ─── Confetti Particle ─── */
function ConfettiParticle({ delay, color }) {
    const left = Math.random() * 100
    const size = Math.random() * 6 + 4
    const duration = Math.random() * 1.5 + 1.5
    return (
        <motion.div
            initial={{ opacity: 1, y: -20, x: 0, rotate: 0 }}
            animate={{
                opacity: [1, 1, 0],
                y: [0, 300, 500],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, Math.random() * 720],
            }}
            transition={{ duration, delay, ease: 'easeOut' }}
            style={{
                position: 'absolute', top: 0, left: `${left}%`,
                width: size, height: size * 1.5,
                borderRadius: 2,
                background: color,
                zIndex: 50, pointerEvents: 'none',
            }}
        />
    )
}

/* ─── Confetti Burst ─── */
function ConfettiBurst() {
    const colors = ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#fb7185', '#818cf8', '#2dd4bf']
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 50 }}>
            {Array.from({ length: 60 }).map((_, i) => (
                <ConfettiParticle key={i} delay={Math.random() * 0.4} color={colors[i % colors.length]} />
            ))}
        </div>
    )
}

export default function FirstTransaction() {
    const navigate = useNavigate()
    const [accounts, setAccounts] = useState([])
    const [tab, setTab] = useState('deposit')
    const [form, setForm] = useState({ account_id: '', amount: '', description: '' })
    const [loading, setLoading] = useState(false)
    const [loadingAccounts, setLoadingAccounts] = useState(true)
    const [receipt, setReceipt] = useState(null)
    const [error, setError] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        api.get('/banking/accounts')
            .then(r => { setAccounts(r.data); setLoadingAccounts(false) })
            .catch(() => setLoadingAccounts(false))
    }, [])

    const selectedAccount = accounts.find(a => a.id?.toString() === form.account_id)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const payload = {
                account_id: parseInt(form.account_id),
                amount: parseFloat(form.amount),
                type: tab,
                description: form.description || `My first ${tab}`,
            }
            const res = await api.post('/banking/user-transaction', payload)
            setReceipt(res.data)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Transaction failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setReceipt(null)
        setForm({ account_id: '', amount: '', description: '' })
        setError(null)
        // Refresh accounts to get updated balances
        api.get('/banking/accounts').then(r => setAccounts(r.data)).catch(() => { })
    }

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            {showConfetti && <ConfettiBurst />}

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <motion.div
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'radial-gradient(circle, rgba(34,211,238,0.2), rgba(15,23,62,0.8))',
                            border: '1px solid rgba(34,211,238,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(34,211,238,0.15)',
                        }}
                    >
                        <Zap size={20} color="#22d3ee" />
                    </motion.div>
                    <div>
                        <h1 style={{
                            fontSize: 24, fontWeight: 700, color: 'var(--nx-text)',
                            fontFamily: 'var(--font-display)', letterSpacing: '0.08em',
                            margin: 0,
                        }}>
                            MAKE A TRANSACTION
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', margin: 0 }}>
                            Execute your first deposit or withdrawal and watch it flow through the NEXA engine
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!receipt ? (
                    /* ─── Transaction Form ─── */
                    <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        {/* Info Banner */}
                        <motion.div
                            className="nx-card-static"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                padding: '1rem 1.25rem', marginBottom: 24,
                                background: 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(139,92,246,0.06))',
                                borderColor: 'rgba(34,211,238,0.15)',
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'rgba(34,211,238,0.1)',
                                border: '1px solid rgba(34,211,238,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Sparkles size={16} color="#22d3ee" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>
                                    Real-Time Processing
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2 }}>
                                    Your transaction passes through 8 architecture layers in ~115ms — from request to confirmation
                                </div>
                            </div>
                        </motion.div>

                        {/* Type Tabs */}
                        <div className="nx-tabs" style={{ marginBottom: 24, display: 'inline-flex' }}>
                            {[
                                { key: 'deposit', icon: ArrowDownLeft, label: 'Deposit', color: '#34d399' },
                                { key: 'withdrawal', icon: ArrowUpRight, label: 'Withdrawal', color: '#fb7185' },
                            ].map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`nx-tab ${tab === t.key ? 'active' : ''}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <t.icon size={13} /> {t.label}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <motion.div
                                className="nx-alert nx-alert-error"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginBottom: 16 }}
                            >
                                ⚠ {error}
                            </motion.div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                            {/* Form Card */}
                            <motion.div
                                className="nx-card-static"
                                style={{ padding: '2rem' }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: tab === 'deposit' ? '#34d399' : '#fb7185',
                                        boxShadow: `0 0 10px ${tab === 'deposit' ? '#34d399' : '#fb7185'}50`,
                                    }} />
                                    <span style={{
                                        fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                                        letterSpacing: '0.1em', color: 'var(--nx-text)',
                                        fontFamily: 'var(--font-display)',
                                    }}>
                                        {tab === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}
                                    </span>
                                </div>

                                {loadingAccounts ? (
                                    <div>{[...Array(3)].map((_, i) => <div key={i} className="nx-skeleton" style={{ height: 44, marginBottom: 16 }} />)}</div>
                                ) : (
                                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div>
                                            <label className="nx-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Wallet size={12} /> Select Account
                                            </label>
                                            <select
                                                className="nx-select"
                                                value={form.account_id}
                                                onChange={e => setForm({ ...form, account_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Choose an account</option>
                                                {accounts.map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.account_number} — ${parseFloat(a.balance).toLocaleString()} ({a.account_type})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="nx-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <DollarSign size={12} /> Amount (USD)
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{
                                                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                                    fontSize: 20, fontWeight: 700, color: 'var(--nx-text-dim)',
                                                    fontFamily: 'var(--font-mono)',
                                                }}>$</span>
                                                <input
                                                    type="number"
                                                    className="nx-input nx-mono"
                                                    style={{ fontSize: 22, paddingLeft: 32, fontWeight: 700, letterSpacing: '0.02em' }}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={tab === 'withdrawal' && selectedAccount ? parseFloat(selectedAccount.balance) : undefined}
                                                    value={form.amount}
                                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            {tab === 'withdrawal' && selectedAccount && (
                                                <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 6 }}>
                                                    Available: <span className="nx-mono" style={{ color: 'var(--nx-emerald)' }}>
                                                        ${parseFloat(selectedAccount.balance).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="nx-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Receipt size={12} /> Description
                                            </label>
                                            <input
                                                type="text"
                                                className="nx-input"
                                                placeholder={`My first ${tab}...`}
                                                value={form.description}
                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                            />
                                        </div>

                                        <motion.button
                                            type="submit"
                                            disabled={loading || !form.account_id || !form.amount}
                                            className="nx-btn nx-btn-primary"
                                            style={{
                                                width: '100%', padding: '0.9rem',
                                                fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
                                                fontFamily: 'var(--font-display)',
                                                marginTop: 4,
                                            }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(34,211,238,0.3)' }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {loading ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    style={{ display: 'inline-flex' }}
                                                >
                                                    <Activity size={16} />
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <Zap size={15} />
                                                    {tab === 'deposit' ? 'EXECUTE DEPOSIT' : 'EXECUTE WITHDRAWAL'}
                                                </>
                                            )}
                                        </motion.button>
                                    </form>
                                )}
                            </motion.div>

                            {/* Pipeline Preview Card */}
                            <motion.div
                                className="nx-card-static"
                                style={{ padding: '2rem' }}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div style={{
                                    fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', color: 'var(--nx-text)',
                                    fontFamily: 'var(--font-display)', marginBottom: 20,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <Layers size={14} color="var(--nx-violet)" />
                                    Transaction Pipeline Preview
                                </div>

                                {[
                                    { label: 'Request Gateway', icon: Zap, color: '#22d3ee', desc: 'HTTP request received' },
                                    { label: 'JWT Authentication', icon: Shield, color: '#a78bfa', desc: 'Token validation' },
                                    { label: 'Schema Validation', icon: CheckCircle2, color: '#34d399', desc: 'Input sanitization' },
                                    { label: 'Fraud Analysis', icon: Activity, color: '#fbbf24', desc: 'Risk scoring engine' },
                                    { label: 'Balance Engine', icon: DollarSign, color: '#22d3ee', desc: 'Atomic balance update' },
                                    { label: 'Ledger Commit', icon: Hash, color: '#fb7185', desc: 'Immutable record' },
                                    { label: 'Settlement', icon: TrendingUp, color: '#34d399', desc: 'Funds availability' },
                                    { label: 'Confirmation', icon: CheckCircle2, color: '#a78bfa', desc: 'Receipt generated' },
                                ].map((stage, i) => (
                                    <motion.div
                                        key={stage.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.06 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 0',
                                            borderBottom: i < 7 ? '1px solid var(--nx-border)' : 'none',
                                        }}
                                    >
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            background: `${stage.color}12`,
                                            border: `1px solid ${stage.color}25`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <stage.icon size={13} color={stage.color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{stage.label}</div>
                                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{stage.desc}</div>
                                        </div>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: 'var(--nx-border)',
                                        }} />
                                    </motion.div>
                                ))}

                                <div style={{
                                    marginTop: 16, padding: '10px 14px',
                                    background: 'rgba(34,211,238,0.04)',
                                    border: '1px solid rgba(34,211,238,0.1)',
                                    borderRadius: 8, fontSize: 11, color: 'var(--nx-text-dim)',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <Clock size={11} color="var(--nx-cyan)" />
                                    Estimated processing: <span className="nx-mono" style={{ color: 'var(--nx-cyan)' }}>~115ms</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    /* ─── Receipt Display ─── */
                    <motion.div
                        key="receipt"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        style={{ maxWidth: 520, margin: '0 auto' }}
                    >
                        {/* Success Header */}
                        <motion.div
                            style={{ textAlign: 'center', marginBottom: 32 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.3, damping: 10, stiffness: 200 }}
                                style={{
                                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                                    background: 'radial-gradient(circle, rgba(52,211,153,0.2), rgba(15,23,62,0.8))',
                                    border: '2px solid rgba(52,211,153,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 40px rgba(52,211,153,0.2)',
                                }}
                            >
                                <CheckCircle2 size={32} color="#34d399" />
                            </motion.div>
                            <h2 style={{
                                fontSize: 22, fontWeight: 700, color: 'var(--nx-emerald)',
                                fontFamily: 'var(--font-display)', letterSpacing: '0.08em',
                                marginBottom: 4,
                            }}>
                                TRANSACTION SUCCESSFUL
                            </h2>
                            <p style={{ fontSize: 13, color: 'var(--nx-text-muted)' }}>
                                Your {receipt.type} has been processed and confirmed
                            </p>
                        </motion.div>

                        {/* Receipt Card */}
                        <motion.div
                            className="nx-card-static"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                padding: 0, overflow: 'hidden',
                                background: 'linear-gradient(180deg, rgba(34,211,238,0.04), transparent)',
                            }}
                        >
                            {/* Receipt Header */}
                            <div style={{
                                padding: '1.5rem 2rem',
                                borderBottom: '1px dashed var(--nx-border)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                                    Amount
                                </div>
                                <div className="nx-mono" style={{
                                    fontSize: 36, fontWeight: 800,
                                    color: receipt.type === 'deposit' ? 'var(--nx-emerald)' : 'var(--nx-rose)',
                                    letterSpacing: '-0.02em',
                                }}>
                                    {receipt.type === 'deposit' ? '+' : '-'}${parseFloat(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <span className={`nx-badge ${receipt.type === 'deposit' ? 'nx-badge-green' : 'nx-badge-red'}`}
                                    style={{ textTransform: 'capitalize', marginTop: 8, display: 'inline-flex' }}>
                                    {receipt.type}
                                </span>
                            </div>

                            {/* Receipt Details */}
                            <div style={{ padding: '1.5rem 2rem' }}>
                                {[
                                    { label: 'Transaction ID', value: `#${receipt.id}`, mono: true },
                                    { label: 'Description', value: receipt.description || `User ${receipt.type}` },
                                    { label: 'Account', value: `ACC-${receipt.account_id}` },
                                    { label: 'Date', value: new Date(receipt.created_at).toLocaleString() },
                                    { label: 'Risk Level', value: receipt.risk_level, badge: true },
                                    { label: 'Status', value: 'Confirmed', badge: true, green: true },
                                ].map((row, i) => (
                                    <motion.div
                                        key={row.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + i * 0.05 }}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px 0',
                                            borderBottom: i < 5 ? '1px solid var(--nx-border)' : 'none',
                                        }}
                                    >
                                        <span style={{ fontSize: 12, color: 'var(--nx-text-dim)' }}>{row.label}</span>
                                        {row.badge ? (
                                            <span className={`nx-badge ${row.green ? 'nx-badge-green' : 'nx-badge-cyan'}`} style={{ fontSize: 10 }}>
                                                {row.value}
                                            </span>
                                        ) : (
                                            <span className={row.mono ? 'nx-mono' : ''} style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>
                                                {row.value}
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Dotted Separator */}
                            <div style={{
                                borderTop: '1px dashed var(--nx-border)',
                                position: 'relative',
                            }}>
                                <div style={{
                                    position: 'absolute', left: -8, top: -8,
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: 'var(--nx-bg-2)',
                                }} />
                                <div style={{
                                    position: 'absolute', right: -8, top: -8,
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: 'var(--nx-bg-2)',
                                }} />
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                                    NEXA · Processed in ~115ms · {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            style={{ display: 'flex', gap: 12, marginTop: 24 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <motion.button
                                onClick={() => navigate(`/transaction-lifecycle?tx=${receipt.id}`)}
                                className="nx-btn nx-btn-primary"
                                style={{
                                    flex: 1, padding: '0.85rem',
                                    fontSize: 13, fontWeight: 700,
                                    fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
                                }}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(34,211,238,0.3)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Layers size={14} />
                                VIEW TRANSACTION LIFECYCLE
                                <ArrowRight size={14} />
                            </motion.button>

                            <motion.button
                                onClick={resetForm}
                                className="nx-btn nx-btn-outline"
                                style={{ padding: '0.85rem 1.25rem', fontSize: 13 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                New Transaction
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
