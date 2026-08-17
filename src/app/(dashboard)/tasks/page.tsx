"use client";

import { useDashboard } from "../layout";
import { useState, useMemo } from "react";
import { Check, CheckCircle2, CircleHelp, Pause, Play, Plus, Search, ChevronDown, CalendarDays, ArrowUpDown } from "lucide-react";
import type { TaskStatus, TaskView, TaskPriority } from "@/lib/types";
import TaskSpreadsheet from "@/components/TaskSpreadsheet";

function Avatar({ initials, color, status, size = "md" }: { initials: string; color: string; status?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";
  return (
    <div className={`avatar ${sizeClass}`} style={{ backgroundColor: color }}>
      <span>{initials}</span>
      {status && <i className={`status-badge is-${status}`} />}
    </div>
  );
}

function dueCopy(value: string) {
  const due = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dateKey = due.toDateString();
  if (dateKey === today.toDateString()) return "Today";
  if (dateKey === tomorrow.toDateString()) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(due);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function TaskRow({
  task,
  timer,
  tick,
  onStatus,
  onTimer,
  disabled,
  currentUser,
}: {
  task: TaskView;
  timer: any;
  tick: number;
  onStatus: (taskId: number, status: string) => void;
  onTimer: (task: TaskView) => void;
  disabled?: boolean;
  currentUser?: any;
}) {
  const isTiming = timer?.taskId === task.id;
  const elapsedSeconds = isTiming ? Math.floor((tick - timer.startedAt) / 1000) : 0;
  const displaySeconds = task.trackedMinutes * 60 + elapsedSeconds;
  const isDueToday = dueCopy(task.dueAt) === "Today";

  const isEmployee = currentUser?.orgRole === "EMPLOYEE";
  const checkboxDisabled = disabled || isEmployee;

  const statusCopy: Record<string, string> = {
    todo: "To do",
    in_progress: "In progress",
    review: "In review",
    ...(isEmployee ? {} : { completed: "Completed" }),
  };

  return (
    <div className={`task-row ${task.status === "completed" ? "is-completed" : ""}`}>
      <style jsx>{`
        .task-row {
          border-left: 4px solid !important;
          border-left-color: ${task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#eab308" : "#22c55e"} !important;
        }
        .timer-button.is-disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
          background: rgba(255,255,255,0.03) !important;
          color: #94a3b8 !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        .task-check.is-disabled {
          cursor: not-allowed !important;
          opacity: 0.6;
          border-color: rgba(255,255,255,0.15) !important;
          background: transparent !important;
        }
      `}</style>

      <button
        className={`task-check status-check-${task.status} ${checkboxDisabled ? "is-disabled" : ""}`}
        aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}
        onClick={() => !checkboxDisabled && onStatus(task.id, task.status === "completed" ? "todo" : "completed")}
        disabled={checkboxDisabled}
      >
        {task.status === "completed" && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="task-main">
        <div className="task-title-line">
          <strong>{task.title}</strong>
          <span className={`priority-dot priority-${task.priority}`} title={`${task.priority} priority`} />
        </div>
        <div className="task-meta-mobile">
          <span>{task.project}</span>
          <span>•</span>
          <span>{dueCopy(task.dueAt)}</span>
        </div>
        <div className="progress-track" aria-label={`${task.progress}% complete`}>
          <span style={{ width: `${task.progress}%` }} />
        </div>
      </div>

      <div className="task-project">
        <span>{task.project}</span>
        <small>{task.progress}% complete</small>
      </div>

      <div className="task-owner" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Avatar
            initials={task.assignee.initials}
            color={task.assignee.avatarColor}
            size="sm"
            status={task.assignee.status}
          />
          <span>{task.assignee.name.split(" ")[0]}</span>
        </div>
        {task.assignee.reportsToName && (
          <small style={{ fontSize: "10px", color: "#64748b", marginLeft: "28px" }}>
            Manager: {task.assignee.reportsToName.split(" ")[0]}
          </small>
        )}
      </div>

      <div className={`task-date ${isDueToday ? "is-today" : ""}`}>
        <CalendarDays size={14} />
        <span>{dueCopy(task.dueAt)}</span>
      </div>

      <div className="task-status-wrap">
        <span className={`status-swatch swatch-${task.status}`} />
        <select
          value={task.status}
          onChange={(event) => onStatus(task.id, event.target.value)}
          aria-label={`Status for ${task.title}`}
          disabled={disabled}
          style={disabled ? { cursor: "not-allowed" } : undefined}
        >
          {Object.entries(statusCopy).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </div>

      <button
        className={`timer-button ${isTiming ? "is-running" : ""} ${disabled ? "is-disabled" : ""}`}
        onClick={() => !disabled && onTimer(task)}
        disabled={disabled}
        aria-label={isTiming ? `Stop timer for ${task.title}` : `Start timer for ${task.title}`}
      >
        {isTiming ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        <span>{isTiming ? formatTimer(displaySeconds) : formatMinutes(task.trackedMinutes)}</span>
      </button>
    </div>
  );
}

const TASK_FILTERS = [
  { id: "all", label: "All tasks" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "completed", label: "Completed" },
];

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

export default function TasksPage() {
  const { data, query, setQuery, updateTaskStatus, handleTimer, timer, tick, setNewTaskOpen, user, isAdmin, refreshData } = useDashboard();
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"due" | "priority" | "tracked" | "newest">("due");
  const [showAllTasks, setShowAllTasks] = useState(isAdmin);
  const [activeTab, setActiveTab] = useState<"list" | "spreadsheet">("list");

  const filteredTasks = useMemo(() => {
    if (!data || !user) return [];
    const normalized = query.trim().toLowerCase();
    const list = data.tasks.filter((task) => {
      const matchesScope = showAllTasks || task.assignee.id === user.id;
      const matchesFilter = filter === "all" || task.status === filter;
      const matchesQuery =
        !normalized ||
        [task.title, task.project, task.assignee.name, task.description].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      return matchesScope && matchesFilter && matchesQuery;
    });

    return list.sort((a, b) => {
      if (sortBy === "due") return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (sortBy === "priority") return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      if (sortBy === "tracked") return b.trackedMinutes - a.trackedMinutes;
      return b.id - a.id;
    });
  }, [data, filter, query, showAllTasks, sortBy, user]);

  if (!data || !user) return null;

  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>{isAdmin ? "Team Tasks" : "My Task Workspace"}</h1>
          <p>{isAdmin ? "Organize, track, and assign tasks across your workspace." : "Track status, complete assignments, and log your focus time."}</p>
        </div>
        {isAdmin && (
          <button className="primary-button new-task-button" onClick={() => setNewTaskOpen(true)}>
            <Plus size={18} /> New task <kbd>N</kbd>
          </button>
        )}
      </section>

      <article className="panel tasks-panel">
        <div className="panel-heading task-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="panel-kicker">Work queue</span>
            <h2>Tasks List <span>{filteredTasks.length}</span></h2>
          </div>
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px", borderRadius: "10px", gap: "4px" }}>
            <button
              onClick={() => setActiveTab("list")}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                background: activeTab === "list" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "list" ? "#ffffff" : "#64748b",
                transition: "all 0.2s ease"
              }}
            >
              Queue List
            </button>
            <button
              onClick={() => setActiveTab("spreadsheet")}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                background: activeTab === "spreadsheet" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "spreadsheet" ? "#ffffff" : "#64748b",
                transition: "all 0.2s ease"
              }}
            >
              Spreadsheet View
            </button>
          </div>
        </div>

        {activeTab === "spreadsheet" ? (
          <TaskSpreadsheet
            employees={data.employees}
            projects={data.projects}
            currentUser={user}
            onSaveSuccess={() => refreshData(true)}
          />
        ) : (
          <>
            <div className="task-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div className="task-filters">
                {TASK_FILTERS.map((item) => (
                  <button
                    key={item.id}
                    className={filter === item.id ? "active" : ""}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", color: "#94a3b8" }}>
                  <ArrowUpDown size={13} style={{ color: "#818cf8" }} />
                  <span style={{ color: "#94a3b8" }}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "12px",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="due" style={{ background: "#0f172a", color: "#ffffff" }}>Due Date</option>
                    <option value="priority" style={{ background: "#0f172a", color: "#ffffff" }}>Priority</option>
                    <option value="tracked" style={{ background: "#0f172a", color: "#ffffff" }}>Time Tracked</option>
                    <option value="newest" style={{ background: "#0f172a", color: "#ffffff" }}>Recently Added</option>
                  </select>
                </div>

                {!isAdmin && (
                  <div className="teammate-scope-toggle" style={{ display: "flex", gap: "4px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px", borderRadius: "8px" }}>
                    <style jsx>{`
                      .scope-btn {
                        padding: 6px 12px;
                        border: none;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                      }
                      .scope-btn.active {
                        background: rgba(99, 102, 241, 0.25);
                        color: #ffffff;
                        border: 1px solid rgba(99, 102, 241, 0.4);
                      }
                      .scope-btn.inactive {
                        background: transparent;
                        color: #94a3b8;
                      }
                    `}</style>
                    <button className={`scope-btn ${!showAllTasks ? "active" : "inactive"}`} onClick={() => setShowAllTasks(false)}>My Tasks</button>
                    <button className={`scope-btn ${showAllTasks ? "active" : "inactive"}`} onClick={() => setShowAllTasks(true)}>All Team Tasks</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="task-table-head">
              <span>Task</span><span>Project</span><span>Assignee</span><span>Due</span><span>Status</span><span>Tracked</span>
            </div>
            
            <div className="task-list">
              {filteredTasks.length ? (
                filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    timer={timer}
                    tick={tick}
                    onStatus={updateTaskStatus}
                    onTimer={handleTimer}
                    disabled={!isAdmin && task.assignee.id !== user.id}
                    currentUser={user}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <Search size={22} />
                  <strong>No matching tasks</strong>
                  <span>Try a different search or task filter.</span>
                  <button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button>
                </div>
              )}
            </div>
          </>
        )}
      </article>

      <footer className="dashboard-footer">
        <span>Disa Financial workspace · All systems operational</span>
        <div><button><CircleHelp size={14} /> Help center</button><button>Privacy</button></div>
      </footer>
    </>
  );
}
