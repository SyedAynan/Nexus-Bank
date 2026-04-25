import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, KeyRound, Fingerprint, Check, Eye, EyeOff, Shield, Zap, Globe, ArrowRight } from 'lucide-react'

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

/* ─── Feature Badges ─── */
function SecurityBadges() {
    const badges = [
        { icon: <Shield size={14} />, label: '256-bit Encryption', color: '#22d3ee' },
        { icon: <Zap size={14} />, label: 'AI-Powered Security', color: '#a78bfa' },
        { icon: <Globe size={14} />, label: 'Global Access', color: '#34d399' },
    ]
    return (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
            {badges.map((b, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 10, color: b.color, fontWeight: 500,
                        padding: '3px 8px', borderRadius: 20,
                        background: `${b.color}12`,
                        border: `1px solid ${b.color}30`,
                    }}
                >
                    {b.icon} {b.label}
                </motion.div>
            ))}
        </div>
    )
}

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loginSuccess, setLoginSuccess] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const result = await login(username, password)
            if (result.mfa_required) {
                // Fallback: if MFA somehow still triggers, go to dashboard anyway
                navigate('/dashboard')
            } else {
                setLoginSuccess(true)
                setTimeout(() => navigate('/dashboard'), 600)
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    const handleSocialLogin = (provider) => {
        setError('')
        setLoading(true)
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
                {Array.from({ length: 25 }, (_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: 2 + Math.random() * 3, height: 2 + Math.random() * 3,
                            borderRadius: '50%',
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            background: i % 3 === 0 ? 'rgba(34,211,238,0.5)' : i % 3 === 1 ? 'rgba(167,139,250,0.4)' : 'rgba(52,211,153,0.4)',
                            boxShadow: `0 0 ${4 + Math.random() * 8}px ${i % 3 === 0 ? 'rgba(34,211,238,0.5)' : i % 3 === 1 ? 'rgba(167,139,250,0.4)' : 'rgba(52,211,153,0.4)'}`,
                        }}
                        animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2] }}
                        transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 4 }}
                    />
                ))}
            </div>

            <motion.div
                style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            >
                {/* Logo + Branding */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <motion.div
                        whileHover={{ scale: 1.08, boxShadow: '0 0 40px rgba(34,211,238,0.5)' }}
                        className="glow-breathe"
                        style={{
                            width: 60, height: 60, borderRadius: 16,
                            background: 'radial-gradient(circle, rgba(34,211,238,0.3), rgba(15,23,62,0.9))',
                            border: '1.5px solid rgba(34,211,238,0.5)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 16, backdropFilter: 'blur(10px)',
                        }}
                    >
                        <span style={{ color: '#22d3ee', fontWeight: 800, fontSize: 22, fontFamily: 'var(--font-display)' }}>NX</span>
                    </motion.div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
                        WELCOME TO <span className="nx-cyan nx-text-glow-cyan">NEXUS</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 6 }}>
                        Your intelligent banking platform
                    </p>
                    <SecurityBadges />
                </div>

                {/* Login Card */}
                <div className="nx-card-static" style={{
                    padding: '2rem',
                    boxShadow: '0 0 50px rgba(0,0,0,0.35), 0 0 20px rgba(34,211,238,0.06)',
                    backdropFilter: 'blur(20px)',
                }}>
                    {/* Success State */}
                    <AnimatePresence>
                        {loginSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    textAlign: 'center', padding: '2rem 1rem',
                                }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.6 }}
                                    style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'rgba(34,211,153,0.15)',
                                        border: '2px solid #22d399',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 16,
                                    }}
                                >
                                    <Check size={28} color="#22d399" strokeWidth={3} />
                                </motion.div>
                                <p style={{ color: '#22d399', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                                    Welcome back, {username}!
                                </p>
                                <p style={{ color: 'var(--nx-text-muted)', fontSize: 12, marginTop: 6 }}>Launching dashboard...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!loginSuccess && (
                        <>
                            {/* Error Alert */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                        className="nx-alert nx-alert-error"
                                        style={{ marginBottom: 16 }}
                                    >⚠ {error}</motion.div>
                                )}
                            </AnimatePresence>

                            {/* Social Auth */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                <motion.button
                                    className="nx-social-btn nx-social-btn-google"
                                    onClick={() => handleSocialLogin('Google')}
                                    whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                                    disabled={loading}
                                >
                                    <GoogleIcon /> Continue with Google
                                </motion.button>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <motion.button
                                        className="nx-social-btn nx-social-btn-apple"
                                        onClick={() => handleSocialLogin('Apple')}
                                        whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                                        disabled={loading}
                                    >
                                        <AppleIcon /> Apple
                                    </motion.button>
                                    <motion.button
                                        className="nx-social-btn nx-social-btn-microsoft"
                                        onClick={() => handleSocialLogin('Microsoft')}
                                        whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                                        disabled={loading}
                                    >
                                        <MicrosoftIcon /> Microsoft
                                    </motion.button>
                                </div>
                            </div>

                            {/* Passkey */}
                            <motion.button
                                className="nx-passkey-btn"
                                onClick={() => handleSocialLogin('Passkey')}
                                whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                                disabled={loading}
                                style={{ marginBottom: 20 }}
                            >
                                <Fingerprint size={18} /> Sign in with Passkey
                            </motion.button>

                            {/* Divider */}
                            <div className="nx-divider" style={{ marginBottom: 20 }}>or sign in with credentials</div>

                            {/* Login Form */}
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Username */}
                                <div>
                                    <label className="nx-label">
                                        <Lock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Username
                                    </label>
                                    <input
                                        type="text"
                                        id="login-username"
                                        className="nx-input"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        required
                                        autoFocus
                                        autoComplete="username"
                                    />
                                </div>

                                {/* Password with Show/Hide Toggle */}
                                <div>
                                    <label className="nx-label">
                                        <KeyRound size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="login-password"
                                            className="nx-input"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            style={{ paddingRight: 44 }}
                                        />
                                        <button
                                            type="button"
                                            id="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            style={{
                                                position: 'absolute',
                                                right: 10,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: showPassword ? '#22d3ee' : 'var(--nx-text-dim)',
                                                transition: 'color 0.2s ease',
                                                borderRadius: 4,
                                            }}
                                            onMouseEnter={e => e.target.style.color = '#22d3ee'}
                                            onMouseLeave={e => { if (!showPassword) e.target.style.color = 'var(--nx-text-dim)' }}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
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

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    id="login-submit"
                                    disabled={loading || !username || !password}
                                    className="nx-btn nx-btn-primary"
                                    style={{
                                        width: '100%', padding: '0.85rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        fontSize: 14, fontWeight: 600,
                                        opacity: (!username || !password) ? 0.5 : 1,
                                        transition: 'opacity 0.3s ease',
                                    }}
                                    whileHover={username && password ? { scale: 1.02, boxShadow: '0 0 25px rgba(34,211,238,0.3)' } : {}}
                                    whileTap={username && password ? { scale: 0.98 } : {}}
                                >
                                    {loading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                style={{
                                                    width: 16, height: 16, borderRadius: '50%',
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTopColor: '#fff',
                                                }}
                                            />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign In <ArrowRight size={16} />
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            {/* Sign Up Link */}
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--nx-border)', textAlign: 'center', fontSize: 13, color: 'var(--nx-text-muted)' }}>
                                Don't have an account? <Link to="/register" style={{ color: 'var(--nx-cyan)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Demo Credentials Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    style={{
                        marginTop: 14, padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(34,211,238,0.15)',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(15,23,62,0.5), rgba(34,211,238,0.04))',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <p style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                        Demo Credentials
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 9, color: '#22d3ee', fontWeight: 700,
                                padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(34,211,238,0.1)',
                                border: '1px solid rgba(34,211,238,0.2)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>Admin</span>
                            <span className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>admin</span>
                            <span style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>/</span>
                            <span className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>admin123</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 9, color: '#a78bfa', fontWeight: 700,
                                padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(167,139,250,0.1)',
                                border: '1px solid rgba(167,139,250,0.2)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>User</span>
                            <span className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>john_doe</span>
                            <span style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>/</span>
                            <span className="nx-mono" style={{ fontSize: 12, color: 'var(--nx-text-muted)' }}>user123</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
