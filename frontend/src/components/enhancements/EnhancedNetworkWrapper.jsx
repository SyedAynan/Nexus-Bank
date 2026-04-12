/* ═══════════════════════════════════════════════════════════
   EnhancedNetworkWrapper — Visual layer for NexusCoreNetwork
   Adds: particle pulses on connections, bloom glow on nodes,
   and mouse-based parallax movement.
   
   Renders a canvas OVER the existing SVG network.
   Reads node/link positions from props, doesn't touch originals.
   ═══════════════════════════════════════════════════════════ */

import { useRef, useEffect, memo } from 'react'
import { useAnimationLoop, useMouseParallax } from './useAnimationLoop'

/* ── Particle traveling along a connection line ── */
class ConnectionParticle {
    constructor(fromX, fromY, toX, toY, color, speed) {
        this.fromX = fromX
        this.fromY = fromY
        this.toX = toX
        this.toY = toY
        this.color = color
        this.speed = speed || (0.3 + Math.random() * 0.5)
        this.t = Math.random() // progress 0..1
        this.size = 1.5 + Math.random() * 2
        this.trail = []
        this.maxTrail = 6
    }

    update(dt) {
        this.t += this.speed * dt
        if (this.t > 1) this.t -= 1

        const x = this.fromX + (this.toX - this.fromX) * this.t
        const y = this.fromY + (this.toY - this.fromY) * this.t

        this.trail.unshift({ x, y })
        if (this.trail.length > this.maxTrail) this.trail.pop()
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i]
            const alpha = (1 - i / this.trail.length) * 0.6
            ctx.beginPath()
            ctx.arc(p.x, p.y, this.size * (1 - i * 0.12), 0, Math.PI * 2)
            ctx.fillStyle = this.color + Math.round(alpha * 255).toString(16).padStart(2, '0')
            ctx.fill()
        }

        // Draw head with glow
        if (this.trail.length > 0) {
            const head = this.trail[0]
            ctx.beginPath()
            ctx.arc(head.x, head.y, this.size * 1.5, 0, Math.PI * 2)
            const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, this.size * 3)
            grad.addColorStop(0, this.color + '60')
            grad.addColorStop(1, this.color + '00')
            ctx.fillStyle = grad
            ctx.fill()
        }
    }
}

/* ── Node bloom glow effect ── */
function drawNodeBloom(ctx, x, y, color, radius, elapsed) {
    const pulse = 1 + Math.sin(elapsed * 2) * 0.15
    const r = radius * pulse

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, color + '30')
    grad.addColorStop(0.4, color + '15')
    grad.addColorStop(1, color + '00')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
}

const EnhancedNetworkWrapper = memo(function EnhancedNetworkWrapper({
    children,
    nodes = [],
    links = [],
    style = {},
}) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const particlesRef = useRef([])
    const mouse = useMouseParallax()
    const initRef = useRef(false)

    // Initialize particles when dimensions are known
    useEffect(() => {
        const container = containerRef.current
        if (!container || initRef.current) return

        const rect = container.getBoundingClientRect()
        const w = rect.width
        const h = rect.height

        if (w === 0 || h === 0) return

        // Create particles for each link
        const particles = []
        links.forEach(link => {
            const fromNode = nodes.find(n => n.id === link.from)
            const toNode = nodes.find(n => n.id === link.to)
            if (!fromNode || !toNode) return

            const fromX = (fromNode.x / 100) * w
            const fromY = (fromNode.y / 100) * h
            const toX = (toNode.x / 100) * w
            const toY = (toNode.y / 100) * h

            // 1-2 particles per link
            const count = 1 + (Math.random() > 0.5 ? 1 : 0)
            for (let i = 0; i < count; i++) {
                particles.push(new ConnectionParticle(
                    fromX, fromY, toX, toY,
                    fromNode.color || '#22d3ee',
                    0.15 + Math.random() * 0.3
                ))
            }
        })

        particlesRef.current = particles
        initRef.current = true
    }, [nodes, links])

    // Animation loop
    useAnimationLoop((dt, elapsed) => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        const w = rect.width
        const h = rect.height

        if (w === 0 || h === 0) return
        if (canvas.width !== w * 2 || canvas.height !== h * 2) {
            canvas.width = w * 2
            canvas.height = h * 2
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
        }

        const ctx = canvas.getContext('2d')
        ctx.setTransform(2, 0, 0, 2, 0, 0) // 2x DPR
        ctx.clearRect(0, 0, w, h)

        // Draw node bloom glows
        nodes.forEach(node => {
            const x = (node.x / 100) * w
            const y = (node.y / 100) * h
            const radius = node.type === 'core' ? 40 : 25
            drawNodeBloom(ctx, x, y, node.color || '#22d3ee', radius, elapsed)
        })

        // Update and draw particles
        particlesRef.current.forEach(p => {
            p.update(dt)
            p.draw(ctx)
        })
    }, { maxFps: 30 })

    // Parallax transform based on mouse position
    const parallaxX = (mouse.current.x - 0.5) * 4
    const parallaxY = (mouse.current.y - 0.5) * 4

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                transform: `translate(${parallaxX}px, ${parallaxY}px)`,
                transition: 'transform 0.3s ease-out',
                ...style,
            }}
        >
            {/* Existing network content */}
            {children}

            {/* Particle + bloom overlay canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                    borderRadius: 'inherit',
                }}
                aria-hidden="true"
            />

            {/* Depth shadow at bottom */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    background: 'linear-gradient(to top, rgba(5,8,22,0.6), transparent)',
                    pointerEvents: 'none',
                    zIndex: 3,
                    borderRadius: 'inherit',
                }}
            />
        </div>
    )
})

export default EnhancedNetworkWrapper
