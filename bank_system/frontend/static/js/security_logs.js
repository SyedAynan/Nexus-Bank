document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("securityTable");
    if (!host) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const events = await fetchJSON("/api/admin/security-events?limit=50");
            if (!events.length) {
                host.textContent = "No recent security events.";
                return;
            }
            const table = document.createElement("table");
            table.className = "data-table";
            table.innerHTML = "<thead><tr><th>User</th><th>Type</th><th>IP</th><th>When</th><th>Details</th></tr></thead>";
            const tbody = document.createElement("tbody");
            events.forEach(e => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${e.username || "-"}</td>
                                <td>${e.type}</td>
                                <td>${e.ip || ""}</td>
                                <td>${new Date(e.created_at).toLocaleString()}</td>
                                <td>${e.details || ""}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            host.innerHTML = "";
            host.appendChild(table);
        } catch (e) {
            console.error(e);
            host.textContent = "Failed to load security events.";
        }
    })();
});

