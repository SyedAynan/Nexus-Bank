"""
Unit Tests — DSA: Trie (Prefix Tree)
"""

import pytest
from bank_system.data_structures.trie import Trie


class TestTrie:
    def setup_method(self):
        self.trie = Trie()

    def test_insert_and_search(self):
        self.trie.insert("hello")
        assert self.trie.search("hello") is True
        assert self.trie.search("hell") is False
        assert self.trie.search("helloo") is False

    def test_case_insensitive(self):
        self.trie.insert("NEXA")
        assert self.trie.search("nexa") is True
        assert self.trie.search("NEXA") is True

    def test_prefix_search(self):
        words = ["apple", "application", "apply", "banana", "band"]
        for w in words:
            self.trie.insert(w, data={"word": w})

        results = self.trie.starts_with("app")
        assert len(results) == 3
        keys = [r[0] for r in results]
        assert "apple" in keys
        assert "application" in keys
        assert "apply" in keys

    def test_prefix_with_limit(self):
        for i in range(50):
            self.trie.insert(f"test{i:03d}")

        results = self.trie.starts_with("test", limit=5)
        assert len(results) == 5

    def test_delete(self):
        self.trie.insert("hello")
        self.trie.insert("help")
        assert self.trie.size == 2

        self.trie.delete("hello")
        assert self.trie.search("hello") is False
        assert self.trie.search("help") is True
        assert self.trie.size == 1

    def test_delete_nonexistent(self):
        result = self.trie.delete("nonexistent")
        assert result is False

    def test_size_tracking(self):
        assert self.trie.size == 0
        self.trie.insert("a")
        assert self.trie.size == 1
        self.trie.insert("a")  # duplicate
        assert self.trie.size == 1
        self.trie.insert("b")
        assert self.trie.size == 2

    def test_with_data(self):
        self.trie.insert("NB-001", data={"id": 1, "balance": 5000})
        results = self.trie.starts_with("nb-")
        assert len(results) == 1
        assert results[0][1]["balance"] == 5000

    def test_visualize(self):
        self.trie.insert("ab")
        self.trie.insert("ac")
        viz = self.trie.visualize(max_depth=5)
        assert viz["type"] == "Trie"
        assert viz["total_words"] == 2
        assert "tree" in viz
        assert "complexity" in viz

    def test_empty_prefix_returns_all(self):
        self.trie.insert("a")
        self.trie.insert("b")
        results = self.trie.starts_with("")
        assert len(results) == 2
