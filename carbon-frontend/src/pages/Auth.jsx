import { useState, useContext } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="auth-oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser, user, loading } = useContext(AuthContext);

  // Determine initial mode based on route
  const initialMode = location.pathname === "/register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Prevent logged-in users from seeing auth page
  if (loading) return null;
  // if (user) return <Navigate to="/" />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setError("");
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // await api.post("/auth/login", {
      //   email: form.email,
      //   password: form.password,
      // });

      // const me = await api.get("/auth/me");
      // await fetchUser();

      // if (me.data.role === "admin") {
      //   navigate("/admin");
      // } else {
      //   navigate("/");
      // }
      await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      await fetchUser();   // wait for context to update

      const me = await api.get("/auth/me");

      if (me.data.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        // ✅ Direct access, no location check
        navigate("/profile", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Register (now auto-logs in or returns success)
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // Show success and auto-login logic if implemented, or just switch
      // Since we changed backend to sendTokens, we might want to just fetchUser and redirect.
      // But purely following "return message" logic:

      // Attempt login immediately
      await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      await fetchUser();
      navigate("/profile", { replace: true });

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  // const handleGoogleAuth = () => {
  //   window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`;
  // };

  return (
    <div className="auth-page">
      {/* Left Panel - Visual Identity */}
      <div className="auth-visual-panel">
        {/* Rotating Earth Globe */}
        <div className="auth-earth-container">
          <div className="auth-earth-orbit"></div>
          <div className="auth-earth-atmosphere"></div>
          <div className="auth-earth"></div>
        </div>

        {/* Graph Lines */}
        <div className="auth-graph-lines">
          <div className="auth-graph-line"></div>
          <div className="auth-graph-line"></div>
          <div className="auth-graph-line"></div>
          <div className="auth-graph-line"></div>
        </div>

        {/* Floating Particles */}
        <div className="auth-particles">
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
          <div className="auth-particle"></div>
        </div>

        {/* Sensor Dots */}
        <div className="auth-sensor-dots">
          <div className="auth-sensor-dot"></div>
          <div className="auth-sensor-dot"></div>
          <div className="auth-sensor-dot"></div>
          <div className="auth-sensor-dot"></div>
          <div className="auth-sensor-dot"></div>
        </div>

        {/* Content */}
        <div className="auth-visual-content">
          <h2 className="auth-visual-title">
            Environmental Intelligence Platform
          </h2>
          <p className="auth-visual-subtitle">
            Real-time air quality monitoring, carbon emission tracking,
            and predictive analytics for environmental decision-making.
          </p>

          <div className="auth-data-hint">
            <div className="auth-data-item">
              <span className="auth-data-value">AQI</span>
              <span className="auth-data-label">Monitoring</span>
            </div>
            <div className="auth-data-item">
              <span className="auth-data-value">Health</span>
              <span className="auth-data-label">Advisory</span>
            </div>
            <div className="auth-data-item">
              <span className="auth-data-value">AI</span>
              <span className="auth-data-label">Predictions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Card */}
      <div className="auth-card-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <span className="auth-logo-text">
              <span className="auth-logo-re">Re</span>
              <span className="auth-logo-atmos">Atmos</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <div className={`auth-tab-indicator ${mode === "register" ? "register" : ""}`}></div>
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => handleTabSwitch("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => handleTabSwitch("register")}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="auth-error">{error}</div>}

          {/* Form */}
          <form
            className="auth-form"
            onSubmit={mode === "login" ? handleLoginSubmit : handleRegisterSubmit}
          >
            {/* Name Field (Register only) */}
            {mode === "register" && (
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="auth-input"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="auth-input"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Field */}
            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="auth-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Confirm Password (Register only) */}
            {mode === "register" && (
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="auth-input"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Forgot Password (Login only) */}
            {mode === "login" && (
              <div className="auth-forgot">
                <button type="button" className="auth-forgot-link">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="auth-submit">
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line"></span>
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line"></span>
          </div>

          {/* Google OAuth */}
          {/* Google OAuth (Disabled) */}
          {/* <button type="button" className="auth-oauth" onClick={handleGoogleAuth}>
            <GoogleIcon />
            Continue with Google
          </button> */}

          {/* Secondary Link */}
          <div className="auth-secondary">
            <span className="auth-secondary-text">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              className="auth-secondary-link"
              onClick={() => handleTabSwitch(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
