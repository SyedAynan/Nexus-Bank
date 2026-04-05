# NEXA — Beyond Fintech | Backend Engine
## DSA-First Banking Platform | **Main code: Python only**

All core logic (accounts, transactions, loans, compliance, DSA) is implemented in **Python**. The frontend is a thin UI that calls the Python API.

---

## 🚀 Quick Start

```bash
pip install flask
cd bank_system
python app.py
# Open: http://localhost:5000
# Login → then go to http://localhost:5000/imperial for Imperial Capital UI
```

**Demo Login Credentials:**
| Role    | Username  | Password   | Access |
|---------|-----------|------------|--------|
| Admin   | admin     | admin123   | Full   |
| Staff   | staff1    | staff123   | TX     |
| Auditor | auditor1  | audit123   | Read   |

---

## 📁 Project Structure

```
bank_system/
├── app.py                          # Flask backend & API routes
├── requirements.txt
├── data_structures/
│   ├── linked_list.py              # DSA #1: Transaction history
│   ├── stack.py                    # DSA #2: Undo operations
│   ├── queue.py                    # DSA #3: TX processing
│   ├── bst.py                      # DSA #4: Sorted accounts
│   ├── hash_table.py               # DSA #5: O(1) lookup
│   ├── graph.py                    # DSA #6: Compliance analysis
│   └── priority_queue.py           # DSA #7: Loan prioritization
├── models/
│   └── models.py                   # Account, Loan, User, AuditLog
├── services/
│   ├── banking_service.py         # Core business logic (Python)
│   ├── imperial_api.py            # Imperial state & API (Python-only)
│   ├── fraud_engine.py
│   ├── loan_scoring.py
│   ├── analytics_engine.py
│   └── search_engine.py
└── frontend/
    └── templates/
        ├── login.html              # Premium login UI
        ├── dashboard.html          # Premium dashboard UI
        └── imperial.html           # Imperial Capital UI (data from Python API)
```

---

## 🧩 DSA Implementation Map

| # | Data Structure | Location | Banking Feature | Time Complexity |
|---|----------------|----------|-----------------|-----------------|
| 1 | **Linked List** | `data_structures/linked_list.py` | Transaction history per account | Append O(1), Read O(n) |
| 2 | **Stack (LIFO)** | `data_structures/stack.py` | Undo last deposit/withdrawal | Push/Pop O(1) |
| 3 | **Queue (FIFO)** | `data_structures/queue.py` | Batch transaction processing | Enqueue/Dequeue O(1) |
| 4 | **Binary Search Tree** | `data_structures/bst.py` | Sorted account registry + range queries | Insert/Search O(log n) avg |
| 5 | **Hash Table** | `data_structures/hash_table.py` | O(1) account lookup by ID/email | Get/Set O(1) avg |
| 6 | **Graph (Adjacency List)** | `data_structures/graph.py` | Transfer network, cycle detection, risk scoring | BFS/DFS O(V+E) |
| 7 | **Priority Queue (Min-Heap)** | `data_structures/priority_queue.py` | Loan approval prioritization | Insert/Extract O(log n) |

---

## 🎯 Feature → DSA Mapping

### Account Management
- Create account → **Hash Table** insert O(1) + **BST** insert O(log n)
- Lookup account → **Hash Table** get O(1)
- Sorted account list → **BST** in-order traversal O(n)

### Transactions
- Deposit/Withdraw → **Linked List** prepend O(1) + **Stack** push O(1)
- Undo last operation → **Stack** pop O(1) + balance reversal
- Batch processing → **Queue** enqueue O(1) / dequeue O(1)
- Transfer → above + **Graph** edge addition O(1)

### Loans
- Apply → **Priority Queue** insert O(log n)
- Process next → **Priority Queue** extract-min O(log n)
- Cancellation → **Priority Queue** lazy delete O(1)

### Compliance
- Fraud cycles → **Graph** DFS cycle detection O(V+E)
- Reachability → **Graph** BFS O(V+E)
- Risk scores → **Graph** degree + volume heuristic O(V+E)

---

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)
     ↕ REST API (JSON)
Flask Backend (app.py)
     ↕
BankingService (services/banking_service.py)
     ↕ integrates all 7 DSA structures
Data Structures (data_structures/)
Models (models/)
```

---

## 🔑 Role-Based Access

- **Admin**: Full access — create accounts, deposit/withdraw, undo, approve loans, compliance
- **Staff**: Accounts + transactions (no undo, no compliance)
- **Auditor**: Read-only + compliance check + audit logs
