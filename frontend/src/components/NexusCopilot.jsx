import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Sparkles, TrendingUp, Shield, CreditCard, HelpCircle, Zap, Heart } from 'lucide-react'

/* ── Copilot AI Responses ── */
const COPILOT_RESPONSES = {
    greeting: "👋 Hey! I'm **NEXUS Copilot**, your AI financial guide. Ask me anything about your finances, markets, or how to use the platform!",
    balance: "💰 Your total portfolio is valued at **$252,051.17** across 3 accounts.\n\n• Checking: $24,580\n• Savings: $85,120\n• Investments: $142,350\n\nYour net worth grew **+4.2%** this month. 🎉",
    market: "📈 **Market Pulse:**\n\n• S&P 500: 5,842 (+0.8%)\n• NASDAQ: 18,420 (+1.2%)\n• BTC: $97,240 (+3.1%)\n• Gold: $2,680 (-0.3%)\n\nSentiment: **Bullish** — AI predicts continued uptrend this week.",
    spend: "📊 **This Month's Spending:**\n\n• Dining: $1,240 (⚠️ 20% above avg)\n• Transport: $380\n• Subscriptions: $142\n• Groceries: $620\n\n💡 **Tip:** You could save $248/mo by reducing dining to your 3-month average.",
    invest: "🎯 **AI Recommendations:**\n\n1. Rebalance portfolio (equity heavy at 72%)\n2. Consider adding bonds (target: 15%)\n3. Your risk score is **7.2/10** — moderate-high\n\nWant me to run a simulation?",
    security: "🛡️ All systems green:\n\n• MFA: ✅ Active\n• Last login: 2 min ago\n• Threat level: **Low**\n• No suspicious activity detected\n\nYour account is well-protected.",
    health: "❤️ **Financial Health Score: 82/100**\n\n• Savings Rate: 33% ✅\n• Debt-to-Income: 28% ✅\n• Emergency Fund: 4.2 months ⚠️\n• Credit Score: 742 ✅\n\nGoal: Build emergency fund to 6 months.",
}

function matchCopilotResponse(msg) {
    const l = msg.toLowerCase()
    if (l.includes('balance') || l.includes('portfolio') || l.includes('money') || l.includes('account')) return COPILOT_RESPONSES.balance
    if (l.includes('market') || l.includes('stock') || l.includes('bitcoin') || l.includes('crypto')) return COPILOT_RESPONSES.market
    if (l.includes('spend') || l.includes('expense') || l.includes('budget')) return COPILOT_RESPONSES.spend
    if (l.includes('invest') || l.includes('recommend') || l.includes('suggest') || l.includes('rebalance')) return COPILOT_RESPONSES.invest
    if (l.includes('security') || l.includes('safe') || l.includes('protect')) return COPILOT_RESPONSES.security
    if (l.includes('health') || l.includes('score') || l.includes('how am i')) return COPILOT_RESPONSES.health
    return `I understand you're asking about "${msg}". Let me help!\n\nTry asking about:\n• Your **balance** or portfolio\n• **Market** trends\n• **Spending** analysis\n• **Investment** recommendations\n• **Security** status\n• Financial **health** score`
}

const QUICK_CHIPS = [
    { label: 'My Balance', icon: CreditCard },
    { label: 'Market Pulse', icon: TrendingUp },
    { label: 'Health Score', icon: Heart },
    { label: 'Security Check', icon: Shield },
]

export default function NexusCopilot() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: COPILOT_RESPONSES.greeting, time: new Date() }
    ])
    const [input, setInput] = useState('')
    const [typing, setTyping] = useState(false)
    const scrollRef = useRef(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, typing])

    const send = (text) => {
        if (!text.trim()) return
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: text.trim(), time: new Date() }])
        setInput('')
        setTyping(true)
        setTimeout(() => {
            const resp = matchCopilotResponse(text)
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: resp, time: new Date() }])
            setTyping(false)
        }, 600 + Math.random() * 800)
    }

    const renderText = (text) => text.split('\n').map((line, i) => {
        let html = line
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#22d3ee">$1</strong>')
            .replace(/•/g, '<span style="color:#a78bfa">•</span>')
            .replace(/⚠️/g, '<span style="color:#fbbf24">⚠️</span>')
            .replace(/✅/g, '<span style="color:#34d399">✅</span>')
        return <div key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} style={{ lineHeight: 1.65 }} />
    })

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                className="nx-copilot-fab"
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={open ? { rotate: 180 } : { rotate: 0 }}
                id="nexus-copilot-trigger"
            >
                {open ? <X size={22} color="#050816" /> : <Sparkles size={22} color="#050816" />}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="nx-copilot-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        id="nexus-copilot-panel"
                    >
                        {/* Header */}
                        <div className="nx-copilot-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))',
                                    border: '1px solid rgba(34,211,238,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Sparkles size={16} color="#22d3ee" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                                        NEXUS COPILOT
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--nx-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="nx-live-dot" style={{ width: 5, height: 5 }} /> Online
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-text-dim)' }}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="nx-copilot-msgs" ref={scrollRef}>
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: 'flex', gap: 8,
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    }}
                                >
                                    <div style={{
                                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                                        background: msg.role === 'assistant'
                                            ? 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(34,211,238,0.1))'
                                            : 'rgba(34,211,238,0.1)',
                                        border: `1px solid ${msg.role === 'assistant' ? 'rgba(167,139,250,0.25)' : 'rgba(34,211,238,0.2)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {msg.role === 'assistant' ? <Bot size={13} color="#a78bfa" /> : <Zap size={13} color="#22d3ee" />}
                                    </div>
                                    <div style={{
                                        maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                                        background: msg.role === 'assistant' ? 'rgba(15,23,62,0.6)' : 'rgba(34,211,238,0.08)',
                                        border: `1px solid ${msg.role === 'assistant' ? 'rgba(255,255,255,0.06)' : 'rgba(34,211,238,0.15)'}`,
                                        fontSize: 12, color: 'var(--nx-text-muted)',
                                    }}>
                                        {renderText(msg.text)}
                                    </div>
                                </motion.div>
                            ))}

                            {typing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 8 }}>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: 8,
                                        background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(34,211,238,0.1))',
                                        border: '1px solid rgba(167,139,250,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Bot size={13} color="#a78bfa" />
                                    </div>
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 12,
                                        background: 'rgba(15,23,62,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex', gap: 4, alignItems: 'center',
                                    }}>
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i}
                                                animate={{ scale: [1, 1.4, 1] }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                                style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Quick Chips */}
                        {messages.length <= 2 && (
                            <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {QUICK_CHIPS.map(c => (
                                    <motion.button key={c.label}
                                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => send(c.label)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            padding: '5px 10px', borderRadius: 20,
                                            background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
                                            color: 'var(--nx-cyan)', fontSize: 10, cursor: 'pointer',
                                            fontFamily: 'var(--font-sans)',
                                        }}
                                    >
                                        <c.icon size={10} /> {c.label}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="nx-copilot-input">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && send(input)}
                                placeholder="Ask NEXUS anything..."
                                style={{
                                    flex: 1, background: 'rgba(10,15,46,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 10, padding: '9px 14px', color: 'var(--nx-text)',
                                    fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)',
                                }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => send(input)}
                                disabled={!input.trim()}
                                style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: input.trim() ? 'linear-gradient(135deg, #22d3ee, #a78bfa)' : 'rgba(10,15,46,0.6)',
                                    border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Send size={14} color={input.trim() ? '#050816' : 'var(--nx-text-dim)'} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
