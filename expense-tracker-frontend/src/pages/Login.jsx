// src/pages/Login.jsx
import "./Login.css";
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Attempt login - support several response shapes
      const res = await api.post("/users/login", { email, password });

      // Common response shapes:
      // { token: '...' }
      // { user: {...}, token: '...' }
      // { data: { token: '...' } }
      let token = res?.data?.token || res?.data?.data?.token || null;
      let name = res?.data?.name || res?.data?.user?.name || res?.data?.data?.user?.name || "";

      // fallback if server put token inside user object
      if (!token && res?.data?.user && res.data.user.token) token = res.data.user.token;

      if (!token) {
        console.warn("Login response missing token:", res?.data);
        toast.error("Login succeeded but server didn't return token. Check console.");
        setLoading(false);
        return;
      }

      // call AuthContext login and store in session
      login({ token, name });
      // also set localStorage/sessionStorage for other code that might read it
      sessionStorage.setItem("token", token);
      if (name) sessionStorage.setItem("name", name);

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error", err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Toaster position="top-right" />

      <header className="login-welcome">
        <h1 className="welcome-title">Welcome to <span className="brand">Micro Expense Tracker</span></h1>
        <p className="welcome-sub">Mini app. Big clarity — track incomes, expenses and budgets quickly.</p>
      </header>

      <main className="login-wrap">
        <div className="login-card card">
          <h2 className="card-head">Login</h2>

          <form className="login-form" onSubmit={handleSubmit} aria-label="Login form">
            <label className="visually-hidden" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="visually-hidden" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="small muted register-note">
            Don't have an account? <Link to="/register" className="link">Register</Link>
          </p>
        </div>
      </main>

      <footer className="login-footer">
        <div className="credits">
          <div>Sushil Kumar — Frontend dev</div>
          <div>Yashwant Vadhan — Backend dev</div>
          <div>Dinesh — Database creation & data collection</div>
        </div>
      </footer>
    </div>
  );
}
