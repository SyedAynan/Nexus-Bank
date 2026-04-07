import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, BarChart3, Zap, CreditCard, TrendingUp, FileCheck, Database, Lock, Eye, Globe, Sparkles, ArrowRight, Users, Activity, Layers } from 'lucide-react'

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '', prefix = '' }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let start = 0
        const step = Math.ceil(end / 50)
        const timer = setInterval(() => { start += step; if (start >= end) { setCount(end); clearInterval(timer) } else setCount(start) }, 25)
        return () => clearInterval(timer)
    }, [end])
    return <span className="nx-mono">{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ─── Floating Card Preview ─── */
function FloatingCard({ children, delay = 0, rotate = 0, x = 0, y = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotate: rotate * 0.5 }}
            animate={{ opacity: 1, y: 0, rotate }}
            transition={{ duration: 1, delay, type: 'spring', stiffness: 60 }}
            whileHover={{ y: -8, scale: 1.03, rotate: 0 }}
            style={{
                background: 'rgba(15, 23, 62, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(34,211,238,0.12)',
                borderRadius: 16,
                padding: '1.25rem',
                minWidth: 200,
                transform: `translateX(${x}px) translateY(${y}px)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(34,211,238,0.05)',
                cursor: 'default',
            }}
        >
            {children}
        </motion.div>
    )
}

/* ─── Particles ─── */
function HeroParticles() {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 30 }, (_, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: 2 + Math.random() * 3, height: 2 + Math.random() * 3,
                        borderRadius: '50%',
                        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                        background: i % 3 === 0 ? 'rgba(34,211,238,0.5)' : i % 3 === 1 ? 'rgba(167,139,250,0.4)' : 'rgba(52,211,153,0.3)',
                        boxShadow: `0 0 ${4 + Math.random() * 8}px currentColor`,
                    }}
                    animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2] }}
                    transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 3 }}
                />
            ))}
        </div>
    )
}

export default function Landing() {
    const features = [
        { icon: Lock, title: 'Enterprise Security', desc: 'Multi-factor auth, hardware key support, continuous threat monitoring with AI-powered anomaly detection.', color: '#22d3ee' },
        { icon: Sparkles, title: 'AI Analytics', desc: 'Intelligent insights that predict spending patterns, optimize savings, and provide real-time financial health scores.', color: '#a78bfa' },
        { icon: Shield, title: 'Fraud Protection', desc: 'Real-time transaction monitoring with ML-based risk scoring and instant fraud alerts across all channels.', color: '#34d399' },
        { icon: CreditCard, title: 'Instant Payments', desc: 'Sub-second transfers with real-time processing, multi-currency support, and comprehensive audit trails.', color: '#fbbf24' },
        { icon: TrendingUp, title: 'Smart Investments', desc: 'AI-powered portfolio management, automated rebalancing, and real-time market analytics at your fingertips.', color: '#3b82f6' },
        { icon: FileCheck, title: 'Auto Compliance', desc: 'Built-in KYC/AML verification, automated regulatory reporting, and continuous compliance monitoring.', color: '#fb7185' },
    ]

    return (
        <div className="animate-in" style={{ position: 'relative' }}>
            <HeroParticles />

            {/* ═══════ HERO ═══════ */}
            <section style={{ padding: '8rem 1.5rem 4rem', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    {/* Badge */}
                    <motion.span
                        className="nx-badge nx-badge-cyan"
                        style={{ marginBottom: 24, padding: '0.375rem 1rem', fontSize: 11, display: 'inline-flex', gap: 6 }}
                        animate={{ boxShadow: ['0 0 0px rgba(34,211,238,0)', '0 0 20px rgba(34,211,238,0.3)', '0 0 0px rgba(34,211,238,0)'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Zap size={12} /> INSTITUTIONAL GRADE PLATFORM
                    </motion.span>

                    {/* Headline */}
                    <h1 style={{
                        fontSize: 64, fontWeight: 800, lineHeight: 1.05,
                        color: 'var(--nx-text)',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.04em', marginBottom: 20,
                        marginTop: 16,
                    }}>
                        The Future of{' '}
                        <span className="nx-cyan" style={{ textShadow: '0 0 30px rgba(34,211,238,0.5), 0 0 60px rgba(34,211,238,0.2)' }}>
                            Banking
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: 18, color: 'var(--nx-text-muted)', maxWidth: 560,
                        margin: '0 auto 2rem', lineHeight: 1.7,
                    }}>
                        AI-Powered • Enterprise Security • Real-Time Analytics
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--nx-text-dim)', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
                        NEXUS is an AI-powered financial intelligence platform built for security, compliance, and intelligent financial management.
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="nx-btn nx-btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: 15 }}>
                            <Zap size={16} /> Get Started
                        </Link>
                        <Link to="/features" className="nx-btn nx-btn-outline" style={{ padding: '0.9rem 2.5rem', fontSize: 15 }}>
                            Explore Features <ArrowRight size={16} />
                        </Link>
                    </div>
                </motion.div>

                {/* ─── Floating Card Previews ─── */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 60, flexWrap: 'wrap' }}>
                    {/* Mini Dashboard Card */}
                    <FloatingCard delay={0.8} rotate={-3}>
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Dashboard</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-cyan)' }} className="nx-mono">$248,750.00</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--nx-text-muted)' }}>
                            <span style={{ color: 'var(--nx-emerald)' }}>↑ 12.5%</span>
                            <span>3 accounts</span>
                        </div>
                        {/* Mini sparkline */}
                        <svg width="160" height="30" style={{ marginTop: 8, opacity: 0.8 }}>
                            <defs>
                                <linearGradient id="miniSpark" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <polygon points="0,30 10,22 30,25 50,15 70,18 90,10 110,12 130,8 150,5 160,7 160,30" fill="url(#miniSpark)" />
                            <polyline points="10,22 30,25 50,15 70,18 90,10 110,12 130,8 150,5 160,7" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                        </svg>
                    </FloatingCard>

                    {/* Mini Account Card */}
                    <FloatingCard delay={1.0} rotate={0} y={-20}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CreditCard size={14} color="#a78bfa" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-text)' }}>Platinum Card</div>
                                <div className="nx-mono" style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>•••• 4242</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
                            <span className="nx-badge nx-badge-cyan" style={{ fontSize: 9, padding: '1px 6px' }}>Active</span>
                            <span className="nx-badge nx-badge-violet" style={{ fontSize: 9, padding: '1px 6px' }}>Visa</span>
                        </div>
                    </FloatingCard>

                    {/* Mini Chart Card */}
                    <FloatingCard delay={1.2} rotate={3}>
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Portfolio</div>
                        <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto' }}>
                            <circle cx="50" cy="50" r="35" stroke="rgba(34,211,238,0.2)" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="35" stroke="#22d3ee" strokeWidth="8" fill="none"
                                strokeDasharray="110 110" strokeDashoffset="0" strokeLinecap="round"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.5))' }} />
                            <circle cx="50" cy="50" r="35" stroke="#a78bfa" strokeWidth="8" fill="none"
                                strokeDasharray="55 165" strokeDashoffset="-110" strokeLinecap="round"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.5))' }} />
                            <circle cx="50" cy="50" r="35" stroke="#34d399" strokeWidth="8" fill="none"
                                strokeDasharray="40 180" strokeDashoffset="-165" strokeLinecap="round"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' }} />
                            <text x="50" y="48" textAnchor="middle" fill="var(--nx-text)" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">87%</text>
                            <text x="50" y="60" textAnchor="middle" fill="var(--nx-text-dim)" fontSize="7" fontFamily="var(--font-display)" letterSpacing="0.1em">GROWTH</text>
                        </svg>
                    </FloatingCard>
                </div>

                {/* Central Core Node */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 1.5, type: 'spring' }}
                    style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}
                >
                    <div className="nx-core-node" style={{ width: 80, height: 80 }}>
                        <Database size={28} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.6))' }} />
                    </div>
                </motion.div>
            </section>

            {/* ═══════ SOCIAL PROOF BAR ═══════ */}
            <section style={{
                maxWidth: 900, margin: '0 auto 5rem', display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '0 1.5rem',
            }}>
                {[
                    { value: 2000000, label: 'Active Users', suffix: '+', prefix: '', icon: Users },
                    { value: 99, label: 'Uptime SLA', suffix: '.99%', prefix: '', icon: Shield },
                    { value: 150, label: 'Countries', suffix: '+', prefix: '', icon: Globe },
                    { value: 500, label: 'Enterprises', suffix: '+', prefix: '', icon: Layers },
                ].map((s, i) => (
                    <motion.div
                        key={i} className="nx-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.6 + i * 0.1 }}
                        style={{ textAlign: 'center', padding: '1.75rem 1rem' }}
                    >
                        <s.icon size={18} color="#22d3ee" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--nx-cyan)' }}>
                            <AnimatedCounter end={s.value} suffix={s.suffix} prefix={s.prefix} />
                        </div>
                        <div style={{
                            fontSize: 11, color: 'var(--nx-text-muted)', marginTop: 4,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            fontFamily: 'var(--font-display)',
                        }}>{s.label}</div>
                    </motion.div>
                ))}
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section style={{ maxWidth: 1000, margin: '0 auto 5rem', padding: '0 1.5rem' }}>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 2.0 }}
                    style={{ textAlign: 'center', marginBottom: 40 }}
                >
                    <h2 style={{
                        fontSize: 28, fontWeight: 700, color: 'var(--nx-text)',
                        fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 8,
                    }}>
                        PLATFORM <span className="nx-cyan nx-text-glow-cyan">CAPABILITIES</span>
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--nx-text-muted)', maxWidth: 480, margin: '0 auto' }}>
                        Everything you need for enterprise-grade digital banking, built for scale.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i} className="nx-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 2.2 + i * 0.1 }}
                            whileHover={{ borderColor: `${f.color}40`, scale: 1.02 }}
                            style={{ padding: '2rem' }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: `${f.color}12`, border: `1px solid ${f.color}25`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16,
                            }}>
                                <f.icon size={22} color={f.color} />
                            </div>
                            <h3 style={{
                                fontSize: 15, fontWeight: 600, color: 'var(--nx-text)', marginBottom: 8,
                                fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
                            }}>{f.title}</h3>
                            <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════ CTA ═══════ */}
            <section style={{ maxWidth: 700, margin: '0 auto 6rem', textAlign: 'center', padding: '0 1.5rem' }}>
                <motion.div
                    className="nx-card-glow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.8 }}
                    style={{ padding: '3rem 2.5rem' }}
                >
                    <h2 style={{
                        fontSize: 26, fontWeight: 700, marginBottom: 10, color: 'var(--nx-text)',
                        fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
                    }}>READY TO BEGIN?</h2>
                    <p style={{ fontSize: 14, color: 'var(--nx-text-muted)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                        Join thousands of businesses banking with NEXUS. Start your journey today.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="nx-btn nx-btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: 14 }}>
                            <Zap size={15} /> Create Free Account
                        </Link>
                        <Link to="/login" className="nx-btn nx-btn-outline" style={{ padding: '0.85rem 2rem', fontSize: 14 }}>
                            Sign In <ArrowRight size={14} />
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
    )
}
