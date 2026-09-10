"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Login failed." }));
      setError(body.message || "Login failed.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="brand-mark">IM</div>
        <div className="brand-copy">
          <p className="brand-name">INDOMOBIL <span>eMOTOR</span></p>
          <h1>Marketing Intelligence</h1>
          <p>Turning marketing data into clearer decisions, faster.</p>
        </div>
        <div className="brand-orb orb-one" />
        <div className="brand-orb orb-two" />
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-mark small">IM</div>
            <strong>INDOMOBIL eMOTOR</strong>
          </div>
          <p className="eyebrow">PRIVATE DASHBOARD</p>
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to access your marketing report.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="show-password" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error ? <p className="login-error">{error}</p> : null}
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="login-note">This dashboard is intended for authorized users only.</p>
        </div>
      </section>
    </main>
  );
}
