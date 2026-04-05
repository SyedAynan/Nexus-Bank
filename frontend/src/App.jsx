import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// ─── Loading Fallback ───
function LoadingFallback() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nx-bg-2)' }}>
            <div className="nx-nebula-bg" />
            <motion.div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 size={28} color="var(--nx-cyan)" />
                </motion.div>
                <span style={{ fontSize: 13, color: 'var(--nx-text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>LOADING</span>
            </motion.div>
        </div>
    )
}

// ─── Layouts (keep eager ─ always used) ───
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'

// ─── Lazy Loaded Pages ───
const Landing = lazy(() => import('./pages/public/Landing'))
const About = lazy(() => import('./pages/public/About'))
const Contact = lazy(() => import('./pages/public/Contact'))

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))

const Dashboard = lazy(() => import('./pages/customer/Dashboard'))
const Accounts = lazy(() => import('./pages/customer/Accounts'))
const Transfer = lazy(() => import('./pages/customer/Transfer'))
const Transactions = lazy(() => import('./pages/customer/Transactions'))
const Loans = lazy(() => import('./pages/customer/Loans'))
const Profile = lazy(() => import('./pages/customer/Profile'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'))
const FraudMonitoring = lazy(() => import('./pages/admin/FraudMonitoring'))
const Compliance = lazy(() => import('./pages/admin/Compliance'))
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'))

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth()
    return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin } = useAuth()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (!isAdmin) return <Navigate to="/dashboard" replace />
    return children
}

export default function App() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Public */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                </Route>

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Customer (Protected) */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/transfer" element={<Transfer />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/loans" element={<Loans />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Admin (Admin Only) */}
                <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/transactions" element={<Transactions />} />
                    <Route path="/admin/security" element={<FraudMonitoring />} />
                    <Route path="/admin/compliance" element={<Compliance />} />
                    <Route path="/admin/logs" element={<AuditLogs />} />
                    <Route path="/admin/settings" element={<SystemSettings />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    )
}
