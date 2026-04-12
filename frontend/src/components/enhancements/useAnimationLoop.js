/* ═══════════════════════════════════════════════════════════
   useAnimationLoop — Shared requestAnimationFrame hook
   Frame-limited, auto-cleanup, performance-optimized
   ═══════════════════════════════════════════════════════════ */

import { useRef, useEffect, useCallback } from 'react'

/**
 * Shared animation loop hook with optional frame limiting.
 * @param {Function} callback - Called each frame with (deltaTime, elapsedTime)
 * @param {Object} options
 * @param {boolean} options.active - Whether the loop is running (default: true)
 * @param {number} options.maxFps - Max frames per second (default: 60)
 */
export function useAnimationLoop(callback, { active = true, maxFps = 60 } = {}) {
    const rafRef = useRef(null)
    const lastTimeRef = useRef(0)
    const startTimeRef = useRef(0)
    const callbackRef = useRef(callback)
    const minInterval = 1000 / maxFps

    // Keep callback ref current without re-triggering effect
    callbackRef.current = callback

    useEffect(() => {
        if (!active) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            return
        }

        startTimeRef.current = performance.now()
        lastTimeRef.current = startTimeRef.current

        const tick = (now) => {
            const delta = now - lastTimeRef.current
            if (delta >= minInterval) {
                const elapsed = (now - startTimeRef.current) / 1000
                callbackRef.current(delta / 1000, elapsed)
                lastTimeRef.current = now
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [active, minInterval])
}

/**
 * Hook that returns a memoized mouse position tracker (0..1 range).
 * Useful for parallax effects.
 */
export function useMouseParallax() {
    const mouse = useRef({ x: 0.5, y: 0.5 })

    useEffect(() => {
        const handler = (e) => {
            mouse.current.x = e.clientX / window.innerWidth
            mouse.current.y = e.clientY / window.innerHeight
        }
        window.addEventListener('mousemove', handler, { passive: true })
        return () => window.removeEventListener('mousemove', handler)
    }, [])

    return mouse
}
