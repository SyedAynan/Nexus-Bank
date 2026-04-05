"""
DSA: Linked List
Used for: Transaction History per Account
Time Complexity: Append O(1), Traversal O(n), Search O(n)
Space Complexity: O(n) where n = number of transactions
"""

class TransactionNode:
    """Node in the transaction linked list."""
    def __init__(self, transaction_id, type_, amount, balance_after, timestamp, description=""):
        self.transaction_id = transaction_id
        self.type = type_           # 'deposit', 'withdrawal', 'transfer'
        self.amount = amount
        self.balance_after = balance_after
        self.timestamp = timestamp
        self.description = description
        self.next = None            # Pointer to next transaction

    def to_dict(self):
        return {
            "transaction_id": self.transaction_id,
            "type": self.type,
            "amount": self.amount,
            "balance_after": self.balance_after,
            "timestamp": self.timestamp,
            "description": self.description
        }


class TransactionLinkedList:
    """
    Singly Linked List to maintain transaction history.
    Newest transactions are prepended (O(1) insert at head).
    """
    def __init__(self):
        self.head = None
        self.size = 0

    def prepend(self, transaction_node):
        """Add transaction at the head. O(1)"""
        transaction_node.next = self.head
        self.head = transaction_node
        self.size += 1

    def to_list(self, limit=None):
        """Traverse and return all transactions. O(n)"""
        result = []
        current = self.head
        count = 0
        while current:
            if limit and count >= limit:
                break
            result.append(current.to_dict())
            current = current.next
            count += 1
        return result

    def get_totals(self):
        """Calculate total deposits and withdrawals. O(n)"""
        total_deposits = 0
        total_withdrawals = 0
        current = self.head
        while current:
            if current.type == 'deposit':
                total_deposits += current.amount
            elif current.type == 'withdrawal':
                total_withdrawals += current.amount
            current = current.next
        return total_deposits, total_withdrawals

    def __len__(self):
        return self.size
