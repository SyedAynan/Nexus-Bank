document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("aiForecastChart");
    if (!canvas) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }

    (async () => {
        try {
            const seriesList = await fetchJSON("/api/analytics/forecast/cashflow");
            const series = seriesList && seriesList[0] ? seriesList[0] : { points: [] };
            const pts = series.points || [];
            const ctx = canvas.getContext("2d");
            new Chart(ctx, {
                type: "line",
                data: {
                    labels: pts.length ? pts.map(p => new Date(p.timestamp).toLocaleDateString()) : ["No data"],
                    datasets: [{
                        label: "Projected net cashflow",
                        data: pts.length ? pts.map(p => p.value) : [0],
                        borderColor: "#38bdf8",
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    plugins: { legend: { display: false } }
                }
            });
        } catch (e) {
            console.error(e);
        }
    })();
});

