/**
 * File: main.jsx
 * Module: frontend/src/main.jsx
 *
 * Purpose:
 *     Application entry point — bootstraps React, sets up the provider
 *     hierarchy, and renders <App /> into the DOM.
 *
 * Provider Hierarchy (outermost → innermost):
 *     React.StrictMode → BrowserRouter → ThemeProvider → AuthProvider → App
 *
 *     - StrictMode: Catches common bugs during development (double renders)
 *     - BrowserRouter: Enables client-side routing (react-router-dom)
 *     - ThemeProvider: Dark/light theme state (CSS variable switching)
 *     - AuthProvider: Authentication state (user, login, logout, MFA)
 *
 * Note: StrictMode causes components to render twice in development.
 * This is intentional — it helps detect side effects, unsafe lifecycles,
 * and legacy API usage. It does NOT affect production builds.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Analytics } from '@vercel/analytics/react'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <App />
                    <Analytics />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
)
