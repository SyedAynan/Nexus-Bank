document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("analyticsChart");
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
                type: "bar",
                data: {
                    labels: pts.length ? pts.map(p => new Date(p.timestamp).toLocaleDateString()) : ["No data"],
                    datasets: [{
                        label: "Projected net cashflow",
                        data: pts.length ? pts.map(p => p.value) : [0],
                        backgroundColor: "rgba(56, 189, 248, 0.4)",
                        borderColor: "#38bdf8",
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { x: { ticks: { maxTicksLimit: 7 } } }
                }
            });
        } catch (e) {
            console.error(e);
        }
    })();
});

