import { useState, useEffect, useRef } from 'react'

/**
 * AnimatedCounter — Smoothly counts from 0 to `value` on mount or when value changes.
 * Uses an ease-out curve for a satisfying deceleration effect.
 * Supports prefix, suffix, and custom formatting.
 *
 * Props:
 *   value      — target number
 *   duration   — animation duration in ms (default 1800)
 *   prefix     — string before the number (e.g. '$')
 *   suffix     — string after the number (e.g. '%')
 *   decimals   — decimal places (default 0)
 *   separator  — thousands separator (default ',')
 *   delay      — delay before starting in ms
 *   className  — CSS class
 *   style      — inline style
 *   pulse      — if true, briefly flash on value change
 */
export default function AnimatedCounter({
    value = 0,
    duration = 1800,
    prefix = '',
    suffix = '',
    decimals = 0,
    separator = ',',
    delay = 0,
    className = '',
    style = {},
    pulse = true,
}) {
    const [display, setDisplay] = useState(0)
    const [flashing, setFlashing] = useState(false)
    const prevValue = useRef(0)
    const rafRef = useRef(null)
    const startTime = useRef(0)

    useEffect(() => {
        const from = prevValue.current
        const to = typeof value === 'number' ? value : parseFloat(value) || 0
        prevValue.current = to

        if (pulse && from !== 0 && from !== to) {
            setFlashing(true)
            setTimeout(() => setFlashing(false), 600)
        }

        const timeout = setTimeout(() => {
            startTime.current = performance.now()

            const tick = (now) => {
                const elapsed = now - startTime.current
                const progress = Math.min(elapsed / duration, 1)
                // Ease out cubic: 1 - (1 - t)^3
                const eased = 1 - Math.pow(1 - progress, 3)
                const current = from + (to - from) * eased
                setDisplay(current)

                if (progress < 1) {
                    rafRef.current = requestAnimationFrame(tick)
                }
            }

            rafRef.current = requestAnimationFrame(tick)
        }, delay)

        return () => {
            clearTimeout(timeout)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [value, duration, delay, pulse])

    const format = (num) => {
        const fixed = Math.abs(num).toFixed(decimals)
        const parts = fixed.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
        const sign = num < 0 ? '-' : ''
        return `${sign}${prefix}${parts.join('.')}${suffix}`
    }

    return (
        <span
            className={className}
            style={{
                ...style,
                transition: 'color 0.3s, text-shadow 0.3s',
                ...(flashing ? {
                    textShadow: `0 0 12px currentColor`,
                } : {}),
            }}
        >
            {format(display)}
        </span>
    )
}
