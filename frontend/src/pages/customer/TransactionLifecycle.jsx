import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import {
    Layers, CheckCircle2, Clock, Zap, Shield, Hash,
    Activity, DollarSign, TrendingUp, ArrowRight,
    Database, Server, Globe, Lock, FileCheck, Receipt,
    ChevronRight, ArrowLeft, Code2
} from 'lucide-react'

/* ─── Stage Icon Map ─── */
const stageIcons = {
    'Request Initiated': Zap,
    'Authentication': Shield,
    'Input Validation': FileCheck,
    'Fraud Analysis': Activity,
    'Balance Update': DollarSign,
    'Ledger Recording': Database,
    'Settlement': TrendingUp,
    'Confirmation': CheckCircle2,
}

const stageColors = {
    'Request Initiated': '#22d3ee',
    'Authentication': '#a78bfa',
    'Input Validation': '#34d399',
    'Fraud Analysis': '#fbbf24',
    'Balance Update': '#22d3ee',
    'Ledger Recording': '#fb7185',
    'Settlement': '#34d399',
    'Confirmation': '#a78bfa',
}

/* ─── Architecture Layer Card ─── */
function ArchLayerCard({ name, index, total }) {
    const layerIcons = {
        'React Frontend': Globe,
        'API Gateway (FastAPI)': Server,
        'Security Middleware (JWT + Rate Limiter)': Lock,
        'Schema Validation (Pydantic)': FileCheck,
        'AI Fraud Engine': Activity,
        'Banking Service (DSA-backed)': Code2,
        'Database (SQLAlchemy ORM)': Database,
        'Settlement Engine': TrendingUp,
        'Notification Service': Receipt,
    }
    const Icon = layerIcons[name] || Layers
    const colors = ['#22d3ee', '#a78bfa', '#fb7185', '#34d399', '#fbbf24', '#818cf8', '#f472b6', '#2dd4bf', '#22d3ee']
    const color = colors[index % colors.length]

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.08 }}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: `${color}06`,
                border: `1px solid ${color}15`,
                borderRadius: 10,
            }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${color}12`,
                border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={14} color={color} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{name}</div>
                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>Layer {index + 1} of {total}</div>
            </div>
            {index < total - 1 && <ChevronRight size={12} color="var(--nx-text-dim)" />}
        </motion.div>
    )
}

export default function TransactionLifecycle() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeStage, setActiveStage] = useState(null)
    const txId = searchParams.get('tx')

    useEffect(() => {
        if (!txId) {
            setLoading(false)
            setError('No transaction ID provided. Please make a transaction first.')
            return
        }
        api.get(`/banking/transaction-lifecycle/${txId}`)
            .then(r => { setData(r.data); setLoading(false) })
            .catch(err => {
                setError(err.response?.data?.detail || 'Failed to load transaction lifecycle')
                setLoading(false)
            })
    }, [txId])

    if (loading) {
        return (
            <div className="animate-in" style={{ maxWidth: 900, margin: '0 auto' }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="nx-skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 12 }} />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="animate-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <Activity size={48} color="var(--nx-text-dim)" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <h2 style={{ fontSize: 18, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                    {error}
                </h2>
                <motion.button
                    className="nx-btn nx-btn-primary"
                    onClick={() => navigate('/first-transaction')}
                    style={{ marginTop: 20 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Zap size={14} /> Make a Transaction
                </motion.button>
            </div>
        )
    }

    const { transaction: tx, lifecycle, total_processing_ms, architecture_layers } = data

    return (
        <div className="animate-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
            {/* Back Button */}
            <motion.button
                onClick={() => navigate('/first-transaction')}
                className="nx-btn nx-btn-outline"
                style={{ marginBottom: 20, fontSize: 12 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <ArrowLeft size={13} /> Back to Transactions
            </motion.button>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'radial-gradient(circle, rgba(139,92,246,0.2), rgba(15,23,62,0.8))',
                            border: '1px solid rgba(139,92,246,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(139,92,246,0.15)',
                        }}
                    >
                        <Layers size={20} color="#a78bfa" />
                    </motion.div>
                    <div>
                        <h1 style={{
                            fontSize: 22, fontWeight: 700, color: 'var(--nx-text)',
                            fontFamily: 'var(--font-display)', letterSpacing: '0.08em', margin: 0,
                        }}>
                            TRANSACTION LIFECYCLE
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', margin: 0 }}>
                            How Transaction #{tx.id} was processed through the NEXA architecture
                        </p>
                    </div>
                </div>
            </div>

            {/* Transaction Summary Bar */}
            <motion.div
                className="nx-card-static"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '1.25rem 1.5rem', marginBottom: 24,
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16,
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.04), rgba(139,92,246,0.04))',
                }}
            >
                {[
                    { label: 'TX ID', value: `#${tx.id}`, color: 'var(--nx-cyan)' },
                    { label: 'Type', value: tx.type.charAt(0).toUpperCase() + tx.type.slice(1), color: tx.type === 'deposit' ? 'var(--nx-emerald)' : 'var(--nx-rose)' },
                    { label: 'Amount', value: `$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: tx.type === 'deposit' ? 'var(--nx-emerald)' : 'var(--nx-rose)' },
                    { label: 'Processing', value: `${total_processing_ms}ms`, color: 'var(--nx-cyan)' },
                    { label: 'Risk', value: tx.risk_level.toUpperCase(), color: tx.risk_level === 'low' ? 'var(--nx-emerald)' : tx.risk_level === 'medium' ? '#fbbf24' : 'var(--nx-rose)' },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                            {item.label}
                        </div>
                        <div className="nx-mono" style={{ fontSize: 16, fontWeight: 700, color: item.color }}>
                            {item.value}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                {/* ─── Lifecycle Pipeline ─── */}
                <div>
                    <div style={{
                        fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--nx-text)',
                        fontFamily: 'var(--font-display)', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#34d399',
                            boxShadow: '0 0 10px #34d39960',
                        }} />
                        Processing Pipeline — {lifecycle.length} Stages
                    </div>

                    {lifecycle.map((stage, i) => {
                        const Icon = stageIcons[stage.stage] || CheckCircle2
                        const color = stageColors[stage.stage] || '#22d3ee'
                        const isActive = activeStage === i

                        return (
                            <motion.div
                                key={stage.stage}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1, type: 'spring', damping: 20 }}
                                onClick={() => setActiveStage(isActive ? null : i)}
                                style={{ cursor: 'pointer', position: 'relative' }}
                            >
                                {/* Connecting Line */}
                                {i < lifecycle.length - 1 && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: '100%' }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                                        style={{
                                            position: 'absolute', left: 19, top: 44,
                                            width: 2, background: `linear-gradient(180deg, ${color}60, ${color}10)`,
                                            zIndex: 0,
                                        }}
                                    />
                                )}

                                <motion.div
                                    className="nx-card-static"
                                    whileHover={{ scale: 1.01, borderColor: `${color}40` }}
                                    style={{
                                        padding: '16px 20px', marginBottom: 8,
                                        display: 'flex', alignItems: 'flex-start', gap: 16,
                                        position: 'relative', zIndex: 1,
                                        background: isActive ? `${color}08` : undefined,
                                        borderColor: isActive ? `${color}30` : undefined,
                                        transition: 'background 0.2s, border-color 0.2s',
                                    }}
                                >
                                    {/* Stage Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                                        style={{
                                            width: 40, height: 40, borderRadius: 12,
                                            background: `${color}15`,
                                            border: `1.5px solid ${color}40`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: `0 0 15px ${color}15`,
                                        }}
                                    >
                                        <Icon size={18} color={color} />
                                    </motion.div>

                                    {/* Stage Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)' }}>
                                                    {stage.stage}
                                                </span>
                                                <span className="nx-badge nx-badge-green" style={{ fontSize: 9 }}>
                                                    {stage.status}
                                                </span>
                                            </div>
                                            <span className="nx-mono" style={{ fontSize: 11, color: color, fontWeight: 600 }}>
                                                {stage.duration_ms}ms
                                            </span>
                                        </div>

                                        <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                                            {stage.description}
                                        </p>

                                        {/* Expanded Details */}
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--nx-border)' }}
                                            >
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    <div>
                                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                                                            Architecture Layer
                                                        </div>
                                                        <div style={{ fontSize: 12, color: color, fontWeight: 600 }}>
                                                            {stage.layer}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                                                            DSA Structure
                                                        </div>
                                                        <div className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text)', fontWeight: 500 }}>
                                                            {stage.dsa}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                                                            Timestamp
                                                        </div>
                                                        <div className="nx-mono" style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>
                                                            {new Date(stage.timestamp).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                                                            Duration
                                                        </div>
                                                        <div className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-emerald)' }}>
                                                            {stage.duration_ms}ms
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Expand Indicator */}
                                    <motion.div
                                        animate={{ rotate: isActive ? 90 : 0 }}
                                        style={{ flexShrink: 0, marginTop: 4 }}
                                    >
                                        <ChevronRight size={14} color="var(--nx-text-dim)" />
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )
                    })}

                    {/* Total Time Bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        style={{
                            marginTop: 16, padding: '14px 20px',
                            background: 'linear-gradient(135deg, rgba(52,211,153,0.06), rgba(34,211,238,0.06))',
                            border: '1px solid rgba(52,211,153,0.15)',
                            borderRadius: 12,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={14} color="#34d399" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>
                                Total Processing Time
                            </span>
                        </div>
                        <span className="nx-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--nx-emerald)' }}>
                            {total_processing_ms}ms
                        </span>
                    </motion.div>
                </div>

                {/* ─── Architecture Distribution Sidebar ─── */}
                <div>
                    {/* Architecture Layers */}
                    <div style={{
                        fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--nx-text)',
                        fontFamily: 'var(--font-display)', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Server size={14} color="var(--nx-violet)" />
                        Architecture Distribution
                    </div>

                    <motion.div
                        className="nx-card-static"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{ padding: '16px', marginBottom: 20 }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {architecture_layers.map((layer, i) => (
                                <ArchLayerCard key={layer} name={layer} index={i} total={architecture_layers.length} />
                            ))}
                        </div>
                    </motion.div>

                    {/* Build Journey */}
                    <div style={{
                        fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--nx-text)',
                        fontFamily: 'var(--font-display)', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Code2 size={14} color="var(--nx-cyan)" />
                        Built From Scratch
                    </div>

                    <motion.div
                        className="nx-card-static"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        style={{ padding: '20px' }}
                    >
                        {[
                            { phase: 'Foundation', desc: 'FastAPI + SQLAlchemy + React/Vite', color: '#22d3ee', pct: 100 },
                            { phase: 'Data Models', desc: 'User, Account, Transaction, Loan', color: '#a78bfa', pct: 100 },
                            { phase: 'DSA Engine', desc: 'LinkedList, BST, Hash, Queue, Stack, Graph, Heap', color: '#34d399', pct: 100 },
                            { phase: 'Banking API', desc: 'Deposit, Withdraw, Transfer, Loans', color: '#fbbf24', pct: 100 },
                            { phase: 'Security', desc: 'JWT Auth, MFA, Rate Limiter, CORS', color: '#fb7185', pct: 100 },
                            { phase: 'AI Engines', desc: 'Fraud Detection, Risk Scoring, AML', color: '#818cf8', pct: 100 },
                            { phase: 'Frontend UI', desc: 'Dashboard, Accounts, Transactions, Admin', color: '#2dd4bf', pct: 100 },
                            { phase: 'This Feature', desc: 'First Transaction + Lifecycle Display', color: '#22d3ee', pct: 100 },
                        ].map((item, i) => (
                            <motion.div
                                key={item.phase}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 + i * 0.06 }}
                                style={{ marginBottom: i < 7 ? 14 : 0 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{item.phase}</span>
                                    <span className="nx-mono" style={{ fontSize: 10, color: item.color }}>{item.pct}%</span>
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginBottom: 6 }}>{item.desc}</div>
                                <div style={{
                                    height: 4, borderRadius: 2,
                                    background: 'var(--nx-border)',
                                    overflow: 'hidden',
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.pct}%` }}
                                        transition={{ delay: 1.0 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                                        style={{
                                            height: '100%', borderRadius: 2,
                                            background: `linear-gradient(90deg, ${item.color}80, ${item.color})`,
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.6 }}
                            style={{
                                marginTop: 20, padding: '12px 16px',
                                background: 'rgba(34,211,238,0.05)',
                                border: '1px solid rgba(34,211,238,0.12)',
                                borderRadius: 8, textAlign: 'center',
                            }}
                        >
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 4 }}>
                                PROJECT STATUS
                            </div>
                            <div className="nx-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-emerald)' }}>
                                ✓ PRODUCTION READY
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
