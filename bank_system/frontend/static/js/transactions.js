document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("transactionsTable");
    if (!container) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const accounts = await fetchJSON("/api/banking/accounts");
            if (!accounts.length) {
                container.textContent = "No accounts yet. The simulation will create activity once an account exists.";
                return;
            }
            const acc = accounts[0];
            const txs = await fetchJSON(`/api/banking/transactions/${acc.id}`);
            if (!txs.length) {
                container.textContent = `No transactions yet for account ${acc.account_number}.`;
                return;
            }
            const table = document.createElement("table");
            table.className = "data-table";
            const thead = document.createElement("thead");
            thead.innerHTML = "<tr><th>Time</th><th>Type</th><th>Amount</th><th>Description</th></tr>";
            table.appendChild(thead);
            const tbody = document.createElement("tbody");
            txs.forEach(t => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${new Date(t.created_at).toLocaleString()}</td>
                                <td>${t.type}</td>
                                <td>${t.amount.toFixed(2)}</td>
                                <td>${t.description || ""}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.innerHTML = "";
            container.appendChild(table);
        } catch (e) {
            console.error(e);
            container.textContent = "Failed to load transactions.";
        }
    })();
});

