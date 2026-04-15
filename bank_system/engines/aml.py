from collections import defaultdict

from sqlalchemy.orm import Session

from bank_system.models.db_models import (
    AMLEdge,
    AMLNode,
    Transaction,
    TransactionType,
)


class AMLEngine:
    def _rebuild_graph(self, db: Session) -> tuple[list[AMLNode], list[AMLEdge]]:
        txs = (
            db.query(Transaction)
            .filter(Transaction.type == TransactionType.transfer)
            .all()
        )

        edge_weights: dict[tuple[int, int], float] = defaultdict(float)

        for tx in txs:
            if not tx.counterparty_account_id:
                continue
            edge_weights[(tx.account_id, tx.counterparty_account_id)] += abs(tx.amount)

        nodes: dict[int, AMLNode] = {}

        for (src, dst), weight in edge_weights.items():
            for acc_id in (src, dst):
                if acc_id not in nodes:
                    node = (
                        db.query(AMLNode)
                        .filter(AMLNode.account_id == acc_id)
                        .one_or_none()
                    )
                    if not node:
                        node = AMLNode(account_id=acc_id, risk_score=0.0)
                        db.add(node)
                    nodes[acc_id] = node

        db.flush()

        edges: list[AMLEdge] = []

        for (src, dst), weight in edge_weights.items():
            edge = (
                db.query(AMLEdge)
                .filter(
                    AMLEdge.from_account_id == src,
                    AMLEdge.to_account_id == dst,
                )
                .one_or_none()
            )

            if not edge:
                edge = AMLEdge(
                    from_account_id=src,
                    to_account_id=dst,
                    weight=weight,
                )
                db.add(edge)
            else:
                edge.weight = weight

            edges.append(edge)

        db.commit()
        return list(nodes.values()), edges

    def run_network_scan(self, db: Session) -> dict[str, list[dict]]:
        nodes, edges = self._rebuild_graph(db)

        adjacency: dict[int, list[int]] = defaultdict(list)

        for e in edges:
            adjacency[e.from_account_id].append(e.to_account_id)

        visited: dict[int, bool] = {}
        stack: list[int] = []
        in_stack: dict[int, bool] = {}
        cycles: list[list[int]] = []

        def dfs(v: int):
            visited[v] = True
            stack.append(v)
            in_stack[v] = True

            for neigh in adjacency.get(v, []):
                if neigh not in visited:
                    dfs(neigh)
                elif in_stack.get(neigh):
                    idx = stack.index(neigh)
                    cycles.append(stack[idx:].copy())

            stack.pop()
            in_stack[v] = False

        for node in nodes:
            if node.account_id not in visited:
                dfs(node.account_id)

        degree: dict[int, int] = defaultdict(int)

        for e in edges:
            degree[e.from_account_id] += 1
            degree[e.to_account_id] += 1

        for node in nodes:
            deg = degree[node.account_id]
            node.risk_score = min(1.0, 0.2 * len(cycles) + 0.05 * deg)

        db.commit()

        node_view = [
            {"account_id": n.account_id, "risk_score": n.risk_score} for n in nodes
        ]

        edge_view = [
            {
                "from_account_id": e.from_account_id,
                "to_account_id": e.to_account_id,
                "weight": e.weight,
            }
            for e in edges
        ]

        suspicious_clusters = [
            {"accounts": cyc, "size": len(cyc)} for cyc in cycles if len(cyc) >= 3
        ]

        return {
            "nodes": node_view,
            "edges": edge_view,
            "clusters": suspicious_clusters,
        }
