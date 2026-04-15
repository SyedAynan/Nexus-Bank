"""
DSA: Queue (FIFO) using collections.deque
Used for: Processing pending transactions in order received
Time Complexity: Enqueue O(1), Dequeue O(1), Peek O(1)
Space Complexity: O(n) where n = queued transactions
"""

from collections import deque


class TransactionQueue:
    """
    FIFO Queue for pending transaction processing.
    deque enables O(1) append and popleft.
    """

    def __init__(self):
        self._queue = deque()

    def enqueue(self, transaction):
        """Add transaction to the back of the queue. O(1)"""
        self._queue.append(transaction)

    def dequeue(self):
        """Remove and return the front transaction. O(1)"""
        if self.is_empty():
            return None
        return self._queue.popleft()

    def peek(self):
        """View front transaction without removing. O(1)"""
        if self.is_empty():
            return None
        return self._queue[0]

    def is_empty(self):
        return len(self._queue) == 0

    def size(self):
        return len(self._queue)

    def process_all(self, processor_fn):
        """
        Process all queued transactions using a processor function. O(n)
        processor_fn: callable that takes a transaction dict
        Returns list of results.
        """
        results = []
        while not self.is_empty():
            txn = self.dequeue()
            result = processor_fn(txn)
            results.append(result)
        return results

    def to_list(self):
        return list(self._queue)
