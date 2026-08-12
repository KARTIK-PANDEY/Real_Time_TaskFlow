"use client";

import { useState, useMemo } from "react";
import { UserPlus, GitCommit, ChevronDown, ChevronRight, RefreshCw, CircleCheck } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  email: string;
  loginId?: string | null;
  role: string;
  department: string;
  avatarColor: string;
  status: string;
  reportsToId?: number | null;
  orgRole?: string;
  initials: string;
}

interface OrgHierarchyProps {
  employees: Employee[];
  currentUser: any;
  onRefresh: () => void;
}

export default function OrgHierarchy({ employees, currentUser, onRefresh }: OrgHierarchyProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());
  const [reassignTarget, setReassignTarget] = useState<string>("");
  const [reassignSupervisor, setReassignSupervisor] = useState<string>("");
  
  // Signup form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newLoginId, setNewLoginId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newSupervisor, setNewSupervisor] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleNode = (id: number) => {
    const updated = new Set(collapsedNodes);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCollapsedNodes(updated);
  };

  // Build hierarchy tree
  const treeData = useMemo(() => {
    const mdNode = employees.find(emp => emp.reportsToId === null);
    if (!mdNode) return null;

    const buildNode = (emp: Employee): any => {
      const children = employees
        .filter(child => child.reportsToId === emp.id)
        .map(buildNode);
      return { ...emp, children };
    };

    return buildNode(mdNode);
  }, [employees]);

  // Find all descendants of a node to prevent circular loops
  const forbiddenSupervisors = useMemo(() => {
    if (!reassignTarget) return new Set<number>();
    const empId = Number(reassignTarget);
    const descendants = new Set<number>([empId]);
    const queue = [empId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      employees.forEach(emp => {
        if (emp.reportsToId === current && !descendants.has(emp.id)) {
          descendants.add(emp.id);
          queue.push(emp.id);
        }
      });
    }
    return descendants;
  }, [reassignTarget, employees]);

  // Handle reassign manager
  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget || !reassignSupervisor) return;

    setLoading(true);
    try {
      const res = await fetch("/api/team/hierarchy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser ? String(currentUser.id) : "",
        },
        body: JSON.stringify({
          employeeId: Number(reassignTarget),
          reportsToId: reassignSupervisor === "null" ? null : Number(reassignSupervisor),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update hierarchy");

      showToast("Hierarchy updated successfully!");
      setReassignTarget("");
      setReassignSupervisor("");
      onRefresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newRole || !newDept || !newPassword || !newSupervisor) {
      showToast("Please fill in all employee registration fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          loginId: newLoginId || undefined,
          role: newRole,
          department: newDept,
          password: newPassword,
          reportsToId: Number(newSupervisor),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register employee");

      showToast(`Employee ${newName} registered successfully!`);
      setNewName("");
      setNewEmail("");
      setNewLoginId("");
      setNewPassword("");
      setNewRole("");
      setNewDept("");
      setNewSupervisor("");
      onRefresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);

    return (
      <div key={node.id} style={{ marginLeft: `${level * 24}px`, borderLeft: level > 0 ? "1px dashed rgba(255,255,255,0.08)" : "none", paddingLeft: level > 0 ? "16px" : 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid rgba(255, 255, 255, 0.03)",
            marginBottom: "8px",
            transition: "all 0.2s ease"
          }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
          ) : (
            <span style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GitCommit size={12} style={{ color: "rgba(255,255,255,0.15)" }} />
            </span>
          )}

          <div
            className="avatar avatar-sm"
            style={{ backgroundColor: node.avatarColor, width: "32px", height: "32px", fontSize: "12px" }}
          >
            <span>{node.initials}</span>
          </div>

          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff", marginRight: "8px" }}>
              {node.name}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {node.role} · <strong style={{ color: "#818cf8" }}>{node.department}</strong>
            </span>
          </div>

          <span
            style={{
              padding: "2px 8px",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "4px",
              background: node.orgRole === "MD" ? "rgba(239, 68, 68, 0.15)" : node.orgRole === "MANAGER" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.05)",
              color: node.orgRole === "MD" ? "#ef4444" : node.orgRole === "MANAGER" ? "#6366f1" : "#94a3b8"
            }}
          >
            {node.orgRole}
          </span>
        </div>

        {hasChildren && !isCollapsed && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", marginTop: "24px" }}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <CircleCheck size={16} />
          {toast.message}
        </div>
      )}

      {/* Org Tree View */}
      <article className="panel">
        <div className="panel-heading">
          <span className="panel-kicker">Visual Tree</span>
          <h2>Reporting Hierarchy Tree</h2>
        </div>
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {treeData ? renderTreeNode(treeData) : <div style={{ color: "#64748b" }}>Loading hierarchy tree...</div>}
        </div>
      </article>

      {/* Control Forms Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Reassign supervisor Form */}
        <article className="panel">
          <div className="panel-heading">
            <span className="panel-kicker">Reassignments</span>
            <h2>Change Supervisor</h2>
          </div>
          <form onSubmit={handleReassign} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Select Subordinate</label>
              <select
                value={reassignTarget}
                onChange={(e) => {
                  setReassignTarget(e.target.value);
                  setReassignSupervisor("");
                }}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              >
                <option value="" style={{ background: "#0b0f19" }}>-- Choose Employee --</option>
                {employees
                  .filter(emp => emp.orgRole !== "MD") // MD cannot report to anyone
                  .map(emp => (
                    <option key={emp.id} value={emp.id} style={{ background: "#0b0f19" }}>{emp.name} ({emp.role})</option>
                  ))
                }
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Select New Supervisor</label>
              <select
                value={reassignSupervisor}
                onChange={(e) => setReassignSupervisor(e.target.value)}
                required
                disabled={!reassignTarget}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              >
                <option value="" style={{ background: "#0b0f19" }}>-- Choose Supervisor --</option>
                {employees
                  .filter(emp => !forbiddenSupervisors.has(emp.id)) // Filter descendants to prevent loop
                  .map(emp => (
                    <option key={emp.id} value={emp.id} style={{ background: "#0b0f19" }}>{emp.name} ({emp.role})</option>
                  ))
                }
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !reassignTarget || !reassignSupervisor}
              className="action-btn"
              style={{
                width: "100%",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                marginTop: "4px"
              }}
            >
              <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
              Save Reporting Chain
            </button>
          </form>
        </article>

        {/* Add Employee Form */}
        <article className="panel">
          <div className="panel-heading">
            <span className="panel-kicker">Onboarding</span>
            <h2>Add New Employee</h2>
          </div>
          <form onSubmit={handleAddEmployee} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Email Address</label>
              <input
                type="email"
                placeholder="rahul@disafinancial.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>User ID (Login ID)</label>
              <input
                type="text"
                placeholder="rahul"
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Password</label>
              <input
                type="password"
                placeholder="Min 6 chars"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Job Role / Designation</label>
              <input
                type="text"
                placeholder="e.g. Back Office Assistant"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Department</label>
              <input
                type="text"
                placeholder="e.g. OPERATION"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Reports To (Supervisor)</label>
              <select
                value={newSupervisor}
                onChange={(e) => setNewSupervisor(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              >
                <option value="" style={{ background: "#0b0f19" }}>-- Choose supervisor --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} style={{ background: "#0b0f19" }}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="action-btn"
              style={{
                width: "100%",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                marginTop: "4px"
              }}
            >
              <UserPlus size={14} />
              Register Teammate
            </button>
          </form>
        </article>

      </div>
    </div>
  );
}
