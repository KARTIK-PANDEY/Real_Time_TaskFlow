"use client";

import { useDashboard } from "../layout";
import { useState } from "react";
import { CircleHelp, Save, User, Shield, Sliders, Bell } from "lucide-react";

export default function SettingsPage() {
  const { user, setToast } = useDashboard();

  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState(user?.role || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [email, setEmail] = useState(user?.email || "");

  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("indigo");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !department) {
      setToast("Please fill all required profile fields.");
      return;
    }

    const updatedUser = {
      ...user,
      name,
      role,
      department,
      initials: name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setToast("Profile settings updated successfully! Reloading...");
    
    // Quick reload to update shell sidebar
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>Settings</h1>
          <p>Customize your workspace account details and configuration.</p>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginTop: "24px" }}>
        {/* Profile Card */}
        <article className="panel">
          <div className="panel-heading" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} style={{ color: "#6366f1" }} />
              <h2>Profile Details</h2>
            </div>
          </div>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                required
                className="form-input"
                style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="profile-email">Email Address (Read-only)</label>
              <input
                id="profile-email"
                type="email"
                readOnly
                disabled
                className="form-input"
                style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", color: "#64748b", cursor: "not-allowed" }}
                value={email}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="profile-role">Designation</label>
              <input
                id="profile-role"
                type="text"
                required
                className="form-input"
                style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white" }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="profile-dept">Department</label>
              <input
                id="profile-dept"
                type="text"
                required
                className="form-input"
                style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "white" }}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="primary-button"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "10px" }}
            >
              <Save size={16} /> Save profile details
            </button>
          </form>
        </article>

        {/* Preferences Card */}
        <article className="panel">
          <div className="panel-heading" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={18} style={{ color: "#6366f1" }} />
              <h2>Workspace Preferences</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>Email Notifications</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Send workspace summaries every Friday</span>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                style={{
                  width: "44px",
                  height: "24px",
                  background: notifications ? "#6366f1" : "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "12px",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    background: "white",
                    borderRadius: "50%",
                    position: "absolute",
                    top: "3px",
                    left: notifications ? "23px" : "3px",
                    transition: "all 0.2s ease"
                  }}
                />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>Theme Color Scheme</span>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {["indigo", "emerald", "amber", "purple"].map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      setTheme(col);
                      setToast(`Theme changed to ${col}`);
                    }}
                    style={{
                      padding: "8px 14px",
                      fontSize: "13px",
                      background: theme === col ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${theme === col ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "8px",
                      color: "#ffffff",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", marginTop: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
                <Shield size={16} />
                <span style={{ fontSize: "13px" }}>Access Permissions: <strong>Workspace Admin</strong></span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <footer className="dashboard-footer">
        <span>Disa Financial workspace · All systems operational</span>
        <div><button><CircleHelp size={14} /> Help center</button><button>Privacy</button></div>
      </footer>
    </>
  );
}
