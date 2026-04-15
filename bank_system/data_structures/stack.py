"""
DSA: Stack (LIFO)
Used for: Undo last transaction (deposit/withdrawal rollback)
Time Complexity: Push O(1), Pop O(1), Peek O(1)
Space Complexity: O(n) where n = number of undoable operations
"""


class UndoStack:
    """
    Stack to support undo of the last banking operation.
    Uses Python list as the underlying structure.
    """

    def __init__(self, max_size=50):
        self._stack = []
        self.max_size = max_size  # Limit memory footprint

    def push(self, operation):
        """
        Push an operation snapshot onto the stack. O(1)
        operation: dict with keys {type, amount, prev_balance, account_id, timestamp}
        """
        if len(self._stack) >= self.max_size:
            self._stack.pop(0)  # Remove oldest if full (O(n) but rare)
        self._stack.append(operation)

    def pop(self):
        """Pop and return the last operation. O(1)"""
        if self.is_empty():
            return None
        return self._stack.pop()

    def peek(self):
        """View the top operation without removing. O(1)"""
        if self.is_empty():
            return None
        return self._stack[-1]

    def is_empty(self):
        return len(self._stack) == 0

    def size(self):
        return len(self._stack)

    def to_list(self):
        """Return all undo-able operations (top first). O(n)"""
        return list(reversed(self._stack))
