import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })
    const [loading, setLoading] = useState(false)

    // Store password for MFA verify step
    const [pendingPassword, setPendingPassword] = useState('')

    const login = async (username, password) => {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)

        const res = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            validateStatus: (status) => status >= 200 && status < 300,
        })

        // 202 = MFA required, 200 = direct login (no MFA)
        if (res.status === 202 || res.data?.mfa === true) {
            setPendingPassword(password)
            return { mfa_required: true }
        }

        // Direct login (if MFA not enabled)
        const { access_token, refresh_token } = res.data
        if (access_token) {
            localStorage.setItem('access_token', access_token)
            if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token)
            }
            const payload = JSON.parse(atob(access_token.split('.')[1]))
            const userData = { username: payload.sub, role: payload.role }
            localStorage.setItem('user', JSON.stringify(userData))
            setUser(userData)
        }
        return { mfa_required: false }
    }

    const verifyOtp = async (username, otp) => {
        const res = await api.post('/auth/verify-otp', { username, password: pendingPassword, otp })
        const { access_token, refresh_token } = res.data
        localStorage.setItem('access_token', access_token)
        if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token)
        }

        const payload = JSON.parse(atob(access_token.split('.')[1]))
        const userData = { username: payload.sub, role: payload.role }
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setPendingPassword('')
        return userData
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) {
            // Ignore logout API errors — still clear local state
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
    }

    const isAdmin = user?.role === 'admin'
    const isAuthenticated = !!user
    const token = localStorage.getItem('access_token')

    return (
        <AuthContext.Provider value={{ user, token, login, verifyOtp, logout, isAdmin, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)

