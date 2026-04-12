/* ═══════════════════════════════════════════════════════════
   EnhancedChartWrapper — Visual glow layer for Recharts
   Wraps any chart container with animated glow border,
   radial light, and horizontal scan-line effect.
   
   Does NOT change chart library or re-render charts.
   ═══════════════════════════════════════════════════════════ */

import { useRef, memo } from 'react'
import { useAnimationLoop } from './useAnimationLoop'

const EnhancedChartWrapper = memo(function EnhancedChartWrapper({
    children,
    glowColor = '#22d3ee',
    intensity = 'medium', // 'low' | 'medium' | 'high'
    scanLine = true,
    style = {},
}) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)

    const intensityMap = { low: 0.03, medium: 0.06, high: 0.1 }
    const glowOpacity = intensityMap[intensity] || 0.06

    // Overlay canvas for glow effects
    useAnimationLoop((dt, elapsed) => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        const w = rect.width
        const h = rect.height

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
        }

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, w, h)

        // 1. Radial glow behind chart area
        const gx = w * 0.5
        const gy = h * 0.45
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.5)
        grad.addColorStop(0, glowColor + Math.round(glowOpacity * 255).toString(16).padStart(2, '0'))
        grad.addColorStop(0.5, glowColor + '05')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // 2. Horizontal scan line sweeping down
        if (scanLine) {
            const scanY = (elapsed * 30) % h
            const scanGrad = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 1)
            scanGrad.addColorStop(0, 'transparent')
            scanGrad.addColorStop(0.5, glowColor + '12')
            scanGrad.addColorStop(1, 'transparent')
            ctx.fillStyle = scanGrad
            ctx.fillRect(0, scanY - 1, w, 2)
        }

        // 3. Edge glow — subtle light on top edge
        const topGrad = ctx.createLinearGradient(0, 0, 0, 6)
        topGrad.addColorStop(0, glowColor + '15')
        topGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = topGrad
        ctx.fillRect(0, 0, w, 6)

    }, { maxFps: 24 })

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                overflow: 'hidden',
                ...style,
            }}
        >
            {/* Glow overlay canvas — behind content */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    borderRadius: 'inherit',
                }}
                aria-hidden="true"
            />

            {/* Animated border glow */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    border: `1px solid ${glowColor}20`,
                    boxShadow: `
                        inset 0 0 20px ${glowColor}08,
                        0 0 15px ${glowColor}06
                    `,
                    pointerEvents: 'none',
                    zIndex: 2,
                    animation: 'chart-border-breathe 4s ease-in-out infinite',
                }}
            />

            {/* Original chart content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>

            {/* Inline keyframes */}
            <style>{`
                @keyframes chart-border-breathe {
                    0%, 100% {
                        box-shadow: inset 0 0 20px ${glowColor}08, 0 0 15px ${glowColor}06;
                        border-color: ${glowColor}15;
                    }
                    50% {
                        box-shadow: inset 0 0 30px ${glowColor}12, 0 0 25px ${glowColor}10;
                        border-color: ${glowColor}25;
                    }
                }
            `}</style>
        </div>
    )
})

export default EnhancedChartWrapper
