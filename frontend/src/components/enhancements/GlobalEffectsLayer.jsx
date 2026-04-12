/* ═══════════════════════════════════════════════════════════
   GlobalEffectsLayer — App-wide visual effects overlay
   Noise texture + vignette + scan-line — all purely visual
   Renders as a fixed overlay that won't block interaction
   ═══════════════════════════════════════════════════════════ */

import { useRef, useEffect, memo } from 'react'
import { useAnimationLoop } from './useAnimationLoop'

/* ── Noise texture generator (creates a grainy film overlay) ── */
function generateNoiseTexture(ctx, width, height, opacity = 0.03) {
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        data[i] = v       // R
        data[i + 1] = v   // G
        data[i + 2] = v   // B
        data[i + 3] = opacity * 255 // A — very subtle
    }
    ctx.putImageData(imageData, 0, 0)
}

/* ── Vignette overlay (darkens edges) ── */
function drawVignette(ctx, width, height) {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.25,
        width / 2, height / 2, width * 0.75
    )
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(0.7, 'transparent')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
}

/* ── Scan line — a horizontal glowing line that sweeps down ── */
function drawScanLine(ctx, width, height, elapsed) {
    const y = (elapsed * 40) % height // speed: 40px/s
    const gradient = ctx.createLinearGradient(0, y - 2, 0, y + 2)
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.03)')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(0, y - 2, width, 4)
}

const GlobalEffectsLayer = memo(function GlobalEffectsLayer() {
    const canvasRef = useRef(null)
    const dimensionsRef = useRef({ w: 0, h: 0 })

    // Resize canvas to match viewport
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 1) // low resolution is fine for noise
            const w = window.innerWidth
            const h = window.innerHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            dimensionsRef.current = { w: canvas.width, h: canvas.height }
        }

        resize()
        window.addEventListener('resize', resize, { passive: true })
        return () => window.removeEventListener('resize', resize)
    }, [])

    // Animation loop — regenerate noise + sweep scan line
    useAnimationLoop((dt, elapsed) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const { w, h } = dimensionsRef.current

        ctx.clearRect(0, 0, w, h)

        // 1. Noise texture — regenerate every 3 frames for organic feel
        if (Math.floor(elapsed * 20) % 3 === 0) {
            generateNoiseTexture(ctx, w, h, 0.025)
        }

        // 2. Vignette
        drawVignette(ctx, w, h)

        // 3. Scan line sweep
        drawScanLine(ctx, w, h, elapsed)
    }, { maxFps: 20 }) // Low FPS is fine for subtle noise

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
                opacity: 0.6,
            }}
            aria-hidden="true"
        />
    )
})

export default GlobalEffectsLayer
