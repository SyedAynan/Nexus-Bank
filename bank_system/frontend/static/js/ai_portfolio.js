document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("aiPortfolioChart");
    if (!canvas) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const accounts = await fetchJSON("/api/banking/accounts");
            if (!accounts.length) {
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#9ca3af";
                ctx.fillText("Create an account first to see portfolio intelligence.", 10, 20);
                return;
            }
            const acc = accounts[0];
            const insights = await fetchJSON(`/api/intelligence/portfolio?account_id=${acc.id}`);
            if (!insights.length) {
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#9ca3af";
                ctx.fillText("No portfolio holdings yet.", 10, 20);
                return;
            }
            const labels = insights.map(i => i.asset_class);
            const data = insights.map(i => i.allocation_pct);
            const ctx = canvas.getContext("2d");
            new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: [
                            "#38bdf8",
                            "#6366f1",
                            "#22c55e",
                            "#f97316",
                            "#e11d48"
                        ]
                    }]
                },
                options: {
                    plugins: { legend: { position: "bottom" } }
                }
            });
        } catch (e) {
            console.error(e);
        }
    })();
});

