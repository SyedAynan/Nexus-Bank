document.addEventListener("DOMContentLoaded", () => {
    const liveUsersEl = document.getElementById("adminLiveUsers");
    const fraudTableEl = document.getElementById("adminFraudTable");
    if (!liveUsersEl || !fraudTableEl) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const users = await fetchJSON("/api/admin/live-users");
            liveUsersEl.innerHTML = "";
            if (!users.length) {
                const li = document.createElement("li");
                li.textContent = "No active WebSocket sessions.";
                liveUsersEl.appendChild(li);
            } else {
                users.forEach(u => {
                    const li = document.createElement("li");
                    li.textContent = u;
                    liveUsersEl.appendChild(li);
                });
            }

            const alerts = await fetchJSON("/api/admin/fraud-alerts");
            if (!alerts.length) {
                fraudTableEl.textContent = "No open fraud alerts.";
                return;
            }
            const table = document.createElement("table");
            table.className = "data-table";
            table.innerHTML = "<thead><tr><th>Account</th><th>Score</th><th>Severity</th><th>When</th></tr></thead>";
            const tbody = document.createElement("tbody");
            alerts.forEach(a => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${a.account_id}</td>
                                <td>${a.score.toFixed(2)}</td>
                                <td>${a.severity}</td>
                                <td>${new Date(a.created_at).toLocaleString()}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            fraudTableEl.innerHTML = "";
            fraudTableEl.appendChild(table);
        } catch (e) {
            console.error(e);
        }
    })();
});

