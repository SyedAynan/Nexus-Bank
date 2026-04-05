"""
Unit Tests — DSA: Sorting Algorithms
"""

import pytest
from bank_system.data_structures.sorting import (
    merge_sort,
    quick_sort,
    heap_sort,
    counting_sort_by_risk,
    get_algorithm_info,
)


class TestMergeSort:
    def test_sort_integers(self):
        data = [38, 27, 43, 3, 9, 82, 10]
        result, stats = merge_sort(data)
        assert result == sorted(data)
        assert stats["comparisons"] > 0

    def test_sort_with_key(self):
        data = [{"name": "b", "val": 2}, {"name": "a", "val": 1}, {"name": "c", "val": 3}]
        result, stats = merge_sort(data, key=lambda x: x["val"])
        assert [r["name"] for r in result] == ["a", "b", "c"]

    def test_sort_reverse(self):
        data = [1, 2, 3, 4, 5]
        result, stats = merge_sort(data, reverse=True)
        assert result == [5, 4, 3, 2, 1]

    def test_empty_list(self):
        result, stats = merge_sort([])
        assert result == []

    def test_single_element(self):
        result, stats = merge_sort([42])
        assert result == [42]

    def test_already_sorted(self):
        data = [1, 2, 3, 4, 5]
        result, stats = merge_sort(data)
        assert result == data

    def test_stability(self):
        data = [(1, "a"), (1, "b"), (2, "c")]
        result, _ = merge_sort(data, key=lambda x: x[0])
        assert result[0] == (1, "a")
        assert result[1] == (1, "b")


class TestQuickSort:
    def test_sort_integers(self):
        data = [38, 27, 43, 3, 9, 82, 10]
        result, stats = quick_sort(data)
        assert result == sorted(data)
        assert stats["comparisons"] > 0
        assert stats["swaps"] > 0

    def test_sort_reverse(self):
        data = [1, 2, 3, 4, 5]
        result, stats = quick_sort(data, reverse=True)
        assert result == [5, 4, 3, 2, 1]

    def test_empty_list(self):
        result, stats = quick_sort([])
        assert result == []

    def test_duplicates(self):
        data = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
        result, _ = quick_sort(data)
        assert result == sorted(data)


class TestHeapSort:
    def test_sort_integers(self):
        data = [38, 27, 43, 3, 9, 82, 10]
        result, stats = heap_sort(data)
        assert result == sorted(data)
        assert stats["heapify_calls"] > 0

    def test_sort_reverse(self):
        data = [1, 2, 3, 4, 5]
        result, _ = heap_sort(data, reverse=True)
        assert result == [5, 4, 3, 2, 1]

    def test_with_key(self):
        data = [{"val": 3}, {"val": 1}, {"val": 2}]
        result, _ = heap_sort(data, key=lambda x: x["val"])
        assert [r["val"] for r in result] == [1, 2, 3]


class TestCountingSortByRisk:
    def test_risk_bucketing(self):
        data = [
            {"id": 1, "risk_level": "low"},
            {"id": 2, "risk_level": "high"},
            {"id": 3, "risk_level": "medium"},
            {"id": 4, "risk_level": "high"},
            {"id": 5, "risk_level": "low"},
        ]
        result, stats = counting_sort_by_risk(data)
        # High risk should come first
        assert result[0]["risk_level"] == "high"
        assert result[1]["risk_level"] == "high"
        assert result[-1]["risk_level"] == "low"
        assert stats["items_processed"] == 5

    def test_empty_list(self):
        result, stats = counting_sort_by_risk([])
        assert result == []
        assert stats["items_processed"] == 0


class TestAlgorithmInfo:
    def test_returns_info(self):
        info = get_algorithm_info()
        assert len(info) == 4
        names = [a["name"] for a in info]
        assert "Merge Sort" in names
        assert "Quick Sort" in names
        assert "Heap Sort" in names
