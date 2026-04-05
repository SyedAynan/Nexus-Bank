import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    GitBranch, Calendar, CheckCircle, Clock, Zap,
    ChevronRight, Flag, Star, Rocket, Shield,
    Database, Layout, Brain, Globe, Server
} from 'lucide-react'

/* ── Complete Day-by-Day Roadmap Data ── */
const PHASES = [
    {
        phase: 'Phase 1 — Foundation',
        icon: Database,
        color: '#22d3ee',
        dateRange: 'Day 1 – Day 8',
        status: 'complete',
        days: [
            { day: 1, title: 'Project Initialization', tasks: ['Initialize Git repository & project scaffolding', 'Set up FastAPI backend with Uvicorn', 'Configure PostgreSQL with SQLAlchemy ORM', 'Create .env and docker-compose.yml', 'Define DB models: User, Account, Transaction'], status: 'done' },
            { day: 2, title: 'Core Banking Service', tasks: ['Implement BankingService with in-memory accounts', 'Build account CRUD operations', 'Add deposit / withdrawal / transfer logic', 'Create transaction history tracking', 'Implement balance validation & overdraft protection'], status: 'done' },
            { day: 3, title: 'Authentication System', tasks: ['JWT token generation with python-jose', 'Password hashing with bcrypt', 'Login / Register API endpoints', 'Role-based access (admin vs customer)', 'Account lockout after failed attempts'], status: 'done' },
            { day: 4, title: 'MFA & Security Layer', tasks: ['OTP generation & verification (pyotp)', 'MFA enforcement on login flow', 'Security event logging', 'CORS configuration & security headers', 'Rate limiting middleware'], status: 'done' },
            { day: 5, title: 'Data Structures — Part 1', tasks: ['Linked List for transaction chaining', 'Stack for undo / rollback operations', 'Queue for FIFO transaction processing', 'Hash Table for O(1) account lookups', 'Unit tests for all 4 structures'], status: 'done' },
            { day: 6, title: 'Data Structures — Part 2', tasks: ['BST for sorted account ordering', 'Graph for AML compliance mapping', 'Priority Queue for loan prioritization', 'Trie for prefix autocomplete search', 'Integration with BankingService'], status: 'done' },
            { day: 7, title: 'Sorting Algorithms', tasks: ['Merge Sort — stable amount sorting', 'Quick Sort — fraud score ranking', 'Heap Sort — top-K extraction', 'Counting Sort — risk-level bucketing', 'Benchmark endpoints for admin panel'], status: 'done' },
            { day: 8, title: 'Database Integration', tasks: ['SQLAlchemy model migrations', 'Database session management', 'Seed script with demo data', 'Transaction persistence to PostgreSQL', 'Redis caching layer integration'], status: 'done' },
        ]
    },
    {
        phase: 'Phase 2 — AI & Intelligence',
        icon: Brain,
        color: '#a78bfa',
        dateRange: 'Day 9 – Day 14',
        status: 'complete',
        days: [
            { day: 9, title: 'Fraud Detection Engine', tasks: ['Z-Score deviation analysis', 'Velocity check (sliding window counter)', 'Round-number fraud detector', 'Time-of-day anomaly detection', 'Graph-based neighbor risk scoring'], status: 'done' },
            { day: 10, title: 'AML & Compliance Engine', tasks: ['Anti-money laundering rule engine', 'Suspicious Activity Report (SAR) generation', 'Transaction pattern analysis', 'Compliance graph cycle detection (DFS)', 'Risk score computation'], status: 'done' },
            { day: 11, title: 'Financial Intelligence', tasks: ['Portfolio optimization engine', 'Loan scoring with credit risk model', 'ML-based predictive analytics (scikit-learn)', 'Financial forecasting (statsmodels)', 'Risk intelligence aggregator'], status: 'done' },
            { day: 12, title: 'Search Engine', tasks: ['Full-text search across all entities', 'Fuzzy matching with Levenshtein distance', 'Trie-based prefix autocomplete', 'Search history & saved searches', 'Multi-entity result ranking'], status: 'done' },
            { day: 13, title: 'Analytics Engine', tasks: ['KPI metric calculations', 'Revenue & growth analytics', 'User activity tracking', 'Transaction volume analysis', 'Dashboard data aggregation'], status: 'done' },
            { day: 14, title: 'API Routes — Intelligence', tasks: ['Fraud alerts API (/api/intelligence/fraud)', 'AML reports API (/api/intelligence/aml)', 'Forecasting API (/api/intelligence/forecast)', 'Portfolio API (/api/intelligence/portfolio)', 'DSA admin visualization routes'], status: 'done' },
        ]
    },
    {
        phase: 'Phase 3 — Frontend',
        icon: Layout,
        color: '#34d399',
        dateRange: 'Day 15 – Day 24',
        status: 'complete',
        days: [
            { day: 15, title: 'React Setup & Design System', tasks: ['Vite + React 18 project initialization', 'Tailwind CSS + design tokens', 'Custom CSS variables & theming', 'Google Fonts (Orbitron, Inter, JetBrains Mono)', 'Layout components (Public, Dashboard, Admin)'], status: 'done' },
            { day: 16, title: 'Landing Page', tasks: ['Hero section with animated background', 'Feature grid with hover effects', 'Glassmorphism card design', 'CTA buttons with glow effects', 'Responsive navigation bar'], status: 'done' },
            { day: 17, title: 'Authentication UI', tasks: ['Login page with sci-fi design', 'Social login buttons (Google, Apple, Microsoft)', 'Passkey / biometric sign-in UI', 'Multi-step MFA OTP verification', 'Registration & Forgot Password flows'], status: 'done' },
            { day: 18, title: 'Customer Dashboard', tasks: ['Financial command center layout', 'KPI cards with animated counters', 'Recent transactions list', 'Quick action buttons', 'Responsive sidebar navigation'], status: 'done' },
            { day: 19, title: 'Banking Pages', tasks: ['Accounts page — list & details', 'Transfer / Payments page', 'Transaction history with filters', 'Statement export page', 'Card management page'], status: 'done' },
            { day: 20, title: 'Customer Services Pages', tasks: ['Loan application page', 'Support & FAQ page', 'Profile & security settings', 'Product features listing', 'Notification center'], status: 'done' },
            { day: 21, title: 'Admin Panel — Core', tasks: ['Admin dashboard with system KPIs', 'User management (CRUD)', 'Transaction oversight panel', 'Admin layout with role guard', 'System settings page'], status: 'done' },
            { day: 22, title: 'Admin Panel — Advanced', tasks: ['Analytics dashboard with charts', 'Fraud monitoring / security page', 'Compliance reporting page (94% score)', 'Audit log viewer', 'DSA visualization admin page'], status: 'done' },
            { day: 23, title: 'Public Pages', tasks: ['About page — security, compliance, tech', 'Contact form page', 'Features comparison matrix', 'Footer with social links', 'SEO meta tags for all pages'], status: 'done' },
            { day: 24, title: 'Animations & Polish', tasks: ['Framer Motion page transitions', 'Micro-animations on hover/focus', 'Loading skeletons & spinners', 'Toast notification system', 'Dark theme fine-tuning'], status: 'done' },
        ]
    },
    {
        phase: 'Phase 4 — Integration & Hardening',
        icon: Shield,
        color: '#f59e0b',
        dateRange: 'Day 25 – Day 30',
        status: 'complete',
        days: [
            { day: 25, title: 'Docker & DevOps', tasks: ['Dockerfile for backend API', 'docker-compose multi-service setup', 'PostgreSQL 15 container', 'Redis 7 Alpine container', 'Frontend dev server configuration'], status: 'done' },
            { day: 26, title: 'Testing Suite', tasks: ['Pytest unit tests setup', 'conftest.py with test fixtures', 'Auth route integration tests', 'Banking route integration tests', 'Security test coverage'], status: 'done' },
            { day: 27, title: 'MCP Integration', tasks: ['MCP config for Neon PostgreSQL', 'MCP config for Notion workspace', 'MCP config for GitHub repository', 'Tool plugin validation', 'Connection health checks'], status: 'done' },
            { day: 28, title: 'Cursor IDE Plugins', tasks: ['AWS Deploy plugin setup', 'Vercel deployment config', 'Cloudflare integration', 'Langfuse observability', 'Clerk auth plugin'], status: 'done' },
            { day: 29, title: 'Branding & Identity', tasks: ['NEXA brand standardization', 'Logo & monogram generation', 'Color palette finalization', 'Typography system (Orbitron)', 'Favicon & PWA icons'], status: 'done' },
            { day: 30, title: 'QA & Bug Fixes', tasks: ['Full diagnostic testing (21 pages)', 'Demo login fallback fix', 'Cross-page navigation testing', 'Error handling improvements', 'Performance audit'], status: 'done' },
        ]
    },
    {
        phase: 'Phase 5 — Production Launch',
        icon: Rocket,
        color: '#ef4444',
        dateRange: 'Day 31 – Day 40',
        status: 'in-progress',
        days: [
            { day: 31, title: 'Feature Expansion', tasks: ['DSA Showcase page for presentations', 'Development Roadmap timeline', 'AI Assistant chatbot', 'Rate Limiting dashboard', 'Enhanced feature pages'], status: 'done' },
            { day: 32, title: 'Real OAuth Integration', tasks: ['Google OAuth 2.0 setup', 'Apple Sign-In configuration', 'Microsoft Azure AD integration', 'Social login callback handlers', 'Token exchange & user provisioning'], status: 'planned' },
            { day: 33, title: 'WebAuthn / Passkey Backend', tasks: ['FIDO2 credential registration', 'Authentication challenge flow', 'Passkey storage & management', 'Biometric fallback handling', 'Browser compatibility testing'], status: 'planned' },
            { day: 34, title: 'Email Service', tasks: ['SendGrid / AWS SES integration', 'OTP email delivery templates', 'Welcome email flow', 'Transaction notification emails', 'Password reset email flow'], status: 'planned' },
            { day: 35, title: 'Real-time Features', tasks: ['WebSocket server setup', 'Live transaction notifications', 'Real-time fraud alerts for admin', 'Connection state management', 'Reconnection & heartbeat logic'], status: 'planned' },
            { day: 36, title: 'PWA & Mobile', tasks: ['Service worker registration', 'Offline caching strategy', 'PWA manifest.json', 'Push notification API', 'Responsive breakpoint audit'], status: 'planned' },
            { day: 37, title: 'CI/CD Pipeline', tasks: ['GitHub Actions workflow', 'Automated test runner', 'Docker image build & push', 'Staging deployment automation', 'Production deployment gate'], status: 'planned' },
            { day: 38, title: 'HTTPS & Security Hardening', tasks: ['SSL/TLS certificate setup', 'HSTS headers enforcement', 'CSP policy configuration', 'Dependency vulnerability audit', 'Penetration test preparation'], status: 'planned' },
            { day: 39, title: 'Monitoring & Observability', tasks: ['APM integration (Datadog/New Relic)', 'Structured logging (ELK/Loki)', 'Error tracking (Sentry)', 'Uptime monitoring', 'Performance dashboards'], status: 'planned' },
            { day: 40, title: 'Production Go-Live', tasks: ['Final regression testing', 'Database backup strategy', 'Load testing (k6/Locust)', 'API documentation (Swagger)', 'Launch checklist sign-off ✅'], status: 'planned' },
        ]
    },
]

const sCard = {
    background: 'var(--nx-card-bg)',
    border: '1px solid var(--nx-border)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
}

const statusColors = { done: '#22d3ee', 'in-progress': '#f59e0b', planned: '#64748b' }
const statusIcons = { done: CheckCircle, 'in-progress': Clock, planned: Flag }

function DayCard({ day, index }) {
    const [open, setOpen] = useState(false)
    const StatusIcon = statusIcons[day.status]
    const clr = statusColors[day.status]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            style={{ ...sCard, padding: '12px 16px', cursor: 'pointer' }}
            onClick={() => setOpen(!open)}
            whileHover={{ borderColor: clr + '44' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: clr + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 12, fontWeight: 800, color: clr,
                    fontFamily: 'var(--font-mono)',
                }}>
                    {day.day}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-text)' }}>{day.title}</div>
                </div>
                <StatusIcon size={16} color={clr} />
                <motion.div animate={{ rotate: open ? 90 : 0 }}>
                    <ChevronRight size={14} color='var(--nx-text-dim)' />
                </motion.div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--nx-border)' }}>
                            {day.tasks.map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                                    <CheckCircle size={12} color={day.status === 'done' ? '#22d3ee' : 'var(--nx-text-dim)'} />
                                    <span style={{ fontSize: 12, color: day.status === 'done' ? 'var(--nx-text-muted)' : 'var(--nx-text-dim)' }}>{t}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default function DevelopmentRoadmap() {
    const [expandedPhase, setExpandedPhase] = useState('Phase 5 — Production Launch')

    const totalDays = PHASES.reduce((s, p) => s + p.days.length, 0)
    const doneDays = PHASES.reduce((s, p) => s + p.days.filter(d => d.status === 'done').length, 0)
    const totalTasks = PHASES.reduce((s, p) => s + p.days.reduce((s2, d) => s2 + d.tasks.length, 0), 0)
    const doneTasks = PHASES.reduce((s, p) => s + p.days.filter(d => d.status === 'done').reduce((s2, d) => s2 + d.tasks.length, 0), 0)

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{
                    fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)',
                    letterSpacing: '0.1em', color: 'var(--nx-text)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <GitBranch size={28} color="#22d3ee" />
                    DEVELOPMENT ROADMAP
                </h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 6 }}>
                    Day-by-day development timeline from project inception to production launch
                </p>
            </div>

            {/* Progress Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total Days', value: totalDays, color: '#22d3ee', icon: Calendar },
                    { label: 'Completed', value: doneDays, color: '#34d399', icon: CheckCircle },
                    { label: 'Tasks', value: `${doneTasks}/${totalTasks}`, color: '#a78bfa', icon: Star },
                    { label: 'Progress', value: `${Math.round(doneDays / totalDays * 100)}%`, color: '#f59e0b', icon: Zap },
                ].map(s => {
                    const I = s.icon
                    return (
                        <div key={s.label} style={{ ...sCard, textAlign: 'center', padding: '1rem' }}>
                            <I size={18} color={s.color} style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2, letterSpacing: '0.06em' }}>{s.label}</div>
                        </div>
                    )
                })}
            </div>

            {/* Global Progress Bar */}
            <div style={{ ...sCard, marginBottom: 24, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--nx-text-muted)' }}>Overall Progress</span>
                    <span style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{Math.round(doneDays / totalDays * 100)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--nx-bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${doneDays / totalDays * 100}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', borderRadius: 3 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
                    {PHASES.map(p => {
                        const pDone = p.days.filter(d => d.status === 'done').length
                        return (
                            <span key={p.phase} style={{ color: p.color }}>
                                {p.phase.split(' — ')[1]}: {pDone}/{p.days.length}
                            </span>
                        )
                    })}
                </div>
            </div>

            {/* Phase Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {PHASES.map((phase) => {
                    const Icon = phase.icon
                    const isOpen = expandedPhase === phase.phase
                    const pDone = phase.days.filter(d => d.status === 'done').length

                    return (
                        <div key={phase.phase}>
                            <motion.div
                                style={{ ...sCard, cursor: 'pointer', borderLeft: `3px solid ${phase.color}` }}
                                onClick={() => setExpandedPhase(isOpen ? null : phase.phase)}
                                whileHover={{ borderColor: phase.color + '66' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: phase.color + '18', border: `1px solid ${phase.color}33`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={20} color={phase.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                                            {phase.phase}
                                        </h3>
                                        <p style={{ fontSize: 12, color: 'var(--nx-text-dim)', marginTop: 2 }}>
                                            {phase.dateRange} · {pDone}/{phase.days.length} days complete
                                        </p>
                                    </div>
                                    <div style={{
                                        width: 50, height: 50, borderRadius: '50%',
                                        background: `conic-gradient(${phase.color} ${pDone / phase.days.length * 360}deg, var(--nx-bg-2) 0deg)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%',
                                            background: 'var(--nx-card-bg)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700, color: phase.color, fontFamily: 'var(--font-mono)',
                                        }}>
                                            {Math.round(pDone / phase.days.length * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingLeft: 20 }}>
                                            {phase.days.map((day, i) => (
                                                <DayCard key={day.day} day={day} index={i} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
