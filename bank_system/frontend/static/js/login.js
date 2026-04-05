let loginUsername = "";
let loginPassword = "";

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;
    loginUsername = username;
    loginPassword = password;

    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: body.toString(),
        });
        if (res.status === 202) {
            document.getElementById("loginForm").classList.add("hidden");
            document.getElementById("otpForm").classList.remove("hidden");
            return;
        }
        if (!res.ok) {
            throw new Error(await res.text());
        }
    } catch (err) {
        alert("Login failed: " + err);
    }
}

async function handleOtp(e) {
    e.preventDefault();
    const form = e.target;
    const otp = form.otp.value;
    try {
        const res = await fetch("/api/auth/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: loginUsername,
                password: loginPassword,
                otp,
            }),
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        window.location.href = "/dashboard";
    } catch (err) {
        alert("OTP verification failed: " + err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const lf = document.getElementById("loginForm");
    const of = document.getElementById("otpForm");
    if (lf) lf.addEventListener("submit", handleLogin);
    if (of) of.addEventListener("submit", handleOtp);
});

