"use client";

import { useState } from "react";
import { Plus, Save, Trash2, Sheet, RefreshCw } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
}

interface Project {
  name: string;
}

interface TaskSpreadsheetProps {
  employees: Employee[];
  projects: Project[];
  currentUser: any;
  onSaveSuccess: (updatedData: any) => void;
}

export default function TaskSpreadsheet({
  employees,
  projects,
  currentUser,
  onSaveSuccess,
}: TaskSpreadsheetProps) {
  const isEmployee = currentUser?.orgRole === "EMPLOYEE"; const createEmptyRow = () => ({
    title: "",
    project: projects[0]?.name || "Internal",
    assigneeId: isEmployee ? String(currentUser.id) : String(employees[0]?.id || ""),
    priority: "medium",
    status: "todo",
    dueAt: new Date().toISOString().slice(0, 10),
    estimatedMinutes: "60",
  });

  const [rows, setRows] = useState<any[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const updated = [...rows];
    updated[rowIndex][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const clearSheet = () => {
    setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    setError("");
    setSuccess("");
  };

  const handleBulkSave = async () => {
    setError("");
    setSuccess("");

    // Filter out rows that have no title
    const activeRows = rows.filter((r) => r.title.trim() !== "");

    if (activeRows.length === 0) {
      setError("Please fill in at least one task title before saving.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser ? String(currentUser.id) : "",
        },
        body: JSON.stringify({ tasksList: activeRows }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save tasks");
      }

      setSuccess(`Successfully saved ${activeRows.length} tasks to database!`);
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
      onSaveSuccess(data);
    } catch (err: any) {
      setError(err.message || "Failed to save spreadsheet tasks.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <style jsx>{`
        .sheet-container {
          background: rgba(20, 20, 43, 0.65) !important;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 24px;
          color: #ffffff;
        }
        .sheet-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sheet-grid-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(13, 13, 29, 0.4);
        }
        .sheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sheet-table th {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px;
          text-align: left;
          color: #94a3b8;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sheet-table td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0;
          background: transparent;
        }
        .sheet-input, .sheet-select {
          width: 100%;
          height: 38px;
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 0 10px;
          font-size: 13px;
          transition: all 0.15s ease;
          outline: none;
        }
        .sheet-input:focus, .sheet-select:focus {
          background: rgba(99, 102, 241, 0.08);
          box-shadow: inset 0 0 0 1.5px #6366f1;
        }
        .btn-row-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 38px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-row-action:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        .sheet-alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .sheet-alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
        }
      `}</style>

      <div className="sheet-container">
        <div className="sheet-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Sheet size={16} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Google Sheets Task Planner</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Bulk insert multiple tasks simultaneously. Empty rows are ignored.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={clearSheet} className="secondary-button" style={{ padding: "8px 14px", fontSize: "12px" }}>
              Reset Sheet
            </button>
            <button onClick={addRow} className="secondary-button" style={{ padding: "8px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={14} /> Add Row
            </button>
            <button onClick={handleBulkSave} disabled={loading} className="primary-button" style={{ padding: "8px 16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              {loading ? <RefreshCw size={14} className="spin-animation" /> : <Save size={14} />}
              Save All to Database
            </button>
          </div>
        </div>

        {error && <div className="sheet-alert-error">{error}</div>}
        {success && <div className="sheet-alert-success">{success}</div>}

        <div className="sheet-grid-wrapper">
          <table className="sheet-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Task Title *</th>
                <th style={{ width: "15%" }}>Project *</th>
                <th style={{ width: "15%" }}>Assignee *</th>
                <th style={{ width: "10%" }}>Priority</th>
                <th style={{ width: "10%" }}>Due Date</th>
                <th style={{ width: "8%" }}>Est (Min)</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "5%", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      className="sheet-input"
                      placeholder="e.g. Prepare compliance audit sheets"
                      value={row.title}
                      onChange={(e) => handleCellChange(index, "title", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="sheet-select"
                      value={row.project}
                      onChange={(e) => handleCellChange(index, "project", e.target.value)}
                    >
                      {projects.map((proj) => (
                        <option key={proj.name} value={proj.name} style={{ background: "#0b0f19" }}>
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="sheet-select"
                      value={row.assigneeId}
                      disabled={isEmployee} // Employees can only assign tasks to themselves
                      onChange={(e) => handleCellChange(index, "assigneeId", e.target.value)}
                    >
                      {isEmployee ? (
                        <option value={currentUser.id} style={{ background: "#0b0f19" }}>
                          {currentUser.name}
                        </option>
                      ) : (
                        employees.map((emp) => (
                          <option key={emp.id} value={emp.id} style={{ background: "#0b0f19" }}>
                            {emp.name}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                  <td>
                    <select
                      className="sheet-select"
                      value={row.priority}
                      onChange={(e) => handleCellChange(index, "priority", e.target.value)}
                    >
                      <option value="low" style={{ background: "#0b0f19" }}>Low</option>
                      <option value="medium" style={{ background: "#0b0f19" }}>Medium</option>
                      <option value="high" style={{ background: "#0b0f19" }}>High</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      className="sheet-input"
                      value={row.dueAt}
                      onChange={(e) => handleCellChange(index, "dueAt", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="sheet-input"
                      min="15"
                      step="15"
                      value={row.estimatedMinutes}
                      onChange={(e) => handleCellChange(index, "estimatedMinutes", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="sheet-select"
                      value={row.status}
                      onChange={(e) => handleCellChange(index, "status", e.target.value)}
                    >
                      <option value="todo" style={{ background: "#0b0f19" }}>To do</option>
                      <option value="in_progress" style={{ background: "#0b0f19" }}>In progress</option>
                      <option value="review" style={{ background: "#0b0f19" }}>In review</option>
                      {!isEmployee && <option value="completed" style={{ background: "#0b0f19" }}>Completed</option>}
                    </select>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => removeRow(index)} className="btn-row-action" title="Delete Row">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
