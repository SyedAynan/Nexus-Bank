import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the deployed backend (e.g. https://nexa-api.onrender.com/api)
// In local dev, falls back to '/api' which Vite proxies to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 second timeout
    withCredentials: true, // Send httpOnly cookies with every request
})

// ── Request Interceptor: Attach JWT token from localStorage (fallback for non-cookie envs) ──
api.interceptors.request.use(
    (config) => {
        // Cookies are sent automatically via withCredentials.
        // Only add Authorization header if we have a localStorage token
        // (backward compat for Swagger UI, mobile, or environments without cookies).
        const token = localStorage.getItem('access_token')
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response Interceptor: Handle 401 with token refresh ──
let isRefreshing = false
let failedQueue = []

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

        // If 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request to retry after refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => {
                    // Cookies are refreshed automatically, just retry
                    return api(originalRequest)
                }).catch(err => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                // Refresh via cookie (httpOnly cookie sent automatically)
                // Fall back to localStorage if no cookie
                const refreshToken = localStorage.getItem('refresh_token')
                const refreshPayload = refreshToken ? { refresh_token: refreshToken } : {}

                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, refreshPayload, {
                    withCredentials: true, // Send refresh_token cookie
                })

                const { access_token, refresh_token: newRefresh } = res.data

                // Store in localStorage as fallback (cookies are set by backend)
                if (access_token) {
                    localStorage.setItem('access_token', access_token)
                }
                if (newRefresh) {
                    localStorage.setItem('refresh_token', newRefresh)
                }

                processQueue(null)

                return api(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                // Refresh failed — clear everything and redirect to login
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('user')
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
