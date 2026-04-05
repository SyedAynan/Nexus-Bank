import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import { UserPlus, User, Mail, Lock, KeyRound, Check, Eye, EyeOff } from 'lucide-react'

/* ─── SVG Brand Icons ─── */
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

const AppleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.82 4.45-3.74 4.25z" />
    </svg>
)

const MicrosoftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
)

/* ─── Password Strength ─── */
function getPasswordStrength(pw) {
    if (!pw) return { level: '', score: 0 }
    const checks = {
        length: pw.length >= 8,
        upper: /[A-Z]/.test(pw),
        number: /\d/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
    }
    const score = Object.values(checks).filter(Boolean).length
    const level = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'strong' : 'excellent'
    return { level, score, checks }
}

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const navigate = useNavigate()

    const strength = useMemo(() => getPasswordStrength(form.password), [form.password])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (!agreed) return setError('Please accept the Terms & Conditions')
        if (form.password !== form.confirm) return setError('Passwords do not match')
        if (strength.score < 2) return setError('Password is too weak')
        setLoading(true)
        try {
            await api.post('/auth/register', { username: form.username, email: form.email, password: form.password })
            navigate('/login')
        } catch (err) { setError(err.response?.data?.detail || 'Registration failed') }
        finally { setLoading(false) }
    }

    const handleSocialSignup = (provider) => {
        setError('')
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setError(`${provider} signup is available in production. Use the form below for demo.`)
        }, 1200)
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
            <div className="nx-nebula-bg" />
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                {Array.from({ length: 15 }, (_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute', width: 2, height: 2, borderRadius: '50%',
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            background: i % 2 === 0 ? 'rgba(52,211,153,0.5)' : 'rgba(167,139,250,0.4)',
                            boxShadow: `0 0 6px ${i % 2 === 0 ? 'rgba(52,211,153,0.5)' : 'rgba(167,139,250,0.4)'}`,
                        }}
                        animate={{ y: [0, -18, 0], opacity: [0.2, 0.7, 0.2] }}
                        transition={{ duration: 5 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
                    />
                ))}
            </div>

            <motion.div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="glow-breathe-violet"
                        style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'radial-gradient(circle, rgba(52,211,153,0.2), rgba(15,23,62,0.8))',
                            border: '1px solid rgba(52,211,153,0.3)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                        }}
                    >
                        <UserPlus size={22} color="#34d399" style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' }} />
                    </motion.div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                        JOIN <span className="nx-cyan nx-text-glow-cyan">NEXA</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 5 }}>Create your account</p>
                </div>

                <div className="nx-card-static" style={{ padding: '1.75rem', boxShadow: '0 0 40px rgba(0,0,0,0.3), 0 0 15px rgba(52,211,153,0.05)' }}>
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="nx-alert nx-alert-error" style={{ marginBottom: 16 }}>⚠ {error}</motion.div>}

                    {/* Social Signup */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        <motion.button className="nx-social-btn nx-social-btn-google" onClick={() => handleSocialSignup('Google')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={loading}>
                            <GoogleIcon /> Sign up with Google
                        </motion.button>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <motion.button className="nx-social-btn nx-social-btn-apple" onClick={() => handleSocialSignup('Apple')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={loading}>
                                <AppleIcon /> Apple
                            </motion.button>
                            <motion.button className="nx-social-btn nx-social-btn-microsoft" onClick={() => handleSocialSignup('Microsoft')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={loading}>
                                <MicrosoftIcon /> Microsoft
                            </motion.button>
                        </div>
                    </div>

                    <div className="nx-divider" style={{ marginBottom: 20 }}>or create with email</div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="nx-label"><User size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Username</label>
                            <input type="text" id="register-username" className="nx-input" placeholder="Choose a username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                        </div>
                        <div>
                            <label className="nx-label"><Mail size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Email</label>
                            <input type="email" id="register-email" className="nx-input" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                            <label className="nx-label"><Lock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'} id="register-password" className="nx-input"
                                    placeholder="Create a strong password" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                    {showPw ? <EyeOff size={16} color="var(--nx-text-dim)" /> : <Eye size={16} color="var(--nx-text-dim)" />}
                                </button>
                            </div>

                            {/* Password Strength Meter */}
                            {form.password && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 10 }}>
                                    <div className="nx-strength-meter">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className={`nx-strength-label ${strength.level}`}>
                                                {strength.level || '—'}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{strength.score}/4</span>
                                        </div>
                                        <div className="nx-strength-bar">
                                            <div className={`nx-strength-fill ${strength.level}`} />
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                                            {[
                                                ['8+ characters', strength.checks?.length],
                                                ['Uppercase', strength.checks?.upper],
                                                ['Number', strength.checks?.number],
                                                ['Special char', strength.checks?.special],
                                            ].map(([label, met]) => (
                                                <span key={label} className={`nx-req${met ? ' met' : ''}`}>
                                                    {met ? <Check size={10} /> : <span style={{ width: 10, textAlign: 'center' }}>○</span>}
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        <div>
                            <label className="nx-label"><KeyRound size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Confirm Password</label>
                            <input type="password" id="register-confirm" className="nx-input" placeholder="Confirm password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                        </div>

                        {/* Terms & Conditions */}
                        <label className="nx-checkbox-wrap" onClick={(e) => { e.preventDefault(); setAgreed(!agreed) }}>
                            <div className={`nx-checkbox${agreed ? ' checked' : ''}`}>
                                {agreed && <Check size={12} color="#22d3ee" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: 12 }}>
                                I agree to the <span style={{ color: 'var(--nx-cyan)', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: 'var(--nx-cyan)', cursor: 'pointer' }}>Privacy Policy</span>
                            </span>
                        </label>

                        <motion.button
                            type="submit" id="register-submit" disabled={loading}
                            className="nx-btn nx-btn-primary"
                            style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, #34d399, #10b981)' }}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--nx-border)', textAlign: 'center', fontSize: 13, color: 'var(--nx-text-muted)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--nx-cyan)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
