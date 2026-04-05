document.addEventListener("DOMContentLoaded", () => {
    const pre = document.getElementById("amlJson");
    if (!pre) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const net = await fetchJSON("/api/intelligence/aml/network");
            const nodes = net.nodes || [];
            const edges = net.edges || [];
            const highRisk = nodes.filter(n => n.risk_score > 0.6).length;
            const summary = {
                total_nodes: nodes.length,
                total_edges: edges.length,
                high_risk_nodes: highRisk
            };
            pre.textContent = JSON.stringify({ summary, nodes: nodes.slice(0, 50), edges: edges.slice(0, 50) }, null, 2);
        } catch (e) {
            console.error(e);
            pre.textContent = "Failed to load AML network.";
        }
    })();
});

