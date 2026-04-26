/**
 * MobileBottomNav — Fixed bottom tab bar for mobile viewport.
 * Matches the fintech reference: HOME · ACCOUNTS · PAYMENTS · CARDS · MARKETS
 */
import { NavLink } from 'react-router-dom'
import { Home, Landmark, Banknote, CreditCard, BarChart3 } from 'lucide-react'

const tabs = [
    { to: '/dashboard', icon: Home,       label: 'Home' },
    { to: '/accounts',  icon: Landmark,   label: 'Accounts' },
    { to: '/transfer',  icon: Banknote,   label: 'Payments' },
    { to: '/cards',     icon: CreditCard, label: 'Cards' },
    { to: '/markets',   icon: BarChart3,  label: 'Markets' },
]

export default function MobileBottomNav() {
    return (
        <nav className="nx-bottom-nav">
            {tabs.map(tab => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) => `nx-bottom-tab ${isActive ? 'active' : ''}`}
                >
                    <tab.icon size={20} strokeWidth={1.8} />
                    <span>{tab.label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
