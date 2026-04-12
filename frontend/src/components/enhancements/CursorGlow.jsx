import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * CursorGlow — Ambient light orb that follows the mouse cursor across the viewport.
 * Uses a radial gradient overlay with smooth spring-like easing.
 * Renders as a fixed-position div; completely non-interactive (pointerEvents: none).
 */
export default function CursorGlow({ size = 420, color = '34,211,238', opacity = 0.07, enabled = true }) {
    const [pos, setPos] = useState({ x: -1000, y: -1000 })
    const targetRef = useRef({ x: -1000, y: -1000 })
    const currentRef = useRef({ x: -1000, y: -1000 })
    const rafRef = useRef(null)

    const lerp = (a, b, t) => a + (b - a) * t

    const animate = useCallback(() => {
        currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.12)
        currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.12)
        setPos({ x: currentRef.current.x, y: currentRef.current.y })
        rafRef.current = requestAnimationFrame(animate)
    }, [])

    useEffect(() => {
        if (!enabled) return

        const onMove = (e) => {
            targetRef.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener('mousemove', onMove, { passive: true })
        rafRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('mousemove', onMove)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [enabled, animate])

    if (!enabled) return null

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(${color},${opacity}) 0%, rgba(${color},${opacity * 0.4}) 40%, transparent 70%)`,
                    transform: `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`,
                    willChange: 'transform',
                    mixBlendMode: 'screen',
                    filter: `blur(${size * 0.08}px)`,
                }}
            />
            {/* Secondary smaller, brighter orb */}
            <div
                style={{
                    position: 'absolute',
                    width: size * 0.35,
                    height: size * 0.35,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(${color},${opacity * 1.8}) 0%, transparent 70%)`,
                    transform: `translate(${pos.x - size * 0.175}px, ${pos.y - size * 0.175}px)`,
                    willChange: 'transform',
                    mixBlendMode: 'screen',
                }}
            />
        </div>
    )
}
