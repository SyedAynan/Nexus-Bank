import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, User, Mail, MessageSquare } from 'lucide-react'

export default function Contact() {
    const [submitted, setSubmitted] = useState(false)
    const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); setTimeout(() => setSubmitted(false), 3000) }

    return (
        <div className="animate-in" style={{ padding: '5rem 1.5rem' }}>
            <motion.div style={{ maxWidth: 480, margin: '0 auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--nx-text)', marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>CONTACT US</h1>
                <p style={{ color: 'var(--nx-text-muted)', fontSize: 14, marginBottom: 32 }}>Get in touch with the NEXUS team.</p>

                {submitted && <div className="nx-alert nx-alert-success" style={{ marginBottom: 16 }}>✓ Message sent successfully</div>}

                <div className="nx-card-static" style={{ padding: '2rem', boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div><label className="nx-label"><User size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Name</label><input type="text" className="nx-input" placeholder="Your name" required /></div>
                        <div><label className="nx-label"><Mail size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Email</label><input type="email" className="nx-input" placeholder="you@example.com" required /></div>
                        <div><label className="nx-label"><MessageSquare size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Message</label><textarea className="nx-input" style={{ minHeight: 120, resize: 'none' }} placeholder="How can we help?" required /></div>
                        <motion.button type="submit" className="nx-btn nx-btn-primary" style={{ width: '100%', padding: '0.8rem' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Send size={14} /> Send Message
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
