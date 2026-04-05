import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 second timeout
})

// ── Request Interceptor: Attach JWT token ──
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
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
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return api(originalRequest)
                }).catch(err => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem('refresh_token')

            if (refreshToken) {
                try {
                    const res = await axios.post('/api/auth/refresh', {
                        refresh_token: refreshToken,
                    })

                    const { access_token, refresh_token: newRefresh } = res.data

                    localStorage.setItem('access_token', access_token)
                    if (newRefresh) {
                        localStorage.setItem('refresh_token', newRefresh)
                    }

                    api.defaults.headers.Authorization = `Bearer ${access_token}`
                    originalRequest.headers.Authorization = `Bearer ${access_token}`

                    processQueue(null, access_token)

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
            } else {
                // No refresh token — clear and redirect
                localStorage.removeItem('access_token')
                localStorage.removeItem('user')
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
