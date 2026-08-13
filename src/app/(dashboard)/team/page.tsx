"use client";

import { useDashboard } from "../layout";
import { useState, useMemo } from "react";
import { CircleHelp, Search, Users, ShieldAlert, GitBranch, TableProperties } from "lucide-react";
import OrgHierarchy from "@/components/OrgHierarchy";

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
  const { data, query, setQuery, isAdmin, user, refreshData } = useDashboard();
  const [selectedDept, setSelectedDept] = useState("all");
  const [activeView, setActiveView] = useState<"directory" | "hierarchy">("directory");

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

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#cbd5e1" }}>
        <ShieldAlert size={48} style={{ color: "#ef4444", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#ffffff", marginBottom: "8px" }}>Access Restricted</h2>
        <p style={{ color: "#64748b", textAlign: "center", maxWidth: "340px", fontSize: "14px" }}>
          The Team Directory page is restricted to workspace administrators and managers.
        </p>
      </div>
    );
  }

  const totalMembers = data.employees.length;
  const activeMembers = data.employees.filter((emp) => emp.status === "online" || emp.status === "focus").length;
  const busyMembers = data.employees.filter((emp) => emp.workload > 70).length;

  return (
    <>
      <section className="welcome-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Team Directory</h1>
          <p>Monitor real-time status, workload balance, and org reporting hierarchies.</p>
        </div>
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px", borderRadius: "10px", gap: "4px" }}>
          <button
            onClick={() => setActiveView("directory")}
            style={{
              padding: "6px 16px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeView === "directory" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeView === "directory" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease"
            }}
          >
            <TableProperties size={14} /> Pulse List
          </button>
          <button
            onClick={() => setActiveView("hierarchy")}
            style={{
              padding: "6px 16px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeView === "hierarchy" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeView === "hierarchy" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease"
            }}
          >
            <GitBranch size={14} /> Org Chart
          </button>
        </div>
      </section>

      {activeView === "hierarchy" ? (
        <OrgHierarchy employees={data.employees} currentUser={user} onRefresh={() => refreshData(true)} />
      ) : (
        <>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "20px" }}>
              <style jsx>{`
                .team-card {
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%) !important;
                  border: 1px solid rgba(255, 255, 255, 0.06) !important;
                  backdrop-filter: blur(16px) !important;
                  border-radius: 20px !important;
                  padding: 26px !important;
                  display: flex;
                  flex-direction: column;
                  gap: 20px !important;
                  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
                }
                .team-card:hover {
                  transform: translateY(-5px) !important;
                  border-color: rgba(129, 140, 248, 0.45) !important;
                  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12), 0 0 1px 1px rgba(99, 102, 241, 0.15) inset !important;
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
                }
                .dept-badge {
                  padding: 3px 9px;
                  font-size: 11px;
                  font-weight: 700;
                  border-radius: 6px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
              `}</style>
              {filteredMembers.length ? (
                filteredMembers.map((employee) => (
                  <div key={employee.id} className="team-card">
                    <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Avatar initials={employee.initials} color={employee.avatarColor} status={employee.status} size="lg" />
                        <div>
                          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#ffffff", lineHeight: "1.3" }}>{employee.name}</h3>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{employee.role}</span>
                        </div>
                      </div>
                      <span className="dept-badge" style={{
                        background: employee.department === "TECHNOLOGY" ? "rgba(59, 130, 246, 0.12)" : employee.department === "OPERATION" ? "rgba(16, 185, 129, 0.12)" : employee.department === "WEALTH" ? "rgba(139, 92, 246, 0.12)" : "rgba(245, 158, 11, 0.12)",
                        color: employee.department === "TECHNOLOGY" ? "#60a5fa" : employee.department === "OPERATION" ? "#34d399" : employee.department === "WEALTH" ? "#a78bfa" : "#fbbf24"
                      }}>
                        {employee.department}
                      </span>
                    </div>

                    {employee.reportsToName && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", background: "rgba(129, 140, 248, 0.05)", padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(129, 140, 248, 0.1)" }}>
                        <span>Reports to:</span> <strong style={{ color: "#ffffff", fontWeight: "600" }}>{employee.reportsToName}</strong>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#cbd5e1", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                      <span>Active Tasks: <strong style={{ color: "#818cf8", fontWeight: "600" }}>{employee.taskCount}</strong></span>
                      <span>Completed: <strong style={{ color: "#34d399", fontWeight: "600" }}>{employee.completedCount}</strong></span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#94a3b8" }}>
                        <span>Weekly Workload</span>
                        <strong style={{ fontWeight: "600", color: employee.workload > 70 ? "#ef4444" : employee.workload > 40 ? "#fbbf24" : "#34d399" }}>{employee.workload}%</strong>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${employee.workload}%`,
                            background: employee.workload > 70 ? "linear-gradient(90deg, #ef4444, #f87171)" : employee.workload > 40 ? "linear-gradient(90deg, #d97706, #fbbf24)" : "linear-gradient(90deg, #059669, #34d399)",
                            borderRadius: "3px"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", marginTop: "4px" }}>
                      <span>Email:</span> <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{employee.email}</span>
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
        </>
      )}

      <footer className="dashboard-footer">
        <span>Disa Financial workspace · All systems operational</span>
        <div><button><CircleHelp size={14} /> Help center</button><button>Privacy</button></div>
      </footer>
    </>
  );
}
