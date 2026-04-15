"""
DSA: Graph (Adjacency List representation)
Used for: Compliance risk analysis — detecting transaction networks, circular transfers, suspicious patterns
Time Complexity: Add edge O(1), BFS/DFS O(V+E), Cycle detection O(V+E)
Space Complexity: O(V+E) where V=accounts, E=transfers between them
"""

from collections import defaultdict, deque


class ComplianceGraph:
    """
    Directed weighted graph where:
    - Nodes = Account IDs
    - Edges = Transfer transactions (with total amount as weight)
    Used to detect: circular transfer networks, high-risk hubs, suspicious clusters
    """

    def __init__(self):
        self.adj = defaultdict(dict)  # {source: {dest: total_amount}}
        self.nodes = set()
        self.risk_scores = {}  # Account risk scores

    def add_transfer(self, from_acc, to_acc, amount):
        """Record a transfer between accounts. O(1)"""
        self.nodes.add(from_acc)
        self.nodes.add(to_acc)
        if to_acc in self.adj[from_acc]:
            self.adj[from_acc][to_acc] += amount
        else:
            self.adj[from_acc][to_acc] = amount

    def bfs(self, start):
        """
        BFS traversal from a starting account.
        Used to find all accounts reachable from 'start' (money flow).
        Time: O(V+E)
        """
        visited = set()
        queue = deque([start])
        order = []
        while queue:
            node = queue.popleft()
            if node not in visited:
                visited.add(node)
                order.append(node)
                for neighbor in self.adj.get(node, {}):
                    if neighbor not in visited:
                        queue.append(neighbor)
        return order

    def detect_cycles(self):
        """
        Detect circular transfer cycles using DFS (compliance red flag).
        Returns list of cycles found. Time: O(V+E)
        """
        visited = set()
        rec_stack = set()
        cycles = []

        def dfs(node, path):
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            for neighbor in self.adj.get(node, {}):
                if neighbor not in visited:
                    dfs(neighbor, path)
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start = path.index(neighbor)
                    cycles.append(path[cycle_start:] + [neighbor])
            path.pop()
            rec_stack.discard(node)

        for node in list(self.nodes):
            if node not in visited:
                dfs(node, [])
        return cycles

    def compute_risk_scores(self):
        """
        Assign risk scores based on out-degree and total transfer volume.
        High out-degree + high volume = higher risk. O(V+E)
        """
        for node in self.nodes:
            neighbors = self.adj.get(node, {})
            out_degree = len(neighbors)
            total_volume = sum(neighbors.values())
            # Simple heuristic: weighted score
            score = min(100, (out_degree * 10) + (total_volume / 10000))
            self.risk_scores[node] = round(score, 2)
        return self.risk_scores

    def get_high_risk_accounts(self, threshold=50):
        """Return accounts above risk threshold. O(V)"""
        self.compute_risk_scores()
        return {
            acc: score for acc, score in self.risk_scores.items() if score >= threshold
        }

    def get_edges(self):
        """Return all edges as list of (from, to, amount). O(E)"""
        edges = []
        for src, dests in self.adj.items():
            for dest, amount in dests.items():
                edges.append({"from": src, "to": dest, "amount": amount})
        return edges

    def get_graph_data(self):
        """Return graph data for visualization."""
        nodes = [{"id": n, "risk": self.risk_scores.get(n, 0)} for n in self.nodes]
        edges = self.get_edges()
        return {"nodes": nodes, "edges": edges}
