"""
Custom Sorting Algorithms — Transaction & Account Ordering
==========================================================
Demonstrates classic sorting algorithms applied to banking data.
Each algorithm includes step counting for the admin visualization panel.

Algorithms:
    1. Merge Sort   — O(n log n) stable, used for transaction history
    2. Quick Sort   — O(n log n) avg, used for risk-based ranking
    3. Heap Sort    — O(n log n), used for top-K queries
    4. Counting Sort — O(n + k), used for risk-level bucketing

All functions return (sorted_list, stats) where stats contains
comparison/swap counts for admin dashboard display.
"""

from typing import Any, Callable, Dict, List, Tuple


SortStats = Dict[str, int]


def merge_sort(
    data: List[Any],
    key: Callable[[Any], Any] = lambda x: x,
    reverse: bool = False,
) -> Tuple[List[Any], SortStats]:
    """Stable merge sort — ideal for transaction history ordering."""
    stats: SortStats = {"comparisons": 0, "copies": 0, "recursive_calls": 0}

    def _merge(left: list, right: list) -> list:
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            stats["comparisons"] += 1
            lv, rv = key(left[i]), key(right[j])
            if (lv <= rv and not reverse) or (lv >= rv and reverse):
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
            stats["copies"] += 1
        result.extend(left[i:])
        result.extend(right[j:])
        stats["copies"] += len(left) - i + len(right) - j
        return result

    def _sort(arr: list) -> list:
        if len(arr) <= 1:
            return arr
        stats["recursive_calls"] += 1
        mid = len(arr) // 2
        return _merge(_sort(arr[:mid]), _sort(arr[mid:]))

    sorted_data = _sort(list(data))
    return sorted_data, stats


def quick_sort(
    data: List[Any],
    key: Callable[[Any], Any] = lambda x: x,
    reverse: bool = False,
) -> Tuple[List[Any], SortStats]:
    """Quick sort — used for risk-based ranking."""
    arr = list(data)
    stats: SortStats = {"comparisons": 0, "swaps": 0, "recursive_calls": 0}

    def _partition(lo: int, hi: int) -> int:
        pivot = key(arr[hi])
        i = lo - 1
        for j in range(lo, hi):
            stats["comparisons"] += 1
            val = key(arr[j])
            if (val <= pivot and not reverse) or (val >= pivot and reverse):
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                stats["swaps"] += 1
        arr[i + 1], arr[hi] = arr[hi], arr[i + 1]
        stats["swaps"] += 1
        return i + 1

    def _sort(lo: int, hi: int) -> None:
        if lo < hi:
            stats["recursive_calls"] += 1
            pi = _partition(lo, hi)
            _sort(lo, pi - 1)
            _sort(pi + 1, hi)

    if arr:
        _sort(0, len(arr) - 1)
    return arr, stats


def heap_sort(
    data: List[Any],
    key: Callable[[Any], Any] = lambda x: x,
    reverse: bool = False,
) -> Tuple[List[Any], SortStats]:
    """Heap sort — used for top-K customer queries."""
    arr = list(data)
    n = len(arr)
    stats: SortStats = {"comparisons": 0, "swaps": 0, "heapify_calls": 0}

    def _heapify(size: int, root: int) -> None:
        stats["heapify_calls"] += 1
        largest = root
        left = 2 * root + 1
        right = 2 * root + 2

        if left < size:
            stats["comparisons"] += 1
            lv, rv = key(arr[left]), key(arr[largest])
            if (lv > rv and not reverse) or (lv < rv and reverse):
                largest = left

        if right < size:
            stats["comparisons"] += 1
            lv, rv = key(arr[right]), key(arr[largest])
            if (lv > rv and not reverse) or (lv < rv and reverse):
                largest = right

        if largest != root:
            arr[root], arr[largest] = arr[largest], arr[root]
            stats["swaps"] += 1
            _heapify(size, largest)

    for i in range(n // 2 - 1, -1, -1):
        _heapify(n, i)

    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        stats["swaps"] += 1
        _heapify(i, 0)

    return arr, stats


def counting_sort_by_risk(
    data: List[dict],
    risk_key: str = "risk_level",
) -> Tuple[List[dict], SortStats]:
    """Counting sort for risk-level bucketing (low/medium/high)."""
    bucket_order = {"low": 0, "medium": 1, "high": 2}
    stats: SortStats = {"bucket_ops": 0, "items_processed": len(data)}

    buckets: Dict[str, List[dict]] = {"low": [], "medium": [], "high": []}
    for item in data:
        level = item.get(risk_key, "low")
        if level not in buckets:
            level = "low"
        buckets[level].append(item)
        stats["bucket_ops"] += 1

    result: List[dict] = []
    for level in ["high", "medium", "low"]:  # high risk first
        result.extend(buckets[level])

    return result, stats


def get_algorithm_info() -> List[dict]:
    """Return algorithm metadata for the admin DSA panel."""
    return [
        {
            "name": "Merge Sort",
            "best": "O(n log n)",
            "average": "O(n log n)",
            "worst": "O(n log n)",
            "space": "O(n)",
            "stable": True,
            "use_case": "Transaction history ordering by date/amount",
        },
        {
            "name": "Quick Sort",
            "best": "O(n log n)",
            "average": "O(n log n)",
            "worst": "O(n²)",
            "space": "O(log n)",
            "stable": False,
            "use_case": "Risk-based account ranking",
        },
        {
            "name": "Heap Sort",
            "best": "O(n log n)",
            "average": "O(n log n)",
            "worst": "O(n log n)",
            "space": "O(1)",
            "stable": False,
            "use_case": "Top-K customers by balance",
        },
        {
            "name": "Counting Sort (Risk Bucketing)",
            "best": "O(n + k)",
            "average": "O(n + k)",
            "worst": "O(n + k)",
            "space": "O(k)",
            "stable": True,
            "use_case": "Risk level categorization",
        },
    ]
