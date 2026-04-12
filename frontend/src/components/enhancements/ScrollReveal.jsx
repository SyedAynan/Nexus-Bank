import { useRef, useEffect, useState } from 'react'

/**
 * ScrollReveal — Wraps children and animates them in when they enter the viewport.
 * Uses IntersectionObserver for performance.
 *
 * Props:
 *   direction  — 'up' | 'down' | 'left' | 'right' | 'none'
 *   distance   — pixels to translate from (default 30)
 *   duration   — transition duration in ms (default 700)
 *   delay      — delay in ms (default 0)
 *   threshold  — IntersectionObserver threshold (default 0.15)
 *   once       — only animate once (default true)
 *   className  — additional class names
 *   style      — additional styles
 */
export default function ScrollReveal({
    children,
    direction = 'up',
    distance = 30,
    duration = 700,
    delay = 0,
    threshold = 0.15,
    once = true,
    className = '',
    style = {},
    as: Tag = 'div',
}) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    if (once) observer.unobserve(el)
                } else if (!once) {
                    setVisible(false)
                }
            },
            { threshold }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [threshold, once])

    const getTranslate = () => {
        switch (direction) {
            case 'up':    return `translateY(${distance}px)`
            case 'down':  return `translateY(-${distance}px)`
            case 'left':  return `translateX(${distance}px)`
            case 'right': return `translateX(-${distance}px)`
            default:      return 'none'
        }
    }

    return (
        <Tag
            ref={ref}
            className={className}
            style={{
                ...style,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) translateX(0)' : getTranslate(),
                transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
                willChange: visible ? 'auto' : 'opacity, transform',
            }}
        >
            {children}
        </Tag>
    )
}
