"""
File: redis_dsa.py
Module: bank_system.core.redis_dsa

Purpose:
    Redis-backed implementations of core data structures used in NEXA's
    DSA Showcase feature. Each class mirrors a standard CS data structure
    but uses Redis for persistence and distribution.

Developer Journey:
    - v1: All data structures were in-memory Python objects — lost on every
      server restart. The DSA showcase was purely educational with no
      real persistence.
    - v2: Created this module with Redis-backed versions. Now data structures
      persist across restarts and work across multiple server instances.
      This is critical for the Kubernetes deployment where multiple backend
      pods need to share state.

Data Structures Implemented:
    - RedisHashTable: O(1) account lookup via HSET/HGET. Uses Redis strings
      with JSON serialization. Includes secondary email index for reverse lookup.
    - RedisUndoStack: Per-account undo history via LPUSH/LPOP (stack = list
      with push/pop on the same end). Capped at 50 entries with LTRIM.
    - RedisQueue: FIFO transaction queue via RPUSH/LPOP (queue = list with
      push on right, pop on left). Used for batch transaction processing.
    - RedisPriorityQueue: Loan priority queue via ZADD/ZPOPMIN (sorted set).
      Priority formula: (100 - credit_score/10) + (amount/100000) - urgency.
      Lower score = higher priority (processed first). Supports lazy deletion
      for cancelled loans.

Redis Data Structure Mapping:
    CS Concept       → Redis Command    → Time Complexity
    Hash Table       → SET/GET          → O(1)
    Stack (push/pop) → LPUSH/LPOP       → O(1)
    Queue (FIFO)     → RPUSH/LPOP       → O(1)
    Priority Queue   → ZADD/ZPOPMIN     → O(log n)
"""

import json
import logging
import time

logger = logging.getLogger("nexa.redis_dsa")


class RedisHashTable:
    """
    Persistent hash table for account data using Redis Hashes.
    Key schema: account:{account_id} → JSON blob
    Secondary index: account_email:{email} → account_id
    """

    PREFIX = "account"
    EMAIL_PREFIX = "account_email"

    def __init__(self, redis_client):
        self.r = redis_client

    def put(self, account_id: str, account_data: dict) -> None:
        """Store account data. O(1)."""
        key = f"{self.PREFIX}:{account_id}"
        self.r.set(key, json.dumps(account_data, default=str))

        # Secondary index by email
        email = account_data.get("email", "")
        if email:
            self.r.set(f"{self.EMAIL_PREFIX}:{email}", account_id)

    def get(self, account_id: str) -> dict | None:
        """Retrieve account by ID. O(1)."""
        key = f"{self.PREFIX}:{account_id}"
        data = self.r.get(key)
        if data:
            return json.loads(data)
        return None

    def get_by_email(self, email: str) -> dict | None:
        """Retrieve account by email (via secondary index). O(1)."""
        account_id = self.r.get(f"{self.EMAIL_PREFIX}:{email}")
        if account_id:
            return self.get(account_id)
        return None

    def delete(self, account_id: str) -> bool:
        """Remove account. O(1)."""
        key = f"{self.PREFIX}:{account_id}"
        data = self.get(account_id)
        if data and data.get("email"):
            self.r.delete(f"{self.EMAIL_PREFIX}:{data['email']}")
        return bool(self.r.delete(key))

    def exists(self, account_id: str) -> bool:
        """Check if account exists. O(1)."""
        return bool(self.r.exists(f"{self.PREFIX}:{account_id}"))


class RedisUndoStack:
    """
    Per-account undo stack using Redis Lists (LPUSH/LPOP = Stack behavior).
    Key schema: undo:{account_id} → list of JSON operation snapshots
    Automatically capped at MAX_SIZE entries.
    """

    PREFIX = "undo"
    MAX_SIZE = 50

    def __init__(self, redis_client):
        self.r = redis_client

    def push(self, account_id: str, operation: dict) -> None:
        """Push undo operation onto stack. O(1)."""
        key = f"{self.PREFIX}:{account_id}"
        self.r.lpush(key, json.dumps(operation, default=str))
        # Cap the list to prevent unbounded growth
        self.r.ltrim(key, 0, self.MAX_SIZE - 1)

    def pop(self, account_id: str) -> dict | None:
        """Pop most recent operation. O(1)."""
        key = f"{self.PREFIX}:{account_id}"
        data = self.r.lpop(key)
        if data:
            return json.loads(data)
        return None

    def peek(self, account_id: str) -> dict | None:
        """View top of stack without removing. O(1)."""
        key = f"{self.PREFIX}:{account_id}"
        data = self.r.lindex(key, 0)
        if data:
            return json.loads(data)
        return None

    def size(self, account_id: str) -> int:
        """Get stack depth for an account. O(1)."""
        return self.r.llen(f"{self.PREFIX}:{account_id}")

    def to_list(self, account_id: str, limit: int = 50) -> list[dict]:
        """Return stack contents as a list (top to bottom)."""
        key = f"{self.PREFIX}:{account_id}"
        items = self.r.lrange(key, 0, limit - 1)
        return [json.loads(item) for item in (items or [])]


class RedisQueue:
    """
    FIFO transaction queue using Redis Lists (RPUSH/LPOP).
    Key schema: txn_queue → list of JSON transaction objects
    """

    KEY = "txn_queue"

    def __init__(self, redis_client):
        self.r = redis_client

    def enqueue(self, transaction: dict) -> None:
        """Add transaction to end of queue. O(1)."""
        self.r.rpush(self.KEY, json.dumps(transaction, default=str))

    def dequeue(self) -> dict | None:
        """Remove and return front of queue. O(1)."""
        data = self.r.lpop(self.KEY)
        if data:
            return json.loads(data)
        return None

    def peek(self) -> dict | None:
        """View front of queue without removing. O(1)."""
        data = self.r.lindex(self.KEY, 0)
        if data:
            return json.loads(data)
        return None

    def size(self) -> int:
        """Get queue length. O(1)."""
        return self.r.llen(self.KEY)

    def is_empty(self) -> bool:
        """Check if queue is empty. O(1)."""
        return self.size() == 0


class RedisPriorityQueue:
    """
    Loan priority queue using Redis Sorted Sets (ZADD/ZPOPMIN).
    Score = priority formula: (100 - credit_score) + (amount / 100000) - urgency
    Lower score = higher priority (processed first).

    Key schema: loan_queue → sorted set of {loan_json: priority_score}
    """

    KEY = "loan_queue"
    CANCELLED_KEY = "loan_cancelled"

    def __init__(self, redis_client):
        self.r = redis_client

    def enqueue_loan(self, loan: dict) -> None:
        """Add loan to priority queue. O(log n)."""
        credit_score = loan.get("credit_score", 500)
        amount = loan.get("amount", 0)
        urgency = loan.get("urgency", 0)

        priority = (100 - credit_score / 10) + (amount / 100000) - urgency
        loan_json = json.dumps(loan, default=str)
        self.r.zadd(self.KEY, {loan_json: priority})

    def dequeue_loan(self) -> dict | None:
        """Remove and return highest priority loan. O(log n)."""
        # ZPOPMIN returns the member with the lowest score
        result = self.r.zpopmin(self.KEY, count=1)
        if result:
            loan_json, score = result[0]
            loan = json.loads(loan_json)
            # Skip cancelled loans
            if loan.get("loan_id") in self._get_cancelled():
                return self.dequeue_loan()  # Lazy deletion
            return loan
        return None

    def cancel_loan(self, loan_id: str) -> None:
        """Mark a loan as cancelled (lazy deletion). O(1)."""
        self.r.sadd(self.CANCELLED_KEY, loan_id)

    def _get_cancelled(self) -> set:
        """Get set of cancelled loan IDs."""
        return self.r.smembers(self.CANCELLED_KEY) or set()

    def size(self) -> int:
        """Get queue size. O(1)."""
        return self.r.zcard(self.KEY)

    def to_list(self, limit: int = 100) -> list[dict]:
        """Return all loans in priority order."""
        result = self.r.zrange(self.KEY, 0, limit - 1, withscores=True)
        cancelled = self._get_cancelled()
        loans = []
        for loan_json, score in (result or []):
            loan = json.loads(loan_json)
            if loan.get("loan_id") not in cancelled:
                loan["priority_score"] = score
                loans.append(loan)
        return loans


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def create_redis_dsa(redis_client) -> dict:
    """
    Create all Redis-backed DSA instances from a single Redis client.

    Returns a dict of {name: instance} that can be used alongside
    the existing in-memory DSA structures.
    """
    return {
        "hash_table": RedisHashTable(redis_client),
        "undo_stack": RedisUndoStack(redis_client),
        "queue": RedisQueue(redis_client),
        "priority_queue": RedisPriorityQueue(redis_client),
    }
