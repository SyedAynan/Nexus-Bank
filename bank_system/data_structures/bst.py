"""
DSA: Binary Search Tree (BST)
Used for: Storing accounts in sorted order by account number for range queries
Time Complexity: Insert O(log n) avg / O(n) worst, Search O(log n) avg, In-order O(n)
Space Complexity: O(n)
"""


class BSTNode:
    def __init__(self, account_number, account_ref):
        self.account_number = account_number  # Key
        self.account_ref = account_ref  # Reference to Account object
        self.left = None
        self.right = None


class AccountBST:
    """
    BST keyed on account_number.
    Enables sorted traversal and range queries (e.g. accounts between A1000-A2000).
    """

    def __init__(self):
        self.root = None
        self._size = 0

    def insert(self, account_number, account_ref):
        """Insert account into BST. O(log n) average."""
        self.root = self._insert(self.root, account_number, account_ref)
        self._size += 1

    def _insert(self, node, account_number, account_ref):
        if node is None:
            return BSTNode(account_number, account_ref)
        if account_number < node.account_number:
            node.left = self._insert(node.left, account_number, account_ref)
        elif account_number > node.account_number:
            node.right = self._insert(node.right, account_number, account_ref)
        else:
            node.account_ref = account_ref  # Update existing
        return node

    def search(self, account_number):
        """Search for account by number. O(log n) average."""
        node = self._search(self.root, account_number)
        return node.account_ref if node else None

    def _search(self, node, account_number):
        if node is None or node.account_number == account_number:
            return node
        if account_number < node.account_number:
            return self._search(node.left, account_number)
        return self._search(node.right, account_number)

    def delete(self, account_number):
        """Delete account from BST. O(log n) average."""
        self.root, deleted = self._delete(self.root, account_number)
        if deleted:
            self._size -= 1

    def _delete(self, node, account_number):
        if node is None:
            return node, False
        deleted = False
        if account_number < node.account_number:
            node.left, deleted = self._delete(node.left, account_number)
        elif account_number > node.account_number:
            node.right, deleted = self._delete(node.right, account_number)
        else:
            deleted = True
            if node.left is None:
                return node.right, deleted
            elif node.right is None:
                return node.left, deleted
            # Find in-order successor
            successor = self._min_node(node.right)
            node.account_number = successor.account_number
            node.account_ref = successor.account_ref
            node.right, _ = self._delete(node.right, successor.account_number)
        return node, deleted

    def _min_node(self, node):
        while node.left:
            node = node.left
        return node

    def inorder(self):
        """Return all accounts sorted by account number. O(n)"""
        result = []
        self._inorder(self.root, result)
        return result

    def _inorder(self, node, result):
        if node:
            self._inorder(node.left, result)
            result.append(node.account_ref)
            self._inorder(node.right, result)

    def range_query(self, low, high):
        """Find all accounts with account_number in [low, high]. O(k + log n)"""
        result = []
        self._range_query(self.root, low, high, result)
        return result

    def _range_query(self, node, low, high, result):
        if node is None:
            return
        if low < node.account_number:
            self._range_query(node.left, low, high, result)
        if low <= node.account_number <= high:
            result.append(node.account_ref)
        if high > node.account_number:
            self._range_query(node.right, low, high, result)

    def size(self):
        return self._size
