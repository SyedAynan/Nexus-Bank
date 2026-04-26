import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Lock, Unlock, Plus, Eye, EyeOff, Shield, Snowflake, AlertTriangle, Copy, Check, Zap, ShoppingBag, Globe, Wifi, DollarSign, Gift, TrendingUp, Star } from 'lucide-react'

/* ═══════ Cards Data ═══════ */
const INITIAL_CARDS = [
    {
        id: 1, name: 'NEXUS Platinum', type: 'physical', tier: 'platinum',
        number: '4242 8521 7634 9012', expiry: '12/28', cvv: '847', holder: 'NEXUS USER',
        balance: 24580.42, limit: 50000, frozen: false, brand: 'VISA',
        gradient: 'linear-gradient(135deg, #1a1a3e 0%, #0a0f2e 30%, #141e46 60%, #22d3ee15 100%)',
        accentColor: '#22d3ee',
        recentTx: [
            { name: 'Apple Store', amount: -1299, date: 'Today' },
            { name: 'Whole Foods', amount: -87.45, date: 'Today' },
            { name: 'Uber', amount: -24.50, date: 'Yesterday' },
        ]
    },
    {
        id: 2, name: 'NEXUS Gold', type: 'physical', tier: 'gold',
        number: '5412 3301 8846 2290', expiry: '09/27', cvv: '512', holder: 'NEXUS USER',
        balance: 8420.00, limit: 25000, frozen: false, brand: 'MASTERCARD',
        gradient: 'linear-gradient(135deg, #2a1a00 0%, #1a1200 30%, #3a2800 60%, #fbbf2415 100%)',
        accentColor: '#fbbf24',
        recentTx: [
            { name: 'Netflix', amount: -22.99, date: 'Today' },
            { name: 'Starbucks', amount: -6.50, date: 'Yesterday' },
        ]
    },
    {
        id: 3, name: 'Virtual Card', type: 'virtual', tier: 'standard',
        number: '4000 1234 5678 0001', expiry: '06/26', cvv: '331', holder: 'NEXUS USER',
        balance: 500.00, limit: 2000, frozen: false, brand: 'VISA',
        gradient: 'linear-gradient(135deg, #0f0f2e 0%, #1a0a2e 30%, #2a1a46 60%, #a78bfa15 100%)',
        accentColor: '#a78bfa',
        recentTx: [
            { name: 'Amazon', amount: -149.99, date: 'Today' },
        ]
    },
]

const LIMIT_CATEGORIES = [
    { name: 'Online Shopping', icon: ShoppingBag, limit: 2000, spent: 1449, color: '#a78bfa' },
    { name: 'International', icon: Globe, limit: 5000, spent: 2592, color: '#22d3ee' },
    { name: 'Contactless', icon: Wifi, limit: 500, spent: 187, color: '#34d399' },
    { name: 'Daily Max', icon: DollarSign, limit: 3000, spent: 1411, color: '#fbbf24' },
]

const REWARDS_DATA = [
    { label: 'Cash Back Earned', value: '$342.50', color: '#34d399', icon: DollarSign },
    { label: 'Points Balance', value: '24,850', color: '#a78bfa', icon: Star },
    { label: 'Tier Status', value: 'Platinum', color: '#22d3ee', icon: Shield },
    { label: 'Referral Bonus', value: '$75.00', color: '#fbbf24', icon: Gift },
]

/* ═══════ 3D Card Component ═══════ */
function Card3D({ card, showDetails, onToggleDetails, onToggleFreeze }) {
    const [flipped, setFlipped] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyNumber = () => {
        navigator.clipboard?.writeText(card.number.replace(/\s/g, ''))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{ perspective: 1000, marginBottom: 16 }}>
            <motion.div
                style={{
                    width: '100%', maxWidth: 380, height: 220, position: 'relative',
                    transformStyle: 'preserve-3d', cursor: 'pointer', margin: '0 auto',
                }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                onClick={() => setFlipped(!flipped)}
                whileHover={{ scale: 1.03 }}
            >
                {/* Front */}
                <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: card.gradient, borderRadius: 16,
                    border: `1px solid ${card.accentColor}25`,
                    padding: '24px 28px', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', overflow: 'hidden',
                    boxShadow: `0 15px 40px rgba(0,0,0,0.5), 0 0 30px ${card.accentColor}10`,
                }}>
                    {/* Holographic shimmer overlay */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)',
                        backgroundSize: '200% 100%', animation: 'shimmer 3s infinite',
                    }} />
                    {card.frozen && (
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: 16,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <Snowflake size={32} color="#22d3ee" />
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', marginTop: 8, fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>FROZEN</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: card.accentColor, fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>{card.name.toUpperCase()}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{card.type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}</div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: card.accentColor, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>NX</span>
                    </div>

                    {/* Chip */}
                    <div style={{ width: 42, height: 30, borderRadius: 6, background: 'linear-gradient(135deg, #c8a961, #e8d48b, #c8a961)', opacity: 0.8, marginTop: 4 }} />

                    <div>
                        <div className="nx-mono" style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2em', marginBottom: 12 }}>
                            {showDetails ? card.number : '•••• •••• •••• ' + card.number.slice(-4)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                            <div>
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card Holder</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>{card.holder}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expires</div>
                                <div className="nx-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{card.expiry}</div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-display)' }}>{card.brand}</div>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)', background: card.gradient, borderRadius: 16,
                    border: `1px solid ${card.accentColor}25`, overflow: 'hidden',
                    boxShadow: `0 15px 40px rgba(0,0,0,0.5), 0 0 30px ${card.accentColor}10`,
                }}>
                    {/* Magnetic strip */}
                    <div style={{ width: '100%', height: 40, background: 'rgba(0,0,0,0.5)', marginTop: 24 }} />
                    <div style={{ padding: '16px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ flex: 1, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                                <span className="nx-mono" style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                                    {showDetails ? card.cvv : '•••'}
                                </span>
                            </div>
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginTop: 8 }}>
                            This card is property of NEXUS Bank. Unauthorized use is prohibited.
                            For support: +1 (800) NEXUS-AI
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

/* ═══════ Main Cards Page ═══════ */
export default function Cards() {
    const [cards, setCards] = useState(INITIAL_CARDS)
    const [selectedCard, setSelectedCard] = useState(0)
    const [showDetails, setShowDetails] = useState(false)

    const card = cards[selectedCard]
    const utilization = card ? ((card.balance / card.limit) * 100).toFixed(1) : 0

    const toggleFreeze = () => {
        setCards(cards.map((c, i) => i === selectedCard ? { ...c, frozen: !c.frozen } : c))
    }

    const createVirtualCard = () => {
        const newCard = {
            id: Date.now(), name: `Virtual Card #${cards.filter(c => c.type === 'virtual').length + 2}`,
            type: 'virtual', tier: 'standard',
            number: `4000 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            expiry: '12/26', cvv: String(Math.floor(100 + Math.random() * 900)),
            holder: 'NEXUS USER', balance: 0, limit: 1000, frozen: false, brand: 'VISA',
            gradient: 'linear-gradient(135deg, #0a1628 0%, #0f1a3e 30%, #1a2856 60%, #34d39915 100%)',
            accentColor: '#34d399', recentTx: [],
        }
        setCards([...cards, newCard])
        setSelectedCard(cards.length)
    }

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CreditCard size={26} color="#22d3ee" /> CARD MANAGER
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        Manage physical & virtual cards — tap card to flip
                    </p>
                </div>
                <motion.button className="nx-btn nx-btn-primary" onClick={createVirtualCard} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Plus size={15} /> New Virtual Card
                </motion.button>
            </motion.div>

            {/* Rewards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                {REWARDS_DATA.map((r, i) => (
                    <motion.div key={i} className="nx-kpi cyan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>{r.label}</div>
                            <r.icon size={14} color={r.color} style={{ opacity: 0.6 }} />
                        </div>
                        <div className="nx-mono" style={{ fontSize: 18, fontWeight: 700, color: r.color, marginTop: 4 }}>{r.value}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* Left: Card + Controls */}
                <div>
                    {/* Card Selector Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', padding: '0 0 4px' }}>
                        {cards.map((c, i) => (
                            <motion.button key={c.id} onClick={() => setSelectedCard(i)}
                                className={`nx-tab ${selectedCard === i ? 'active' : ''}`}
                                style={{
                                    whiteSpace: 'nowrap', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 14px', borderRadius: 8,
                                    background: selectedCard === i ? `${c.accentColor}12` : 'rgba(10,15,46,0.4)',
                                    border: `1px solid ${selectedCard === i ? c.accentColor + '30' : 'var(--nx-border)'}`,
                                    color: selectedCard === i ? c.accentColor : 'var(--nx-text-muted)',
                                    cursor: 'pointer',
                                }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <CreditCard size={12} /> {c.name}
                                {c.frozen && <Snowflake size={10} />}
                            </motion.button>
                        ))}
                    </div>

                    {/* 3D Card */}
                    {card && <Card3D card={card} showDetails={showDetails} onToggleDetails={() => setShowDetails(!showDetails)} onToggleFreeze={toggleFreeze} />}

                    {/* Card Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 11 }} onClick={() => setShowDetails(!showDetails)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            {showDetails ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showDetails ? 'Hide Details' : 'Show Details'}
                        </motion.button>
                        <motion.button className={`nx-btn ${card?.frozen ? 'nx-btn-primary' : 'nx-btn-outline'}`}
                            style={{ fontSize: 11, borderColor: card?.frozen ? undefined : 'rgba(251,191,36,0.3)', color: card?.frozen ? undefined : 'var(--nx-amber)' }}
                            onClick={toggleFreeze} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            {card?.frozen ? <Unlock size={13} /> : <Lock size={13} />}
                            {card?.frozen ? 'Unfreeze' : 'Freeze Card'}
                        </motion.button>
                        <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 11, borderColor: 'rgba(251,113,133,0.3)', color: 'var(--nx-rose)' }}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <AlertTriangle size={13} /> Report Stolen
                        </motion.button>
                    </div>

                    {/* Card Balance Info */}
                    {card && (
                        <motion.div className="nx-card-static" style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>CARD BALANCE</h3>
                                <span className={`nx-badge ${card.frozen ? 'nx-badge-cyan' : 'nx-badge-green'}`}>{card.frozen ? 'Frozen' : 'Active'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase' }}>Balance</div>
                                    <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: card.accentColor }}>${card.balance.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase' }}>Limit</div>
                                    <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text-muted)' }}>${card.limit.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase' }}>Utilization</div>
                                    <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: utilization > 75 ? 'var(--nx-rose)' : utilization > 50 ? 'var(--nx-amber)' : 'var(--nx-emerald)' }}>{utilization}%</div>
                                </div>
                            </div>
                            <div className="nx-progress" style={{ height: 6 }}>
                                <motion.div className="nx-progress-bar"
                                    style={{ background: utilization > 75 ? '#fb7185' : utilization > 50 ? '#fbbf24' : '#34d399', boxShadow: `0 0 8px ${utilization > 75 ? '#fb718560' : '#34d39960'}` }}
                                    initial={{ width: 0 }} animate={{ width: `${Math.min(utilization, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }} />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right: Spending Limits + Recent Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Spending Limits */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 16 }}>
                            <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} color="#22d3ee" />
                            SPENDING LIMITS
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {LIMIT_CATEGORIES.map((cat, i) => {
                                const pct = (cat.spent / cat.limit) * 100
                                const Icon = cat.icon
                                return (
                                    <div key={cat.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Icon size={12} color={cat.color} />
                                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text)' }}>{cat.name}</span>
                                            </div>
                                            <span className="nx-mono" style={{ fontSize: 10, color: 'var(--nx-text-muted)' }}>
                                                ${cat.spent.toLocaleString()} / ${cat.limit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="nx-progress" style={{ height: 4 }}>
                                            <motion.div className="nx-progress-bar"
                                                style={{ background: pct > 80 ? '#fb7185' : cat.color, boxShadow: `0 0 4px ${cat.color}40` }}
                                                initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                                                transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 14 }}>
                            CARD ACTIVITY
                        </h3>
                        {card && card.recentTx.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {card.recentTx.map((tx, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(10,15,46,0.4)', border: '1px solid var(--nx-border)' }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-text)' }}>{tx.name}</div>
                                            <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{tx.date}</div>
                                        </div>
                                        <span className="nx-mono" style={{ fontSize: 13, fontWeight: 600, color: tx.amount < 0 ? 'var(--nx-rose)' : 'var(--nx-emerald)' }}>
                                            {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: 12, color: 'var(--nx-text-dim)' }}>
                                No recent activity
                            </div>
                        )}
                    </motion.div>

                    {/* Security Info */}
                    <motion.div className="nx-ai-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Zap size={12} color="#a78bfa" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>SECURITY</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>
                            All card data is encrypted with <strong style={{ color: '#22d3ee' }}>AES-256</strong>.
                            Virtual cards auto-expire and can be frozen instantly.
                            3D Secure authentication is enabled for all online transactions.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
