import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldCheck, KeyRound, Fingerprint, Check } from 'lucide-react'

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

/* ─── OTP Input Group ─── */
function OtpInputGroup({ value, onChange }) {
    const refs = useRef([])
    const digits = value.padEnd(6, '').split('').slice(0, 6)

    const handleChange = (i, val) => {
        if (!/^\d*$/.test(val)) return
        const arr = [...digits]
        arr[i] = val.slice(-1)
        onChange(arr.join(''))
        if (val && i < 5) refs.current[i + 1]?.focus()
    }

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            refs.current[i - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        onChange(pasted)
        const focusIdx = Math.min(pasted.length, 5)
        refs.current[focusIdx]?.focus()
    }

    return (
        <div className="nx-otp-group">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`nx-otp-input${d ? ' filled' : ''}`}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    autoFocus={i === 0}
                />
            ))}
        </div>
    )
}

export default function Login() {
    const [step, setStep] = useState('credentials')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const { login, verifyOtp } = useAuth()
    const navigate = useNavigate()

    const handleCredentials = async (e) => {
        e.preventDefault(); setLoading(true); setError('')
        try {
            const result = await login(username, password)
            if (result.mfa_required) setStep('otp')
            else navigate('/dashboard')
        } catch (err) { setError(err.response?.data?.detail || 'Invalid credentials') }
        finally { setLoading(false) }
    }

    const handleOtp = async (e) => {
        e.preventDefault(); setLoading(true); setError('')
        try { await verifyOtp(username, otp); navigate('/dashboard') }
        catch (err) { setError(err.response?.data?.detail || 'Invalid verification code') }
        finally { setLoading(false) }
    }

    const handleSocialLogin = (provider) => {
        setError('')
        setLoading(true)
        // Simulated social auth — shows loading then demo message
        setTimeout(() => {
            setLoading(false)
            setError(`${provider} authentication is available in production. Use credentials for demo.`)
        }, 1200)
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
            {/* Nebula Background */}
            <div className="nx-nebula-bg" />

            {/* Floating particles */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                {Array.from({ length: 20 }, (_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: 2 + Math.random() * 2, height: 2 + Math.random() * 2,
                            borderRadius: '50%',
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            background: i % 2 === 0 ? 'rgba(34,211,238,0.5)' : 'rgba(167,139,250,0.4)',
                            boxShadow: `0 0 ${4 + Math.random() * 6}px ${i % 2 === 0 ? 'rgba(34,211,238,0.5)' : 'rgba(167,139,250,0.4)'}`,
                        }}
                        animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
                    />
                ))}
            </div>

            <motion.div
                style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <motion.div
                        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34,211,238,0.4)' }}
                        className="glow-breathe"
                        style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'radial-gradient(circle, rgba(34,211,238,0.25), rgba(15,23,62,0.8))',
                            border: '1px solid rgba(34,211,238,0.4)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 14,
                        }}
                    >
                        <span style={{ color: '#22d3ee', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)' }}>NX</span>
                    </motion.div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                        WELCOME TO <span className="nx-cyan nx-text-glow-cyan">NEXUS</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 5 }}>Sign in to your account</p>
                </div>

                <div className="nx-card-static" style={{ padding: '1.75rem', boxShadow: '0 0 40px rgba(0,0,0,0.3), 0 0 15px rgba(34,211,238,0.05)' }}>
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="nx-alert nx-alert-error" style={{ marginBottom: 16 }}
                            >⚠ {error}</motion.div>
                        )}
                    </AnimatePresence>

                    {step === 'credentials' ? (
                        <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {/* Social Auth Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                <motion.button
                                    className="nx-social-btn nx-social-btn-google"
                                    onClick={() => handleSocialLogin('Google')}
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    disabled={loading}
                                >
                                    <GoogleIcon /> Continue with Google
                                </motion.button>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <motion.button
                                        className="nx-social-btn nx-social-btn-apple"
                                        onClick={() => handleSocialLogin('Apple')}
                                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        disabled={loading}
                                    >
                                        <AppleIcon /> Apple
                                    </motion.button>
                                    <motion.button
                                        className="nx-social-btn nx-social-btn-microsoft"
                                        onClick={() => handleSocialLogin('Microsoft')}
                                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        disabled={loading}
                                    >
                                        <MicrosoftIcon /> Microsoft
                                    </motion.button>
                                </div>
                            </div>

                            {/* Passkey Button */}
                            <motion.button
                                className="nx-passkey-btn"
                                onClick={() => handleSocialLogin('Passkey')}
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                disabled={loading}
                                style={{ marginBottom: 20 }}
                            >
                                <Fingerprint size={18} /> Sign in with Passkey
                            </motion.button>

                            {/* Divider */}
                            <div className="nx-divider" style={{ marginBottom: 20 }}>or sign in with credentials</div>

                            {/* Credentials Form */}
                            <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="nx-label"><Lock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Username</label>
                                    <input type="text" id="login-username" className="nx-input" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
                                </div>
                                <div>
                                    <label className="nx-label"><KeyRound size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Password</label>
                                    <input type="password" id="login-password" className="nx-input" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>

                                {/* Remember Me + Forgot Password */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="nx-checkbox-wrap" onClick={() => setRememberMe(!rememberMe)}>
                                        <div className={`nx-checkbox${rememberMe ? ' checked' : ''}`}>
                                            {rememberMe && <Check size={12} color="#22d3ee" strokeWidth={3} />}
                                        </div>
                                        Remember me
                                    </label>
                                    <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--nx-cyan)', textDecoration: 'none', fontWeight: 500 }}>
                                        Forgot password?
                                    </Link>
                                </div>

                                <motion.button
                                    type="submit" id="login-submit" disabled={loading}
                                    className="nx-btn nx-btn-primary"
                                    style={{ width: '100%', padding: '0.8rem' }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </motion.button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                        <ShieldCheck size={40} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 15px rgba(34,211,238,0.5))' }} />
                                    </motion.div>
                                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginTop: 12 }}>
                                        VERIFICATION REQUIRED
                                    </h2>
                                    <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 6 }}>
                                        Enter the 6-digit verification code
                                    </p>
                                </div>

                                <OtpInputGroup value={otp} onChange={setOtp} />

                                <motion.button
                                    type="submit" id="otp-submit" disabled={loading || otp.length < 6}
                                    className="nx-btn nx-btn-primary"
                                    style={{ width: '100%', padding: '0.8rem' }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </motion.button>

                                <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setError('') }}
                                    style={{ background: 'none', border: 'none', color: 'var(--nx-text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    ← Back to login
                                </button>
                            </form>
                        </motion.div>
                    )}

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--nx-border)', textAlign: 'center', fontSize: 13, color: 'var(--nx-text-muted)' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--nx-cyan)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
                    </div>
                </div>

                {/* Demo Credentials */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    style={{ marginTop: 12, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--nx-border)', textAlign: 'center', background: 'rgba(15,23,62,0.4)' }}
                >
                    <p style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>
                        Admin: <span className="nx-mono" style={{ color: 'var(--nx-text-muted)' }}>admin</span> / <span className="nx-mono" style={{ color: 'var(--nx-text-muted)' }}>admin123</span> &nbsp;|&nbsp;
                        User: <span className="nx-mono" style={{ color: 'var(--nx-text-muted)' }}>john_doe</span> / <span className="nx-mono" style={{ color: 'var(--nx-text-muted)' }}>user123</span>
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginTop: 2 }}>
                        OTP: <span className="nx-mono" style={{ color: 'var(--nx-cyan)' }}>000000</span>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    )
}
