"""
DSA: Hash Table (Python dict)
Used for: O(1) average account lookup by account ID
Time Complexity: Get O(1) avg, Set O(1) avg, Delete O(1) avg
Space Complexity: O(n)
Python dict is a hash table with open addressing + dynamic resizing.
"""

import threading


class AccountHashTable:
    """
    Hash table wrapper for O(1) account lookup.
    Also maintains a secondary index by email and owner name.
    """

    def __init__(self):
        self._table = {}  # Primary: account_id -> account_dict
        self._email_index = {}  # Secondary: email -> account_id
        self._owner_index = {}  # Secondary: owner_name -> [account_ids]
        self._lock = threading.RLock()

    def put(self, account_id, account):
        """Insert or update account. O(1) average."""
        with self._lock:
            self._table[account_id] = account
            # Maintain secondary indices
            email = account.get("email", "")
            if email:
                self._email_index[email] = account_id
            owner = account.get("owner_name", "")
            if owner:
                if owner not in self._owner_index:
                    self._owner_index[owner] = []
                if account_id not in self._owner_index[owner]:
                    self._owner_index[owner].append(account_id)

    def get(self, account_id):
        """Retrieve account by ID. O(1) average."""
        with self._lock:
            return self._table.get(account_id)

    def get_by_email(self, email):
        """Retrieve account by email using secondary index. O(1)"""
        with self._lock:
            acc_id = self._email_index.get(email)
            return self._table.get(acc_id) if acc_id else None

    def get_by_owner(self, owner_name):
        """Retrieve all accounts by owner name. O(k) k=accounts per owner"""
        with self._lock:
            ids = self._owner_index.get(owner_name, [])
            return [self._table[i] for i in ids if i in self._table]

    def delete(self, account_id):
        """Remove account from hash table. O(1) average."""
        with self._lock:
            account = self._table.pop(account_id, None)
            if account:
                email = account.get("email", "")
                if email in self._email_index:
                    del self._email_index[email]
                owner = account.get("owner_name", "")
                if owner in self._owner_index:
                    self._owner_index[owner] = [i for i in self._owner_index[owner] if i != account_id]
            return account

    def exists(self, account_id):
        """Check if account exists. O(1)"""
        with self._lock:
            return account_id in self._table

    def all_accounts(self):
        """Return all accounts. O(n)"""
        with self._lock:
            return list(self._table.values())

    def count(self):
        with self._lock:
            return len(self._table)
