"""
Service Layer: BankingService (v4.0)
Integrates all 9 DSA structures + ML Fraud Engine + Event Bus
into real banking operations.
"""

from datetime import datetime

# Robust imports — work as both a package and standalone module
try:
    from data_structures import (
        AccountBST,
        AccountHashTable,
        ComplianceGraph,
        LoanPriorityQueue,
        TransactionLinkedList,
        TransactionNode,
        TransactionQueue,
        UndoStack,
    )
except ImportError:
    from bank_system.data_structures import (
        AccountBST,
        AccountHashTable,
        ComplianceGraph,
        LoanPriorityQueue,
        TransactionLinkedList,
        TransactionNode,
        TransactionQueue,
        UndoStack,
    )

try:
    from bank_system.models.models import (
        Account,
        AuditLog,
        LoanApplication,
        User,
        gen_id,
    )
except ImportError:
    from models.models import Account, AuditLog, LoanApplication, User, gen_id
import hashlib
import logging
import threading

# v4.0 — ML Fraud Engine + Event Bus
try:
    from bank_system.services.ml_fraud_engine import MLFraudEngine
except ImportError:
    MLFraudEngine = None

try:
    from bank_system.core.event_bus import EventType, get_event_bus
except ImportError:
    EventType = None
    get_event_bus = None

try:
    from bank_system.core.redis_dsa import create_redis_dsa
    from bank_system.core.redis_client import get_redis
except ImportError:
    create_redis_dsa = None
    get_redis = None

logger = logging.getLogger("nexa.banking")


class BankingService:
    """
    Central banking service wiring together all DSA implementations.

    DSA Usage Map:
    ┌─────────────────────────────────────────────────────────────────┐
    │ Feature               │ DSA Used          │ Complexity          │
    ├─────────────────────────────────────────────────────────────────┤
    │ Transaction History   │ Linked List       │ Append O(1)         │
    │ Undo Operations       │ Stack             │ Push/Pop O(1)       │
    │ Transaction Queue     │ Queue             │ Enqueue/Dequeue O(1)│
    │ Sorted Account View   │ BST               │ Search O(log n)     │
    │ Fast Account Lookup   │ Hash Table        │ Lookup O(1)         │
    │ Risk/Compliance       │ Graph + BFS/DFS   │ O(V+E)              │
    │ Loan Prioritization   │ Priority Queue    │ Insert O(log n)     │
    └─────────────────────────────────────────────────────────────────┘
    """

    def __init__(self):
        # DSA: Hash Table — O(1) account lookup
        self.account_table = AccountHashTable()

        # DSA: BST — sorted account access and range queries
        self.account_bst = AccountBST()

        # DSA: Transaction Linked Lists — per account history
        self.transaction_histories = {}  # account_id -> TransactionLinkedList

        # DSA: Stack — undo operations per account
        self.undo_stacks = {}  # account_id -> UndoStack

        # DSA: Queue — pending transaction processor
        self.transaction_queue = TransactionQueue()

        # DSA: Graph — compliance/risk network
        self.compliance_graph = ComplianceGraph()

        # DSA: Priority Queue — loan application priority
        self.loan_queue = LoanPriorityQueue()

        # Processed loans
        self.processed_loans = []

        # Users and audit
        self.users = {}  # username -> User
        self.audit_logs = []
        self._last_audit_hash = "GENESIS"

        # Locks for multi-threaded safety
        self.balance_locks = {}  # account_id -> threading.Lock
        self._global_lock = threading.Lock()  # For creating accounts/locks safely

        # ── v4.0: ML Fraud Engine ──
        self.ml_fraud_engine = None
        if MLFraudEngine is not None:
            try:
                self.ml_fraud_engine = MLFraudEngine(banking_service=self)
                logger.info("ML Fraud Engine initialized (Isolation Forest + GBT ensemble)")
            except Exception as e:
                logger.warning(f"ML Fraud Engine init failed (non-fatal): {e}")

        # ── v4.0: Event Bus ──
        self.event_bus = None
        if get_event_bus is not None:
            try:
                self.event_bus = get_event_bus()
                logger.info("Event bus connected (in-process mode)")
            except Exception as e:
                logger.warning(f"Event bus init failed (non-fatal): {e}")

        # ── v4.0: Redis DSA Cache ──
        self.redis_dsa = None
        if create_redis_dsa is not None and get_redis is not None:
            try:
                redis_client = get_redis()
                self.redis_dsa = create_redis_dsa(redis_client)
                logger.info("Redis DSA persistence layer initialized")
            except Exception as e:
                logger.warning(f"Redis DSA init failed (non-fatal): {e}")

        # Initialize default users
        self._seed_users()

        # Seed demo data
        self._seed_demo_data()

    def _seed_users(self):
        users = [
            User("admin", "admin123", "admin"),
            User("staff1", "staff123", "staff"),
            User("auditor1", "audit123", "auditor"),
        ]
        for u in users:
            self.users[u.username] = u

    def _seed_demo_data(self):
        """Seed demo accounts and transactions."""
        demo_accounts = [
            ("Alice Mercer", "alice@bank.com", "savings", 25000),
            ("Bob Tanner", "bob@bank.com", "checking", 12000),
            ("Carol Nash", "carol@bank.com", "business", 87500),
            ("David Kim", "david@bank.com", "savings", 3400),
            ("Eva Chen", "eva@bank.com", "checking", 15600),
            ("Frank Russo", "frank@bank.com", "business", 220000),
        ]
        created_accounts = []
        for name, email, atype, deposit in demo_accounts:
            acc = self.create_account(name, email, atype, deposit, user="system")
            created_accounts.append(acc)

        # Seed some transactions
        ops = [
            (created_accounts[0]["account_id"], "deposit", 5000),
            (created_accounts[0]["account_id"], "withdrawal", 1200),
            (created_accounts[1]["account_id"], "deposit", 3000),
            (created_accounts[2]["account_id"], "withdrawal", 5000),
            (created_accounts[3]["account_id"], "deposit", 800),
            (created_accounts[4]["account_id"], "deposit", 2500),
        ]
        for acc_id, op_type, amount in ops:
            if op_type == "deposit":
                self.deposit(acc_id, amount, user="system")
            else:
                self.withdraw(acc_id, amount, user="system")

        # Seed some transfers for compliance graph
        ids = [a["account_id"] for a in created_accounts]
        self.transfer(ids[0], ids[1], 2000, user="system")
        self.transfer(ids[1], ids[2], 1500, user="system")
        self.transfer(ids[2], ids[0], 500, user="system")  # Creates cycle
        self.transfer(ids[3], ids[4], 300, user="system")

        # Seed loan applications
        loan_data = [
            (
                created_accounts[0]["account_id"],
                "Alice Mercer",
                50000,
                "Home Renovation",
                720,
                0,
            ),
            (
                created_accounts[1]["account_id"],
                "Bob Tanner",
                10000,
                "Car Purchase",
                650,
                5,
            ),
            (
                created_accounts[2]["account_id"],
                "Carol Nash",
                200000,
                "Business Expansion",
                780,
                10,
            ),
            (created_accounts[3]["account_id"], "David Kim", 5000, "Personal", 580, 0),
        ]
        for acc_id, name, amt, purpose, cs, urgency in loan_data:
            self.apply_loan(acc_id, name, amt, purpose, cs, urgency, user="system")

    # ─────────────────────────────────────────────
    # ACCOUNT MANAGEMENT
    # ─────────────────────────────────────────────
    def create_account(self, owner_name, email, account_type, initial_deposit, user="unknown"):
        acc = Account(owner_name, email, account_type, initial_deposit)
        acc_dict = acc.to_dict()

        # DSA: Hash Table insert O(1)
        self.account_table.put(acc.account_id, acc_dict)

        # DSA: BST insert O(log n)
        with self._global_lock:
            self.account_bst.insert(acc.account_number, acc_dict)
            self.balance_locks[acc.account_id] = threading.Lock()

        # Initialize Linked List for transaction history
        self.transaction_histories[acc.account_id] = TransactionLinkedList()

        # Initialize Undo Stack
        self.undo_stacks[acc.account_id] = UndoStack()

        # Record initial deposit as transaction
        if initial_deposit > 0:
            self._record_transaction(
                acc.account_id,
                "deposit",
                initial_deposit,
                initial_deposit,
                "Initial deposit",
            )

        self._audit(user, "ACCOUNT_CREATE", f"Created account {acc.account_id} for {owner_name}")
        return acc_dict

    def get_account(self, account_id):
        """DSA: Hash Table lookup O(1)"""
        return self.account_table.get(account_id)

    def get_all_accounts(self):
        """Returns accounts sorted by account number (BST in-order). O(n)"""
        return self.account_bst.inorder()

    def freeze_account(self, account_id, user="unknown"):
        acc = self.account_table.get(account_id)
        if acc:
            acc["status"] = "frozen"
            self._audit(user, "ACCOUNT_FREEZE", f"Froze account {account_id}", "warning")
            return True
        return False

    # ─────────────────────────────────────────────
    # TRANSACTIONS — Linked List + Stack + Queue
    # ─────────────────────────────────────────────
    def deposit(self, account_id, amount, description="", user="unknown"):
        acc = self.account_table.get(account_id)
        if not acc:
            return {"success": False, "error": "Account not found"}
        if acc["status"] != "active":
            return {"success": False, "error": "Account is not active"}
        if amount <= 0:
            return {"success": False, "error": "Amount must be positive"}

        # Acquire lock for thread safety
        lock = self.balance_locks.get(account_id)
        if lock:
            lock.acquire()
        try:
            prev_balance = acc["balance"]
            acc["balance"] += amount
            acc["balance"] = round(acc["balance"], 2)

            # DSA: Linked List — O(1) prepend
            txn = self._record_transaction(account_id, "deposit", amount, acc["balance"], description or "Deposit")

            # DSA: Stack — push undo snapshot O(1)
            self.undo_stacks[account_id].push(
                {
                    "type": "deposit",
                    "amount": amount,
                    "prev_balance": prev_balance,
                    "transaction_id": txn.transaction_id,
                    "timestamp": txn.timestamp,
                }
            )
        finally:
            if lock:
                lock.release()

        self._audit(user, "DEPOSIT", f"Deposited ${amount} to {account_id}")
        return {
            "success": True,
            "balance": acc["balance"],
            "transaction_id": txn.transaction_id,
        }

    def withdraw(self, account_id, amount, description="", user="unknown"):
        acc = self.account_table.get(account_id)
        if not acc:
            return {"success": False, "error": "Account not found"}
        if acc["status"] != "active":
            return {"success": False, "error": "Account is not active"}
        if amount <= 0:
            return {"success": False, "error": "Amount must be positive"}
        if acc["balance"] < amount:
            return {"success": False, "error": "Insufficient funds"}

        lock = self.balance_locks.get(account_id)
        if lock:
            lock.acquire()
        try:
            prev_balance = acc["balance"]
            acc["balance"] -= amount
            acc["balance"] = round(acc["balance"], 2)

            txn = self._record_transaction(
                account_id,
                "withdrawal",
                amount,
                acc["balance"],
                description or "Withdrawal",
            )

            # DSA: Stack — push undo snapshot O(1)
            self.undo_stacks[account_id].push(
                {
                    "type": "withdrawal",
                    "amount": amount,
                    "prev_balance": prev_balance,
                    "transaction_id": txn.transaction_id,
                    "timestamp": txn.timestamp,
                }
            )
        finally:
            if lock:
                lock.release()

        self._audit(user, "WITHDRAWAL", f"Withdrew ${amount} from {account_id}")
        return {
            "success": True,
            "balance": acc["balance"],
            "transaction_id": txn.transaction_id,
        }

    def transfer(self, from_id, to_id, amount, user="unknown"):
        """Transfer money and register in compliance graph."""
        if amount > 50000:
            return {
                "success": False,
                "error": "Transfer exceeds maximum limit of $50,000",
            }

        w_result = self.withdraw(from_id, amount, f"Transfer to {to_id}", user)
        if not w_result["success"]:
            return w_result
        d_result = self.deposit(to_id, amount, f"Transfer from {from_id}", user)

        # DSA: Graph — add edge for compliance tracking O(1)
        with self._global_lock:
            self.compliance_graph.add_transfer(from_id, to_id, amount)

        self._audit(user, "TRANSFER", f"Transfer ${amount} from {from_id} to {to_id}")

        # ── v4.0: ML Fraud Scoring ──
        ml_result = None
        if self.ml_fraud_engine:
            try:
                # Get rule-based score first
                from bank_system.services.fraud_engine import FraudEngine
                if hasattr(self, '_fraud_engine'):
                    rule_result = self._fraud_engine.score_transaction(
                        from_id, amount, "transfer"
                    )
                    rule_score = rule_result.get("composite_score", 0)
                    rule_signals = rule_result.get("signals", {})
                else:
                    rule_score = 0
                    rule_signals = {}

                ml_result = self.ml_fraud_engine.score_transaction(
                    account_id=from_id,
                    amount=amount,
                    txn_type="transfer",
                    rule_score=rule_score,
                    rule_signals=rule_signals,
                )
            except Exception as e:
                logger.warning(f"ML fraud scoring failed (non-fatal): {e}")

        # ── v4.0: Publish Event ──
        if self.event_bus:
            try:
                self.event_bus.emit(
                    "transfer.completed",
                    data={
                        "from_id": from_id,
                        "to_id": to_id,
                        "amount": amount,
                        "from_balance": w_result["balance"],
                        "to_balance": d_result["balance"],
                        "ml_fraud_score": ml_result.get("ensemble_score") if ml_result else None,
                    },
                    source="banking-service",
                )
            except Exception as e:
                logger.warning(f"Event publish failed (non-fatal): {e}")

        result = {
            "success": True,
            "from_balance": w_result["balance"],
            "to_balance": d_result["balance"],
        }
        if ml_result:
            result["ml_fraud_assessment"] = {
                "ensemble_score": ml_result["ensemble_score"],
                "severity": ml_result["severity"],
                "decision": ml_result["decision"],
                "model_version": ml_result["model_version"],
            }
        return result

    def undo_last_transaction(self, account_id, user="unknown"):
        """
        DSA: Stack — pop last operation and reverse it. O(1)
        """
        if account_id not in self.undo_stacks:
            return {"success": False, "error": "No undo stack"}

        stack = self.undo_stacks[account_id]
        op = stack.pop()  # O(1)
        if not op:
            return {"success": False, "error": "Nothing to undo"}

        acc = self.account_table.get(account_id)
        # Reverse the operation
        acc["balance"] = op["prev_balance"]
        self._record_transaction(
            account_id,
            "undo",
            op["amount"],
            acc["balance"],
            f"UNDO: {op['type']} of ${op['amount']}",
        )
        self._audit(
            user,
            "UNDO",
            f"Undid {op['type']} of ${op['amount']} on {account_id}",
            "warning",
        )
        return {"success": True, "balance": acc["balance"], "reversed": op}

    def enqueue_transaction(self, transaction):
        """DSA: Queue — enqueue pending transaction O(1)"""
        self.transaction_queue.enqueue(transaction)

    def process_queued_transactions(self, user="unknown"):
        """DSA: Queue — process all pending transactions FIFO O(n)"""
        results = []
        while not self.transaction_queue.is_empty():
            txn = self.transaction_queue.dequeue()
            if txn["type"] == "deposit":
                r = self.deposit(txn["account_id"], txn["amount"], user=user)
            elif txn["type"] == "withdrawal":
                r = self.withdraw(txn["account_id"], txn["amount"], user=user)
            else:
                r = {"success": False, "error": "Unknown type"}
            r["transaction"] = txn
            results.append(r)
        return results

    # ─────────────────────────────────────────────
    # LOANS — Priority Queue (Heap)
    # ─────────────────────────────────────────────
    def apply_loan(
        self,
        account_id,
        owner_name,
        amount,
        purpose,
        credit_score,
        urgency=0,
        user="unknown",
    ):
        loan = LoanApplication(account_id, owner_name, amount, purpose, credit_score, urgency)
        loan_dict = loan.to_dict()

        # DSA: Priority Queue — insert O(log n)
        self.loan_queue.enqueue_loan(loan_dict)
        self._audit(user, "LOAN_APPLY", f"Loan ${amount} applied by {owner_name}")
        return loan_dict

    def process_next_loan(self, decision, user="unknown"):
        """DSA: Priority Queue — extract highest priority loan O(log n)"""
        loan = self.loan_queue.dequeue_loan()
        if not loan:
            return {"success": False, "error": "No pending loans"}
        loan["status"] = decision
        loan["processed_at"] = datetime.now().isoformat()
        self.processed_loans.append(loan)

        if decision == "approved":
            # Credit the loan amount to account
            self.deposit(
                loan["account_id"],
                loan["amount"],
                f"Loan approved: {loan['loan_id']}",
                user,
            )

        self._audit(
            user,
            f"LOAN_{decision.upper()}",
            f"Loan {loan['loan_id']} {decision}",
            "warning" if decision == "rejected" else "info",
        )
        return {"success": True, "loan": loan}

    def get_pending_loans(self):
        """DSA: Priority Queue — list in priority order O(n log n)"""
        return self.loan_queue.to_list()

    # ─────────────────────────────────────────────
    # COMPLIANCE — Graph
    # ─────────────────────────────────────────────
    def run_compliance_check(self):
        """DSA: Graph DFS — detect cycles, compute risk scores O(V+E)"""
        cycles = self.compliance_graph.detect_cycles()
        risk_scores = self.compliance_graph.compute_risk_scores()
        high_risk = self.compliance_graph.get_high_risk_accounts(threshold=30)
        graph_data = self.compliance_graph.get_graph_data()
        return {
            "cycles_detected": cycles,
            "risk_scores": risk_scores,
            "high_risk_accounts": high_risk,
            "graph": graph_data,
        }

    # ─────────────────────────────────────────────
    # ANALYTICS
    # ─────────────────────────────────────────────
    def get_analytics(self):
        accounts = self.account_table.all_accounts()
        total_balance = sum(a["balance"] for a in accounts)
        total_accounts = len(accounts)
        active = sum(1 for a in accounts if a["status"] == "active")
        pending_loans = self.loan_queue.size()

        # Collect all transaction totals
        total_deposits = 0
        total_withdrawals = 0
        for acc_id, hist in self.transaction_histories.items():
            d, w = hist.get_totals()
            total_deposits += d
            total_withdrawals += w

        return {
            "total_accounts": total_accounts,
            "active_accounts": active,
            "total_balance": round(total_balance, 2),
            "total_deposits": round(total_deposits, 2),
            "total_withdrawals": round(total_withdrawals, 2),
            "pending_loans": pending_loans,
            "processed_loans": len(self.processed_loans),
            "audit_logs": len(self.audit_logs),
            "queued_transactions": self.transaction_queue.size(),
        }

    def get_transaction_history(self, account_id, limit=20):
        """DSA: Linked List traversal O(limit)"""
        hist = self.transaction_histories.get(account_id)
        if not hist:
            return []
        return hist.to_list(limit=limit)

    def get_all_recent_transactions(self, limit=50):
        all_txns = []
        for acc_id, hist in self.transaction_histories.items():
            txns = hist.to_list()
            for t in txns:
                t["account_id"] = acc_id
            all_txns.extend(txns)
        all_txns.sort(key=lambda x: x["timestamp"], reverse=True)
        return all_txns[:limit]

    # ─────────────────────────────────────────────
    # AUTH
    # ─────────────────────────────────────────────
    def authenticate(self, username, password):
        user = self.users.get(username)
        if user and user.check_password(password):
            return user.to_dict()
        return None

    # ─────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────
    def _record_transaction(self, account_id, type_, amount, balance_after, description):
        node = TransactionNode(
            transaction_id=gen_id("TXN"),
            type_=type_,
            amount=amount,
            balance_after=balance_after,
            timestamp=datetime.now().isoformat(),
            description=description,
        )
        # DSA: Linked List prepend O(1)
        self.transaction_histories[account_id].prepend(node)
        return node

    def _audit(self, user, action, details, severity="info"):
        log = AuditLog(user, action, details, severity)
        base = log.to_dict()
        # Sovereign-style immutable chain: hash with previous hash
        payload = f"{self._last_audit_hash}|{base['timestamp']}|{base['user']}|{base['action']}|{base['details']}|{base['severity']}"
        h = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        base["prev_hash"] = self._last_audit_hash
        base["hash"] = h
        self._last_audit_hash = h
        self.audit_logs.append(base)

    def get_audit_logs(self, limit=100):
        return list(reversed(self.audit_logs))[:limit]

    def verify_audit_chain(self):
        """
        Verify the integrity of the audit log hash chain.
        Returns (ok, first_bad_index) where index is from 0..n-1.
        """
        prev = "GENESIS"
        for idx, entry in enumerate(self.audit_logs):
            payload = (
                f"{prev}|{entry['timestamp']}|{entry['user']}|{entry['action']}|{entry['details']}|{entry['severity']}"
            )
            expected = hashlib.sha256(payload.encode("utf-8")).hexdigest()
            if entry.get("hash") != expected or entry.get("prev_hash") != prev:
                return False, idx
            prev = entry["hash"]
        return True, None
