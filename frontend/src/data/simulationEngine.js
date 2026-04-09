/* ═══════════════════════════════════════════════════════════
   NEXUS — Real-Time Simulation Engine
   Provides dynamic, time-based data across the entire platform
   ═══════════════════════════════════════════════════════════ */

// ─── Deterministic Seeded Random ───
function seededRandom(seed) {
    let s = seed % 2147483647
    if (s <= 0) s += 2147483646
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// ─── Time-based seed that shifts every N seconds ───
function getTimeSeed(intervalSec = 5) {
    return Math.floor(Date.now() / (intervalSec * 1000))
}

// ─── Stock Market Data ───
const BASE_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 218.45, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft', basePrice: 472.80, sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet', basePrice: 186.23, sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon', basePrice: 225.10, sector: 'Consumer' },
    { symbol: 'TSLA', name: 'Tesla', basePrice: 342.18, sector: 'Automotive' },
    { symbol: 'NVDA', name: 'NVIDIA', basePrice: 1042.50, sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms', basePrice: 612.30, sector: 'Technology' },
    { symbol: 'BRK.B', name: 'Berkshire B', basePrice: 475.90, sector: 'Finance' },
    { symbol: 'JPM', name: 'JPMorgan Chase', basePrice: 198.40, sector: 'Finance' },
    { symbol: 'V', name: 'Visa Inc.', basePrice: 282.10, sector: 'Finance' },
    { symbol: 'UNH', name: 'UnitedHealth', basePrice: 520.30, sector: 'Healthcare' },
    { symbol: 'WMT', name: 'Walmart', basePrice: 165.80, sector: 'Consumer' },
]

const BASE_INDICES = [
    { name: 'S&P 500', base: 5842.30, symbol: 'SPX' },
    { name: 'NASDAQ', base: 18420.15, symbol: 'IXIC' },
    { name: 'DOW', base: 42180.60, symbol: 'DJI' },
    { name: 'FTSE 100', base: 8320.40, symbol: 'FTSE' },
    { name: 'Nikkei', base: 38750.20, symbol: 'N225' },
    { name: 'BTC/USD', base: 97240, symbol: 'BTC' },
    { name: 'ETH/USD', base: 3820, symbol: 'ETH' },
    { name: 'Gold', base: 2680.50, symbol: 'XAU' },
    { name: 'EUR/USD', base: 1.0842, symbol: 'EURUSD' },
    { name: 'Crude Oil', base: 78.40, symbol: 'WTI' },
]

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', rate: 1.0 },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', rate: 0.92 },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', rate: 0.79 },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥', rate: 149.50 },
    { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr', rate: 0.88 },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$', rate: 1.36 },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$', rate: 1.53 },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹', rate: 83.12 },
    { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$', rate: 1.34 },
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ', rate: 3.67 },
]

// ─── Generate live stock prices ───
export function getLiveStocks() {
    const rng = seededRandom(getTimeSeed(3))
    return BASE_STOCKS.map(s => {
        const change = (rng() - 0.48) * s.basePrice * 0.04
        const price = +(s.basePrice + change).toFixed(2)
        const pct = +((change / s.basePrice) * 100).toFixed(2)
        return { ...s, price, change: +change.toFixed(2), pct }
    })
}

// ─── Generate live index values ───
export function getLiveIndices() {
    const rng = seededRandom(getTimeSeed(5))
    return BASE_INDICES.map(idx => {
        const volatility = idx.base > 10000 ? 0.015 : idx.base > 100 ? 0.025 : 0.035
        const change = (rng() - 0.47) * idx.base * volatility
        const value = idx.base + change
        const pct = (change / idx.base) * 100
        const isSmall = idx.base < 10
        return {
            ...idx,
            value: isSmall ? value.toFixed(4) : value > 1000 ? value.toLocaleString('en', { maximumFractionDigits: 0 }) : value.toFixed(2),
            rawValue: value,
            change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
            up: pct >= 0,
        }
    })
}

// ─── Generate live portfolio data ───
export function getLivePortfolio() {
    const stocks = getLiveStocks()
    const holdings = [
        { ...stocks[0], shares: 50, avgCost: 185.20, alloc: 18 },
        { ...stocks[1], shares: 25, avgCost: 420.00, alloc: 20 },
        { ...stocks[5], shares: 15, avgCost: 850.00, alloc: 26 },
        { ...stocks[3], shares: 30, avgCost: 195.00, alloc: 11 },
        { symbol: 'BTC', name: 'Bitcoin', shares: 0.5, avgCost: 68000, price: getLiveIndices()[5].rawValue, alloc: 8, sector: 'Crypto' },
        { symbol: 'BONDS', name: 'Bond ETF', shares: 100, avgCost: 95.00, price: 97.30 + (seededRandom(getTimeSeed(10))() - 0.5) * 2, alloc: 17, sector: 'Bonds' },
    ]
    const totalValue = holdings.reduce((s, h) => s + h.price * h.shares, 0)
    const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0)
    return { holdings, totalValue, totalCost, pnl: totalValue - totalCost, pnlPct: ((totalValue - totalCost) / totalCost * 100) }
}

// ─── Generate performance chart data ───
export function getPerformanceChart(months = 12) {
    const rng = seededRandom(getTimeSeed(30))
    let base = 180000
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return labels.slice(0, months).map(month => {
        base += (rng() - 0.42) * 8000
        return { month, value: Math.round(base) }
    })
}

// ─── Generate dynamic cash flow data ───
export function getCashFlowData() {
    const rng = seededRandom(getTimeSeed(15))
    return [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return {
            day: d.toLocaleDateString('en', { weekday: 'short' }),
            date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            deposits: Math.round(800 + rng() * 4200),
            withdrawals: Math.round(400 + rng() * 2800),
        }
    })
}

// ─── Global transaction simulation ───
const GLOBAL_CITIES = [
    { city: 'New York', country: 'US', lat: 40.7, lng: -74.0 },
    { city: 'London', country: 'UK', lat: 51.5, lng: -0.1 },
    { city: 'Tokyo', country: 'JP', lat: 35.7, lng: 139.7 },
    { city: 'Singapore', country: 'SG', lat: 1.4, lng: 103.8 },
    { city: 'Dubai', country: 'AE', lat: 25.2, lng: 55.3 },
    { city: 'Sydney', country: 'AU', lat: -33.9, lng: 151.2 },
    { city: 'Mumbai', country: 'IN', lat: 19.1, lng: 72.9 },
    { city: 'Frankfurt', country: 'DE', lat: 50.1, lng: 8.7 },
    { city: 'São Paulo', country: 'BR', lat: -23.5, lng: -46.6 },
    { city: 'Hong Kong', country: 'HK', lat: 22.3, lng: 114.2 },
    { city: 'Toronto', country: 'CA', lat: 43.7, lng: -79.4 },
    { city: 'Zurich', country: 'CH', lat: 47.4, lng: 8.5 },
]

const TX_TYPES = ['Wire Transfer', 'ACH Payment', 'Card Purchase', 'FX Exchange', 'Loan Disbursement', 'Investment Trade', 'Bill Payment', 'P2P Transfer']
const TX_STATUS = ['completed', 'processing', 'pending', 'verified']

export function generateGlobalTransactions(count = 20) {
    const rng = seededRandom(getTimeSeed(8))
    const now = Date.now()
    return Array.from({ length: count }, (_, i) => {
        const from = GLOBAL_CITIES[Math.floor(rng() * GLOBAL_CITIES.length)]
        let to = GLOBAL_CITIES[Math.floor(rng() * GLOBAL_CITIES.length)]
        while (to.city === from.city) to = GLOBAL_CITIES[Math.floor(rng() * GLOBAL_CITIES.length)]
        return {
            id: `TX-${(100000 + Math.floor(rng() * 900000))}`,
            type: TX_TYPES[Math.floor(rng() * TX_TYPES.length)],
            amount: +(500 + rng() * 49500).toFixed(2),
            currency: CURRENCIES[Math.floor(rng() * 4)].code,
            from, to,
            status: TX_STATUS[Math.floor(rng() * TX_STATUS.length)],
            timestamp: new Date(now - Math.floor(rng() * 3600000)).toISOString(),
            processing_time: +(0.2 + rng() * 2.8).toFixed(1),
        }
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

// ─── Dashboard demo accounts ───
export function getDemoAccounts() {
    return [
        { id: 1, account_number: 'NX-2847-PLAT', account_type: 'checking', balance: '24580.42', currency: 'USD', status: 'active' },
        { id: 2, account_number: 'NX-5931-SAVE', account_type: 'savings', balance: '85120.00', currency: 'USD', status: 'active' },
        { id: 3, account_number: 'NX-8274-INVT', account_type: 'investment', balance: '142350.75', currency: 'USD', status: 'active' },
    ]
}

export function getDemoTransactions() {
    const rng = seededRandom(getTimeSeed(20))
    const types = ['deposit', 'withdrawal']
    const descs = {
        deposit: ['Salary Credit — Acme Corp', 'Freelance Payment', 'Investment Return', 'Dividend Payment', 'Refund — Amazon', 'Client Invoice Payment'],
        withdrawal: ['Rent Payment', 'Grocery — Whole Foods', 'Electric Bill', 'Netflix Subscription', 'Gas Station', 'Restaurant — Nobu NYC'],
    }
    const now = Date.now()
    return Array.from({ length: 12 }, (_, i) => {
        const type = types[Math.floor(rng() * 2)]
        return {
            id: i + 1,
            type,
            amount: type === 'deposit' ? (1000 + rng() * 4000).toFixed(2) : (50 + rng() * 1500).toFixed(2),
            description: descs[type][Math.floor(rng() * descs[type].length)],
            created_at: new Date(now - i * 86400000 * (0.5 + rng())).toISOString(),
        }
    })
}

// ─── Network nodes for 3D visualization ───
export const NEXUS_NETWORK_NODES = [
    { id: 'core', label: 'NEXUS CORE', x: 50, y: 50, type: 'core', color: '#22d3ee' },
    { id: 'auth', label: 'Auth Engine', x: 20, y: 20, type: 'module', color: '#a78bfa' },
    { id: 'payments', label: 'Payments', x: 80, y: 20, type: 'module', color: '#34d399' },
    { id: 'analytics', label: 'Analytics', x: 15, y: 55, type: 'module', color: '#fbbf24' },
    { id: 'security', label: 'Security', x: 85, y: 55, type: 'module', color: '#fb7185' },
    { id: 'ai', label: 'AI Engine', x: 30, y: 82, type: 'module', color: '#a78bfa' },
    { id: 'market', label: 'Market Data', x: 70, y: 82, type: 'module', color: '#22d3ee' },
    { id: 'storage', label: 'Data Store', x: 50, y: 18, type: 'infra', color: '#3b82f6' },
    { id: 'gateway', label: 'API Gateway', x: 50, y: 82, type: 'infra', color: '#f59e0b' },
]

export const NEXUS_NETWORK_LINKS = [
    { from: 'core', to: 'auth' }, { from: 'core', to: 'payments' },
    { from: 'core', to: 'analytics' }, { from: 'core', to: 'security' },
    { from: 'core', to: 'ai' }, { from: 'core', to: 'market' },
    { from: 'core', to: 'storage' }, { from: 'core', to: 'gateway' },
    { from: 'auth', to: 'security' }, { from: 'payments', to: 'security' },
    { from: 'ai', to: 'analytics' }, { from: 'market', to: 'analytics' },
    { from: 'gateway', to: 'ai' }, { from: 'gateway', to: 'market' },
    { from: 'storage', to: 'auth' }, { from: 'storage', to: 'payments' },
]

// ─── Credit/Loans simulation ───
export function getCreditData() {
    const rng = seededRandom(getTimeSeed(30))
    return {
        totalCredit: 250000,
        utilized: 87400 + Math.round(rng() * 10000),
        available: 162600 - Math.round(rng() * 10000),
        creditScore: 720 + Math.round((rng() - 0.5) * 40),
        activeLoans: [
            { type: 'Personal Loan', principal: 25000, remaining: 18750 + Math.round(rng() * 2000), rate: 5.5, term: 36, emi: 755 },
            { type: 'Auto Loan', principal: 45000, remaining: 32100 + Math.round(rng() * 3000), rate: 4.2, term: 60, emi: 833 },
            { type: 'Credit Line', principal: 50000, remaining: 12800 + Math.round(rng() * 5000), rate: 7.8, term: 0, emi: 0 },
        ],
        breakdown: [
            { name: 'Personal', value: 25, color: '#22d3ee' },
            { name: 'Auto', value: 35, color: '#a78bfa' },
            { name: 'Credit Line', value: 20, color: '#34d399' },
            { name: 'Available', value: 20, color: '#4a5578' },
        ],
    }
}

// ─── Utility: useInterval hook ───
export function useSimulationInterval(callback, delay = 5000) {
    // This is meant to be composed in components with useEffect
    return { callback, delay }
}

// ─── BillPay demo data ───
export function getDemoBillPayData() {
    return {
        payments: [
            { id: 1, payee_name: 'Netflix', amount: 22.99, frequency: 'monthly', next_date: '2026-05-01', auto_pay: true, status: 'active', logo: '🎬', category: 'entertainment' },
            { id: 2, payee_name: 'Con Edison', amount: 142.50, frequency: 'monthly', next_date: '2026-04-28', auto_pay: true, status: 'active', logo: '⚡', category: 'utilities' },
            { id: 3, payee_name: 'Verizon', amount: 85.00, frequency: 'monthly', next_date: '2026-05-03', auto_pay: false, status: 'active', logo: '📱', category: 'telecom' },
            { id: 4, payee_name: 'Spotify', amount: 15.99, frequency: 'monthly', next_date: '2026-05-10', auto_pay: true, status: 'active', logo: '🎵', category: 'entertainment' },
            { id: 5, payee_name: 'Gym Membership', amount: 49.99, frequency: 'monthly', next_date: '2026-04-15', auto_pay: true, status: 'active', logo: '💪', category: 'health' },
            { id: 6, payee_name: 'Insurance — Geico', amount: 189.00, frequency: 'monthly', next_date: '2026-05-01', auto_pay: true, status: 'active', logo: '🛡️', category: 'insurance' },
            { id: 7, payee_name: 'AWS Cloud', amount: 340.00, frequency: 'monthly', next_date: '2026-05-01', auto_pay: false, status: 'paused', logo: '☁️', category: 'tech' },
        ],
        payees: [
            { id: 1, name: 'Netflix', category: 'entertainment', logo: '🎬' },
            { id: 2, name: 'Con Edison', category: 'utilities', logo: '⚡' },
            { id: 3, name: 'Verizon', category: 'telecom', logo: '📱' },
            { id: 4, name: 'Amazon', category: 'shopping', logo: '📦' },
        ],
        summary: {
            active: 6, monthly_total: 845.47, auto_pay_count: 4, total_paid_all_time: 12680,
        },
    }
}

// ─── Multi-Currency demo data ───
export function getDemoFXWallet() {
    const rng = seededRandom(getTimeSeed(20))
    return {
        holdings: [
            { currency: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', balance: 24580, usd_value: 24580, percentage: 48.2, change: 0 },
            { currency: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', balance: 8500, usd_value: Math.round(8500 / (0.92 + rng() * 0.02)), percentage: 18.1, change: +(rng() * 2 - 1).toFixed(2) },
            { currency: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', balance: 5200, usd_value: Math.round(5200 / (0.79 + rng() * 0.01)), percentage: 12.9, change: +(rng() * 2 - 1).toFixed(2) },
            { currency: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥', balance: 850000, usd_value: Math.round(850000 / (149 + rng() * 3)), percentage: 11.2, change: +(rng() * 2 - 1).toFixed(2) },
            { currency: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr', balance: 4200, usd_value: Math.round(4200 / (0.88 + rng() * 0.02)), percentage: 9.6, change: +(rng() * 2 - 1).toFixed(2) },
        ],
        total_usd: 51000 + Math.round(rng() * 2000),
    }
}

export function getDemoFXCurrencies() {
    const rng = seededRandom(getTimeSeed(10))
    return CURRENCIES.map(c => ({
        ...c,
        rate: +(c.rate * (1 + (rng() - 0.5) * 0.01)).toFixed(c.rate > 10 ? 2 : 4),
        change: +((rng() - 0.48) * 2).toFixed(2),
    }))
}

export { GLOBAL_CITIES, CURRENCIES, BASE_STOCKS, BASE_INDICES }
