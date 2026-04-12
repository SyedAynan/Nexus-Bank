import { useRef, useState, useCallback } from 'react'

/**
 * MagneticButton — A button wrapper that subtly attracts towards the cursor
 * when hovering within proximity, creating an organic, tactile feel.
 *
 * Props:
 *   strength   — max displacement in px (default 8)
 *   radius     — detection radius as multiplier of element size (default 1.5)
 *   className  — additional class
 *   style      — additional styles
 */
export default function MagneticButton({
    children,
    strength = 8,
    radius = 1.5,
    className = '',
    style = {},
    onClick,
    ...rest
}) {
    const ref = useRef(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [hovering, setHovering] = useState(false)

    const handleMove = useCallback((e) => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = Math.max(rect.width, rect.height) * radius

        if (dist < maxDist) {
            const pull = 1 - dist / maxDist  // 0 at edge → 1 at center
            setOffset({
                x: dx * pull * (strength / maxDist) * 3,
                y: dy * pull * (strength / maxDist) * 3,
            })
            setHovering(true)
        } else {
            setOffset({ x: 0, y: 0 })
            setHovering(false)
        }
    }, [strength, radius])

    const handleLeave = useCallback(() => {
        setOffset({ x: 0, y: 0 })
        setHovering(false)
    }, [])

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={onClick}
            className={className}
            style={{
                ...style,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                transition: hovering
                    ? 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)'
                    : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                willChange: hovering ? 'transform' : 'auto',
            }}
            {...rest}
        >
            {children}
        </div>
    )
}
