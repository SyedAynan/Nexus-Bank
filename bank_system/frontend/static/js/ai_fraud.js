document.addEventListener("DOMContentLoaded", () => {
    const summary = document.getElementById("fraudSummary");
    const tableHost = document.getElementById("fraudAlertsTable");
    if (!summary || !tableHost) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const alerts = await fetchJSON("/api/admin/fraud-alerts");
            if (!alerts.length) {
                summary.textContent = "No open fraud alerts. All clear.";
                tableHost.textContent = "";
                return;
            }
            const high = alerts.filter(a => a.severity === "high").length;
            const medium = alerts.filter(a => a.severity === "medium").length;
            const low = alerts.filter(a => a.severity === "low").length;
            summary.textContent = `Open alerts: ${alerts.length} (high: ${high}, medium: ${medium}, low: ${low})`;

            const table = document.createElement("table");
            table.className = "data-table";
            table.innerHTML = "<thead><tr><th>Account</th><th>Score</th><th>Severity</th><th>Reason</th><th>When</th></tr></thead>";
            const tbody = document.createElement("tbody");
            alerts.forEach(a => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${a.account_id}</td>
                                <td>${a.score.toFixed(2)}</td>
                                <td>${a.severity}</td>
                                <td>${a.reason}</td>
                                <td>${new Date(a.created_at).toLocaleString()}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            tableHost.innerHTML = "";
            tableHost.appendChild(table);
        } catch (e) {
            console.error(e);
            summary.textContent = "Failed to load fraud data.";
        }
    })();
});

