import { useState, useRef, useCallback } from 'react'

/**
 * TiltCard — Wraps children with a 3D perspective tilt on hover.
 * Includes a moving specular highlight that follows the cursor.
 * Props:
 *   maxTilt    — max rotation degrees (default 8)
 *   glareColor — specular highlight color
 *   scale      — scale on hover (default 1.02)
 *   className  — additional class names
 *   style      — additional inline styles
 */
export default function TiltCard({
    children,
    maxTilt = 8,
    glareColor = 'rgba(34,211,238,0.12)',
    scale = 1.02,
    className = '',
    style = {},
    ...rest
}) {
    const ref = useRef(null)
    const [transform, setTransform] = useState('')
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })

    const handleMove = useCallback((e) => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width   // 0-1
        const y = (e.clientY - rect.top) / rect.height    // 0-1
        const tiltX = (0.5 - y) * maxTilt * 2             // pitch
        const tiltY = (x - 0.5) * maxTilt * 2             // yaw

        setTransform(`perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(${scale},${scale},1)`)
        setGlare({ x: x * 100, y: y * 100, opacity: 0.6 })
    }, [maxTilt, scale])

    const handleLeave = useCallback(() => {
        setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')
        setGlare({ x: 50, y: 50, opacity: 0 })
    }, [])

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className={className}
            style={{
                ...style,
                transform,
                transition: 'transform 0.25s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
                transformStyle: 'preserve-3d',
                position: 'relative',
                willChange: 'transform',
            }}
            {...rest}
        >
            {children}
            {/* Specular glare overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${glareColor} 0%, transparent 60%)`,
                    opacity: glare.opacity,
                    transition: 'opacity 0.3s ease',
                    mixBlendMode: 'screen',
                    zIndex: 1,
                }}
            />
        </div>
    )
}
