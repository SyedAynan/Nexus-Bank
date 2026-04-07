import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bot, Send, X, Sparkles, MessageCircle, User,
    CreditCard, TrendingUp, Shield, HelpCircle, Zap
} from 'lucide-react'

/* ── Simulated AI Responses ── */
const AI_RESPONSES = {
    'balance': { text: 'Your current account balances:\n\n💰 **Checking (NB-001):** $24,580.42\n💰 **Savings (NB-002):** $85,120.00\n💰 **Investment (NB-003):** $142,350.75\n\nTotal portfolio value: **$252,051.17**', category: 'banking' },
    'transfer': { text: 'To make a transfer:\n\n1. Go to **Payments** in the sidebar\n2. Enter the recipient\'s account number\n3. Specify the amount & description\n4. Confirm with your MFA code\n\nWire transfers process within 1-2 business days. Internal transfers are instant. Would you like me to navigate you there?', category: 'help' },
    'fraud': { text: '🛡️ **Fraud Protection Status:** Active\n\nYour account is monitored by our 6-signal AI fraud engine:\n• Z-Score anomaly detection\n• Velocity monitoring (sliding window)\n• Round-number analysis\n• Time-of-day profiling\n• Balance ratio tracking\n• Graph-based network risk\n\nNo suspicious activity detected in the last 30 days.', category: 'security' },
    'loan': { text: '📊 **Loan Pre-Qualification:**\n\nBased on your profile:\n• Credit Score: **742** (Good)\n• Debt-to-Income: **28%**\n• Employment: Verified\n\n✅ You pre-qualify for:\n• Personal Loan up to **$50,000** at 8.5% APR\n• Home Equity up to **$200,000** at 5.2% APR\n\nWould you like to start an application?', category: 'banking' },
    'security': { text: '🔐 **Security Settings:**\n\n• MFA: ✅ Enabled (TOTP)\n• Passkey: ✅ Registered\n• Login Alerts: ✅ Active\n• Session Timeout: 30min\n• Last Password Change: 15 days ago\n\nRecommendation: Your security setup looks excellent! Consider enabling biometric login for faster access.', category: 'security' },
    'analytics': { text: '📈 **Your Financial Summary (Last 30 Days):**\n\n• Income: **$12,500.00**\n• Expenses: **$8,342.18**\n• Savings Rate: **33.3%**\n• Top Category: Dining ($1,240)\n• Largest Transaction: Rent ($2,800)\n\nYour savings rate is above the recommended 20%. Great job! 🎉', category: 'analytics' },
    'help': { text: 'I can help you with:\n\n💰 **Banking** — Balance checks, transfers, statements\n🛡️ **Security** — MFA, passkeys, fraud alerts\n📊 **Analytics** — Spending analysis, trends\n💳 **Loans** — Pre-qualification, applications\n🔍 **Search** — Find transactions, accounts\n⚙️ **Settings** — Profile, preferences\n\nJust ask me anything! I understand natural language.', category: 'help' },
}

function matchResponse(msg) {
    const lower = msg.toLowerCase()
    if (lower.includes('balance') || lower.includes('how much') || lower.includes('money')) return AI_RESPONSES.balance
    if (lower.includes('transfer') || lower.includes('send') || lower.includes('pay') || lower.includes('payment')) return AI_RESPONSES.transfer
    if (lower.includes('fraud') || lower.includes('suspicious') || lower.includes('scam')) return AI_RESPONSES.fraud
    if (lower.includes('loan') || lower.includes('borrow') || lower.includes('credit') || lower.includes('qualify')) return AI_RESPONSES.loan
    if (lower.includes('security') || lower.includes('password') || lower.includes('mfa') || lower.includes('2fa')) return AI_RESPONSES.security
    if (lower.includes('analytics') || lower.includes('spend') || lower.includes('summary') || lower.includes('report')) return AI_RESPONSES.analytics
    if (lower.includes('help') || lower.includes('what can') || lower.includes('hi') || lower.includes('hello')) return AI_RESPONSES.help
    return { text: `I understand you're asking about "${msg}". Let me connect you with a specialist. In the meantime, here's what I can help with:\n\n• Balance inquiries\n• Transfer guidance\n• Fraud protection status\n• Loan pre-qualification\n• Security settings\n• Financial analytics\n\nTry asking about any of these topics!`, category: 'help' }
}

const QUICK_ACTIONS = [
    { label: 'Check Balance', icon: CreditCard, query: 'What is my balance?' },
    { label: 'Fraud Status', icon: Shield, query: 'Is my account safe from fraud?' },
    { label: 'Loan Options', icon: TrendingUp, query: 'Do I qualify for a loan?' },
    { label: 'Help', icon: HelpCircle, query: 'What can you help me with?' },
]

const sCard = {
    background: 'var(--nx-card-bg)',
    border: '1px solid var(--nx-border)',
    borderRadius: 'var(--radius-md)',
}

export default function AIAssistant() {
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: '👋 Hi! I\'m **NEXUS AI**, your intelligent banking assistant. I can help you with balance checks, transfers, fraud monitoring, loan applications, and much more.\n\nHow can I help you today?', time: new Date() }
    ])
    const [input, setInput] = useState('')
    const [typing, setTyping] = useState(false)
    const scrollRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, typing])

    const send = (text) => {
        if (!text.trim()) return
        const userMsg = { id: Date.now(), role: 'user', text: text.trim(), time: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setTyping(true)

        // Simulate AI thinking
        setTimeout(() => {
            const resp = matchResponse(text)
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: resp.text, time: new Date(), category: resp.category }])
            setTyping(false)
        }, 800 + Math.random() * 1200)
    }

    const renderMarkdown = (text) => {
        return text.split('\n').map((line, i) => {
            let html = line
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#22d3ee">$1</strong>')
                .replace(/•/g, '<span style="color:#a78bfa">•</span>')
            return <div key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} style={{ lineHeight: 1.7 }} />
        })
    }

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{
                    fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)',
                    letterSpacing: '0.1em', color: 'var(--nx-text)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <Sparkles size={28} color="#a78bfa" />
                    AI ASSISTANT
                </h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 6 }}>
                    Your intelligent banking copilot — powered by NEXUS intelligence engine
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, height: 'calc(100vh - 200px)', minHeight: 500 }}>
                {/* Chat Area */}
                <div style={{ ...sCard, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {messages.map(msg => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex', gap: 10,
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: msg.role === 'assistant' ? '#a78bfa18' : '#22d3ee18',
                                    border: `1px solid ${msg.role === 'assistant' ? '#a78bfa33' : '#22d3ee33'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {msg.role === 'assistant' ? <Bot size={16} color="#a78bfa" /> : <User size={16} color="#22d3ee" />}
                                </div>
                                <div style={{
                                    maxWidth: '75%', padding: '12px 16px', borderRadius: 12,
                                    background: msg.role === 'assistant' ? 'var(--nx-bg-2)' : '#22d3ee12',
                                    border: `1px solid ${msg.role === 'assistant' ? 'var(--nx-border)' : '#22d3ee25'}`,
                                    fontSize: 13, color: 'var(--nx-text-muted)',
                                }}>
                                    {renderMarkdown(msg.text)}
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', marginTop: 6, textAlign: 'right' }}>
                                        {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {typing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: '#a78bfa18', border: '1px solid #a78bfa33',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Bot size={16} color="#a78bfa" />
                                </div>
                                <div style={{
                                    padding: '12px 16px', borderRadius: 12,
                                    background: 'var(--nx-bg-2)', border: '1px solid var(--nx-border)',
                                    display: 'flex', gap: 4, alignItems: 'center',
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Input Bar */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--nx-border)', display: 'flex', gap: 10 }}>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send(input)}
                            placeholder="Ask NEXUS AI anything..."
                            style={{
                                flex: 1, background: 'var(--nx-bg-2)', border: '1px solid var(--nx-border)',
                                borderRadius: 8, padding: '10px 14px', color: 'var(--nx-text)',
                                fontSize: 13, outline: 'none',
                            }}
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={!input.trim()}
                            style={{
                                width: 40, height: 40, borderRadius: 8,
                                background: input.trim() ? '#22d3ee' : 'var(--nx-bg-2)',
                                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Send size={16} color={input.trim() ? '#0a0f1a' : 'var(--nx-text-dim)'} />
                        </button>
                    </div>
                </div>

                {/* Sidebar — Quick Actions & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ ...sCard, padding: '16px' }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 12 }}>
                            QUICK ACTIONS
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {QUICK_ACTIONS.map(a => {
                                const I = a.icon
                                return (
                                    <motion.button
                                        key={a.label}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => send(a.query)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 12px', borderRadius: 8,
                                            background: 'var(--nx-bg-2)', border: '1px solid var(--nx-border)',
                                            color: 'var(--nx-text)', fontSize: 12, cursor: 'pointer',
                                            textAlign: 'left', width: '100%',
                                        }}
                                    >
                                        <I size={14} color="#22d3ee" />
                                        {a.label}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ ...sCard, padding: '16px' }}>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 12 }}>
                            AI CAPABILITIES
                        </h3>
                        {[
                            { label: 'Natural Language', desc: 'Understands conversational queries', color: '#22d3ee' },
                            { label: 'Context Aware', desc: 'Remembers conversation history', color: '#a78bfa' },
                            { label: 'Secure', desc: 'All data stays encrypted', color: '#34d399' },
                            { label: 'Real-time', desc: 'Live account data access', color: '#f59e0b' },
                        ].map(c => (
                            <div key={c.label} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <Zap size={12} color={c.color} style={{ marginTop: 2, flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.label}</div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-text-dim)' }}>{c.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ ...sCard, padding: '16px', background: '#a78bfa08', borderColor: '#a78bfa22' }}>
                        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Sparkles size={12} /> NEXUS AI v4.0
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--nx-text-dim)', lineHeight: 1.5 }}>
                            Powered by NEXUS intelligence engine with fraud detection, financial analytics, and natural language understanding.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
