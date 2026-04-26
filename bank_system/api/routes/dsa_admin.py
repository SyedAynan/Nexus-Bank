"""
File: dsa_admin.py
Module: bank_system.api.routes.dsa_admin

Purpose:
    Admin-only API routes for the Data Structures & Algorithms (DSA) showcase.
    Exposes visualization, benchmarking, and performance metrics for all DSA
    implementations used in NEXA — a unique feature demonstrating CS fundamentals
    applied to real fintech problems.

Developer Journey:
    - v1: DSA was purely internal — no way to visualize the Trie, benchmark
      sorting algorithms, or inspect memory usage of data structures.
    - v2: Created this admin panel with endpoints for:
      * /overview — summary of all 9 data structures with time/space complexity
      * /trie/visualize — interactive Trie tree visualization
      * /trie/search — prefix-based autocomplete search
      * /sorting/benchmark — runs 4 sorting algorithms on real transaction data
      * /performance — memory estimates and data structure statistics

DSA Implementations:
    Linked List, Stack, Queue, BST, Hash Table, Graph, Priority Queue (Heap),
    Trie, and 4 sorting algorithms (Merge, Quick, Heap, Counting Sort).
    Each is applied to a real banking use case, not just academic examples.
"""

import sys
import time
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bank_system.api.deps import role_required
from bank_system.core.db import get_db
from bank_system.data_structures.sorting import (
    counting_sort_by_risk,
    get_algorithm_info,
    heap_sort,
    merge_sort,
    quick_sort,
)
from bank_system.data_structures.trie import Trie
from bank_system.models.db_models import Account, Transaction, UserRole

router = APIRouter(prefix="/api/admin/dsa", tags=["dsa-admin"])

# Shared DSA instances (populated from DB on request)
_trie = Trie()


@router.get("/overview")
def dsa_overview(
    current_admin=Depends(role_required(UserRole.admin)),
):
    """Return summary of all DSA structures used in the system."""
    return {
        "structures": [
            {
                "name": "Linked List",
                "module": "TransactionLinkedList",
                "use_case": "Transaction history chaining",
                "time_complexity": {
                    "insert": "O(1)",
                    "traverse": "O(n)",
                    "search": "O(n)",
                },
                "space_complexity": "O(n)",
            },
            {
                "name": "Stack",
                "module": "UndoStack",
                "use_case": "Transaction undo/rollback",
                "time_complexity": {"push": "O(1)", "pop": "O(1)", "peek": "O(1)"},
                "space_complexity": "O(n)",
            },
            {
                "name": "Queue",
                "module": "TransactionQueue",
                "use_case": "Pending transaction processing (FIFO)",
                "time_complexity": {"enqueue": "O(1)", "dequeue": "O(1)"},
                "space_complexity": "O(n)",
            },
            {
                "name": "Binary Search Tree",
                "module": "AccountBST",
                "use_case": "Sorted account ordering",
                "time_complexity": {
                    "insert": "O(log n)",
                    "search": "O(log n)",
                    "in_order": "O(n)",
                },
                "space_complexity": "O(n)",
            },
            {
                "name": "Hash Table",
                "module": "AccountHashTable",
                "use_case": "O(1) account lookup by ID",
                "time_complexity": {
                    "insert": "O(1)",
                    "lookup": "O(1)",
                    "delete": "O(1)",
                },
                "space_complexity": "O(n)",
            },
            {
                "name": "Graph",
                "module": "ComplianceGraph",
                "use_case": "AML transaction relationship mapping & cycle detection",
                "time_complexity": {
                    "add_edge": "O(1)",
                    "dfs": "O(V+E)",
                    "cycle_detect": "O(V+E)",
                },
                "space_complexity": "O(V+E)",
            },
            {
                "name": "Priority Queue (Heap)",
                "module": "LoanPriorityQueue",
                "use_case": "Loan approval priority & top-K customers",
                "time_complexity": {"insert": "O(log n)", "extract_max": "O(log n)"},
                "space_complexity": "O(n)",
            },
            {
                "name": "Trie (Prefix Tree)",
                "module": "Trie",
                "use_case": "Fast autocomplete search for users/accounts",
                "time_complexity": {
                    "insert": "O(m)",
                    "search": "O(m)",
                    "prefix": "O(m+k)",
                },
                "space_complexity": "O(N × M)",
            },
            {
                "name": "Sorting Algorithms",
                "module": "SortingAlgorithms",
                "use_case": "Transaction ordering, risk ranking, top-K queries",
                "algorithms": [
                    "Merge Sort",
                    "Quick Sort",
                    "Heap Sort",
                    "Counting Sort",
                ],
            },
        ],
        "total_structures": 9,
    }


@router.get("/trie/visualize")
def trie_visualize(
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
):
    """Visualize the Trie structure populated from current accounts."""
    global _trie
    _trie = Trie()

    accounts = db.query(Account).all()
    for acc in accounts:
        _trie.insert(
            acc.account_number,
            data={"id": acc.id, "balance": float(acc.balance), "status": acc.status},
        )

    return _trie.visualize(max_depth=6)


@router.get("/trie/search")
def trie_search(
    prefix: str,
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
    limit: int = 10,
):
    """Search accounts using Trie prefix matching."""
    global _trie
    if _trie.size == 0:
        accounts = db.query(Account).all()
        for acc in accounts:
            _trie.insert(
                acc.account_number,
                data={
                    "id": acc.id,
                    "balance": float(acc.balance),
                    "status": acc.status,
                },
            )

    results = _trie.starts_with(prefix, limit=limit)
    return {
        "prefix": prefix,
        "results": [{"key": k, "data": d} for k, d in results],
        "count": len(results),
    }


@router.get("/sorting/benchmark")
def sorting_benchmark(
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
):
    """Run all sorting algorithms on transaction data and return performance stats."""
    transactions = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(500).all()

    if not transactions:
        return {"message": "No transactions to sort", "results": []}

    tx_dicts = [
        {
            "id": t.id,
            "amount": float(t.amount),
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "risk_level": t.risk_level or "low",
            "fraud_score": float(t.fraud_score),
        }
        for t in transactions
    ]

    results = []

    # Merge Sort by amount
    start = time.perf_counter()
    _, merge_stats = merge_sort(tx_dicts, key=lambda x: x["amount"])
    merge_time = round((time.perf_counter() - start) * 1000, 3)
    results.append(
        {
            "algorithm": "Merge Sort",
            "sort_by": "amount",
            "time_ms": merge_time,
            "stats": merge_stats,
        }
    )

    # Quick Sort by fraud_score
    start = time.perf_counter()
    _, quick_stats = quick_sort(tx_dicts, key=lambda x: x["fraud_score"], reverse=True)
    quick_time = round((time.perf_counter() - start) * 1000, 3)
    results.append(
        {
            "algorithm": "Quick Sort",
            "sort_by": "fraud_score (desc)",
            "time_ms": quick_time,
            "stats": quick_stats,
        }
    )

    # Heap Sort by amount
    start = time.perf_counter()
    _, heap_stats = heap_sort(tx_dicts, key=lambda x: x["amount"], reverse=True)
    heap_time = round((time.perf_counter() - start) * 1000, 3)
    results.append(
        {
            "algorithm": "Heap Sort",
            "sort_by": "amount (desc)",
            "time_ms": heap_time,
            "stats": heap_stats,
        }
    )

    # Counting Sort by risk_level
    start = time.perf_counter()
    _, count_stats = counting_sort_by_risk(tx_dicts)
    count_time = round((time.perf_counter() - start) * 1000, 3)
    results.append(
        {
            "algorithm": "Counting Sort",
            "sort_by": "risk_level",
            "time_ms": count_time,
            "stats": count_stats,
        }
    )

    return {
        "data_points": len(tx_dicts),
        "algorithms": get_algorithm_info(),
        "benchmark_results": results,
    }


@router.get("/performance")
def dsa_performance(
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
):
    """Return memory usage and performance metrics for all DSA structures."""
    account_count = db.query(Account).count()
    tx_count = db.query(Transaction).count()

    return {
        "memory_estimates": {
            "hash_table": f"{account_count * 128} bytes (~{account_count} accounts × 128B per entry)",
            "bst": f"{account_count * 64} bytes (~{account_count} nodes × 64B per node)",
            "trie": f"{_trie.size * 256} bytes (~{_trie.size} words × 256B avg)",
            "linked_list": f"{tx_count * 96} bytes (~{tx_count} transactions × 96B per node)",
            "graph": f"~{account_count * 48 + tx_count * 32} bytes (V={account_count}, E≈{tx_count})",
        },
        "data_counts": {
            "accounts": account_count,
            "transactions": tx_count,
            "trie_words": _trie.size,
        },
        "python_object_sizes": {
            "trie_root": sys.getsizeof(_trie.root),
        },
    }
