import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Binary, Network, Layers, Database, Search, Shield,
    TrendingUp, ArrowRight, GitBranch, Cpu, Zap, ChevronDown,
    ChevronRight, BarChart3, Lock, AlertTriangle, CreditCard
} from 'lucide-react'

/* ── DSA Data ── */
const DSA_DATA = [
    {
        id: 'linked-list',
        name: 'Linked List',
        icon: Layers,
        color: '#22d3ee',
        module: 'TransactionLinkedList',
        file: 'data_structures/linked_list.py',
        useCase: 'Transaction History Chaining',
        description: 'Each transaction is a node in a singly linked list, enabling O(1) insertion of new transactions and efficient forward traversal of history. Used in the banking service to maintain chronological transaction chains per account.',
        whereUsed: ['Banking Service', 'Transaction History', 'Account Ledger'],
        complexity: { insert: 'O(1)', traverse: 'O(n)', search: 'O(n)', delete: 'O(n)', space: 'O(n)' },
        realWorldUse: 'When a user views their transaction history, each entry is traversed from head → tail. New transactions are prepended in O(1).',
    },
    {
        id: 'stack',
        name: 'Stack (LIFO)',
        icon: Layers,
        color: '#a78bfa',
        module: 'UndoStack',
        file: 'data_structures/stack.py',
        useCase: 'Transaction Undo / Rollback',
        description: 'LIFO structure for reversible operations. When a transaction is executed, it\'s pushed to the stack. Undo pops the most recent operation and reverses it. Critical for admin rollback functionality.',
        whereUsed: ['Admin Panel', 'Transaction Rollback', 'Audit Trail'],
        complexity: { push: 'O(1)', pop: 'O(1)', peek: 'O(1)', space: 'O(n)' },
        realWorldUse: 'Admin clicks "Undo Last Transaction" → pop from stack → reverse the credit/debit → update account balance.',
    },
    {
        id: 'queue',
        name: 'Queue (FIFO)',
        icon: ArrowRight,
        color: '#34d399',
        module: 'TransactionQueue',
        file: 'data_structures/queue.py',
        useCase: 'Pending Transaction Processing',
        description: 'FIFO queue for processing pending transactions in order. Wire transfers, scheduled payments, and batch operations are enqueued and dequeued in arrival order, ensuring fairness.',
        whereUsed: ['Payment Processing', 'Wire Transfers', 'Batch Operations'],
        complexity: { enqueue: 'O(1)', dequeue: 'O(1)', peek: 'O(1)', space: 'O(n)' },
        realWorldUse: 'User initiates a transfer → enqueued → processed in FIFO order → dequeued after settlement.',
    },
    {
        id: 'bst',
        name: 'Binary Search Tree',
        icon: GitBranch,
        color: '#f59e0b',
        module: 'AccountBST',
        file: 'data_structures/bst.py',
        useCase: 'Sorted Account Ordering & Range Queries',
        description: 'Accounts are organized in a BST by balance, enabling efficient sorted listing, range queries (find all accounts with balance $10k-$50k), and min/max balance lookups.',
        whereUsed: ['Account Sorting', 'Balance Range Queries', 'Analytics Dashboard'],
        complexity: { insert: 'O(log n)', search: 'O(log n)', inOrder: 'O(n)', min: 'O(log n)', space: 'O(n)' },
        realWorldUse: 'Admin views accounts sorted by balance → BST in-order traversal. Analytics queries for balance ranges use BST range search.',
    },
    {
        id: 'hash-table',
        name: 'Hash Table',
        icon: Database,
        color: '#ec4899',
        module: 'AccountHashTable',
        file: 'data_structures/hash_table.py',
        useCase: 'O(1) Account Lookup by ID',
        description: 'Constant-time account lookups by account number. When a transfer is initiated, both sender and receiver accounts are found instantly via hash table instead of linear search.',
        whereUsed: ['Account Lookup', 'Transfer Validation', 'Balance Checks'],
        complexity: { insert: 'O(1)', lookup: 'O(1)', delete: 'O(1)', space: 'O(n)' },
        realWorldUse: 'User enters account number for transfer → hash table lookup O(1) → account found instantly vs O(n) linear scan.',
    },
    {
        id: 'graph',
        name: 'Graph (Adjacency List)',
        icon: Network,
        color: '#ef4444',
        module: 'ComplianceGraph',
        file: 'data_structures/graph.py',
        useCase: 'AML Transaction Network & Cycle Detection',
        description: 'Directed graph where nodes are accounts and edges are transfer relationships. DFS detects cycles (circular money flows — a red flag for money laundering). BFS finds shortest paths between accounts for compliance tracing.',
        whereUsed: ['AML Engine', 'Fraud Detection', 'Compliance Reporting', 'Risk Intelligence'],
        complexity: { addEdge: 'O(1)', DFS: 'O(V+E)', BFS: 'O(V+E)', cycleDetect: 'O(V+E)', space: 'O(V+E)' },
        realWorldUse: 'AML scan runs DFS cycle detection → finds A→B→C→A circular transfers → flags as suspicious money laundering pattern.',
    },
    {
        id: 'priority-queue',
        name: 'Priority Queue (Heap)',
        icon: TrendingUp,
        color: '#8b5cf6',
        module: 'LoanPriorityQueue',
        file: 'data_structures/priority_queue.py',
        useCase: 'Loan Approval Priority & Top-K',
        description: 'Max-heap prioritizes loan applications by approval probability score. The loan officer processes highest-priority loans first. Also used for Top-K customer rankings.',
        whereUsed: ['Loan Scoring', 'Approval Queue', 'Customer Analytics'],
        complexity: { insert: 'O(log n)', extractMax: 'O(log n)', peek: 'O(1)', space: 'O(n)' },
        realWorldUse: 'Loan applications inserted with priority score → extract_max returns highest-probability loan for review → officer approves/rejects.',
    },
    {
        id: 'trie',
        name: 'Trie (Prefix Tree)',
        icon: Search,
        color: '#06b6d4',
        module: 'Trie',
        file: 'data_structures/trie.py',
        useCase: 'Fast Autocomplete Search',
        description: 'Prefix tree for instant autocomplete. Account numbers and usernames are indexed in the Trie. Typing "NB-" instantly returns all matching accounts without scanning the entire database.',
        whereUsed: ['Search Engine', 'Account Autocomplete', 'Admin Panel Search'],
        complexity: { insert: 'O(m)', search: 'O(m)', prefix: 'O(m+k)', space: 'O(N×M)' },
        realWorldUse: 'User types "NB-JH" in search → Trie traverses 5 characters → returns NB-JHN-001, NB-JHN-002 instantly.',
    },
    {
        id: 'sorting',
        name: 'Sorting Algorithms',
        icon: BarChart3,
        color: '#f97316',
        module: 'SortingAlgorithms',
        file: 'data_structures/sorting.py',
        useCase: 'Transaction Ordering & Risk Ranking',
        description: 'Four sorting algorithms optimized for different use cases: Merge Sort (stable amount sorting), Quick Sort (fraud score ranking), Heap Sort (top-K extraction), Counting Sort (risk-level bucketing).',
        whereUsed: ['Transaction Sorting', 'Risk Ranking', 'Analytics', 'Fraud Alerts'],
        complexity: { mergeSort: 'O(n log n)', quickSort: 'O(n log n) avg', heapSort: 'O(n log n)', countingSort: 'O(n+k)' },
        algorithms: [
            { name: 'Merge Sort', use: 'Stable sort by transaction amount', best: 'Preserves order of equal elements' },
            { name: 'Quick Sort', use: 'Sort by fraud score (descending)', best: 'Fastest average-case in-place sort' },
            { name: 'Heap Sort', use: 'Top-K highest risk transactions', best: 'No extra memory, guaranteed O(n log n)' },
            { name: 'Counting Sort', use: 'Group transactions by risk level', best: 'O(n) for small range of values (low/med/high)' },
        ],
        realWorldUse: 'Dashboard loads → Merge Sort orders transactions by date → Quick Sort ranks fraud alerts → Counting Sort groups by risk level for the pie chart.',
    },
]

/* ── Architecture Pipeline Map ── */
const PIPELINE_STAGES = [
    {
        stage: 'User Input',
        icon: CreditCard,
        color: '#22d3ee',
        description: 'User initiates a transaction, search, or loan application',
        dsaUsed: [],
    },
    {
        stage: 'Validation',
        icon: Lock,
        color: '#a78bfa',
        description: 'Input validated, accounts verified via O(1) lookup',
        dsaUsed: ['Hash Table'],
    },
    {
        stage: 'Processing',
        icon: Cpu,
        color: '#34d399',
        description: 'Transaction queued (FIFO), undo stack updated, linked list extended',
        dsaUsed: ['Queue', 'Stack (LIFO)', 'Linked List'],
    },
    {
        stage: 'AI Analysis',
        icon: Shield,
        color: '#ef4444',
        description: 'Fraud scoring via ML + graph analysis for AML compliance',
        dsaUsed: ['Graph', 'Sorting Algorithms'],
    },
    {
        stage: 'Prioritization',
        icon: TrendingUp,
        color: '#f59e0b',
        description: 'Loans prioritized, accounts sorted, top-K extracted',
        dsaUsed: ['Priority Queue', 'Binary Search Tree', 'Sorting Algorithms'],
    },
    {
        stage: 'Search & Discovery',
        icon: Search,
        color: '#06b6d4',
        description: 'Instant autocomplete, fuzzy matching, prefix search',
        dsaUsed: ['Trie'],
    },
]

/* ── Component Styles ── */
const sCard = {
    background: 'var(--nx-card-bg)',
    border: '1px solid var(--nx-border)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
}

function DSACard({ dsa, isOpen, onToggle }) {
    const Icon = dsa.icon
    return (
        <motion.div
            layout
            style={{ ...sCard, cursor: 'pointer', overflow: 'hidden' }}
            whileHover={{ borderColor: dsa.color + '44' }}
            onClick={onToggle}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: dsa.color + '18', border: `1px solid ${dsa.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} color={dsa.color} />
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        {dsa.name}
                    </h3>
                    <p style={{ fontSize: 12, color: dsa.color, marginTop: 2 }}>{dsa.useCase}</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} color='var(--nx-text-muted)' />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--nx-border)' }}>
                            {/* Description */}
                            <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                                {dsa.description}
                            </p>

                            {/* Module + File */}
                            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', background: 'var(--nx-bg-2)', padding: '4px 10px', borderRadius: 6 }}>
                                    Module: <span style={{ color: dsa.color }}>{dsa.module}</span>
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', background: 'var(--nx-bg-2)', padding: '4px 10px', borderRadius: 6 }}>
                                    File: <span style={{ color: 'var(--nx-text-muted)' }}>{dsa.file}</span>
                                </span>
                            </div>

                            {/* Where Used */}
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Used In:</span>
                                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                    {dsa.whereUsed.map(w => (
                                        <span key={w} style={{
                                            fontSize: 11, padding: '3px 10px', borderRadius: 20,
                                            background: dsa.color + '15', color: dsa.color,
                                            border: `1px solid ${dsa.color}30`,
                                        }}>{w}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Complexity Table */}
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Time & Space Complexity:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, marginTop: 8 }}>
                                    {Object.entries(dsa.complexity).map(([op, val]) => (
                                        <div key={op} style={{
                                            background: 'var(--nx-bg-2)', padding: '6px 10px', borderRadius: 6,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', textTransform: 'capitalize' }}>{op}</span>
                                            <span style={{ fontSize: 12, color: '#22d3ee', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sorting sub-algorithms */}
                            {dsa.algorithms && (
                                <div style={{ marginBottom: 16 }}>
                                    <span style={{ fontSize: 11, color: 'var(--nx-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Algorithms:</span>
                                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {dsa.algorithms.map(a => (
                                            <div key={a.name} style={{ background: 'var(--nx-bg-2)', padding: '8px 12px', borderRadius: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: dsa.color, fontWeight: 600 }}>{a.name}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--nx-text-dim)' }}>{a.best}</span>
                                                </div>
                                                <span style={{ fontSize: 11, color: 'var(--nx-text-muted)' }}>{a.use}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Real World Use */}
                            <div style={{
                                background: dsa.color + '08', border: `1px solid ${dsa.color}20`,
                                borderRadius: 8, padding: '10px 14px',
                            }}>
                                <span style={{ fontSize: 11, color: dsa.color, fontWeight: 600 }}>💡 Real-World Example:</span>
                                <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                                    {dsa.realWorldUse}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ── Pipeline Stage ── */
function PipelineStage({ stage, index, total }) {
    const Icon = stage.icon
    return (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 16 }}>
            {/* Timeline connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44 }}>
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: index * 0.15, type: 'spring' }}
                    style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: stage.color + '18', border: `2px solid ${stage.color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                >
                    <Icon size={20} color={stage.color} />
                </motion.div>
                {index < total - 1 && (
                    <motion.div
                        initial={{ height: 0 }} animate={{ height: '100%' }}
                        transition={{ delay: index * 0.15 + 0.2, duration: 0.4 }}
                        style={{ width: 2, background: `linear-gradient(${stage.color}55, transparent)`, minHeight: 20, flex: 1 }}
                    />
                )}
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.1 }}
                style={{ flex: 1, paddingBottom: index < total - 1 ? 20 : 0 }}
            >
                <h4 style={{ fontSize: 14, fontWeight: 700, color: stage.color, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                    STAGE {index + 1}: {stage.stage.toUpperCase()}
                </h4>
                <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                    {stage.description}
                </p>
                {stage.dsaUsed.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {stage.dsaUsed.map(d => (
                            <span key={d} style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 12,
                                background: stage.color + '15', color: stage.color,
                                border: `1px solid ${stage.color}25`, fontWeight: 600,
                            }}>{d}</span>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}

/* ── Main Page ── */
export default function DSAShowcase() {
    const [openCards, setOpenCards] = useState(new Set(['linked-list']))
    const [view, setView] = useState('map') // 'map' | 'catalog'

    const toggle = (id) => {
        const next = new Set(openCards)
        next.has(id) ? next.delete(id) : next.add(id)
        setOpenCards(next)
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{
                    fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)',
                    letterSpacing: '0.1em', color: 'var(--nx-text)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <Binary size={28} color="#22d3ee" />
                    DSA ARCHITECTURE
                </h1>
                <p style={{ fontSize: 13, color: 'var(--nx-text-muted)', marginTop: 6 }}>
                    9 data structures & 4 sorting algorithms powering NEXA's banking engine
                </p>
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Data Structures', value: '9', color: '#22d3ee' },
                    { label: 'Sorting Algorithms', value: '4', color: '#a78bfa' },
                    { label: 'Services Using DSA', value: '12', color: '#34d399' },
                    { label: 'API Endpoints', value: '6', color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} style={{ ...sCard, textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--nx-text-dim)', marginTop: 2, letterSpacing: '0.06em' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {['map', 'catalog'].map(v => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={view === v ? 'nx-btn nx-btn-primary' : 'nx-btn nx-btn-outline'}
                        style={{ fontSize: 12, padding: '6px 18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    >
                        {v === 'map' ? '🗺️ Architecture Pipeline' : '📂 DSA Catalog'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {view === 'map' ? (
                    <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Architecture Pipeline Map */}
                        <div style={{ ...sCard, marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 20 }}>
                                <Zap size={16} color="#22d3ee" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                                TRANSACTION PROCESSING PIPELINE
                            </h2>
                            <p style={{ fontSize: 12, color: 'var(--nx-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                                Every financial operation flows through this pipeline. Each stage leverages specific data structures for optimal performance.
                            </p>
                            {PIPELINE_STAGES.map((stage, i) => (
                                <PipelineStage key={stage.stage} stage={stage} index={i} total={PIPELINE_STAGES.length} />
                            ))}
                        </div>

                        {/* DSA ↔ Service Integration Matrix */}
                        <div style={{ ...sCard }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--nx-text)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 16 }}>
                                <Network size={16} color="#a78bfa" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                                DSA ↔ SERVICE INTEGRATION MAP
                            </h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--nx-border)' }}>
                                            <th style={{ padding: 8, textAlign: 'left', color: 'var(--nx-text-dim)', fontWeight: 600 }}>DSA</th>
                                            {['Banking', 'Fraud', 'AML', 'Loans', 'Search', 'Analytics', 'Admin'].map(s => (
                                                <th key={s} style={{ padding: 8, textAlign: 'center', color: 'var(--nx-text-dim)', fontWeight: 600 }}>{s}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ['Linked List', true, false, false, false, false, true, false],
                                            ['Stack', true, false, false, false, false, false, true],
                                            ['Queue', true, false, false, false, false, false, false],
                                            ['BST', true, false, false, false, false, true, true],
                                            ['Hash Table', true, true, true, false, false, false, true],
                                            ['Graph', false, true, true, false, false, false, true],
                                            ['Priority Queue', false, false, false, true, false, true, false],
                                            ['Trie', false, false, false, false, true, false, true],
                                            ['Merge Sort', true, false, false, false, false, true, false],
                                            ['Quick Sort', false, true, false, false, false, true, false],
                                            ['Heap Sort', false, true, false, true, false, true, false],
                                            ['Counting Sort', false, true, true, false, false, true, false],
                                        ].map(([name, ...cols]) => (
                                            <tr key={name} style={{ borderBottom: '1px solid var(--nx-border)' }}>
                                                <td style={{ padding: 8, color: 'var(--nx-text)', fontWeight: 500 }}>{name}</td>
                                                {cols.map((v, i) => (
                                                    <td key={i} style={{ padding: 8, textAlign: 'center' }}>
                                                        {v ? <span style={{ color: '#22d3ee', fontWeight: 700 }}>●</span> : <span style={{ color: 'var(--nx-text-dim)' }}>·</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* DSA Catalog - Accordion Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {DSA_DATA.map(dsa => (
                                <DSACard
                                    key={dsa.id}
                                    dsa={dsa}
                                    isOpen={openCards.has(dsa.id)}
                                    onToggle={() => toggle(dsa.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
