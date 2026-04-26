/**
 * File: AuthContext.jsx
 * Module: frontend/src/context/AuthContext.jsx
 *
 * Purpose:
 *     React Context provider for authentication state management.
 *     Provides login, logout, MFA verification, and user state to all
 *     components in the application via the useAuth() hook.
 *
 * Developer Journey:
 *     - v1: Auth state lived in individual components — every page had its
 *       own login check, token storage, and redirect logic. Lots of duplication.
 *     - v2: Centralized into AuthContext — single source of truth for auth state.
 *       Used atob() to decode the JWT payload and extract user info (username, role).
 *     - v3: Removed insecure atob() JWT decoding. The JWT payload is base64-encoded
 *       but NOT encrypted — decoding it client-side is a security anti-pattern because:
 *       (a) The payload could be tampered with if the token is from localStorage
 *       (b) We should trust the server, not client-side parsing
 *       Now the backend includes user data (username, role) in the login response body.
 *     - v4: Added httpOnly cookie support. The browser sends cookies automatically,
 *       so we no longer need to manually attach tokens. localStorage is kept only
 *       as a fallback for environments without cookie support.
 *
 * Auth Flow:
 *     1. User submits credentials → login() sends POST /auth/login
 *     2. If MFA enabled → server returns 202, frontend shows OTP input
 *     3. User enters OTP → verifyOtp() sends POST /auth/verify-otp
 *     4. Server sets httpOnly cookies + returns user data in response body
 *     5. AuthContext stores user info in state + localStorage (for persistence)
 *     6. All child components can access auth state via useAuth() hook
 *
 * Issue Faced:
 *     Login returned 200 but the dashboard showed "Not authenticated" because
 *     the token was stored but the user state wasn't set. The atob() decode
 *     was failing silently on some JWT formats. Fixed by having the server
 *     return the user object directly instead of relying on client-side decode.
 */

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
