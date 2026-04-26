import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ShieldCheck, Lock, KeyRound, CheckCircle, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react'
import api from '../../api'

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
        refs.current[Math.min(pasted.length, 5)]?.focus()
    }

    return (
        <div className="nx-otp-group">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1}
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

export default function ForgotPassword() {
    const [step, setStep] = useState('email') // email | otp | reset | success
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(5)
    const navigate = useNavigate()

    const strength = getPasswordStrength(password)

    // Countdown timer on success step
    useEffect(() => {
        if (step !== 'success') return
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(timer); navigate('/login'); return 0 }
                return c - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [step, navigate])

    const handleEmailSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setStep('otp')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send reset code')
        } finally {
            setLoading(false)
        }
    }

    const handleOtpSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true)
        // OTP is verified during reset-password call, so just move to reset step
        // We validate OTP format client-side first
        if (otp.length === 6) {
            setLoading(false)
            setStep('reset')
        } else {
            setLoading(false)
            setError('Please enter a valid 6-digit code')
        }
    }

    const handleResetSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (password !== confirm) return setError('Passwords do not match')
        if (strength.score < 2) return setError('Password is too weak')
        setLoading(true)
        try {
            await api.post('/auth/reset-password', {
                email,
                otp,
                new_password: password,
            })
            setStep('success')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    const stepConfig = {
        email: { title: 'RESET PASSWORD', subtitle: 'Enter your email to receive a verification code' },
        otp: { title: 'VERIFY IDENTITY', subtitle: 'Enter the 6-digit code sent to your email' },
        reset: { title: 'NEW PASSWORD', subtitle: 'Create a strong new password for your account' },
        success: { title: 'PASSWORD RESET', subtitle: 'Your password has been successfully updated' },
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
            <div className="nx-nebula-bg" />
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                {Array.from({ length: 12 }, (_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute', width: 2, height: 2, borderRadius: '50%',
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            background: i % 3 === 0 ? 'rgba(34,211,238,0.5)' : i % 3 === 1 ? 'rgba(167,139,250,0.4)' : 'rgba(251,191,36,0.3)',
                            boxShadow: `0 0 6px rgba(34,211,238,0.3)`,
                        }}
                        animate={{ y: [0, -20, 0], opacity: [0.2, 0.7, 0.2] }}
                        transition={{ duration: 5 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
                    />
                ))}
            </div>

            <motion.div
                style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <motion.div
                        className="glow-breathe"
                        style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: step === 'success'
                                ? 'radial-gradient(circle, rgba(52,211,153,0.25), rgba(15,23,62,0.8))'
                                : 'radial-gradient(circle, rgba(251,191,36,0.2), rgba(15,23,62,0.8))',
                            border: `1px solid ${step === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.3)'}`,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                        }}
                    >
                        {step === 'success'
                            ? <CheckCircle size={22} color="#34d399" style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' }} />
                            : step === 'otp'
                                ? <ShieldCheck size={22} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} />
                                : <Mail size={22} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} />
                        }
                    </motion.div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                        {stepConfig[step].title}
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 5 }}>{stepConfig[step].subtitle}</p>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    {['email', 'otp', 'reset', 'success'].map((s, i) => (
                        <motion.div
                            key={s}
                            style={{
                                width: step === s ? 32 : 8, height: 4, borderRadius: 999,
                                background: ['email', 'otp', 'reset', 'success'].indexOf(step) >= i
                                    ? step === 'success' ? 'var(--nx-emerald)' : 'var(--nx-cyan)'
                                    : 'rgba(255,255,255,0.08)',
                                transition: 'all 0.4s ease',
                            }}
                            layout
                        />
                    ))}
                </div>

                <div className="nx-card-static" style={{ padding: '1.75rem', boxShadow: '0 0 40px rgba(0,0,0,0.3), 0 0 15px rgba(251,191,36,0.03)' }}>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="nx-alert nx-alert-error" style={{ marginBottom: 16 }}>
                            ⚠ {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <motion.form key="email" onSubmit={handleEmailSubmit}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="nx-label"><Mail size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Email or Username</label>
                                    <input type="text" id="forgot-email" className="nx-input" placeholder="Enter your email or username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                                </div>
                                <motion.button type="submit" disabled={loading} className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.8rem' }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    {loading ? 'Sending...' : 'Send Verification Code'}
                                </motion.button>
                            </motion.form>
                        )}

                        {/* Step 2: OTP */}
                        {step === 'otp' && (
                            <motion.form key="otp" onSubmit={handleOtpSubmit}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                        <ShieldCheck size={36} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.5))' }} />
                                    </motion.div>
                                </div>
                                <OtpInputGroup value={otp} onChange={setOtp} />
                                <p style={{ fontSize: 11, color: 'var(--nx-text-dim)', textAlign: 'center' }}>
                                    Demo OTP: <span className="nx-mono" style={{ color: 'var(--nx-cyan)' }}>000000</span>
                                </p>
                                <motion.button type="submit" disabled={loading || otp.length < 6} className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.8rem' }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </motion.button>
                                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError('') }}
                                    style={{ background: 'none', border: 'none', color: 'var(--nx-text-muted)', fontSize: 13, cursor: 'pointer' }}>
                                    ← Back
                                </button>
                            </motion.form>
                        )}

                        {/* Step 3: New Password */}
                        {step === 'reset' && (
                            <motion.form key="reset" onSubmit={handleResetSubmit}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="nx-label"><Lock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPw ? 'text' : 'password'} id="reset-password" className="nx-input" placeholder="Create new password"
                                            value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.5rem' }} />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            {showPw ? <EyeOff size={16} color="var(--nx-text-dim)" /> : <Eye size={16} color="var(--nx-text-dim)" />}
                                        </button>
                                    </div>
                                    {password && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>
                                            <div className="nx-strength-meter">
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span className={`nx-strength-label ${strength.level}`}>{strength.level}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{strength.score}/4</span>
                                                </div>
                                                <div className="nx-strength-bar">
                                                    <div className={`nx-strength-fill ${strength.level}`} />
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                                                    {[['8+ chars', strength.checks?.length], ['Uppercase', strength.checks?.upper], ['Number', strength.checks?.number], ['Special', strength.checks?.special]].map(([label, met]) => (
                                                        <span key={label} className={`nx-req${met ? ' met' : ''}`}>
                                                            {met ? <Check size={10} /> : <span style={{ width: 10, textAlign: 'center' }}>○</span>} {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                <div>
                                    <label className="nx-label"><KeyRound size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Confirm Password</label>
                                    <input type="password" id="reset-confirm" className="nx-input" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                                </div>
                                <motion.button type="submit" disabled={loading} className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.8rem' }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </motion.button>
                            </motion.form>
                        )}

                        {/* Step 4: Success */}
                        {step === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <div className="nx-success-icon">
                                    <CheckCircle size={36} color="#34d399" style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.6))' }} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--nx-emerald)', fontFamily: 'var(--font-display)', marginTop: 20, letterSpacing: '0.08em' }}>
                                    SUCCESS
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 8 }}>
                                    Your password has been reset.
                                </p>
                                <p style={{ fontSize: 12, color: 'var(--nx-text-dim)', marginTop: 12 }}>
                                    Redirecting to login in <span className="nx-mono" style={{ color: 'var(--nx-cyan)' }}>{countdown}</span>s
                                </p>
                                <Link to="/login" className="nx-btn nx-btn-primary" style={{ marginTop: 16, padding: '0.7rem 2rem' }}>
                                    Go to Login
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {step !== 'success' && (
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--nx-border)', textAlign: 'center', fontSize: 13, color: 'var(--nx-text-muted)' }}>
                            Remember your password? <Link to="/login" style={{ color: 'var(--nx-cyan)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
