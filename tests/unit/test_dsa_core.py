"""
Unit Tests — DSA: Linked List, Stack, Queue, BST, Hash Table, Graph, Priority Queue
"""

import pytest
from bank_system.data_structures import (
    TransactionLinkedList,
    UndoStack,
    TransactionQueue,
    AccountBST,
    AccountHashTable,
    ComplianceGraph,
    LoanPriorityQueue,
)
from bank_system.data_structures.linked_list import TransactionNode


class TestLinkedList:
    def test_prepend_and_traverse(self):
        ll = TransactionLinkedList()
        node1 = TransactionNode(1, "deposit", 100, 100, "2025-01-01")
        node2 = TransactionNode(2, "withdrawal", 50, 50, "2025-01-02")
        ll.prepend(node1)
        ll.prepend(node2)
        items = ll.to_list()
        assert len(items) == 2
        # prepend puts newest first
        assert items[0]["transaction_id"] == 2

    def test_empty_list(self):
        ll = TransactionLinkedList()
        assert ll.to_list() == []
        assert ll.size == 0


class TestStack:
    def test_push_pop(self):
        stack = UndoStack()
        stack.push({"action": "deposit", "amount": 100})
        stack.push({"action": "withdrawal", "amount": 50})
        assert stack.size() == 2

        item = stack.pop()
        assert item["action"] == "withdrawal"
        assert stack.size() == 1

    def test_peek(self):
        stack = UndoStack()
        stack.push({"action": "deposit"})
        assert stack.peek()["action"] == "deposit"
        assert stack.size() == 1  # peek doesn't remove

    def test_empty_pop(self):
        stack = UndoStack()
        assert stack.pop() is None


class TestQueue:
    def test_enqueue_dequeue(self):
        q = TransactionQueue()
        q.enqueue({"id": 1})
        q.enqueue({"id": 2})
        assert q.size() == 2

        item = q.dequeue()
        assert item["id"] == 1  # FIFO
        assert q.size() == 1

    def test_empty_dequeue(self):
        q = TransactionQueue()
        assert q.dequeue() is None


class TestBST:
    def test_insert_and_inorder(self):
        bst = AccountBST()
        bst.insert(500, {"id": "A500"})
        bst.insert(300, {"id": "A300"})
        bst.insert(700, {"id": "A700"})

        result = bst.inorder()
        # inorder returns list of account_ref (the data), sorted by key
        ids = [r["id"] for r in result]
        assert ids == ["A300", "A500", "A700"]

    def test_search(self):
        bst = AccountBST()
        bst.insert(100, {"id": "A100"})
        assert bst.search(100) is not None
        assert bst.search(999) is None


class TestHashTable:
    def test_insert_and_get(self):
        ht = AccountHashTable()
        ht.put("ACC001", {"name": "John", "balance": 5000})
        result = ht.get("ACC001")
        assert result["balance"] == 5000

    def test_get_missing_key(self):
        ht = AccountHashTable()
        assert ht.get("NONEXISTENT") is None

    def test_overwrite(self):
        ht = AccountHashTable()
        ht.put("ACC001", {"balance": 100})
        ht.put("ACC001", {"balance": 200})
        assert ht.get("ACC001")["balance"] == 200


class TestGraph:
    def test_add_transfer_and_detect_cycle(self):
        g = ComplianceGraph()
        g.add_transfer("A", "B", 100)
        g.add_transfer("B", "C", 200)
        # No cycle yet
        cycles = g.detect_cycles()
        assert len(cycles) == 0

    def test_cycle_detection(self):
        g = ComplianceGraph()
        g.add_transfer("A", "B", 100)
        g.add_transfer("B", "C", 200)
        g.add_transfer("C", "A", 150)  # creates cycle
        cycles = g.detect_cycles()
        assert len(cycles) > 0

    def test_risk_scores(self):
        g = ComplianceGraph()
        g.add_transfer("A", "B", 100)
        g.add_transfer("B", "C", 200)
        scores = g.compute_risk_scores()
        assert isinstance(scores, dict)


class TestPriorityQueue:
    def test_enqueue_and_dequeue(self):
        pq = LoanPriorityQueue()
        pq.enqueue_loan({"loan_id": "L1", "credit_score": 600, "amount": 5000, "urgency": 0})
        pq.enqueue_loan({"loan_id": "L2", "credit_score": 800, "amount": 5000, "urgency": 0})
        pq.enqueue_loan({"loan_id": "L3", "credit_score": 500, "amount": 5000, "urgency": 0})

        # Higher credit score = higher priority (lower heap key)
        top = pq.dequeue_loan()
        assert top["loan_id"] == "L2"  # credit_score 800 has lowest priority key

    def test_empty_dequeue(self):
        pq = LoanPriorityQueue()
        assert pq.dequeue_loan() is None
