/**
 * File: useDeviceCapability.js
 * 
 * Purpose:
 *     Custom hook that detects device capabilities for adaptive rendering.
 *     Used by 3D components, animations, and chart pages to degrade
 *     gracefully on low-power devices.
 *
 * Returns:
 *     - isMobile: screen width ≤ 768px
 *     - isSmallMobile: screen width ≤ 480px
 *     - isTablet: screen width ≤ 1024px
 *     - isLargeScreen: screen width ≥ 1536px
 *     - prefersReducedMotion: user prefers reduced motion
 *     - isTouchDevice: device has touch capability
 *     - screenWidth: current window width
 */

import { useState, useEffect } from 'react'

export default function useDeviceCapability() {
    const [state, setState] = useState(() => ({
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
        prefersReducedMotion: typeof window !== 'undefined'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false,
        isTouchDevice: typeof window !== 'undefined'
            ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
            : false,
    }))

    useEffect(() => {
        let timeout
        const handleResize = () => {
            clearTimeout(timeout)
            // Debounce resize events to avoid excessive re-renders
            timeout = setTimeout(() => {
                setState(prev => ({ ...prev, screenWidth: window.innerWidth }))
            }, 150)
        }

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const handleMotionChange = (e) => {
            setState(prev => ({ ...prev, prefersReducedMotion: e.matches }))
        }

        window.addEventListener('resize', handleResize)
        motionQuery.addEventListener('change', handleMotionChange)

        return () => {
            clearTimeout(timeout)
            window.removeEventListener('resize', handleResize)
            motionQuery.removeEventListener('change', handleMotionChange)
        }
    }, [])

    return {
        screenWidth: state.screenWidth,
        isMobile: state.screenWidth <= 768,
        isSmallMobile: state.screenWidth <= 480,
        isTablet: state.screenWidth <= 1024,
        isLargeScreen: state.screenWidth >= 1536,
        prefersReducedMotion: state.prefersReducedMotion,
        isTouchDevice: state.isTouchDevice,
    }
}
