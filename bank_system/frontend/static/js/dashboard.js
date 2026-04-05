let accessToken = localStorage.getItem("access_token");

function showToast(message, type = "") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function setThemeToggle() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;
    toggle.onclick = () => {
        const html = document.documentElement;
        const isDark = html.getAttribute("data-theme") !== "light";
        html.setAttribute("data-theme", isDark ? "light" : "dark");
    };
}

async function fetchJSON(url, options = {}) {
    const headers = options.headers || {};
    if (accessToken) {
        headers["Authorization"] = "Bearer " + accessToken;
    }
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const err = new Error(await res.text());
        err.status = res.status;
        throw err;
    }
    return res.json();
}

async function loadDashboard() {
    if (!document.getElementById("kpiBalance")) return;
    if (!accessToken) {
        window.location.href = "/";
        return;
    }
    try {
        const kpi = await fetchJSON("/api/analytics/kpi");
        document.getElementById("kpiBalance").textContent = kpi.total_balance != null ? kpi.total_balance.toFixed(2) : "0.00";
        document.getElementById("kpiTx").textContent = kpi.total_transactions_24h ?? 0;
        document.getElementById("kpiFraud").textContent = kpi.fraud_alerts_open ?? 0;

        const forecast = await fetchJSON("/api/analytics/forecast/cashflow");
        const series = forecast && forecast[0] ? forecast[0] : { points: [] };
        const points = series.points || [];
        const ctx = document.getElementById("forecastChart");
        if (!ctx) return;
        new Chart(ctx.getContext("2d"), {
            type: "line",
            data: {
                labels: points.length ? points.map(p => new Date(p.timestamp).toLocaleDateString()) : ["No data"],
                datasets: [{
                    label: "Net flow",
                    data: points.length ? points.map(p => p.value) : [0],
                    borderColor: "#38bdf8",
                    fill: true,
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    tension: 0.3
                }]
            },
            options: { plugins: { legend: { display: false }}, scales: { x: { display:false } } }
        });
    } catch (e) {
        console.error(e);
        if (e.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/";
        }
    }
}

function initWebSocket() {
    const status = document.getElementById("wsStatus");
    const feed = document.getElementById("liveFeed");
    if (!status) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws/dashboard`);
    ws.onopen = () => {
        status.textContent = "Live";
    };
    ws.onclose = () => {
        status.textContent = "Disconnected";
        status.style.borderColor = "#f97373";
    };
    ws.onmessage = (ev) => {
        try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "tick" && feed) {
                const li = document.createElement("li");
                li.textContent = `Acc ${msg.account_id} ${msg.tx_type} ${msg.tx_amount} | score ${msg.fraud_score.toFixed(2)} (${msg.fraud_severity})`;
                feed.prepend(li);
                if (msg.fraud_severity === "high") {
                    showToast("High severity fraud pattern detected.", "danger");
                }
            }
        } catch {}
    };
}

document.addEventListener("DOMContentLoaded", () => {
    setThemeToggle();
    initWebSocket();
    loadDashboard();
});

