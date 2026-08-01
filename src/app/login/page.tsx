"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear existing session on load
  useEffect(() => {
    localStorage.removeItem("user");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store authenticated user in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect to dashboard
      router.push("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <main className="auth-container">
      <style jsx global>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at 50% 50%, #1e1e38 0%, #0d0d1e 100%);
          font-family: var(--font-geist-sans), sans-serif;
          color: #f1f5f9;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          background: rgba(26, 26, 46, 0.65);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 28px;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #6366f1;
        }
        .auth-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #ffffff;
        }
        .auth-header p {
          font-size: 15px;
          color: #94a3b8;
        }
        .auth-form-group {
          margin-bottom: 20px;
          position: relative;
        }
        .auth-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #cbd5e1;
        }
        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: #64748b;
        }
        .auth-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          background: rgba(13, 13, 29, 0.6);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #ffffff;
          font-size: 15px;
          transition: all 0.2s ease;
        }
        .auth-input:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(13, 13, 29, 0.8);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .auth-toggle-pass {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .auth-toggle-pass:hover {
          color: #94a3b8;
        }
        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 12px 16px;
          border-radius: 10px;
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .auth-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .auth-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }
        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 14px;
          color: #94a3b8;
        }
        .auth-link {
          color: #6366f1;
          font-weight: 500;
          text-decoration: none;
        }
        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">
            <Zap size={20} fill="currentColor" />
          </span>
          <span>Disa Tracker</span>
        </div>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to manage your workspace</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="email">Email or User ID</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={18} />
              <input
                id="email"
                type="text"
                required
                className="auth-input"
                placeholder="you@disafinancial.com or User ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="auth-link">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
