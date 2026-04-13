"""
DSA: Priority Queue (Min-Heap via heapq)
Used for: Loan approval prioritization based on credit score, amount, urgency
Time Complexity: Insert O(log n), Extract-min O(log n), Peek O(1)
Space Complexity: O(n)
"""

import heapq


class LoanPriorityQueue:
    """
    Min-Heap based priority queue for loan applications.
    Priority = lower score means HIGHER priority (e.g., urgency score).
    Priority formula: lower risk + higher credit score = higher priority (lower heap key).
    """
    def __init__(self):
        self._heap = []             # List of (priority_score, counter, loan_dict)
        self._counter = 0           # Tiebreaker for equal priorities (FIFO within same priority)
        self._entry_finder = {}     # Map loan_id -> entry for fast lookup

    def _compute_priority(self, loan):
        """
        Lower number = higher priority.
        Formula: 100 - credit_score + loan_amount/100000 + urgency_penalty
        """
        credit_score = loan.get('credit_score', 600)
        amount = loan.get('amount', 0)
        urgency = loan.get('urgency', 0)    # 0=normal, -10=urgent
        return (100 - credit_score) + (amount / 100000) - urgency

    def enqueue_loan(self, loan):
        """Add a loan application to the priority queue. O(log n)"""
        priority = self._compute_priority(loan)
        self._counter += 1
        entry = [priority, self._counter, loan]
        self._entry_finder[loan['loan_id']] = entry
        heapq.heappush(self._heap, entry)

    def dequeue_loan(self):
        """Remove and return the highest priority loan. O(log n)"""
        while self._heap:
            priority, count, loan = heapq.heappop(self._heap)
            if loan is not None:    # Not a removed/cancelled entry
                self._entry_finder.pop(loan['loan_id'], None)
                return loan
        return None

    def cancel_loan(self, loan_id):
        """
        Lazy deletion: mark entry as removed. O(1)
        Actual removal happens on next dequeue.
        """
        if loan_id in self._entry_finder:
            entry = self._entry_finder.pop(loan_id)
            entry[2] = None     # Mark as removed

    def peek(self):
        """View highest priority loan without removing. O(1)"""
        while self._heap:
            priority, count, loan = self._heap[0]
            if loan is not None:
                return loan
            heapq.heappop(self._heap)
        return None

    def size(self):
        return sum(1 for _, _, loan in self._heap if loan is not None)

    def to_list(self):
        """Return all pending loans in priority order. O(n log n)"""
        temp = [(p, c, loan) for p, c, loan in self._heap if loan is not None]
        temp.sort()
        return [loan for _, _, loan in temp]

    def is_empty(self):
        return self.size() == 0
