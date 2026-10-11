/**
 * File: useNotifications.js
 * Module: frontend/src/hooks/useNotifications.js
 *
 * Purpose:
 *     Shared hook for the live notification inbox (GET /api/notifications/).
 *     Maps backend Notification rows to the UI shape used by the notification
 *     center dropdowns and the full Notifications page, and exposes
 *     mark-read actions that persist via the API.
 *
 * Backend mapping:
 *     type: info | transaction | security | ai | alert  → icon + color + tab key
 *     is_read: false → unread badge/dot; PATCH /{id}/read or /read-all to clear
 *
 * Note: notification deletion is an admin-only backend operation, so dismiss()
 * and clearAll() only hide items locally for the current session.
 */

import { useState, useEffect, useCallback } from 'react'
import { Bell, Shield, CreditCard, Sparkles, AlertTriangle } from 'lucide-react'
import api from '../api'

export const NOTIFICATION_TYPE_META = {
    transaction: { icon: CreditCard, color: '#34d399' },
    security: { icon: Shield, color: '#22d3ee' },
    ai: { icon: Sparkles, color: '#a78bfa' },
    alert: { icon: AlertTriangle, color: '#fbbf24' },
    info: { icon: Bell, color: '#22d3ee' },
}

function relativeTime(date) {
    const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export function toUiNotification(n) {
    const meta = NOTIFICATION_TYPE_META[n.type] || NOTIFICATION_TYPE_META.info
    const created = n.created_at ? new Date(n.created_at) : null
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const day = created ? created.toDateString() : ''
    return {
        id: n.id,
        type: NOTIFICATION_TYPE_META[n.type] ? n.type : 'info',
        title: n.title,
        desc: n.message,
        time: created ? relativeTime(created) : '',
        date: day === today ? 'Today' : day === yesterday ? 'Yesterday' : 'This Week',
        unread: !n.is_read,
        icon: meta.icon,
        color: meta.color,
    }
}

export function useNotifications() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        api.get('/notifications/')
            .then(r => { if (!cancelled) setItems((r.data || []).map(toUiNotification)) })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const markAllRead = useCallback(() => {
        api.patch('/notifications/read-all').catch(() => { })
        setItems(prev => prev.map(n => ({ ...n, unread: false })))
    }, [])

    const markRead = useCallback((id) => {
        api.patch(`/notifications/${id}/read`).catch(() => { })
        setItems(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)))
    }, [])

    // Local-only: deletion is an admin operation on the backend
    const dismiss = useCallback((id) => {
        setItems(prev => prev.filter(n => n.id !== id))
    }, [])

    const clearAll = useCallback(() => setItems([]), [])

    const unreadCount = items.filter(n => n.unread).length

    return { items, unreadCount, loading, markAllRead, markRead, dismiss, clearAll }
}
