import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe as GlobeIcon, ArrowRightLeft, DollarSign, TrendingUp, Zap, MapPin, Satellite, RotateCcw, Activity, CreditCard, Clock, Users, ZoomIn, ZoomOut } from 'lucide-react'
import { EnhancedGlobeWrapper } from '../../components/enhancements'

/* ═══════════════════════════════════════════════════════════
   NEXUS GLOBAL FINANCE — 3D SATELLITE GLOBE
   Real-time worldwide payments & capital flow visualization
   ═══════════════════════════════════════════════════════════ */

/* ── Major Financial Cities ── */
const CITIES = [
    { id: 'nyc', name: 'New York', country: 'US', lat: 40.7, lng: -74.0, color: '#22d3ee', tier: 1 },
    { id: 'ldn', name: 'London', country: 'UK', lat: 51.5, lng: -0.1, color: '#a78bfa', tier: 1 },
    { id: 'tky', name: 'Tokyo', country: 'JP', lat: 35.7, lng: 139.7, color: '#34d399', tier: 1 },
    { id: 'shg', name: 'Shanghai', country: 'CN', lat: 31.2, lng: 121.5, color: '#fbbf24', tier: 1 },
    { id: 'sgp', name: 'Singapore', country: 'SG', lat: 1.3, lng: 103.8, color: '#22d3ee', tier: 1 },
    { id: 'hkg', name: 'Hong Kong', country: 'HK', lat: 22.3, lng: 114.2, color: '#a78bfa', tier: 1 },
    { id: 'fra', name: 'Frankfurt', country: 'DE', lat: 50.1, lng: 8.7, color: '#34d399', tier: 2 },
    { id: 'zrh', name: 'Zurich', country: 'CH', lat: 47.4, lng: 8.5, color: '#fbbf24', tier: 2 },
    { id: 'dxb', name: 'Dubai', country: 'AE', lat: 25.2, lng: 55.3, color: '#f59e0b', tier: 2 },
    { id: 'syd', name: 'Sydney', country: 'AU', lat: -33.9, lng: 151.2, color: '#22d3ee', tier: 2 },
    { id: 'mum', name: 'Mumbai', country: 'IN', lat: 19.1, lng: 72.9, color: '#fb7185', tier: 2 },
    { id: 'sao', name: 'São Paulo', country: 'BR', lat: -23.6, lng: -46.6, color: '#34d399', tier: 2 },
    { id: 'jnb', name: 'Johannesburg', country: 'ZA', lat: -26.2, lng: 28.0, color: '#fbbf24', tier: 3 },
    { id: 'tor', name: 'Toronto', country: 'CA', lat: 43.7, lng: -79.4, color: '#a78bfa', tier: 3 },
    { id: 'par', name: 'Paris', country: 'FR', lat: 48.9, lng: 2.3, color: '#22d3ee', tier: 3 },
    { id: 'sel', name: 'Seoul', country: 'KR', lat: 37.6, lng: 127.0, color: '#fb7185', tier: 3 },
]

/* ── Payment Types for Simulation ── */
const PAYMENT_TYPES = ['SWIFT', 'Wire Transfer', 'SEPA', 'ACH', 'Crypto', 'FX Swap', 'Trade Settlement', 'Remittance']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'SGD', 'AED', 'AUD', 'INR', 'BRL', 'CHF', 'HKD', 'CAD', 'KRW', 'ZAR']

/* ── Region Aggregates ── */
const REGIONS = [
    { id: 'na', name: 'North America', color: '#22d3ee', baseVolume: 4.2, baseFlows: 82 },
    { id: 'eu', name: 'Europe', color: '#a78bfa', baseVolume: 3.1, baseFlows: 45 },
    { id: 'asia', name: 'Asia Pacific', color: '#34d399', baseVolume: 5.8, baseFlows: 120 },
    { id: 'me', name: 'Middle East', color: '#fbbf24', baseVolume: 0.8, baseFlows: 15 },
    { id: 'sa', name: 'South America', color: '#fb7185', baseVolume: 0.6, baseFlows: -8 },
    { id: 'af', name: 'Africa', color: '#f59e0b', baseVolume: 0.3, baseFlows: 5 },
]

/* ── Satellites ── */
const SATELLITES = [
    { id: 1, orbitRadius: 178, speed: 14, offset: 0, tilt: 20, color: '#22d3ee', name: 'NX-SAT-1' },
    { id: 2, orbitRadius: 195, speed: 22, offset: 120, tilt: -15, color: '#a78bfa', name: 'NX-SAT-2' },
    { id: 3, orbitRadius: 165, speed: 30, offset: 240, tilt: 35, color: '#34d399', name: 'NX-SAT-3' },
]

/* ── Detailed Continent Polygons ── */
const CONTINENTS = {
    na: { points: [[72,-168],[71,-156],[70,-141],[63,-140],[60,-128],[55,-133],[50,-128],[48,-124],[40,-124],[35,-120],[32,-117],[28,-105],[26,-98],[25,-90],[30,-85],[25,-82],[25,-78],[32,-75],[37,-76],[40,-74],[43,-70],[45,-64],[47,-53],[52,-56],[55,-60],[60,-65],[58,-75],[55,-95],[60,-110],[60,-140],[65,-168]], color: 'rgba(34,211,238,0.12)', stroke: 'rgba(34,211,238,0.2)' },
    sa: { points: [[12,-73],[10,-67],[7,-60],[5,-52],[2,-50],[-2,-45],[-5,-35],[-10,-37],[-15,-40],[-18,-40],[-23,-43],[-28,-49],[-33,-52],[-40,-62],[-48,-66],[-55,-69],[-55,-64],[-52,-60],[-45,-60],[-38,-57],[-30,-48],[-22,-41],[-15,-38],[-10,-37],[-5,-35],[0,-50],[5,-58],[8,-63],[12,-73]], color: 'rgba(251,113,133,0.1)', stroke: 'rgba(251,113,133,0.18)' },
    eu: { points: [[37,-8],[38,-5],[36,0],[38,5],[40,2],[43,5],[45,7],[47,1],[48,3],[50,5],[52,5],[54,8],[55,12],[57,10],[60,5],[60,10],[62,15],[65,14],[66,18],[68,20],[70,28],[68,30],[64,32],[60,30],[56,28],[54,22],[52,21],[50,20],[48,18],[45,15],[42,14],[40,20],[42,25],[40,28],[38,24],[36,28],[38,22],[36,15],[37,12],[39,3],[37,-8]], color: 'rgba(167,139,250,0.12)', stroke: 'rgba(167,139,250,0.2)' },
    af: { points: [[35,-5],[37,10],[33,12],[32,18],[30,30],[28,33],[20,38],[15,42],[12,44],[8,42],[5,40],[2,10],[0,10],[-5,12],[-10,14],[-15,12],[-20,14],[-25,16],[-28,18],[-30,22],[-34,26],[-35,20],[-30,28],[-34,18],[-28,15],[-20,12],[-15,10],[-10,14],[-5,12],[0,10],[2,10],[5,1],[10,-5],[15,-17],[20,-17],[25,-16],[30,-10],[35,-5]], color: 'rgba(245,158,11,0.1)', stroke: 'rgba(245,158,11,0.18)' },
    asia: { points: [[42,30],[45,35],[48,40],[52,45],[55,55],[52,60],[54,68],[50,75],[52,80],[55,73],[60,60],[62,50],[65,60],[67,65],[70,70],[72,80],[72,100],[70,120],[68,135],[67,140],[63,138],[58,140],[55,132],[47,142],[43,146],[42,132],[40,128],[35,135],[34,130],[30,122],[22,115],[20,110],[15,100],[8,105],[5,95],[8,80],[10,78],[15,75],[20,72],[25,68],[32,48],[35,35],[38,30],[42,30]], color: 'rgba(52,211,153,0.1)', stroke: 'rgba(52,211,153,0.18)' },
    au: { points: [[-18,122],[-14,127],[-12,131],[-12,136],[-15,141],[-19,146],[-25,150],[-28,154],[-33,152],[-37,150],[-39,147],[-38,141],[-35,137],[-32,134],[-32,128],[-28,122],[-24,114],[-20,114],[-18,122]], color: 'rgba(59,130,246,0.1)', stroke: 'rgba(59,130,246,0.18)' },
}

/* ═══════ Random helpers ═══════ */
const randBetween = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.floor(randBetween(a, b))
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
const formatAmount = (n) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
    return `$${n.toFixed(0)}`
}

/* ═══════ Generate a random live payment ═══════ */
function generatePayment(id) {
    const from = randItem(CITIES)
    let to = randItem(CITIES)
    while (to.id === from.id) to = randItem(CITIES)
    const amount = from.tier === 1 && to.tier === 1
        ? randBetween(5e6, 500e6)
        : from.tier <= 2 ? randBetween(100e3, 50e6) : randBetween(10e3, 5e6)
    return {
        id, from, to, amount,
        type: randItem(PAYMENT_TYPES),
        currency: randItem(CURRENCIES),
        timestamp: new Date(),
        progress: 0,
        color: from.color,
    }
}

/* ═══════ 3D Sphere Projection ═══════ */
function useProjection(cx, cy, R, rotation) {
    return useCallback((lat, lng) => {
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lng + rotation) * (Math.PI / 180)
        const x3d = R * Math.sin(phi) * Math.cos(theta)
        const y3d = R * Math.cos(phi)
        const z3d = R * Math.sin(phi) * Math.sin(theta)
        const perspective = 600
        const scale = perspective / (perspective + z3d)
        return {
            x: cx + x3d * scale,
            y: cy - y3d * scale,
            z: z3d,
            visible: z3d > -R * 0.15,
            scale,
            opacity: Math.max(0, Math.min(1, (z3d + R * 0.5) / R)),
        }
    }, [cx, cy, R, rotation])
}

/* ═══════ Star Field Background ═══════ */
function StarField() {
    const stars = useRef(
        Array.from({ length: 80 }, () => ({
            x: Math.random() * 420, y: Math.random() * 420,
            r: 0.3 + Math.random() * 0.8,
            o: 0.2 + Math.random() * 0.5,
            twinkle: 2 + Math.random() * 4,
        }))
    )
    return (
        <g>
            {stars.current.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e0e7ff" opacity={s.o}>
                    <animate attributeName="opacity" values={`${s.o};${s.o * 0.3};${s.o}`} dur={`${s.twinkle}s`} repeatCount="indefinite" />
                </circle>
            ))}
        </g>
    )
}

/* ═══════ Payment Arc Animation ═══════ */
function PaymentArc({ payment, project }) {
    const pFrom = project(payment.from.lat, payment.from.lng)
    const pTo = project(payment.to.lat, payment.to.lng)
    if (!pFrom.visible && !pTo.visible) return null

    const dx = pTo.x - pFrom.x
    const dy = pTo.y - pFrom.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const arcHeight = Math.max(25, dist * 0.35)
    const midX = (pFrom.x + pTo.x) / 2
    const midY = (pFrom.y + pTo.y) / 2 - arcHeight
    const pathD = `M${pFrom.x},${pFrom.y} Q${midX},${midY} ${pTo.x},${pTo.y}`
    const avgOpacity = (pFrom.opacity + pTo.opacity) / 2

    return (
        <g opacity={Math.max(0.2, avgOpacity)}>
            {/* Trail */}
            <path d={pathD} fill="none" stroke={payment.color} strokeWidth="1.2" opacity="0.15" />
            {/* Animated glow line */}
            <path d={pathD} fill="none" stroke={payment.color} strokeWidth="1.5" opacity="0.6"
                strokeDasharray={`${dist * 0.15} ${dist * 0.85}`}
                style={{ filter: `drop-shadow(0 0 3px ${payment.color})` }}>
                <animate attributeName="stroke-dashoffset" from={dist} to={0}
                    dur="2.5s" repeatCount="1" fill="freeze" />
            </path>
            {/* Flying payment dot */}
            <circle r="3" fill={payment.color} style={{ filter: `drop-shadow(0 0 6px ${payment.color})` }}>
                <animateMotion dur="2.5s" repeatCount="1" fill="freeze" path={pathD} />
                <animate attributeName="r" values="2;4;2" dur="2.5s" repeatCount="1" />
            </circle>
            {/* Amount label traveling with dot */}
            <text fontSize="7" fill={payment.color} fontFamily="var(--font-mono)" fontWeight="600"
                style={{ filter: `drop-shadow(0 0 2px rgba(0,0,0,0.8))` }}>
                <animateMotion dur="2.5s" repeatCount="1" fill="freeze" path={pathD} />
                <tspan dy="-8">{formatAmount(payment.amount)}</tspan>
            </text>
            {/* Origin pulse */}
            {pFrom.visible && (
                <circle cx={pFrom.x} cy={pFrom.y} r="2" fill="none" stroke={payment.color} strokeWidth="1" opacity="0.6">
                    <animate attributeName="r" values="2;10;2" dur="1.5s" repeatCount="1" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="1" />
                </circle>
            )}
        </g>
    )
}

/* ═══════ MAIN GLOBE COMPONENT ═══════ */
export default function GlobePage() {
    const [rotation, setRotation] = useState(0)
    const [autoRotate, setAutoRotate] = useState(true)
    const [livePayments, setLivePayments] = useState([])
    const [txFeed, setTxFeed] = useState([])
    const [stats, setStats] = useState({ totalTx: 0, totalVol: 0, activeCorridors: 0, tps: 0 })
    const [zoom, setZoom] = useState(1)
    const [selectedCity, setSelectedCity] = useState(null)
    const [regionVolumes, setRegionVolumes] = useState(() =>
        REGIONS.map(r => ({ ...r, volume: r.baseVolume + randBetween(-0.3, 0.3), flows: r.baseFlows + randInt(-10, 10) }))
    )
    const animRef = useRef(null)
    const paymentIdRef = useRef(0)
    const totalTxRef = useRef(0)
    const totalVolRef = useRef(0)

    const cx = 210, cy = 210, R = 150
    const project = useProjection(cx, cy, R, rotation)

    // ── Auto-rotate ──
    useEffect(() => {
        if (!autoRotate) { cancelAnimationFrame(animRef.current); return }
        const animate = () => {
            setRotation(prev => (prev + 0.12) % 360)
            animRef.current = requestAnimationFrame(animate)
        }
        animRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animRef.current)
    }, [autoRotate])

    // ── Live Payment Spawner ──
    useEffect(() => {
        const spawnPayment = () => {
            paymentIdRef.current++
            const payment = generatePayment(paymentIdRef.current)
            totalTxRef.current++
            totalVolRef.current += payment.amount

            setLivePayments(prev => [...prev.slice(-12), payment])
            setTxFeed(prev => [payment, ...prev].slice(0, 8))
            setStats({
                totalTx: totalTxRef.current,
                totalVol: totalVolRef.current,
                activeCorridors: Math.min(16, Math.floor(totalTxRef.current / 3) + 6),
                tps: (2 + Math.random() * 3).toFixed(1),
            })

            // Remove old payment arcs after animation completes
            setTimeout(() => {
                setLivePayments(prev => prev.filter(p => p.id !== payment.id))
            }, 3000)
        }

        // Initial burst
        for (let i = 0; i < 3; i++) setTimeout(() => spawnPayment(), i * 400)

        // Continuous spawner — every 1.2–2.5 seconds
        const interval = setInterval(() => {
            spawnPayment()
            // Occasionally spawn 2 at once for realism
            if (Math.random() > 0.6) setTimeout(spawnPayment, 200 + Math.random() * 500)
        }, 1200 + Math.random() * 1300)

        return () => clearInterval(interval)
    }, [])

    // ── Dynamic region volumes — update every 5s ──
    useEffect(() => {
        const interval = setInterval(() => {
            setRegionVolumes(REGIONS.map(r => ({
                ...r,
                volume: r.baseVolume + randBetween(-0.4, 0.4),
                flows: r.baseFlows + randInt(-12, 12),
            })))
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    // ── Grid lines ──
    const gridLines = []
    for (let lat = -60; lat <= 60; lat += 30) {
        const pts = []
        for (let lng = 0; lng <= 360; lng += 4) {
            const p = project(lat, lng)
            if (p.visible) pts.push(`${p.x},${p.y}`)
            else if (pts.length > 1) { gridLines.push(pts.join(' ')); pts.length = 0 }
        }
        if (pts.length > 1) gridLines.push(pts.join(' '))
    }
    for (let lng = 0; lng < 360; lng += 30) {
        const pts = []
        for (let lat = -80; lat <= 80; lat += 4) {
            const p = project(lat, lng)
            if (p.visible) pts.push(`${p.x},${p.y}`)
            else if (pts.length > 1) { gridLines.push(pts.join(' ')); pts.length = 0 }
        }
        if (pts.length > 1) gridLines.push(pts.join(' '))
    }

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en', { hour12: false })

    return (
        <div className="animate-in">
            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <GlobeIcon size={26} color="#22d3ee" /> GLOBAL FINANCE
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        Real-time worldwide payments & satellite intelligence — <span className="nx-mono" style={{ color: '#22d3ee' }}>{timeStr} UTC</span>
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 11, padding: '0.4rem 0.7rem' }}
                        onClick={() => setZoom(z => Math.min(2, z + 0.2))} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <ZoomIn size={13} />
                    </motion.button>
                    <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 11, padding: '0.4rem 0.7rem' }}
                        onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <ZoomOut size={13} />
                    </motion.button>
                    <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 11 }}
                        onClick={() => setAutoRotate(!autoRotate)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <RotateCcw size={13} /> {autoRotate ? 'Pause' : 'Rotate'}
                    </motion.button>
                    <div className="nx-live-indicator"><div className="dot" /> Live</div>
                </div>
            </motion.div>

            {/* ── Live Stats Bar ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                {[
                    { label: 'Transactions Today', value: stats.totalTx.toLocaleString(), icon: CreditCard, color: 'cyan', sub: `${stats.tps} tx/s` },
                    { label: 'Volume Processed', value: formatAmount(stats.totalVol), icon: DollarSign, color: 'emerald', sub: 'Real-time' },
                    { label: 'Active Corridors', value: stats.activeCorridors.toString(), icon: ArrowRightLeft, color: 'violet', sub: `${CITIES.length} cities` },
                    { label: 'Uptime', value: '99.97%', icon: Activity, color: 'amber', sub: 'SLA met' },
                ].map((k, i) => (
                    <motion.div key={i} className={`nx-kpi ${k.color}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{k.label}</div>
                            <k.icon size={14} color={`var(--nx-${k.color})`} style={{ opacity: 0.6 }} />
                        </div>
                        <div className="nx-mono" style={{ fontSize: 22, fontWeight: 700, color: `var(--nx-${k.color})`, marginTop: 6 }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginTop: 2 }}>{k.sub}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Satellite Status Strip ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {SATELLITES.map(sat => (
                    <div key={sat.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        borderRadius: 8, background: `${sat.color}06`, border: `1px solid ${sat.color}12`,
                    }}>
                        <Satellite size={11} color={sat.color} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: sat.color, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{sat.name}</span>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: sat.color, boxShadow: `0 0 4px ${sat.color}` }} />
                        <span style={{ fontSize: 8, color: 'var(--nx-text-dim)' }}>ONLINE</span>
                    </div>
                ))}
            </div>

            {/* ── Globe + Sidebar ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                {/* Globe — wrapped with Three.js 3D enhancement layer */}
                <EnhancedGlobeWrapper cities={CITIES} payments={livePayments}>
                <motion.div className="nx-chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ padding: '0.75rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem 0.5rem' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            PAYMENT FLOW MAP — 3D SATELLITE VIEW
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="nx-mono" style={{ fontSize: 9, color: 'var(--nx-text-dim)' }}>
                                {livePayments.length} active
                            </span>
                            <span className="nx-badge nx-badge-cyan" style={{ fontSize: 8 }}>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22d3ee', display: 'inline-block', marginRight: 4, boxShadow: '0 0 4px #22d3ee', animation: 'pulse-soft 1.5s infinite' }} />
                                LIVE
                            </span>
                        </div>
                    </div>

                    <svg viewBox="0 0 420 420" style={{ width: '100%', height: 'auto', maxHeight: '60vh', transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}>
                        <defs>
                            <radialGradient id="ocean" cx="42%" cy="38%">
                                <stop offset="0%" stopColor="#0a1a3a" />
                                <stop offset="40%" stopColor="#06132e" />
                                <stop offset="80%" stopColor="#040e22" />
                                <stop offset="100%" stopColor="#020818" />
                            </radialGradient>
                            <radialGradient id="atmosphere" cx="40%" cy="35%">
                                <stop offset="82%" stopColor="transparent" />
                                <stop offset="90%" stopColor="rgba(34,211,238,0.04)" />
                                <stop offset="95%" stopColor="rgba(34,211,238,0.08)" />
                                <stop offset="100%" stopColor="rgba(34,211,238,0.14)" />
                            </radialGradient>
                            <radialGradient id="sun-highlight" cx="32%" cy="28%">
                                <stop offset="0%" stopColor="rgba(200,220,255,0.04)" />
                                <stop offset="50%" stopColor="rgba(100,140,200,0.02)" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                            <radialGradient id="shadow" cx="70%" cy="65%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="60%" stopColor="rgba(0,0,0,0.15)" />
                                <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                            </radialGradient>
                            <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            <filter id="bigGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>

                        {/* Stars */}
                        <StarField />

                        {/* Globe body */}
                        <circle cx={cx} cy={cy} r={R} fill="url(#ocean)" />
                        <circle cx={cx} cy={cy} r={R} fill="url(#sun-highlight)" />

                        {/* Grid */}
                        {gridLines.map((pts, i) => (
                            <polyline key={i} points={pts} fill="none" stroke="rgba(34,211,238,0.04)" strokeWidth="0.3" />
                        ))}

                        {/* Continents */}
                        {Object.entries(CONTINENTS).map(([cid, cont]) => {
                            const projected = cont.points.map(([lat, lng]) => project(lat, lng))
                            const visible = projected.filter(p => p.visible)
                            if (visible.length < 3) return null
                            const d = visible.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z'
                            return <path key={cid} d={d} fill={cont.color} stroke={cont.stroke} strokeWidth="0.6" />
                        })}

                        {/* Shading overlay */}
                        <circle cx={cx} cy={cy} r={R} fill="url(#shadow)" />
                        {/* Atmosphere */}
                        <circle cx={cx} cy={cy} r={R + 6} fill="url(#atmosphere)" />
                        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.7" />

                        {/* City hotspots */}
                        {CITIES.map(city => {
                            const p = project(city.lat, city.lng)
                            if (!p.visible) return null
                            const isSelected = selectedCity?.id === city.id
                            const sz = city.tier === 1 ? 3.5 : city.tier === 2 ? 2.5 : 1.8
                            return (
                                <g key={city.id} style={{ cursor: 'pointer' }}
                                    onClick={() => { setSelectedCity(city); setAutoRotate(false) }}>
                                    {/* Ambient glow */}
                                    <circle cx={p.x} cy={p.y} r={sz * 2.5} fill={city.color} opacity={0.06} />
                                    {/* Pulse for tier 1 */}
                                    {city.tier === 1 && (
                                        <circle cx={p.x} cy={p.y} r={sz} fill="none" stroke={city.color} strokeWidth="0.5" opacity="0.4">
                                            <animate attributeName="r" values={`${sz};${sz + 6};${sz}`} dur="3s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                                        </circle>
                                    )}
                                    {/* City dot */}
                                    <circle cx={p.x} cy={p.y} r={sz * p.scale} fill={city.color}
                                        opacity={p.opacity} style={{ filter: `drop-shadow(0 0 ${isSelected ? 8 : 3}px ${city.color})` }} />
                                    {/* Label for tier 1+2 */}
                                    {(city.tier <= 2 || isSelected) && (
                                        <text x={p.x} y={p.y - sz - 4} textAnchor="middle" fill={city.color}
                                            fontSize={isSelected ? '7' : '5.5'} fontWeight="700"
                                            fontFamily="var(--font-display)" letterSpacing="0.06em"
                                            opacity={p.opacity * (isSelected ? 1 : 0.8)}
                                            style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))' }}>
                                            {city.name.toUpperCase()}
                                        </text>
                                    )}
                                    {isSelected && (
                                        <circle cx={p.x} cy={p.y} r="10" fill="none" stroke={city.color} strokeWidth="1" opacity="0.5" strokeDasharray="2 2">
                                            <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="8s" repeatCount="indefinite" />
                                        </circle>
                                    )}
                                </g>
                            )
                        })}

                        {/* Live payment arcs */}
                        {livePayments.map(p => (
                            <PaymentArc key={p.id} payment={p} project={project} />
                        ))}

                        {/* Satellite orbits */}
                        {SATELLITES.map(sat => (
                            <g key={sat.id}>
                                <ellipse cx={cx} cy={cy} rx={sat.orbitRadius} ry={sat.orbitRadius * 0.3}
                                    fill="none" stroke={`${sat.color}10`} strokeWidth="0.4" strokeDasharray="3 6"
                                    transform={`rotate(${sat.tilt}, ${cx}, ${cy})`} />
                                <g>
                                    <animateTransform attributeName="transform" type="rotate"
                                        from={`${sat.offset} ${cx} ${cy}`} to={`${sat.offset + 360} ${cx} ${cy}`}
                                        dur={`${sat.speed}s`} repeatCount="indefinite" />
                                    <circle cx={cx + sat.orbitRadius} cy={cy} r="2" fill={sat.color}
                                        style={{ filter: `drop-shadow(0 0 6px ${sat.color})` }} />
                                    {/* Downlink beam */}
                                    <line x1={cx + sat.orbitRadius} y1={cy}
                                        x2={cx + sat.orbitRadius - 4} y2={cy + 10}
                                        stroke={sat.color} strokeWidth="0.3" opacity="0.3" />
                                    <line x1={cx + sat.orbitRadius} y1={cy}
                                        x2={cx + sat.orbitRadius + 4} y2={cy + 10}
                                        stroke={sat.color} strokeWidth="0.3" opacity="0.3" />
                                </g>
                            </g>
                        ))}

                        {/* Branding */}
                        <text x={cx} y={38} textAnchor="middle" fill="rgba(34,211,238,0.2)"
                            fontSize="5" fontWeight="700" fontFamily="var(--font-display)" letterSpacing="0.35em">
                            NEXUS ORBITAL NETWORK
                        </text>
                    </svg>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 12, padding: '0.5rem', flexWrap: 'wrap' }}>
                        {regionVolumes.map(r => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'var(--nx-text-dim)' }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.color }} />
                                <span style={{ fontWeight: 600, color: r.color }}>{r.name}</span>
                                <span className="nx-mono">${r.volume.toFixed(1)}T</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
                </EnhancedGlobeWrapper>

                {/* ── Sidebar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Selected City / Default info */}
                    <motion.div className="nx-card-glow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }} key={selectedCity?.id || 'default'}
                        style={{ borderColor: selectedCity ? `${selectedCity.color}30` : 'rgba(34,211,238,0.2)' }}>
                        {selectedCity ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <MapPin size={14} color={selectedCity.color} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                                        {selectedCity.name.toUpperCase()}
                                    </span>
                                    <span className="nx-badge nx-badge-muted" style={{ fontSize: 8 }}>{selectedCity.country}</span>
                                </div>
                                {[
                                    { label: 'Coordinates', value: `${selectedCity.lat.toFixed(1)}°, ${selectedCity.lng.toFixed(1)}°` },
                                    { label: 'Tier', value: `Tier ${selectedCity.tier} Hub` },
                                    { label: 'Status', value: 'Active', badge: true },
                                ].map(s => (
                                    <div key={s.label} className="nx-stat-row">
                                        <span style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{s.label}</span>
                                        {s.badge ? <span className="nx-badge nx-badge-green" style={{ fontSize: 8 }}>{s.value}</span>
                                            : <span className="nx-mono" style={{ fontSize: 11, color: selectedCity.color }}>{s.value}</span>}
                                    </div>
                                ))}
                                <button onClick={() => setSelectedCity(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--nx-text-dim)', fontSize: 10, cursor: 'pointer', marginTop: 8 }}>
                                    ← Back to overview
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 10 }}>
                                    NETWORK OVERVIEW
                                </div>
                                {[
                                    { label: 'Financial Centers', value: CITIES.length, icon: MapPin, color: '#22d3ee' },
                                    { label: 'Tier 1 Hubs', value: CITIES.filter(c => c.tier === 1).length, icon: Users, color: '#a78bfa' },
                                    { label: 'Network Latency', value: '< 2ms', icon: Clock, color: '#34d399' },
                                ].map(s => (
                                    <div key={s.label} className="nx-stat-row">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <s.icon size={10} color={s.color} />
                                            <span style={{ fontSize: 10, color: 'var(--nx-text-muted)' }}>{s.label}</span>
                                        </div>
                                        <span className="nx-mono" style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.value}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </motion.div>

                    {/* Live Transaction Feed */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }} style={{ maxHeight: 300, overflow: 'hidden' }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Activity size={12} color="#22d3ee" /> LIVE PAYMENTS
                        </h3>
                        <AnimatePresence mode="popLayout">
                            {txFeed.map(tx => (
                                <motion.div key={tx.id} layout initial={{ opacity: 0, x: 20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '6px 8px', marginBottom: 4, borderRadius: 6,
                                        background: `${tx.color}06`, border: `1px solid ${tx.color}10`,
                                    }}>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--nx-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ color: tx.color }}>{tx.from.name.slice(0, 3).toUpperCase()}</span>
                                            <ArrowRightLeft size={8} color="var(--nx-text-dim)" />
                                            <span style={{ color: tx.color }}>{tx.to.name.slice(0, 3).toUpperCase()}</span>
                                        </div>
                                        <div style={{ fontSize: 8, color: 'var(--nx-text-dim)' }}>
                                            {tx.type} · {tx.currency}
                                        </div>
                                    </div>
                                    <span className="nx-mono" style={{ fontSize: 10, fontWeight: 700, color: tx.color }}>
                                        {formatAmount(tx.amount)}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* AI Prediction */}
                    <motion.div className="nx-ai-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Zap size={12} color="#a78bfa" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI PREDICTION</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>
                            Cross-border payment volume to <strong style={{ color: '#34d399' }}>Asia Pacific</strong> expected to surge <strong style={{ color: '#22d3ee' }}>12%</strong> this quarter. Satellite telemetry confirms increased trading activity across the <strong style={{ color: '#a78bfa' }}>Tokyo–Shanghai–Singapore</strong> corridor.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
