import { useState, useEffect, useRef } from 'react'

/**
 * LivePriceTick — Displays a price value with a green/red flash animation
 * whenever the value changes, simulating a real-time trading terminal.
 *
 * Props:
 *   value      — current numeric value
 *   prefix     — string before value (default '$')
 *   decimals   — decimal places (default 2)
 *   fontSize   — CSS font-size
 *   className  — additional class
 */
export default function LivePriceTick({
    value = 0,
    prefix = '$',
    decimals = 2,
    fontSize = 14,
    className = '',
    style = {},
}) {
    const [flash, setFlash] = useState(null) // 'up' | 'down' | null
    const prevRef = useRef(value)

    useEffect(() => {
        if (prevRef.current !== value) {
            const direction = value > prevRef.current ? 'up' : 'down'
            setFlash(direction)
            prevRef.current = value
            const t = setTimeout(() => setFlash(null), 800)
            return () => clearTimeout(t)
        }
    }, [value])

    const formatted = `${prefix}${Math.abs(value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

    const flashColor = flash === 'up'
        ? 'var(--nx-emerald, #34d399)'
        : flash === 'down'
            ? 'var(--nx-rose, #fb7185)'
            : undefined

    return (
        <span
            className={`nx-mono ${className}`}
            style={{
                ...style,
                fontSize,
                fontWeight: 600,
                color: flashColor || style.color || 'var(--nx-text)',
                textShadow: flash ? `0 0 8px ${flashColor}` : 'none',
                transition: 'color 0.15s ease, text-shadow 0.15s ease',
                position: 'relative',
            }}
        >
            {formatted}
            {flash && (
                <span
                    style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: 4,
                        background: flash === 'up'
                            ? 'rgba(52,211,153,0.08)'
                            : 'rgba(251,113,133,0.08)',
                        animation: 'nx-price-fade 0.8s ease-out forwards',
                        pointerEvents: 'none',
                    }}
                />
            )}
            <style>{`
                @keyframes nx-price-fade {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </span>
    )
}
