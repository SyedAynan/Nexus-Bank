import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Layers, Server, Database, Shield, Brain, Layout, Code2, GitBranch,
    ChevronDown, Globe, Cpu, Lock, BarChart3, Search, AlertTriangle,
    CreditCard, Users, FileText, Zap, Terminal, Box, Network,
    Workflow, TrendingUp, Eye, Settings, Rocket, CheckCircle,
    Clock, Star, Activity, Binary, TreePine, Hash, ArrowRightLeft,
    SortAsc, Fingerprint, Bot, Wallet, DollarSign, PieChart,
    Monitor, Container, TestTube, Palette, Flag
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   NEXA — Complete Project Description
   A comprehensive, immersive walkthrough of the entire platform
   ───────────────────────────────────────────────────────── */

const sCard = {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
}

const sSection = {
    marginBottom: 40,
}

const sHeading = {
    fontSize: 18,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.08em',
    color: 'var(--nx-text)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
}

const sSub = {
    fontSize: 13,
    color: 'var(--nx-text-muted)',
    marginBottom: 20,
    lineHeight: 1.7,
}

/* ═══════════════ DATA ═══════════════ */

const TECH_STACK = [
    { category: 'Frontend', color: '#22d3ee', icon: Layout, techs: [
        { name: 'React 18', desc: 'Component-based SPA with hooks' },
        { name: 'Vite', desc: 'Lightning-fast HMR build tool' },
        { name: 'Framer Motion', desc: 'Declarative animations' },
        { name: 'Recharts', desc: 'Financial chart rendering' },
        { name: 'Tailwind CSS', desc: 'Utility-first styling' },
        { name: 'Lucide React', desc: '1,000+ premium icons' },
    ]},
    { category: 'Backend', color: '#a78bfa', icon: Server, techs: [
        { name: 'FastAPI', desc: 'High-performance async Python API' },
        { name: 'SQLAlchemy', desc: 'ORM with connection pooling' },
        { name: 'Pydantic', desc: 'Data validation & serialization' },
        { name: 'Alembic', desc: 'Database migrations' },
        { name: 'python-jose', desc: 'JWT token management' },
        { name: 'bcrypt', desc: 'Password hashing' },
    ]},
    { category: 'Database & Cache', color: '#34d399', icon: Database, techs: [
        { name: 'PostgreSQL 15', desc: 'ACID-compliant relational DB' },
        { name: 'Redis 7', desc: 'Caching & rate limiting' },
        { name: 'SQLAlchemy ORM', desc: 'Async session management' },
        { name: 'Alembic', desc: 'Schema versioning' },
    ]},
    { category: 'DevOps & Infra', color: '#f59e0b', icon: Container, techs: [
        { name: 'Docker', desc: 'Multi-stage containerization' },
        { name: 'Docker Compose', desc: 'Multi-service orchestration' },
        { name: 'GitHub Actions', desc: 'CI/CD pipeline' },
        { name: 'Nginx', desc: 'Reverse proxy & TLS' },
    ]},
    { category: 'Security', color: '#fb7185', icon: Shield, techs: [
        { name: 'JWT + MFA', desc: 'Dual-factor authentication' },
        { name: 'RBAC', desc: '5-tier role-based access' },
        { name: 'Rate Limiting', desc: 'Redis sliding window' },
        { name: 'OWASP Headers', desc: 'HSTS, CSP, X-Frame' },
    ]},
]

const DSA_STRUCTURES = [
    { name: 'Linked List', icon: ArrowRightLeft, color: '#22d3ee', use: 'Transaction History', desc: 'Per-account chronological chain of all deposits, withdrawals, and transfers. O(1) append, O(n) search.' },
    { name: 'Stack', icon: Layers, color: '#a78bfa', use: 'Undo Operations', desc: 'LIFO structure enabling reversible banking operations — undo last deposit, withdrawal, or transfer.' },
    { name: 'Queue', icon: Workflow, color: '#34d399', use: 'Transaction Processing', desc: 'FIFO queue for pending transaction batch processing — ensures fair ordering.' },
    { name: 'Hash Table', icon: Hash, color: '#f59e0b', use: 'Account Lookup', desc: 'O(1) account retrieval with secondary indices by email and owner for instant access.' },
    { name: 'BST', icon: TreePine, color: '#fb7185', use: 'Sorted Accounts', desc: 'Binary Search Tree maintaining accounts sorted by balance — enables range queries and ordered traversal.' },
    { name: 'Priority Queue', icon: Star, color: '#22d3ee', use: 'Loan Prioritization', desc: 'Heap-based queue ranking loan applications by credit score — highest credit processed first.' },
    { name: 'Graph', icon: Network, color: '#a78bfa', use: 'AML Compliance', desc: 'Adjacency-list graph mapping transfer networks — DFS cycle detection flags suspicious circular flows.' },
    { name: 'Trie', icon: Search, color: '#34d399', use: 'Autocomplete Search', desc: 'Prefix tree for real-time search-as-you-type across accounts, transactions, and entities.' },
    { name: 'Sorting', icon: SortAsc, color: '#f59e0b', use: '4 Algorithms', desc: 'Merge Sort (stable), Quick Sort (ranking), Heap Sort (top-K), Counting Sort (bucketing) — all with step visualization.' },
]

const AI_ENGINES = [
    { name: 'Fraud Detection', icon: AlertTriangle, color: '#fb7185', signals: '6-signal composite scorer', desc: 'Z-Score deviation, velocity checks, round-number detection, time-of-day anomaly, balance ratio analysis, graph-based neighbor risk.' },
    { name: 'AML Engine', icon: Eye, color: '#a78bfa', signals: 'Pattern analysis', desc: 'Anti-money laundering rule engine with Suspicious Activity Report generation and transaction pattern detection.' },
    { name: 'Risk Intelligence', icon: Shield, color: '#f59e0b', signals: 'Portfolio risk', desc: 'Predictive scoring models, risk trend analysis, financial health scoring, and portfolio optimization.' },
    { name: 'Loan Scoring', icon: TrendingUp, color: '#22d3ee', signals: '7-factor model', desc: 'Credit score normalization, account behavior, balance sufficiency, LTI ratio, purpose risk, tenure, network exposure.' },
    { name: 'Search Engine', icon: Search, color: '#34d399', signals: 'Fuzzy + Trie', desc: 'Multi-entity search with Levenshtein fuzzy matching, relevance scoring, search history, and CSV/JSON export.' },
    { name: 'Analytics Engine', icon: BarChart3, color: '#22d3ee', signals: '13 chart types', desc: 'Transaction volume, balance distribution, loan pipeline, top accounts, monthly cash flow, hourly heatmap.' },
    { name: 'Forecasting', icon: TrendingUp, color: '#a78bfa', signals: 'Statistical models', desc: 'Financial forecasting with trend predictions using statistical analysis and time-series models.' },
    { name: 'Portfolio Engine', icon: PieChart, color: '#34d399', signals: 'Optimization', desc: 'Portfolio analysis with asset allocation, performance tracking, and optimization recommendations.' },
]

const PAGES = {
    'Public': { color: '#22d3ee', icon: Globe, pages: [
        'Landing Page', 'About', 'Contact', 'Product Features'
    ]},
    'Authentication': { color: '#a78bfa', icon: Fingerprint, pages: [
        'Login (Social + Passkey)', 'Register (Multi-step)', 'Forgot Password (OTP)'
    ]},
    'Customer Banking': { color: '#34d399', icon: Wallet, pages: [
        'Dashboard (KPI + Charts)', 'Accounts', 'Transfer', 'Transactions',
        'Loans', 'Cards', 'Statements', 'Profile',
        'Support', 'AI Assistant', 'Bill Pay', 'Investments',
        'Multi-Currency', 'First Transaction', 'Transaction Lifecycle'
    ]},
    'Admin Console': { color: '#f59e0b', icon: Settings, pages: [
        'Admin Dashboard', 'User Management', 'Admin Transactions',
        'Admin Analytics', 'Fraud Monitoring', 'Compliance',
        'Audit Logs', 'System Settings', 'DSA Showcase',
        'Development Roadmap', 'Rate Limiting', 'Open Banking',
        'Feature Flags', 'Monitoring', 'Backup Manager', 'Project Description'
    ]},
}

const SECURITY_LAYERS = [
    { name: 'JWT Authentication', icon: Lock, color: '#22d3ee', desc: 'Access and refresh tokens with automatic renewal and session management' },
    { name: 'TOTP MFA', icon: Fingerprint, color: '#a78bfa', desc: 'Time-based one-time passwords for two-factor authentication on every login' },
    { name: 'RBAC', icon: Users, color: '#34d399', desc: '5 roles: Super Admin, Compliance Officer, Support Agent, Analytics Viewer, User' },
    { name: 'Rate Limiting', icon: Activity, color: '#f59e0b', desc: 'Redis-backed sliding window counters preventing brute-force and API abuse' },
    { name: 'OWASP Headers', icon: Shield, color: '#fb7185', desc: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options on every response' },
    { name: 'Hash-Chain Audit', icon: Binary, color: '#22d3ee', desc: 'SHA-256 linked audit entries — blockchain-lite tamper-proof integrity verification' },
]

const TIMELINE = [
    { phase: 'Phase 1', name: 'Foundation & Architecture', days: 'Days 1–5', color: '#22d3ee', percent: 100, highlights: 'Project setup, DB design, Auth, DSA Part 1 & 2, Banking Service' },
    { phase: 'Phase 2', name: 'Core Banking + DSA Engine', days: 'Days 6–12', color: '#a78bfa', percent: 100, highlights: 'REST API, Analytics, Search, Fraud, Loan Scoring, Risk, WebSocket' },
    { phase: 'Phase 3', name: 'Intelligence & AI Engines', days: 'Days 13–18', color: '#34d399', percent: 100, highlights: 'AML, Forecasting, Portfolio, Intelligence API routes' },
    { phase: 'Phase 4', name: 'React Frontend & UI', days: 'Days 19–24', color: '#f59e0b', percent: 100, highlights: 'Auth pages, Dashboard, Banking pages, Admin console, Public pages' },
    { phase: 'Phase 5', name: 'Security Hardening', days: 'Days 25–30', color: '#fb7185', percent: 100, highlights: 'Middleware, RBAC, Audit system, Unit tests, Docker' },
    { phase: 'Phase 6', name: 'Premium Features', days: 'Days 31–35', color: '#22d3ee', percent: 100, highlights: 'DSA Showcase, AI Chatbot, Rate Limiting Dashboard, Roadmap page' },
    { phase: 'Phase 7', name: 'Sci-Fi Theme & Rebrand', days: 'Days 36–40', color: '#a78bfa', percent: 100, highlights: 'NEXA rebrand, Glassmorphism, Neon glow, Animation system' },
    { phase: 'Phase 8', name: 'Production Critical', days: 'Days 41–45', color: '#34d399', percent: 100, highlights: 'OAuth, WebAuthn, Email, TLS, Transaction Export, CI/CD' },
    { phase: 'Phase 9', name: 'Infrastructure', days: 'Days 46–50', color: '#f59e0b', percent: 100, highlights: 'Monitoring, Logging, Backups, API Docs, Load Testing' },
    { phase: 'Phase 10', name: 'Final QA & Launch', days: 'Days 56–60', color: '#fb7185', percent: 60, highlights: 'E2E testing, Compliance checklist, Documentation, Go-live' },
]

const PROJECT_STATS = [
    { label: 'Backend Services', value: '18+', color: '#a78bfa', icon: Server },
    { label: 'Frontend Pages', value: '36+', color: '#34d399', icon: Layout },
    { label: 'API Endpoints', value: '50+', color: '#22d3ee', icon: Globe },
    { label: 'DSA Structures', value: '9', color: '#f59e0b', icon: Binary },
    { label: 'AI Engines', value: '8', color: '#fb7185', icon: Brain },
    { label: 'Security Layers', value: '6', color: '#22d3ee', icon: Shield },
    { label: 'Sorting Algorithms', value: '4', color: '#a78bfa', icon: SortAsc },
    { label: 'Dev Phases', value: '10', color: '#34d399', icon: GitBranch },
]

/* ═══════════════ COMPONENTS ═══════════════ */

function SectionHeader({ icon: Icon, title, subtitle, color }) {
    return (
        <div style={sSection}>
            <motion.h2
                style={{ ...sHeading, color }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: color + '18', border: `1px solid ${color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={18} color={color} />
                </div>
                {title}
            </motion.h2>
            {subtitle && <p style={sSub}>{subtitle}</p>}
        </div>
    )
}

function StatCard({ item, index }) {
    const I = item.icon
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            style={{ ...sCard, textAlign: 'center', padding: '1.25rem' }}
        >
            <I size={20} color={item.color} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 32, fontWeight: 900, color: item.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.label}</div>
        </motion.div>
    )
}

function ExpandableSection({ title, icon: Icon, color, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div style={{ marginBottom: 12 }}>
            <motion.div
                onClick={() => setOpen(!open)}
                style={{
                    ...sCard,
                    cursor: 'pointer',
                    borderLeft: `3px solid ${color}`,
                    padding: '1rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}
                whileHover={{ borderColor: color + '66' }}
            >
                <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: color + '18', border: `1px solid ${color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Icon size={16} color={color} />
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                    {title}
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} color="var(--nx-text-dim)" />
                </motion.div>
            </motion.div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingLeft: 20, paddingTop: 12 }}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════════════ MAIN PAGE ═══════════════ */

export default function ProjectDescription() {
    return (
        <div>
            {/* ─── HERO ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}
            >
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 18px', borderRadius: 999,
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
                        fontSize: 11, fontWeight: 700, color: '#22d3ee',
                        fontFamily: 'var(--font-display)', letterSpacing: '0.14em',
                        marginBottom: 18,
                    }}
                >
                    <Zap size={12} /> v3.0.0 — PRODUCTION READY
                </motion.div>

                <h1 style={{
                    fontSize: 38, fontWeight: 900, fontFamily: 'var(--font-display)',
                    letterSpacing: '0.12em',
                    background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #34d399)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.2, marginBottom: 12,
                }}>
                    NEXA
                </h1>
                <p style={{
                    fontSize: 15, color: 'var(--nx-text-muted)', fontFamily: 'var(--font-display)',
                    letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8,
                }}>
                    Beyond Fintech
                </p>
                <p style={{ fontSize: 14, color: 'var(--nx-text-muted)', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
                    Enterprise-grade digital banking platform built for institutional trust, regulatory compliance,
                    and intelligent financial management. Powered by <span style={{ color: '#22d3ee' }}>9 DSA engines</span>,{' '}
                    <span style={{ color: '#a78bfa' }}>8 AI services</span>, and a{' '}
                    <span style={{ color: '#34d399' }}>futuristic sci-fi interface</span>.
                </p>
            </motion.div>

            {/* ─── STATS ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 48 }}>
                {PROJECT_STATS.map((s, i) => <StatCard key={s.label} item={s} index={i} />)}
            </div>

            {/* ─── ARCHITECTURE ─── */}
            <SectionHeader icon={Cpu} title="SYSTEM ARCHITECTURE" subtitle="Full-stack architecture overview: React SPA communicates with FastAPI through RESTful endpoints, backed by PostgreSQL for persistence and Redis for caching." color="#22d3ee" />
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ ...sCard, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8, color: 'var(--nx-text-muted)', marginBottom: 48, overflowX: 'auto' }}
            >
                <pre style={{ margin: 0, whiteSpace: 'pre' }}>{`
┌───────────────────────────────────────────────────────────────────────────────┐
│                          NEXA Platform Architecture                          │
├──────────────────────────┬────────────────────────────────────────────────────┤
│   ⚛️  React SPA (Vite)   │   🐍 FastAPI Backend                              │
│   ├─ Glassmorphism UI    │   ├─ Authentication (JWT + MFA + OAuth)           │
│   ├─ Framer Motion       │   ├─ Banking API (CRUD + Transfers)              │
│   ├─ Recharts            │   ├─ Admin Console API                           │
│   ├─ 36+ Pages           │   ├─ Fraud Detection Engine (6-signal)           │
│   ├─ Lazy Loading        │   ├─ AML Compliance Engine                       │
│   └─ Lucide Icons        │   ├─ Risk Intelligence Suite                     │
│                          │   ├─ Loan Scoring (7-factor model)               │
│   📱 Responsive          │   ├─ Analytics Engine (13 chart types)           │
│   🎨 Sci-Fi Theme        │   ├─ Search Engine (Trie + Fuzzy)               │
│   🌙 Dark Mode           │   ├─ AI Chatbot Assistant                       │
│                          │   └─ WebSocket (Real-time push)                  │
├──────────────────────────┴────────────────────────────────────────────────────┤
│   🗄️  PostgreSQL 15    │   ⚡ Redis 7        │   🐳 Docker Compose          │
│   ACID Compliance       │   Rate Limiting      │   Multi-service             │
│   Session Management    │   Caching Layer      │   CI/CD Ready               │
└───────────────────────────────────────────────────────────────────────────────┘
                `}</pre>
            </motion.div>

            {/* ─── TECH STACK ─── */}
            <SectionHeader icon={Code2} title="TECHNOLOGY STACK" subtitle="A carefully curated set of modern technologies chosen for performance, security, and developer experience." color="#a78bfa" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 48 }}>
                {TECH_STACK.map(cat => (
                    <ExpandableSection key={cat.category} title={cat.category} icon={cat.icon} color={cat.color} defaultOpen={cat.category === 'Frontend'}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                            {cat.techs.map(t => (
                                <div key={t.name} style={{ ...sCard, padding: '12px 14px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: cat.color, marginBottom: 4 }}>{t.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{t.desc}</div>
                                </div>
                            ))}
                        </div>
                    </ExpandableSection>
                ))}
            </div>

            {/* ─── DSA ENGINE ─── */}
            <SectionHeader icon={Binary} title="DSA ENGINE — 9 STRUCTURES" subtitle="The core banking engine is powered by 9 classical Data Structures & Algorithms, each mapped to a real-world banking operation." color="#34d399" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, marginBottom: 48 }}>
                {DSA_STRUCTURES.map((dsa, i) => {
                    const I = dsa.icon
                    return (
                        <motion.div
                            key={dsa.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            style={{ ...sCard, borderTop: `2px solid ${dsa.color}44` }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: dsa.color + '18', border: `1px solid ${dsa.color}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <I size={16} color={dsa.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)' }}>{dsa.name}</div>
                                    <div style={{ fontSize: 10, color: dsa.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{dsa.use}</div>
                                </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>{dsa.desc}</p>
                        </motion.div>
                    )
                })}
            </div>

            {/* ─── AI ENGINES ─── */}
            <SectionHeader icon={Brain} title="AI & INTELLIGENCE SUITE" subtitle="8 purpose-built engines providing fraud detection, compliance monitoring, risk analysis, and financial intelligence." color="#a78bfa" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, marginBottom: 48 }}>
                {AI_ENGINES.map((eng, i) => {
                    const I = eng.icon
                    return (
                        <motion.div
                            key={eng.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            style={{ ...sCard }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: eng.color + '18', border: `1px solid ${eng.color}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <I size={16} color={eng.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)' }}>{eng.name}</div>
                                    <div style={{ fontSize: 10, color: eng.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{eng.signals}</div>
                                </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>{eng.desc}</p>
                        </motion.div>
                    )
                })}
            </div>

            {/* ─── PAGES ─── */}
            <SectionHeader icon={Layout} title="36+ FRONTEND PAGES" subtitle="A comprehensive set of pages covering public marketing, authentication, customer banking, and admin operations." color="#34d399" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 48 }}>
                {Object.entries(PAGES).map(([group, data]) => (
                    <ExpandableSection key={group} title={`${group} (${data.pages.length})`} icon={data.icon} color={data.color} defaultOpen={group === 'Customer Banking'}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                            {data.pages.map(page => (
                                <div key={page} style={{
                                    padding: '10px 14px', borderRadius: 8,
                                    background: data.color + '08', border: `1px solid ${data.color}22`,
                                    fontSize: 12, fontWeight: 500, color: 'var(--nx-text)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <CheckCircle size={12} color={data.color} />
                                    {page}
                                </div>
                            ))}
                        </div>
                    </ExpandableSection>
                ))}
            </div>

            {/* ─── SECURITY ─── */}
            <SectionHeader icon={Shield} title="SECURITY & COMPLIANCE" subtitle="6 layers of defense protecting user data, preventing fraud, and ensuring regulatory compliance." color="#fb7185" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 48 }}>
                {SECURITY_LAYERS.map((sec, i) => {
                    const I = sec.icon
                    return (
                        <motion.div
                            key={sec.name}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            style={{ ...sCard, display: 'flex', alignItems: 'flex-start', gap: 14 }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: sec.color + '18', border: `1px solid ${sec.color}33`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <I size={18} color={sec.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', marginBottom: 4 }}>{sec.name}</div>
                                <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>{sec.desc}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* ─── DEVELOPMENT TIMELINE ─── */}
            <SectionHeader icon={GitBranch} title="DEVELOPMENT TIMELINE" subtitle="60-day journey from initial concept to production-ready enterprise banking platform, across 10 distinct phases." color="#f59e0b" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
                {TIMELINE.map((phase, i) => (
                    <motion.div
                        key={phase.phase}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        style={{ ...sCard, padding: '14px 18px', borderLeft: `3px solid ${phase.color}` }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{
                                padding: '3px 10px', borderRadius: 6,
                                background: phase.color + '18', border: `1px solid ${phase.color}33`,
                                fontSize: 10, fontWeight: 800, color: phase.color,
                                fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
                            }}>
                                {phase.phase}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', flex: 1 }}>{phase.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', fontFamily: 'var(--font-mono)' }}>{phase.days}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--nx-text-dim)', marginBottom: 8 }}>{phase.highlights}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${phase.percent}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: i * 0.08 }}
                                    style={{ height: '100%', background: `linear-gradient(90deg, ${phase.color}, ${phase.color}88)`, borderRadius: 2 }}
                                />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: phase.color, fontFamily: 'var(--font-mono)', minWidth: 35, textAlign: 'right' }}>
                                {phase.percent}%
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ─── BACKEND SERVICES ─── */}
            <SectionHeader icon={Server} title="BACKEND SERVICES" subtitle="18+ specialized service modules powering the banking engine, each with dedicated API routes." color="#22d3ee" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 48 }}>
                {[
                    { name: 'banking_service.py', desc: 'Core banking + DSA hub', color: '#22d3ee' },
                    { name: 'analytics_engine.py', desc: '13 chart generators', color: '#a78bfa' },
                    { name: 'fraud_engine.py', desc: '6-signal fraud scorer', color: '#fb7185' },
                    { name: 'search_engine.py', desc: 'Trie + fuzzy search', color: '#34d399' },
                    { name: 'loan_scoring.py', desc: '7-factor loan model', color: '#f59e0b' },
                    { name: 'risk_intelligence.py', desc: 'Portfolio risk suite', color: '#22d3ee' },
                    { name: 'aml_engine.py', desc: 'Anti-money laundering', color: '#a78bfa' },
                    { name: 'forecasting_engine.py', desc: 'Financial forecasting', color: '#34d399' },
                    { name: 'portfolio_engine.py', desc: 'Portfolio optimization', color: '#f59e0b' },
                    { name: 'oauth_service.py', desc: 'Social login (OAuth)', color: '#fb7185' },
                    { name: 'webauthn_service.py', desc: 'Passkey / FIDO2', color: '#22d3ee' },
                    { name: 'email_service.py', desc: 'OTP & notification emails', color: '#a78bfa' },
                    { name: 'billpay_service.py', desc: 'Scheduled payments', color: '#34d399' },
                    { name: 'multicurrency_service.py', desc: '20+ currencies, FX rates', color: '#f59e0b' },
                    { name: 'export_service.py', desc: 'PDF/CSV statements', color: '#fb7185' },
                    { name: 'feature_flags.py', desc: 'A/B testing & rollouts', color: '#22d3ee' },
                    { name: 'security_engine.py', desc: 'Security analysis', color: '#a78bfa' },
                    { name: 'imperial_api.py', desc: 'Imperial integration', color: '#34d399' },
                ].map((svc, i) => (
                    <motion.div
                        key={svc.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        style={{ ...sCard, padding: '12px 14px' }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 700, color: svc.color, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{svc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{svc.desc}</div>
                    </motion.div>
                ))}
            </div>

            {/* ─── FOOTER ─── */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{
                    ...sCard,
                    textAlign: 'center',
                    padding: '2rem',
                    borderTop: '2px solid rgba(34,211,238,0.15)',
                    marginBottom: 20,
                }}
            >
                <div style={{
                    fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-display)',
                    letterSpacing: '0.14em',
                    background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 8,
                }}>
                    NEXA — BEYOND FINTECH
                </div>
                <p style={{ fontSize: 12, color: 'var(--nx-text-dim)', marginBottom: 12 }}>
                    Enterprise Digital Banking Platform · 60 Days of Development · 10 Phases · v3.0.0
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: 'var(--nx-text-dim)' }}>
                    <span>🐍 FastAPI</span>
                    <span>⚛️ React 18</span>
                    <span>🗄️ PostgreSQL</span>
                    <span>⚡ Redis</span>
                    <span>🐳 Docker</span>
                    <span>🔒 JWT + MFA</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginTop: 16, fontFamily: 'var(--font-mono)' }}>
                    © 2026 NEXA — All rights reserved.
                </div>
            </motion.div>
        </div>
    )
}
