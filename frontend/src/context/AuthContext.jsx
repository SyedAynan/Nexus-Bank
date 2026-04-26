import { createContext, useContext, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })
    const [loading, setLoading] = useState(false)

    // Store password and username for MFA verify step
    const [pendingPassword, setPendingPassword] = useState('')
    const [pendingUsername, setPendingUsername] = useState('')

    const login = async (username, password) => {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)

        const res = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            validateStatus: (status) => (status >= 200 && status < 300) || status === 202,
        })

        // 202 = MFA required, 200 = direct login (no MFA)
        if (res.status === 202 || res.data?.mfa === true) {
            setPendingPassword(password)
            return { mfa_required: true }
        }

        // Direct login — server sets httpOnly cookies AND returns user data in body
        const { access_token, refresh_token, user: userData } = res.data

        // Store tokens in localStorage as fallback for non-cookie environments
        if (access_token) {
            localStorage.setItem('access_token', access_token)
        }
        if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token)
        }

        // Use server-provided user data instead of insecure client-side JWT decode
        const userInfo = userData || { username, role: 'user' }
        localStorage.setItem('user', JSON.stringify(userInfo))
        setUser(userInfo)

        return { mfa_required: false }
    }

    const verifyOtp = async (username, otp) => {
        const res = await api.post('/auth/verify-otp', { username, password: pendingPassword, otp })
        const { access_token, refresh_token, user: userData } = res.data

        // Store tokens in localStorage as fallback
        if (access_token) {
            localStorage.setItem('access_token', access_token)
        }
        if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token)
        }

        // Use server-provided user data
        const userInfo = userData || { username, role: 'user' }
        localStorage.setItem('user', JSON.stringify(userInfo))
        setUser(userInfo)
        setPendingPassword('')
        return userInfo
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) {
            // Ignore logout API errors — still clear local state
        }
        // Clear localStorage fallback (cookies cleared by server response)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
    }

    const isAdmin = user?.role === 'admin'
    const isAuthenticated = !!user

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, logout, isAdmin, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
