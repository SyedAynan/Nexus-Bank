document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("loansTable");
    if (!host) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const loans = await fetchJSON("/api/banking/loans");
            if (!loans.length) {
                host.textContent = "No loans yet.";
                return;
            }
            const table = document.createElement("table");
            table.className = "data-table";
            table.innerHTML = "<thead><tr><th>Account</th><th>Principal</th><th>Rate %</th><th>Term (m)</th><th>Risk tier</th><th>Approval %</th></tr></thead>";
            const tbody = document.createElement("tbody");
            loans.forEach(l => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${l.account_id}</td>
                                <td>${l.principal.toFixed(2)}</td>
                                <td>${l.interest_rate.toFixed(2)}</td>
                                <td>${l.term_months}</td>
                                <td>${l.risk_tier}</td>
                                <td>${(l.approval_probability * 100).toFixed(0)}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            host.innerHTML = "";
            host.appendChild(table);
        } catch (e) {
            console.error(e);
            host.textContent = "Failed to load loans.";
        }
    })();
});

