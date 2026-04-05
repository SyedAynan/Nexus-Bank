document.addEventListener("DOMContentLoaded", () => {
    const scoreEl = document.getElementById("healthScore");
    const detailEl = document.getElementById("healthDetail");
    if (!scoreEl || !detailEl) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const health = await fetchJSON("/api/intelligence/financial-health");
            scoreEl.textContent = `${health.health_score} / 100`;
            detailEl.innerHTML = `
                <p><strong>Risk exposure:</strong> ${(health.risk_exposure * 100).toFixed(0)}%</p>
                <p><strong>Savings consistency:</strong> ${(health.savings_consistency * 100).toFixed(0)}%</p>
                <p><strong>Spending discipline:</strong> ${(health.spending_discipline * 100).toFixed(0)}%</p>
                <p style="margin-top:0.75rem;">${health.recommendations}</p>
            `;
        } catch (e) {
            console.error(e);
            detailEl.textContent = "Unable to compute financial health right now.";
        }
    })();
});

