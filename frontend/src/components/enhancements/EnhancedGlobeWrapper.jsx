/* ═══════════════════════════════════════════════════════════
   EnhancedGlobeWrapper — Three.js 3D Earth rendered BEHIND
   the existing SVG globe. Pure visual layer, no logic change.
   
   Integration: wraps the SVG container, renders WebGL under it.
   Syncs rotation with existing globe state via props.
   ═══════════════════════════════════════════════════════════ */

import { useRef, useMemo, memo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useDeviceCapability from '../../hooks/useDeviceCapability'
import {
    atmosphereVertexShader,
    atmosphereFragmentShader,
} from './shaders/atmosphere'

/* ── Earth Sphere — procedural dark ocean with grid ── */
function EarthSphere({ rotationSpeed = 0.12, segments = 64 }) {
    const meshRef = useRef()
    const cloudRef = useRef()
    const atmosphereRef = useRef()

    // Procedural earth texture — deep ocean with subtle grid
    const earthTexture = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 256
        const ctx = canvas.getContext('2d')

        // Deep ocean base
        const grad = ctx.createLinearGradient(0, 0, 0, 256)
        grad.addColorStop(0, '#040e22')
        grad.addColorStop(0.3, '#061530')
        grad.addColorStop(0.5, '#0a1a3a')
        grad.addColorStop(0.7, '#061530')
        grad.addColorStop(1, '#040e22')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 512, 256)

        // Subtle latitude lines
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)'
        ctx.lineWidth = 0.5
        for (let lat = 0; lat < 256; lat += 32) {
            ctx.beginPath()
            ctx.moveTo(0, lat)
            ctx.lineTo(512, lat)
            ctx.stroke()
        }

        // Subtle longitude lines
        for (let lng = 0; lng < 512; lng += 32) {
            ctx.beginPath()
            ctx.moveTo(lng, 0)
            ctx.lineTo(lng, 256)
            ctx.stroke()
        }

        // Continent-like landmass hints (simplified)
        ctx.fillStyle = 'rgba(34, 211, 238, 0.04)'
        // North America hint
        ctx.beginPath()
        ctx.ellipse(130, 80, 40, 30, -0.3, 0, Math.PI * 2)
        ctx.fill()
        // Europe hint
        ctx.beginPath()
        ctx.ellipse(270, 75, 20, 15, 0.2, 0, Math.PI * 2)
        ctx.fill()
        // Asia hint
        ctx.beginPath()
        ctx.ellipse(350, 85, 50, 25, 0, 0, Math.PI * 2)
        ctx.fill()
        // Africa hint
        ctx.beginPath()
        ctx.ellipse(270, 140, 15, 30, 0, 0, Math.PI * 2)
        ctx.fill()
        // South America hint
        ctx.beginPath()
        ctx.ellipse(160, 160, 12, 30, 0.3, 0, Math.PI * 2)
        ctx.fill()

        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        return tex
    }, [])

    // Cloud layer texture — wispy transparent clouds
    const cloudTexture = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 256
        const ctx = canvas.getContext('2d')

        ctx.clearRect(0, 0, 512, 256)
        // Random wispy cloud patches
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 512
            const y = Math.random() * 256
            const r = 10 + Math.random() * 30
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)')
            grad.addColorStop(1, 'transparent')
            ctx.fillStyle = grad
            ctx.fillRect(x - r, y - r, r * 2, r * 2)
        }

        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        return tex
    }, [])

    // Atmosphere shader material
    const atmosphereMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            uniforms: {
                uColor: { value: new THREE.Color('#22d3ee') },
                uIntensity: { value: 1.2 },
                uPower: { value: 3.0 },
            },
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
        })
    }, [])

    // Animation loop
    useFrame((_, delta) => {
        const speed = (rotationSpeed * Math.PI) / 180 // degrees to radians
        if (meshRef.current) {
            meshRef.current.rotation.y += speed * delta * 60
        }
        if (cloudRef.current) {
            // Clouds rotate slightly faster for parallax
            cloudRef.current.rotation.y += speed * delta * 60 * 1.15
        }
        if (atmosphereRef.current) {
            atmosphereRef.current.rotation.y += speed * delta * 60 * 0.5
        }
    })

    return (
        <group>
            {/* Main Earth sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, segments, segments]} />
                <meshStandardMaterial
                    map={earthTexture}
                    emissive="#0a1a3a"
                    emissiveIntensity={0.15}
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            {/* Cloud layer — slightly larger, semi-transparent */}
            <mesh ref={cloudRef}>
                <sphereGeometry args={[1.008, Math.floor(segments * 0.75), Math.floor(segments * 0.75)]} />
                <meshBasicMaterial
                    map={cloudTexture}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </mesh>

            {/* Atmosphere glow — Fresnel shader on back side of larger sphere */}
            <mesh ref={atmosphereRef} material={atmosphereMaterial}>
                <sphereGeometry args={[1.15, Math.floor(segments * 0.75), Math.floor(segments * 0.75)]} />
            </mesh>

            {/* Inner atmosphere halo */}
            <mesh>
                <sphereGeometry args={[1.02, Math.floor(segments * 0.75), Math.floor(segments * 0.75)]} />
                <meshBasicMaterial
                    color="#22d3ee"
                    transparent
                    opacity={0.03}
                    side={THREE.FrontSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

/* ── Payment Arc — 3D curved tube between two points ── */
function PaymentArc3D({ fromLat, fromLng, toLat, toLng, color, progress = 1 }) {
    const meshRef = useRef()

    const curve = useMemo(() => {
        const from = latLngToVec3(fromLat, fromLng, 1.01)
        const to = latLngToVec3(toLat, toLng, 1.01)

        // Mid point elevated above the surface for arc
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
        const dist = from.distanceTo(to)
        mid.normalize().multiplyScalar(1.01 + dist * 0.4) // arc height proportional to distance

        return new THREE.QuadraticBezierCurve3(from, mid, to)
    }, [fromLat, fromLng, toLat, toLng])

    const geometry = useMemo(() => {
        const points = curve.getPoints(50)
        return new THREE.BufferGeometry().setFromPoints(points)
    }, [curve])

    // Animated particle along the arc
    const particleRef = useRef()
    useFrame((_, delta) => {
        if (particleRef.current) {
            particleRef.current.userData.t = ((particleRef.current.userData.t || 0) + delta * 0.4) % 1
            const pos = curve.getPoint(particleRef.current.userData.t)
            particleRef.current.position.copy(pos)
        }
    })

    const col = new THREE.Color(color || '#22d3ee')

    return (
        <group>
            {/* Arc line */}
            <line geometry={geometry}>
                <lineBasicMaterial
                    color={col}
                    transparent
                    opacity={0.3}
                    linewidth={1}
                />
            </line>

            {/* Traveling particle */}
            <mesh ref={particleRef} userData={{ t: 0 }}>
                <sphereGeometry args={[0.012, 8, 8]} />
                <meshBasicMaterial color={col} transparent opacity={0.9} />
            </mesh>
        </group>
    )
}

/* ── Convert lat/lng to 3D vector on unit sphere ── */
function latLngToVec3(lat, lng, radius = 1) {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    )
}

/* ── City Point Light on globe surface ── */
function CityPoint({ lat, lng, color, tier }) {
    const pos = useMemo(() => latLngToVec3(lat, lng, 1.015), [lat, lng])
    const size = tier === 1 ? 0.015 : tier === 2 ? 0.01 : 0.007
    const col = new THREE.Color(color)

    return (
        <mesh position={pos}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshBasicMaterial color={col} transparent opacity={0.9} />
        </mesh>
    )
}

/* ── Main scene content ── */
function GlobeScene({ cities = [], payments = [], segments = 64 }) {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.15} />
            <directionalLight position={[5, 3, 5]} intensity={0.6} color="#c8d6f0" />
            <directionalLight position={[-3, -1, -5]} intensity={0.15} color="#1a1a4e" />

            {/* Earth */}
            <EarthSphere rotationSpeed={0.12} segments={segments} />

            {/* City dots */}
            {cities.map(city => (
                <CityPoint key={city.id} lat={city.lat} lng={city.lng} color={city.color} tier={city.tier} />
            ))}

            {/* Payment arcs */}
            {payments.slice(0, 8).map(p => (
                <PaymentArc3D
                    key={p.id}
                    fromLat={p.from.lat} fromLng={p.from.lng}
                    toLat={p.to.lat} toLng={p.to.lng}
                    color={p.color}
                />
            ))}
        </>
    )
}

/* ═══════ WRAPPER COMPONENT ═══════
   Mounts a Three.js canvas BEHIND the children (existing SVG globe).
   Children render on top via z-index.
*/
const EnhancedGlobeWrapper = memo(function EnhancedGlobeWrapper({
    children,
    cities = [],
    payments = [],
    style = {},
}) {
    const { isMobile, isSmallMobile, prefersReducedMotion } = useDeviceCapability()
    const segments = isMobile ? 32 : 64
    const maxArcs = isMobile ? 4 : 8
    const dpr = isMobile ? [1, 1] : [1, 1.5]

    // Skip WebGL entirely on very small screens — too heavy
    if (isSmallMobile) {
        return (
            <div style={{ position: 'relative', ...style }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', ...style }}>
            {/* Three.js canvas — renders BEHIND */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                opacity: 0.85,
            }}>
                <Canvas
                    camera={{ position: [0, 0, 2.6], fov: 45 }}
                    gl={{
                        antialias: !isMobile,
                        alpha: true,
                        powerPreference: isMobile ? 'low-power' : 'high-performance',
                        toneMapping: THREE.ACESFilmicToneMapping,
                    }}
                    dpr={dpr}
                    frameloop={prefersReducedMotion ? 'demand' : 'always'}
                    style={{ background: 'transparent' }}
                >
                    <Suspense fallback={null}>
                        <GlobeScene
                            cities={cities}
                            payments={payments.slice(0, maxArcs)}
                            segments={segments}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* Existing SVG globe — renders ON TOP */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    )
})

export default EnhancedGlobeWrapper
