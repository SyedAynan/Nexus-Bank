# 🧬 NEXA — DSA Architecture Map

> **This document maps every Data Structure & Algorithm used in the NEXA banking platform to its exact location in the codebase.**  
> The DSA layer is invisible in the UI — it powers the backend silently. Only visible by reading the source code.

---

## 📊 Overview

NEXA uses **9 core DSA implementations** + **4 indirect algorithmic patterns** across its banking engine. Every data structure solves a real banking problem — this is not academic code; it's production infrastructure.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXA DSA Architecture                          │
├─────────────┬──────────────────┬────────────────────────────────────┤
│  Structure  │   Complexity     │   Banking Use Case                 │
├─────────────┼──────────────────┼────────────────────────────────────┤
│ Hash Table  │ O(1) lookup      │ Account retrieval by ID/email      │
│ BST         │ O(log n) search  │ Sorted accounts, range queries     │
│ Linked List │ O(1) prepend     │ Transaction history per account    │
│ Stack       │ O(1) push/pop    │ Undo last transaction              │
│ Queue       │ O(1) enq/deq     │ FIFO transaction processing        │
│ Priority Q  │ O(log n) extract │ Loan approval prioritization       │
│ Graph       │ O(V+E) traversal │ Transfer network, cycle detection  │
│ Trie        │ O(m) prefix      │ Autocomplete search                │
│ Sorting     │ O(n log n)       │ Transaction/risk ordering          │
├─────────────┼──────────────────┼────────────────────────────────────┤
│ Sliding Win │ O(1) amortized   │ Fraud velocity detection           │
│ Levenshtein │ O(m×n) DP        │ Fuzzy search matching              │
│ Hash Chain  │ O(1) append      │ Tamper-proof audit logs            │
│ Counting    │ O(n+k)           │ Risk-level bucketing               │
└─────────────┴──────────────────┴────────────────────────────────────┘
```

---

## 🔷 1. Hash Table — `AccountHashTable`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/hash_table.py` |
| **Class** | `AccountHashTable` |
| **Underlying** | Python `dict` (open addressing + dynamic resizing) |
| **Thread Safety** | `threading.RLock` for concurrent access |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `put(account_id, account)` | O(1) avg | O(n) |
| `get(account_id)` | O(1) avg | — |
| `get_by_email(email)` | O(1) avg | — |
| `get_by_owner(name)` | O(k) | — |
| `delete(account_id)` | O(1) avg | — |
| `exists(account_id)` | O(1) | — |

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()          → self.account_table = AccountHashTable()
├── create_account()    → self.account_table.put(account_id, account_dict)
├── get_account()       → return self.account_table.get(account_id)  # O(1)
├── freeze_account()    → self.account_table.get(account_id)
├── deposit()           → self.account_table.get(account_id)
├── withdraw()          → self.account_table.get(account_id)
└── transfer()          → self.account_table.get(from_id), get(to_id)

bank_system/services/analytics_engine.py
└── get_account_growth() → self.bank.account_table.count()
```

### Why This DSA?
Banking requires **instant account lookup** by multiple keys (ID, email, owner). A hash table provides O(1) average-case access through primary and secondary indices. The secondary indices (`_email_index`, `_owner_index`) enable multi-key lookups without scanning all accounts.

---

## 🔷 2. Binary Search Tree (BST) — `AccountBST`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/bst.py` |
| **Class** | `AccountBST` (with `BSTNode`) |
| **Key** | `account_number` (string comparison) |

### Time & Space Complexity
| Operation | Time (Avg) | Time (Worst) | Space |
|-----------|-----------|-------------|-------|
| `insert(account_number, ref)` | O(log n) | O(n) | O(n) |
| `search(account_number)` | O(log n) | O(n) | — |
| `delete(account_number)` | O(log n) | O(n) | — |
| `inorder()` | O(n) | O(n) | O(n) |
| `range_query(low, high)` | O(k + log n) | — | O(k) |

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()          → self.account_bst = AccountBST()
├── create_account()    → self.account_bst.insert(account_number, account_dict)
├── get_all_accounts()  → return self.account_bst.inorder()  # Sorted traversal
└── _seed_demo_data()   → self.account_bst.insert(...)

bank_system/api/routes/dsa_admin.py
└── /api/admin/dsa/bst  → Visualize BST structure for admin panel
```

### Why This DSA?
While the hash table provides O(1) random access, the BST provides **sorted traversal** and **range queries**. When a user requests "show all accounts between NX-1000 and NX-2000", the BST efficiently prunes branches using range_query() in O(k + log n) instead of scanning all accounts.

---

## 🔷 3. Linked List — `TransactionLinkedList`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/linked_list.py` |
| **Classes** | `TransactionNode`, `TransactionLinkedList` |
| **Type** | Singly linked list (head insertion) |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `prepend(node)` | O(1) | O(1) |
| `to_list(limit)` | O(limit) | O(limit) |
| `get_totals()` | O(n) | O(1) |

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()                    → self.transactions = {}  # account_id → TransactionLinkedList
├── _record_transaction()         → linked_list.prepend(TransactionNode(...))
├── get_transaction_history()     → return self.transactions[account_id].to_list(limit)
├── get_all_recent_transactions() → iterates all linked lists
├── deposit()                     → calls _record_transaction()
├── withdraw()                    → calls _record_transaction()
└── transfer()                    → calls _record_transaction() for both accounts
```

### Why This DSA?
Each account maintains its own transaction history as a linked list. **Prepending** new transactions is O(1) — critical for a banking system processing many transactions per second. Unlike an array, no resizing or shifting is needed. The most recent transactions are always at the head, making "last N transactions" queries efficient.

---

## 🔷 4. Stack (LIFO) — `UndoStack`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/stack.py` |
| **Class** | `UndoStack` |
| **Underlying** | Python `list` with max_size cap |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `push(operation)` | O(1) | O(n) |
| `pop()` | O(1) | — |
| `peek()` | O(1) | — |
| `to_list()` | O(n) | O(n) |

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()                → self.undo_stacks = {}  # account_id → UndoStack
├── deposit()                 → undo_stack.push({type: 'deposit', amount, prev_balance, ...})
├── withdraw()                → undo_stack.push({type: 'withdrawal', amount, prev_balance, ...})
├── undo_last_transaction()   → op = undo_stack.pop()  →  reverses the operation
│   ├── if op.type == 'deposit'    → subtract amount (reverse deposit)
│   └── if op.type == 'withdrawal' → add amount back (reverse withdrawal)
```

### Why This DSA?
The **LIFO property** of a stack naturally models "undo" operations. The last operation is the first one that can be reversed. The max_size cap (default 50) prevents unbounded memory growth while keeping a reasonable undo history.

---

## 🔷 5. Queue (FIFO) — `TransactionQueue`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/queue.py` |
| **Class** | `TransactionQueue` |
| **Underlying** | `collections.deque` (doubly-linked list) |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `enqueue(transaction)` | O(1) | O(n) |
| `dequeue()` | O(1) | — |
| `peek()` | O(1) | — |
| `process_all(fn)` | O(n) | O(n) |

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()                      → self.transaction_queue = TransactionQueue()
├── enqueue_transaction()           → self.transaction_queue.enqueue(transaction)
└── process_queued_transactions()   → while not queue.empty(): dequeue → process
    ├── type == 'deposit'  → calls self.deposit()
    ├── type == 'withdrawal' → calls self.withdraw()
    └── type == 'transfer' → calls self.transfer()
```

### Why This DSA?
Bank transactions must be processed **in the order received** (FIFO). A customer's deposit submitted at 10:01 must clear before their 10:02 transfer. The `deque` backend provides O(1) for both enqueue (append) and dequeue (popleft), unlike a list which would be O(n) for popleft.

---

## 🔷 6. Priority Queue (Min-Heap) — `LoanPriorityQueue`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/priority_queue.py` |
| **Class** | `LoanPriorityQueue` |
| **Underlying** | `heapq` (binary min-heap) |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `enqueue_loan(loan)` | O(log n) | O(n) |
| `dequeue_loan()` | O(log n) | — |
| `peek()` | O(1) | — |
| `cancel_loan(id)` | O(1) lazy | — |
| `to_list()` | O(n log n) | O(n) |

### Priority Formula
```python
priority = (100 - credit_score) + (loan_amount / 100000) - urgency
# Lower number = HIGHER priority
# High credit + small amount + urgent = processed first
```

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()            → self.loan_queue = LoanPriorityQueue()
├── apply_loan()          → self.loan_queue.enqueue_loan(loan_dict)
├── process_next_loan()   → loan = self.loan_queue.dequeue_loan()  # Highest priority
├── get_pending_loans()   → return self.loan_queue.to_list()

bank_system/services/analytics_engine.py
└── get_loan_status_breakdown() → self.bank.loan_queue.size()

bank_system/services/loan_scoring.py
└── score_all_pending()   → self.bank.get_pending_loans()  # Uses queue data
```

### Why This DSA?
Loan applications have **different priorities** based on credit score, amount, and urgency. A priority queue ensures the most creditworthy/urgent applications are processed first without manual sorting. The **lazy deletion** pattern (`cancel_loan` marks entries as removed, actual deletion on next `dequeue`) avoids expensive heap restructuring.

---

## 🔷 7. Graph (Adjacency List) — `ComplianceGraph`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/graph.py` |
| **Class** | `ComplianceGraph` |
| **Type** | Directed weighted graph |
| **Nodes** | Account IDs |
| **Edges** | Transfer transactions (weight = total amount) |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `add_transfer(from, to, amount)` | O(1) | O(V+E) |
| `bfs(start)` | O(V+E) | O(V) |
| `detect_cycles()` | O(V+E) | O(V) |
| `compute_risk_scores()` | O(V+E) | O(V) |

### Where Used in Code

```
bank_system/services/banking_service.py
├── __init__()              → self.compliance_graph = ComplianceGraph()
├── transfer()              → self.compliance_graph.add_transfer(from_id, to_id, amount)
├── run_compliance_check()  → 
│   ├── cycles = self.compliance_graph.detect_cycles()      # DFS cycle detection
│   ├── risk_scores = self.compliance_graph.compute_risk_scores()
│   └── high_risk = self.compliance_graph.get_high_risk_accounts()

bank_system/services/fraud_engine.py
└── _graph_risk_signal()    → self.bank.compliance_graph.compute_risk_scores()
                            # Uses graph risk as a fraud signal

bank_system/services/loan_scoring.py
└── _score_network()        → self.bank.compliance_graph.compute_risk_scores()
                            # Network risk affects loan approval

bank_system/api/routes/dsa_admin.py
└── /api/admin/dsa/graph    → self.bank.compliance_graph.get_graph_data()
                            # Visualization for admin panel
```

### Why This DSA?
Transfer networks are **naturally graph-structured**. Detecting **circular transfers** (money laundering red flag) requires cycle detection (DFS). Computing **risk scores** uses out-degree and transfer volume as heuristics. BFS finds all accounts reachable from a suspicious account (money flow tracing). This is the most complex DSA in NEXA and powers three separate engines.

---

## 🔷 8. Trie (Prefix Tree) — `Trie`

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/trie.py` |
| **Classes** | `TrieNode`, `Trie` |
| **Optimization** | `__slots__` on TrieNode for memory efficiency |

### Time & Space Complexity
| Operation | Time | Space |
|-----------|------|-------|
| `insert(word, data)` | O(m) | O(N × M) |
| `search(word)` | O(m) | — |
| `starts_with(prefix, limit)` | O(m + k) | O(k) |
| `delete(word)` | O(m) | — |
| `visualize()` | O(nodes) | O(nodes) |

Where m = word length, k = results count, N = total words, M = avg word length.

### Where Used in Code

```
bank_system/services/search_engine.py
├── SearchEngine.__init__()  → Uses Trie for autocomplete suggestions
└── get_suggestions()        → trie.starts_with(partial, limit=5)

bank_system/api/routes/dsa_admin.py
├── /api/admin/dsa/trie         → trie.visualize()  # JSON tree for admin panel
├── /api/admin/dsa/trie/insert  → trie.insert(word)
├── /api/admin/dsa/trie/search  → trie.search(word) + trie.starts_with(prefix)
└── /api/admin/dsa/trie/delete  → trie.delete(word)
```

### Why This DSA?
Autocomplete search requires **prefix matching** — "find all usernames starting with 'joh'". A trie answers this in O(m + k) time where m = prefix length and k = number of results. A hash table would require scanning all keys. The `visualize()` method enables a tree view in the admin DSA panel.

---

## 🔷 9. Sorting Algorithms

| Property | Detail |
|----------|--------|
| **File** | `bank_system/data_structures/sorting.py` |
| **Algorithms** | Merge Sort, Quick Sort, Heap Sort, Counting Sort |
| **Feature** | All return `(sorted_list, stats)` with comparison/swap counts |

### Complexity Comparison

| Algorithm | Best | Average | Worst | Space | Stable | Banking Use Case |
|-----------|------|---------|-------|-------|--------|-----------------|
| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | Transaction history by date/amount |
| **Quick Sort** | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ | Risk-based account ranking |
| **Heap Sort** | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ | Top-K customers by balance |
| **Counting Sort** | O(n+k) | O(n+k) | O(n+k) | O(k) | ✅ | Risk-level bucketing (low/med/high) |

### Where Used in Code

```
bank_system/api/routes/dsa_admin.py
├── /api/admin/dsa/sort         → merge_sort(), quick_sort(), heap_sort()
│                                 Runs all algorithms on sample data,
│                                 returns step counts for visualization
├── /api/admin/dsa/sort/run     → Run specific algorithm with custom data
└── /api/admin/dsa/algorithms   → get_algorithm_info()  # Metadata for panel

bank_system/services/banking_service.py
└── get_analytics()             → Implicitly sorts accounts by balance (Python sort)

bank_system/services/fraud_engine.py
└── bulk_screen_accounts()      → profiles.sort(key=composite_risk, reverse=True)
```

### Why These Algorithms?
Each sorting algorithm has different **stability, space, and worst-case guarantees**:
- **Merge Sort** is used where **stability matters** (preserving insertion order for equal-date transactions)
- **Quick Sort** for **in-place** risk ranking (minimal memory overhead)
- **Heap Sort** for **top-K queries** (find top 5 accounts without sorting all accounts)
- **Counting Sort** for **categorical bucketing** (risk levels have finite categories)

---

## 🔶 Indirect DSA Patterns

These are algorithmic patterns used indirectly without dedicated DSA files:

### 10. Sliding Window — Fraud Velocity Detection

```
bank_system/services/fraud_engine.py
├── __init__()           → self.velocity_windows = defaultdict(lambda: deque())
├── _velocity_signal()   → Count transactions in last 1-hour window
├── _update_velocity()   → Append new, prune old entries from deque
```
**Pattern**: `deque` as a **time-based sliding window** to detect transaction velocity anomalies. Prunes expired entries on each update. O(1) amortized.

### 11. Dynamic Programming — Levenshtein Distance

```
bank_system/services/search_engine.py
├── levenshtein(s1, s2)  → Classic DP edit distance O(m×n)
└── fuzzy_score()        → Maps edit distance to 0-100 relevance score
```
**Pattern**: **Dynamic programming matrix** computing minimum edit operations (insert/delete/substitute) between search query and target. Enables fuzzy matching — searching "jhon" still finds "john".

### 12. Hash Chain — Tamper-Proof Audit Logs

```
bank_system/services/banking_service.py
├── _audit()               → Computes SHA-256 hash linking each log entry to previous
│                            hash = SHA256(previous_hash + action + details + timestamp)
└── verify_audit_chain()   → Traverses chain, recomputes hashes, detects tampering
```
**Pattern**: Each audit log entry contains a hash computed from the previous entry's hash + current data, forming a **hash chain** (simplified blockchain). Tampering with any entry breaks the chain. O(1) append, O(n) verification.

### 13. Counting/Bucketing — Analytics Aggregation

```
bank_system/services/analytics_engine.py
├── get_balance_distribution()    → defaultdict buckets ($0-1K, $1K-5K, ...)
├── get_txn_type_breakdown()      → defaultdict counting by transaction type
├── get_hourly_heatmap()          → 24-slot array counting by hour
└── get_account_type_breakdown()  → defaultdict counting by account type
```
**Pattern**: Uses `defaultdict` and fixed-size arrays as **counting buckets** for O(n) aggregation across large datasets. This is the counting sort principle applied to analytics.

---

## 🗺️ DSA Usage Map — Which Service Uses What

```
                        ┌──────────────────────┐
                        │   BankingService     │
                        │   (Central Hub)      │
                        ├───────┬──────┬───────┤
                        │       │      │       │
              ┌─────────┤   ┌───┤  ┌───┤   ┌───┤
              ▼         ▼   ▼   ▼  ▼   ▼   ▼   ▼
        ┌──────────┐ ┌─────┐ ┌─────┐ ┌──────┐ ┌──────────┐
        │Hash Table│ │ BST │ │Stack│ │Queue │ │Linked    │
        │O(1) get  │ │sort │ │undo │ │FIFO  │ │List      │
        │by ID     │ │range│ │txn  │ │batch │ │txn hist  │
        └────┬─────┘ └──┬──┘ └─────┘ └──────┘ └──────────┘
             │          │
        ┌────┴─────┐ ┌──┴──────────┐ ┌──────────┐ ┌──────────┐
        │Priority Q│ │Compliance   │ │  Trie    │ │ Sorting  │
        │loan queue│ │Graph        │ │autocmp   │ │merge/qck │
        └──────────┘ │cycle detect │ └──────────┘ │heap/cnt  │
                     │risk scoring │               └──────────┘
                     └──────┬──────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │ Fraud    │ │ Loan     │ │ Analytics    │
        │ Engine   │ │ Scoring  │ │ Engine       │
        │+sliding  │ │+network  │ │+counting     │
        │ window   │ │ risk     │ │ buckets      │
        └──────────┘ └──────────┘ └──────────────┘
```

---

## 📈 Complexity Summary Table

| DSA | Insert | Search/Access | Delete | Traversal | Banking Operation |
|-----|--------|--------------|--------|-----------|-------------------|
| Hash Table | O(1) | O(1) | O(1) | O(n) | Account lookup |
| BST | O(log n) | O(log n) | O(log n) | O(n) | Range query |
| Linked List | O(1) head | O(n) | O(n) | O(n) | Transaction history |
| Stack | O(1) | O(1) top | O(1) | O(n) | Undo operation |
| Queue | O(1) | O(1) front | O(1) | O(n) | Transaction batch |
| Priority Queue | O(log n) | O(1) top | O(log n) | O(n log n) | Loan priority |
| Graph | O(1) edge | O(V+E) | — | O(V+E) | Compliance check |
| Trie | O(m) | O(m) | O(m) | O(nodes) | Autocomplete |
| Merge Sort | — | — | — | O(n log n) | Stable ordering |
| Quick Sort | — | — | — | O(n log n) | Risk ranking |
| Heap Sort | — | — | — | O(n log n) | Top-K queries |
| Counting Sort | — | — | — | O(n+k) | Risk bucketing |

---

## 🎯 Key Design Decisions

1. **Dual Index (Hash Table + BST)**: Accounts are stored in BOTH a hash table (O(1) random access) and a BST (sorted traversal). This trades memory for speed.

2. **Per-Account Data Structures**: Each account has its own `TransactionLinkedList` and `UndoStack`, enabling account-level isolation without locking the entire system.

3. **Lazy Deletion in Priority Queue**: Cancelled loans are marked as removed but not physically deleted from the heap, avoiding O(n) heap restructuring.

4. **Graph Risk Propagation**: The `ComplianceGraph` risk score feeds into BOTH the fraud engine and loan scoring engine — a high-risk transfer network affect loan approvals and triggers fraud alerts.

5. **Step Counting**: All sorting algorithms return operation counts (`comparisons`, `swaps`, `copies`) enabling the admin DSA visualization panel to show algorithmic behavior in real-time.

---

*Generated for NEXA v3.0.0 — Beyond Fintech*
