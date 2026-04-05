"""
Trie (Prefix Tree) — Fast User/Account Search
==============================================
Used for autocomplete and prefix-based search across usernames
and account numbers.

Time Complexity:
    insert:   O(m) where m = length of word
    search:   O(m)
    prefix:   O(m + k) where k = number of results
    delete:   O(m)

Space Complexity: O(N * M) where N = words, M = avg length
"""

from typing import Dict, List, Optional, Tuple


class TrieNode:
    __slots__ = ("children", "is_end", "data")

    def __init__(self) -> None:
        self.children: Dict[str, "TrieNode"] = {}
        self.is_end: bool = False
        self.data: Optional[dict] = None  # metadata attached at word end


class Trie:
    """Prefix tree for fast autocomplete search."""

    def __init__(self) -> None:
        self.root = TrieNode()
        self._size = 0

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def insert(self, word: str, data: Optional[dict] = None) -> None:
        """Insert a word (lowercased) with optional metadata."""
        node = self.root
        for ch in word.lower():
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        if not node.is_end:
            self._size += 1
        node.is_end = True
        node.data = data

    def search(self, word: str) -> bool:
        """Return True if exact word exists."""
        node = self._find_node(word.lower())
        return node is not None and node.is_end

    def starts_with(self, prefix: str, limit: int = 20) -> List[Tuple[str, Optional[dict]]]:
        """Return up to *limit* words starting with *prefix*."""
        node = self._find_node(prefix.lower())
        if node is None:
            return []
        results: List[Tuple[str, Optional[dict]]] = []
        self._collect(node, list(prefix.lower()), results, limit)
        return results

    def delete(self, word: str) -> bool:
        """Remove a word. Returns True if it existed."""
        return self._delete(self.root, word.lower(), 0)

    @property
    def size(self) -> int:
        return self._size

    # ------------------------------------------------------------------
    # Visualization helpers (admin dashboard)
    # ------------------------------------------------------------------

    def visualize(self, max_depth: int = 5) -> dict:
        """Return a JSON-safe tree representation for the admin panel."""
        return {
            "type": "Trie",
            "total_words": self._size,
            "tree": self._viz_node(self.root, 0, max_depth),
            "complexity": {
                "insert": "O(m)",
                "search": "O(m)",
                "prefix_search": "O(m + k)",
                "space": "O(N × M)",
            },
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _find_node(self, key: str) -> Optional[TrieNode]:
        node = self.root
        for ch in key:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def _collect(
        self,
        node: TrieNode,
        path: list,
        results: list,
        limit: int,
    ) -> None:
        if len(results) >= limit:
            return
        if node.is_end:
            results.append(("".join(path), node.data))
        for ch in sorted(node.children):
            path.append(ch)
            self._collect(node.children[ch], path, results, limit)
            path.pop()

    def _delete(self, node: TrieNode, word: str, depth: int) -> bool:
        if depth == len(word):
            if not node.is_end:
                return False
            node.is_end = False
            node.data = None
            self._size -= 1
            return len(node.children) == 0

        ch = word[depth]
        child = node.children.get(ch)
        if child is None:
            return False

        should_delete = self._delete(child, word, depth + 1)
        if should_delete:
            del node.children[ch]
            return not node.is_end and len(node.children) == 0

        return False

    def _viz_node(self, node: TrieNode, depth: int, max_depth: int) -> dict:
        if depth >= max_depth:
            remaining = self._count_children(node)
            return {"truncated": True, "remaining_nodes": remaining}
        children = {}
        for ch in sorted(node.children):
            children[ch] = self._viz_node(node.children[ch], depth + 1, max_depth)
        result: dict = {"is_end": node.is_end}
        if children:
            result["children"] = children
        return result

    def _count_children(self, node: TrieNode) -> int:
        count = 1
        for child in node.children.values():
            count += self._count_children(child)
        return count
