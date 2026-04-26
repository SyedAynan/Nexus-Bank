/**
 * File: api.js
 * Module: frontend/src/api.js
 *
 * Purpose:
 *     Centralized Axios HTTP client for all frontend-to-backend API communication.
 *     Handles: base URL configuration, request/response interceptors, automatic
 *     token refresh on 401 responses, and credential management.
 *
 * Developer Journey:
 *     - v1: Used fetch() directly in every component — no centralized error
 *       handling, no token refresh, duplicated headers everywhere.
 *     - v2: Created this Axios instance with interceptors. The request interceptor
 *       attaches the JWT token, and the response interceptor handles 401 errors
 *       by automatically refreshing the token and retrying the failed request.
 *     - v3: Added httpOnly cookie support (withCredentials: true). The browser
 *       now sends cookies automatically — no need to manually attach tokens.
 *       Kept localStorage as fallback for environments without cookies.
 *     - v4: Added request queuing during token refresh to prevent race conditions
 *       when multiple requests fail simultaneously.
 *
 * Auth Architecture:
 *     Primary: httpOnly cookies (set by backend, sent automatically by browser)
 *     Fallback: localStorage tokens + Authorization header (Swagger, mobile)
 *
 *     Token Refresh Flow:
 *     1. API request returns 401 (access token expired)
 *     2. Interceptor sends POST /auth/refresh (with refresh cookie)
 *     3. Backend issues new access + refresh token pair
 *     4. Failed request is automatically retried with new token
 *     5. Any requests that failed during refresh are queued and retried
 *
 * Issue Faced:
 *     Multiple simultaneous 401s caused multiple refresh requests, each
 *     invalidating the previous refresh token (token rotation). Fixed by
 *     using an isRefreshing flag and a failedQueue to serialize refresh attempts.
 */

import axios from 'axios'

// ── Base URL Configuration ──
// In production (Vercel/Nginx), VITE_API_URL is set to '/api' (relative path)
// which is reverse-proxied to the backend by Nginx. This avoids CORS issues
// because both frontend and API appear to be on the same origin.
// In local dev with Vite proxy, falls back to '/api' which Vite proxies to localhost:8000.
// Issue faced: Using absolute URLs like 'http://localhost:8000/api' in production
// caused CORS errors. Switched to relative '/api' path resolved via reverse proxy.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// ── Axios Instance ──
// Using a shared instance ensures all requests use the same base URL,
// headers, timeout, and credential settings.
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 second timeout — prevents hanging requests
    // withCredentials: true tells the browser to send httpOnly cookies with
    // every request. Without this, cookies are only sent to same-origin requests.
    // This is critical for the httpOnly cookie auth to work with cross-origin APIs.
    withCredentials: true,
})

// ── Request Interceptor: Attach JWT token (fallback for non-cookie environments) ──
// Cookies are sent automatically via withCredentials. This interceptor only adds
// the Authorization header if we have a localStorage token AND no cookie is set.
// This maintains backward compatibility with Swagger UI and mobile clients.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token')
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response Interceptor: Automatic Token Refresh on 401 ──
// When a request fails with 401 (Unauthorized), this interceptor:
// 1. Pauses all subsequent failed requests
// 2. Sends a single refresh request
// 3. On success: retries all queued requests
// 4. On failure: clears auth state and redirects to login

let isRefreshing = false   // Prevents multiple simultaneous refresh requests
let failedQueue = []       // Queue of requests waiting for refresh to complete

/**
 * Process the queue of failed requests after a refresh attempt.
 * On success: retries each request. On failure: rejects each promise.
 */
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // If 401 and we haven't already tried to refresh for this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Another refresh is in progress — queue this request
                // It will be retried after the refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => {
                    // Cookies are refreshed automatically, just retry the original request
                    return api(originalRequest)
                }).catch(err => Promise.reject(err))
            }

            originalRequest._retry = true   // Prevent infinite retry loops
            isRefreshing = true

            try {
                // Attempt token refresh
                // httpOnly cookie (refresh_token) is sent automatically via withCredentials
                // localStorage token is sent as fallback payload
                const refreshToken = localStorage.getItem('refresh_token')
                const refreshPayload = refreshToken ? { refresh_token: refreshToken } : {}

                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, refreshPayload, {
                    withCredentials: true, // Send refresh_token cookie
                })

                const { access_token, refresh_token: newRefresh } = res.data

                // Store in localStorage as fallback (cookies are set by backend response)
                if (access_token) {
                    localStorage.setItem('access_token', access_token)
                }
                if (newRefresh) {
                    localStorage.setItem('refresh_token', newRefresh)
                }

                // Retry all queued requests
                processQueue(null)

                // Retry the original failed request
                return api(originalRequest)
            } catch (refreshError) {
                // Refresh failed — user needs to re-authenticate
                processQueue(refreshError, null)
                // Clear all auth state
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('user')
                // Redirect to login page
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
