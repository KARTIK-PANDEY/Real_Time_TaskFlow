"use client";

import { useDashboard } from "../layout";
import { useState, useMemo } from "react";
import { CircleHelp, Search, Users, ShieldAlert } from "lucide-react";

function Avatar({ initials, color, status, size = "md" }: { initials: string; color: string; status?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";
  return (
    <div className={`avatar ${sizeClass}`} style={{ backgroundColor: color }}>
      <span>{initials}</span>
      {status && <i className={`status-badge is-${status}`} />}
    </div>
  );
}

export default function TeamPage() {
  const { data, query, setQuery } = useDashboard();
  const [selectedDept, setSelectedDept] = useState("all");

  const departments = useMemo(() => {
    if (!data) return [];
    const depts = new Set<string>();
    data.employees.forEach((emp) => depts.add(emp.department));
    return ["all", ...Array.from(depts)];
  }, [data]);

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();
    return data.employees.filter((emp) => {
      const matchesDept = selectedDept === "all" || emp.department === selectedDept;
      const matchesQuery =
        !normalized ||
        [emp.name, emp.role, emp.department, emp.email].some((val) =>
          val.toLowerCase().includes(normalized)
        );
      return matchesDept && matchesQuery;
    });
  }, [data, selectedDept, query]);

  if (!data) return null;

  const totalMembers = data.employees.length;
  const activeMembers = data.employees.filter((emp) => emp.status === "online" || emp.status === "focus").length;
  const busyMembers = data.employees.filter((emp) => emp.workload > 70).length;

  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>Team Directory</h1>
          <p>Monitor real-time status, workload balance, and task allocations.</p>
        </div>
      </section>

      <section className="stat-grid" aria-label="Team Pulse Summary">
        <article className="stat-card">
          <div className="stat-icon blue">
            <Users size={18} />
          </div>
          <div className="stat-card-copy">
            <span>Total Members</span>
            <strong>{totalMembers}</strong>
            <small>Workspace users</small>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green">
            <span className="live-pill" style={{ margin: 0, padding: "2px 6px" }}><span style={{ marginRight: "4px" }} /> Active</span>
          </div>
          <div className="stat-card-copy">
            <span>Currently Active</span>
            <strong>{activeMembers}</strong>
            <small>Online or in focus</small>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon orange">
            <ShieldAlert size={18} />
          </div>
          <div className="stat-card-copy">
            <span>At Capacity</span>
            <strong>{busyMembers}</strong>
            <small>Workload &gt; 70%</small>
          </div>
        </article>
      </section>

      <article className="panel" style={{ marginTop: "24px" }}>
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="panel-kicker">Workspace Capacity</span>
            <h2>Team Capacity & Pulse</h2>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  background: selectedDept === dept ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedDept === dept ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px",
                  color: selectedDept === dept ? "#ffffff" : "#cbd5e1",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {dept === "all" ? "All Departments" : dept}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", marginTop: "20px" }}>
          {filteredMembers.length ? (
            filteredMembers.map((employee) => (
              <div
                key={employee.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Avatar initials={employee.initials} color={employee.avatarColor} status={employee.status} size="lg" />
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#ffffff" }}>{employee.name}</h3>
                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>{employee.role} · <strong style={{ color: "#818cf8" }}>{employee.department}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#cbd5e1" }}>
                  <span>Active: <strong>{employee.taskCount}</strong></span>
                  <span>Completed: <strong>{employee.completedCount}</strong></span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                    <span>Weekly Workload</span>
                    <strong style={{ color: employee.workload > 70 ? "#f87171" : employee.workload > 40 ? "#fbbf24" : "#34d399" }}>{employee.workload}%</strong>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${employee.workload}%`,
                        background: employee.workload > 70 ? "#ef4444" : employee.workload > 40 ? "#fbbf24" : "#10b981",
                        borderRadius: "3px"
                      }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: "13px", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", marginTop: "4px" }}>
                  Email: <span style={{ color: "#cbd5e1" }}>{employee.email}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>
              <strong style={{ display: "block", color: "#ffffff", fontSize: "16px", marginBottom: "4px" }}>No team members match your criteria</strong>
              <span style={{ color: "#64748b", fontSize: "14px" }}>Try adjusting your filters or search query.</span>
            </div>
          )}
        </div>
      </article>

      <footer className="dashboard-footer">
        <span>Disa Financial workspace · All systems operational</span>
        <div><button><CircleHelp size={14} /> Help center</button><button>Privacy</button></div>
      </footer>
    </>
  );
}
