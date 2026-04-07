import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Globe as GlobeIcon, ArrowRightLeft, DollarSign, TrendingUp, Zap, MapPin, Satellite, RotateCcw } from 'lucide-react'

/* ═══════ Financial Regions Data ═══════ */
const REGIONS = [
    { id: 'na', name: 'North America', lat: 40, lng: -100, volume: '$4.2T', flows: '+$82B', color: '#22d3ee', gdp: '$28.5T', markets: 'NYSE, NASDAQ' },
    { id: 'eu', name: 'Europe', lat: 50, lng: 15, volume: '$3.1T', flows: '+$45B', color: '#a78bfa', gdp: '$18.3T', markets: 'LSE, Euronext' },
    { id: 'asia', name: 'Asia Pacific', lat: 35, lng: 110, volume: '$5.8T', flows: '+$120B', color: '#34d399', gdp: '$35.2T', markets: 'TSE, SSE, BSE' },
    { id: 'me', name: 'Middle East', lat: 25, lng: 45, volume: '$0.8T', flows: '+$15B', color: '#fbbf24', gdp: '$3.8T', markets: 'TASI, DFM' },
    { id: 'sa', name: 'South America', lat: -15, lng: -55, volume: '$0.6T', flows: '-$8B', color: '#fb7185', gdp: '$4.2T', markets: 'B3, BVC' },
    { id: 'af', name: 'Africa', lat: 5, lng: 20, volume: '$0.3T', flows: '+$5B', color: '#f59e0b', gdp: '$2.9T', markets: 'JSE, NSE' },
]

const FLOW_PATHS = [
    { from: 'na', to: 'eu', amount: '$18B', color: '#22d3ee' },
    { from: 'eu', to: 'asia', amount: '$32B', color: '#a78bfa' },
    { from: 'asia', to: 'na', amount: '$45B', color: '#34d399' },
    { from: 'me', to: 'eu', amount: '$12B', color: '#fbbf24' },
    { from: 'na', to: 'asia', amount: '$28B', color: '#22d3ee' },
    { from: 'sa', to: 'na', amount: '$6B', color: '#fb7185' },
]

/* ═══════ Satellite Orbits ═══════ */
const SATELLITES = [
    { id: 1, orbitRadius: 175, speed: 12, offset: 0, color: '#22d3ee', name: 'NEXUS-SAT-1' },
    { id: 2, orbitRadius: 195, speed: 18, offset: 120, color: '#a78bfa', name: 'NEXUS-SAT-2' },
    { id: 3, orbitRadius: 160, speed: 25, offset: 240, color: '#34d399', name: 'NEXUS-SAT-3' },
]

/* ═══════ 3D Globe — Pure SVG / CSS ═══════ */
function Globe3D({ selectedRegion, onRegionClick, rotation }) {
    const cx = 200, cy = 200, R = 140

    // Project lat/lng to sphere + apply rotation
    const project = (lat, lng) => {
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lng + rotation) * (Math.PI / 180)

        const x3d = R * Math.sin(phi) * Math.cos(theta)
        const y3d = R * Math.cos(phi)
        const z3d = R * Math.sin(phi) * Math.sin(theta)

        // Simple perspective
        const scale = 1 + z3d / (R * 4)
        return {
            x: cx + x3d * scale,
            y: cy - y3d * scale,
            z: z3d,
            visible: z3d > -R * 0.3,
            scale,
        }
    }

    // Generate latitude/longitude grid lines
    const gridLines = []
    // Latitude circles
    for (let lat = -60; lat <= 60; lat += 30) {
        const points = []
        for (let lng = 0; lng <= 360; lng += 5) {
            const p = project(lat, lng)
            points.push(p)
        }
        gridLines.push({ points, type: 'lat' })
    }
    // Longitude arcs
    for (let lng = 0; lng < 360; lng += 30) {
        const points = []
        for (let lat = -80; lat <= 80; lat += 5) {
            const p = project(lat, lng)
            points.push(p)
        }
        gridLines.push({ points, type: 'lng' })
    }

    // Continent outlines (simplified — key coastal points)
    const continentPaths = {
        na: [[65, -170], [70, -140], [60, -125], [48, -125], [32, -118], [25, -100], [30, -85], [25, -80], [30, -75], [45, -65], [50, -60], [55, -65], [60, -80], [55, -95], [60, -110], [55, -130], [60, -150], [70, -160], [65, -170]],
        sa: [[10, -75], [5, -60], [-5, -35], [-15, -40], [-25, -45], [-35, -55], [-45, -65], [-55, -70], [-54, -65], [-40, -60], [-30, -50], [-20, -40], [-10, -37], [0, -50], [5, -60], [10, -75]],
        eu: [[40, -10], [45, 0], [48, 5], [52, 5], [55, 10], [60, 25], [55, 30], [48, 30], [42, 28], [38, 25], [35, 15], [38, 0], [40, -10]],
        af: [[35, -5], [30, 10], [25, 30], [15, 40], [10, 45], [0, 42], [-10, 40], [-25, 35], [-35, 25], [-34, 18], [-30, 15], [-20, 12], [-10, 15], [0, 10], [5, 0], [15, -15], [25, -10], [35, -5]],
        asia: [[45, 35], [55, 60], [50, 80], [55, 90], [45, 100], [40, 115], [35, 130], [38, 140], [45, 142], [52, 140], [55, 135], [65, 140], [68, 170], [68, 180], [60, 165], [50, 130], [40, 130], [35, 105], [30, 90], [25, 80], [20, 75], [10, 77], [5, 80], [0, 100], [5, 110], [10, 120], [-5, 115], [-8, 105], [0, 100], [5, 95], [10, 80], [15, 55], [25, 50], [30, 35], [35, 35], [45, 35]],
        au: [[-20, 114], [-15, 130], [-13, 136], [-15, 140], [-20, 148], [-28, 153], [-35, 150], [-38, 145], [-35, 138], [-30, 130], [-25, 115], [-20, 114]],
    }

    return (
        <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%' }}>
            <defs>
                <radialGradient id="globe-bg" cx="45%" cy="40%">
                    <stop offset="0%" stopColor="rgba(13,19,64,0.9)" />
                    <stop offset="50%" stopColor="rgba(10,15,46,0.95)" />
                    <stop offset="100%" stopColor="rgba(5,8,22,1)" />
                </radialGradient>
                <radialGradient id="globe-atmosphere" cx="40%" cy="35%">
                    <stop offset="85%" stopColor="transparent" />
                    <stop offset="95%" stopColor="rgba(34,211,238,0.08)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0.15)" />
                </radialGradient>
                <radialGradient id="globe-highlight" cx="35%" cy="30%">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.04)" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="glow3d">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="satellite-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Globe sphere */}
            <circle cx={cx} cy={cy} r={R} fill="url(#globe-bg)" stroke="rgba(34,211,238,0.15)" strokeWidth="0.5" />
            <circle cx={cx} cy={cy} r={R} fill="url(#globe-highlight)" />
            <circle cx={cx} cy={cy} r={R + 8} fill="url(#globe-atmosphere)" />

            {/* Grid lines */}
            {gridLines.map((line, li) => {
                const segments = []
                let seg = []
                line.points.forEach((p, pi) => {
                    if (p.visible) {
                        seg.push(`${p.x},${p.y}`)
                    } else if (seg.length > 1) {
                        segments.push(seg.join(' '))
                        seg = []
                    } else { seg = [] }
                })
                if (seg.length > 1) segments.push(seg.join(' '))
                return segments.map((s, si) => (
                    <polyline key={`${li}-${si}`} points={s} fill="none"
                        stroke="rgba(34,211,238,0.06)" strokeWidth="0.4" />
                ))
            })}

            {/* Continent shapes */}
            {Object.entries(continentPaths).map(([cid, coords]) => {
                const projected = coords.map(([lat, lng]) => project(lat, lng))
                const visiblePoints = projected.filter(p => p.visible)
                if (visiblePoints.length < 3) return null

                const regionId = cid === 'au' ? 'asia' : cid
                const region = REGIONS.find(r => r.id === regionId)
                const isSelected = selectedRegion === regionId
                const pathD = visiblePoints.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ') + 'Z'

                return (
                    <path key={cid} d={pathD}
                        fill={isSelected ? `${region?.color}30` : 'rgba(34,211,238,0.08)'}
                        stroke={isSelected ? region?.color : 'rgba(34,211,238,0.15)'}
                        strokeWidth={isSelected ? 1.2 : 0.5} opacity={0.85}
                        style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        onClick={() => onRegionClick(regionId)}
                    />
                )
            })}

            {/* Capital Flow arcs */}
            {FLOW_PATHS.map((flow, i) => {
                const from = REGIONS.find(r => r.id === flow.from)
                const to = REGIONS.find(r => r.id === flow.to)
                if (!from || !to) return null
                const pFrom = project(from.lat, from.lng)
                const pTo = project(to.lat, to.lng)
                if (!pFrom.visible || !pTo.visible) return null

                const midX = (pFrom.x + pTo.x) / 2
                const midY = (pFrom.y + pTo.y) / 2 - 30
                return (
                    <g key={i}>
                        <path d={`M${pFrom.x},${pFrom.y} Q${midX},${midY} ${pTo.x},${pTo.y}`}
                            fill="none" stroke={flow.color} strokeWidth="1" opacity="0.4"
                            strokeDasharray="4 3" filter="url(#glow3d)" className="nx-flow-line" />
                        {/* Animated dot along path */}
                        <circle r="2" fill={flow.color} style={{ filter: `drop-shadow(0 0 4px ${flow.color})` }}>
                            <animateMotion dur={`${3 + i * 0.5}s`} repeatCount="indefinite"
                                path={`M${pFrom.x},${pFrom.y} Q${midX},${midY} ${pTo.x},${pTo.y}`} />
                        </circle>
                    </g>
                )
            })}

            {/* Region hotspots */}
            {REGIONS.map(r => {
                const p = project(r.lat, r.lng)
                if (!p.visible) return null
                const isSelected = selectedRegion === r.id
                const sz = isSelected ? 6 : 4
                return (
                    <g key={r.id} style={{ cursor: 'pointer' }} onClick={() => onRegionClick(r.id)}>
                        {/* Pulse ring */}
                        {isSelected && (
                            <circle cx={p.x} cy={p.y} r="12" fill="none" stroke={r.color} strokeWidth="0.8" opacity="0.4">
                                <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                            </circle>
                        )}
                        <circle cx={p.x} cy={p.y} r={sz} fill={r.color}
                            style={{ filter: `drop-shadow(0 0 ${isSelected ? 8 : 4}px ${r.color})` }} />
                        {isSelected && (
                            <text x={p.x} y={p.y - 12} textAnchor="middle" fill={r.color}
                                fontSize="8" fontWeight="700" fontFamily="var(--font-display)"
                                style={{ letterSpacing: '0.08em' }} filter="url(#glow3d)">
                                {r.name.toUpperCase().slice(0, 6)}
                            </text>
                        )}
                    </g>
                )
            })}

            {/* Satellite Orbits */}
            {SATELLITES.map(sat => (
                <g key={sat.id}>
                    {/* Orbit ring */}
                    <ellipse cx={cx} cy={cy} rx={sat.orbitRadius} ry={sat.orbitRadius * 0.35}
                        fill="none" stroke={`${sat.color}15`} strokeWidth="0.5" strokeDasharray="3 5"
                        transform={`rotate(${sat.offset / 4}, ${cx}, ${cy})`} />
                    {/* Satellite */}
                    <g filter="url(#satellite-glow)">
                        <animateTransform attributeName="transform" type="rotate"
                            from={`${sat.offset} ${cx} ${cy}`} to={`${sat.offset + 360} ${cx} ${cy}`}
                            dur={`${sat.speed}s`} repeatCount="indefinite" />
                        <circle cx={cx + sat.orbitRadius} cy={cy} r="2.5" fill={sat.color}
                            style={{ filter: `drop-shadow(0 0 6px ${sat.color})` }} />
                        {/* Satellite beam */}
                        <line x1={cx + sat.orbitRadius} y1={cy} x2={cx + sat.orbitRadius - 6} y2={cy + 12}
                            stroke={sat.color} strokeWidth="0.3" opacity="0.4" />
                        <line x1={cx + sat.orbitRadius} y1={cy} x2={cx + sat.orbitRadius + 6} y2={cy + 12}
                            stroke={sat.color} strokeWidth="0.3" opacity="0.4" />
                    </g>
                </g>
            ))}

            {/* "NEXUS" branding at top */}
            <text x={cx} y={46} textAnchor="middle" fill="rgba(34,211,238,0.3)"
                fontSize="6" fontWeight="700" fontFamily="var(--font-display)" letterSpacing="0.3em">
                NEXUS ORBITAL NETWORK
            </text>
        </svg>
    )
}

/* ═══════ Main Globe Page ═══════ */
export default function GlobePage() {
    const [selectedRegion, setSelectedRegion] = useState('na')
    const [rotation, setRotation] = useState(0)
    const [autoRotate, setAutoRotate] = useState(true)
    const region = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0]
    const animRef = useRef(null)

    // Auto-rotate globe
    useEffect(() => {
        if (!autoRotate) { cancelAnimationFrame(animRef.current); return }
        let frame
        const animate = () => {
            setRotation(prev => (prev + 0.15) % 360)
            frame = requestAnimationFrame(animate)
            animRef.current = frame
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [autoRotate])

    return (
        <div className="animate-in">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <GlobeIcon size={26} color="#22d3ee" /> GLOBAL FINANCE
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 4 }}>
                        Real-time worldwide capital flows & satellite intelligence network
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.button className="nx-btn nx-btn-outline" style={{ fontSize: 11 }}
                        onClick={() => setAutoRotate(!autoRotate)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <RotateCcw size={13} /> {autoRotate ? 'Pause' : 'Rotate'}
                    </motion.button>
                    <div className="nx-live-indicator"><div className="dot" /> Live Data Feed</div>
                </div>
            </motion.div>

            {/* Satellite Info Strip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                style={{ display: 'flex', gap: 12, marginBottom: 16, overflowX: 'auto' }}>
                {SATELLITES.map(sat => (
                    <div key={sat.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                        borderRadius: 8, background: `${sat.color}08`, border: `1px solid ${sat.color}15`,
                        whiteSpace: 'nowrap',
                    }}>
                        <Satellite size={12} color={sat.color} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: sat.color, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{sat.name}</span>
                        <span className="nx-live-dot" style={{ width: 4, height: 4, background: sat.color }} />
                        <span style={{ fontSize: 9, color: 'var(--nx-text-dim)' }}>Online</span>
                    </div>
                ))}
            </motion.div>

            {/* Map + Detail Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* 3D Globe */}
                <motion.div className="nx-chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ padding: '1rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 0.5rem' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                            CAPITAL FLOW MAP — 3D SATELLITE VIEW
                        </span>
                        <span className="nx-badge nx-badge-cyan" style={{ fontSize: 9 }}>
                            <span className="nx-live-dot" style={{ marginRight: 4, width: 4, height: 4 }} /> LIVE
                        </span>
                    </div>
                    <div style={{ maxWidth: 500, margin: '0 auto' }}>
                        <Globe3D selectedRegion={selectedRegion} onRegionClick={(id) => { setSelectedRegion(id); setAutoRotate(false) }} rotation={rotation} />
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '0 0.5rem', flexWrap: 'wrap' }}>
                        {REGIONS.map(r => (
                            <motion.div key={r.id}
                                onClick={() => { setSelectedRegion(r.id); setAutoRotate(false) }}
                                whileHover={{ scale: 1.05 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                    padding: '4px 10px', borderRadius: 6,
                                    background: selectedRegion === r.id ? `${r.color}12` : 'transparent',
                                    border: `1px solid ${selectedRegion === r.id ? `${r.color}30` : 'transparent'}`,
                                    transition: 'all 0.2s',
                                }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color }} />
                                <span style={{ fontSize: 10, color: selectedRegion === r.id ? r.color : 'var(--nx-text-dim)', fontWeight: 500 }}>
                                    {r.name}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Selected Region Detail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <motion.div className="nx-card-glow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }} key={selectedRegion}
                        style={{ borderColor: `${region.color}30` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <MapPin size={16} color={region.color} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                                {region.name.toUpperCase()}
                            </span>
                        </div>
                        {[
                            { label: 'Daily Volume', value: region.volume, icon: DollarSign },
                            { label: 'Net Capital Flow', value: region.flows, icon: ArrowRightLeft },
                            { label: 'GDP', value: region.gdp, icon: TrendingUp },
                        ].map(stat => (
                            <div key={stat.label} className="nx-stat-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <stat.icon size={12} color="var(--nx-text-dim)" />
                                    <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{stat.label}</span>
                                </div>
                                <span className="nx-mono" style={{ fontSize: 13, fontWeight: 600, color: region.color }}>
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--nx-text-dim)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--nx-text-muted)' }}>Key Markets: </span>
                            {region.markets}
                        </div>
                    </motion.div>

                    {/* Live Flows */}
                    <motion.div className="nx-card-static" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 10 }}>
                            ACTIVE FLOWS
                        </h3>
                        {FLOW_PATHS.map((f, i) => {
                            const from = REGIONS.find(r => r.id === f.from)
                            const to = REGIONS.find(r => r.id === f.to)
                            return (
                                <motion.div key={i} className="nx-stat-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.08 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--nx-text-muted)' }}>
                                        <span style={{ color: f.color, fontWeight: 600 }}>{from?.name?.slice(0, 3).toUpperCase()}</span>
                                        <ArrowRightLeft size={9} color="var(--nx-text-dim)" />
                                        <span style={{ color: f.color, fontWeight: 600 }}>{to?.name?.slice(0, 3).toUpperCase()}</span>
                                    </div>
                                    <span className="nx-mono" style={{ fontSize: 11, color: f.color }}>{f.amount}</span>
                                </motion.div>
                            )
                        })}
                    </motion.div>

                    {/* AI Prediction */}
                    <motion.div className="nx-ai-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Zap size={12} color="#a78bfa" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>AI PREDICTION</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--nx-text-muted)', lineHeight: 1.6 }}>
                            Capital inflows to {region.name} expected to increase 8% this quarter, driven by institutional demand. Satellite telemetry confirms enhanced trading activity at {region.markets?.split(',')[0]}.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
