import { useState, useCallback } from 'react'

/**
 * RippleEffect — Neon ripple burst on click. Wrap any clickable element.
 * Creates a Material-style ripple with a glowing neon ring.
 *
 * Props:
 *   color     — ripple color (default 'rgba(34,211,238,0.4)')
 *   duration  — ripple animation duration in ms (default 600)
 *   className — additional class
 *   style     — additional styles
 */
export default function RippleEffect({
    children,
    color = 'rgba(34,211,238,0.35)',
    duration = 600,
    className = '',
    style = {},
    ...rest
}) {
    const [ripples, setRipples] = useState([])

    const handleClick = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const size = Math.max(rect.width, rect.height) * 2

        const ripple = { x, y, size, id: Date.now() }
        setRipples((prev) => [...prev, ripple])

        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
        }, duration)
    }, [duration])

    return (
        <div
            onClick={handleClick}
            className={className}
            style={{
                ...style,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
            }}
            {...rest}
        >
            {children}
            {ripples.map((r) => (
                <span
                    key={r.id}
                    style={{
                        position: 'absolute',
                        left: r.x - r.size / 2,
                        top: r.y - r.size / 2,
                        width: r.size,
                        height: r.size,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                        transform: 'scale(0)',
                        animation: `nx-ripple-burst ${duration}ms ease-out forwards`,
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />
            ))}

            {/* Inject keyframes if not already present */}
            <style>{`
                @keyframes nx-ripple-burst {
                    0% { transform: scale(0); opacity: 1; }
                    70% { transform: scale(1); opacity: 0.4; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
            `}</style>
        </div>
    )
}
