"use client";

import type { DashboardData, TaskPriority, TaskStatus, TaskView } from "@/lib/types";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Gauge,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  TimerReset,
  Users,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TaskFilter = "all" | TaskStatus;
type TimerState = { taskId: number; startedAt: number; baseMinutes: number } | null;

const statusCopy: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  completed: "Completed",
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "team", label: "Team", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const taskFilters: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "completed", label: "Completed" },
];

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

function timeAgo(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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

function Avatar({
  initials,
  color,
  size = "md",
  status,
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  status?: string;
}) {
  return (
    <span className={`avatar avatar-${size}`} style={{ backgroundColor: color }} aria-hidden="true">
      {initials}
      {status && <span className={`avatar-status status-${status}`} />}
    </span>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="stat-card-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <button className="icon-button stat-more" aria-label={`More ${label} details`}>
        <MoreHorizontal size={17} />
      </button>
    </article>
  );
}

function TaskRow({
  task,
  timer,
  tick,
  onStatus,
  onTimer,
}: {
  task: TaskView;
  timer: TimerState;
  tick: number;
  onStatus: (task: TaskView, status: TaskStatus) => void;
  onTimer: (task: TaskView) => void;
}) {
  const isTiming = timer?.taskId === task.id;
  const elapsedSeconds = isTiming ? Math.floor((tick - timer.startedAt) / 1000) : 0;
  const displaySeconds = task.trackedMinutes * 60 + elapsedSeconds;
  const isDueToday = dueCopy(task.dueAt) === "Today";

  return (
    <div className={`task-row ${task.status === "completed" ? "is-completed" : ""}`}>
      <button
        className={`task-check status-check-${task.status}`}
        aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}
        onClick={() => onStatus(task, task.status === "completed" ? "todo" : "completed")}
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

      <div className="task-owner">
        <Avatar
          initials={task.assignee.initials}
          color={task.assignee.avatarColor}
          size="sm"
          status={task.assignee.status}
        />
        <span>{task.assignee.name.split(" ")[0]}</span>
      </div>

      <div className={`task-date ${isDueToday ? "is-today" : ""}`}>
        <CalendarDays size={14} />
        <span>{dueCopy(task.dueAt)}</span>
      </div>

      <div className="task-status-wrap">
        <span className={`status-swatch swatch-${task.status}`} />
        <select
          value={task.status}
          onChange={(event) => onStatus(task, event.target.value as TaskStatus)}
          aria-label={`Status for ${task.title}`}
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
        className={`timer-button ${isTiming ? "is-running" : ""}`}
        onClick={() => onTimer(task)}
        aria-label={isTiming ? `Stop timer for ${task.title}` : `Start timer for ${task.title}`}
      >
        {isTiming ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        <span>{isTiming ? formatTimer(displaySeconds) : formatMinutes(task.trackedMinutes)}</span>
      </button>
    </div>
  );
}

function NewTaskModal({
  data,
  saving,
  onClose,
  onSubmit,
}: {
  data: DashboardData;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">New assignment</span>
            <h2 id="new-task-heading">Create a task</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close new task dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="task-form">
          <label className="field full-field">
            <span>Task name</span>
            <input name="title" placeholder="What needs to be done?" autoFocus required maxLength={220} />
          </label>
          <label className="field full-field">
            <span>Description</span>
            <textarea name="description" placeholder="Add context, goals, or a quick note…" rows={3} />
          </label>
          <label className="field">
            <span>Project</span>
            <input name="project" list="project-list" placeholder="Choose a project" required />
            <datalist id="project-list">
              {data.projects.map((project) => (
                <option key={project.name} value={project.name} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Assignee</span>
            <select name="assigneeId" defaultValue="" required>
              <option value="" disabled>
                Select teammate
              </option>
              {data.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} — {employee.role}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input name="dueAt" type="date" defaultValue={defaultDate} required />
          </label>
          <label className="field">
            <span>Priority</span>
            <select name="priority" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <div className="modal-actions full-field">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? <RefreshCw className="spin" size={16} /> : <Plus size={17} />}
              {saving ? "Creating…" : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function TaskDashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [activeNav, setActiveNav] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timer, setTimer] = useState<TimerState>(null);
  const [tick, setTick] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const refreshData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Refresh failed");
      setData((await response.json()) as DashboardData);
    } catch {
      setToast("Could not refresh the live dashboard");
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => refreshData(false), 8000);
    return () => window.clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    if (!timer) return;
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement;
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) setNewTaskOpen(true);
      }
      if (event.key === "Escape") {
        setNewTaskOpen(false);
        setNotificationsOpen(false);
        setMobileNav(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.tasks.filter((task) => {
      const matchesFilter = filter === "all" || task.status === filter;
      const matchesQuery =
        !normalized ||
        [task.title, task.project, task.assignee.name, task.description].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      return matchesFilter && matchesQuery;
    });
  }, [data.tasks, filter, query]);

  const handleNav = (id: string) => {
    setActiveNav(id);
    setMobileNav(false);
    if (id === "tasks") document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth" });
    if (id === "team") document.getElementById("team")?.scrollIntoView({ behavior: "smooth" });
    if (id === "reports") document.getElementById("reports")?.scrollIntoView({ behavior: "smooth" });
    if (id === "overview") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateTaskStatus = async (task: TaskView, status: TaskStatus) => {
    const previous = data;
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? { ...item, status, progress: status === "completed" ? 100 : status === "todo" ? 0 : item.progress }
          : item,
      ),
    }));
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Update failed");
      setData((await response.json()) as DashboardData);
      setToast(status === "completed" ? "Task marked complete" : `Moved to ${statusCopy[status]}`);
    } catch {
      setData(previous);
      setToast("Task update failed — your changes were restored");
    }
  };

  const handleTimer = async (task: TaskView) => {
    if (timer?.taskId === task.id) {
      const elapsedMinutes = Math.max(1, Math.ceil((Date.now() - timer.startedAt) / 60000));
      const trackedMinutes = timer.baseMinutes + elapsedMinutes;
      setTimer(null);
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackedMinutes }),
        });
        if (!response.ok) throw new Error("Timer update failed");
        setData((await response.json()) as DashboardData);
        setToast(`${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} logged`);
      } catch {
        setToast("The timer stopped, but time could not be saved");
      }
      return;
    }

    setTimer({ taskId: task.id, startedAt: Date.now(), baseMinutes: task.trackedMinutes });
    setTick(Date.now());
    if (task.status === "todo") void updateTaskStatus(task, "in_progress");
    setToast(`Timer started for “${task.title}”`);
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      project: form.get("project"),
      assigneeId: Number(form.get("assigneeId")),
      dueAt: form.get("dueAt"),
      priority: form.get("priority") as TaskPriority,
    };

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Create failed");
      setData((await response.json()) as DashboardData);
      setNewTaskOpen(false);
      setFilter("all");
      setToast("Task created and assigned");
    } catch {
      setToast("Could not create the task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onlineCount = data.employees.filter((employee) => employee.status !== "offline").length;
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const trackedToday = Math.round(data.stats.trackedMinutes * 0.12);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="#top" onClick={() => handleNav("overview")}>
            <span className="brand-mark">
              <Zap size={18} fill="currentColor" />
            </span>
            <span>Disa Tracker</span>
          </a>
          <button className="sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">DF</span>
          <span>
            <small>Workspace</small>
            <strong>Disa Financial Services</strong>
          </span>
          <ChevronDown size={14} />
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeNav === item.id ? "active" : ""}
                onClick={() => handleNav(item.id)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === "tasks" && <em>{data.stats.activeTasks}</em>}
              </button>
            );
          })}

          <span className="nav-label second-label">Manage</span>
          <button onClick={() => setNotificationsOpen(true)}>
            <Inbox size={18} strokeWidth={1.8} />
            <span>Inbox</span>
            <i className="unread-dot" />
          </button>
          <button onClick={() => setToast("Project planning is up to date")}>
            <BriefcaseBusiness size={18} strokeWidth={1.8} />
            <span>Projects</span>
          </button>
          <button onClick={() => setToast("Settings are ready for your workspace")}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-promo">
          <span><Sparkles size={14} /> Focus tip</span>
          <strong>Protect your team’s deep work.</strong>
          <p>Workload is balanced across 4 of 6 teammates.</p>
          <button onClick={() => handleNav("team")}>View capacity <ArrowUpRight size={13} /></button>
        </div>

        <div className="sidebar-user">
          <Avatar initials="SM" color="#e77862" status="online" />
          <span>
            <strong>Shrishti Manekar</strong>
            <small>Workspace Admin</small>
          </span>
          <MoreHorizontal size={17} />
        </div>
      </aside>

      {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu" />}

      <main className="main-content" id="top">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={21} />
          </button>
          <div className="global-search">
            <Search size={18} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, projects, or people…"
              aria-label="Search tasks, projects, or people"
            />
            <kbd><Command size={11} /> K</kbd>
          </div>
          <div className="topbar-actions">
            <button className="live-pill" onClick={() => refreshData(true)}>
              <span /> Live
            </button>
            <button
              className={`icon-button ${refreshing ? "spin" : ""}`}
              onClick={() => refreshData(true)}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={17} />
            </button>
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Open notifications"
              >
                <Bell size={18} />
                <span />
              </button>
              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-heading">
                    <div>
                      <strong>Notifications</strong>
                      <small>3 unread updates</small>
                    </div>
                    <button className="icon-button" onClick={() => setNotificationsOpen(false)}><X size={16} /></button>
                  </div>
                  {data.activities.slice(0, 3).map((item) => (
                    <div className="notification-item" key={item.id}>
                      {item.employee ? (
                        <Avatar initials={item.employee.initials} color={item.employee.avatarColor} size="sm" />
                      ) : (
                        <span className="activity-system"><Activity size={14} /></span>
                      )}
                      <p><strong>{item.employee?.name ?? "Disa Tracker"}</strong> {item.detail}<small>{timeAgo(item.createdAt)}</small></p>
                    </div>
                  ))}
                  <button className="notification-footer" onClick={() => { setNotificationsOpen(false); document.getElementById("activity")?.scrollIntoView({ behavior: "smooth" }); }}>
                    View all activity
                  </button>
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            <Avatar initials="SM" color="#e77862" size="sm" />
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <span className="date-line"><CalendarDays size={14} /> {today}</span>
              <h1>Good morning, Shrishti <span>👋</span></h1>
              <p>Here’s how your team is moving work forward today.</p>
            </div>
            <button className="primary-button new-task-button" onClick={() => setNewTaskOpen(true)}>
              <Plus size={18} /> New task <kbd>N</kbd>
            </button>
          </section>

          <section className="stat-grid" aria-label="Team summary">
            <StatCard
              label="Active tasks"
              value={String(data.stats.activeTasks)}
              note={`${data.stats.dueToday} due today`}
              icon={ListChecks}
              tone="purple"
            />
            <StatCard
              label="Completed"
              value={String(data.stats.completedTasks)}
              note="4 this week"
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard
              label="Time tracked"
              value={formatMinutes(data.stats.trackedMinutes)}
              note={`${formatMinutes(trackedToday)} today`}
              icon={Clock3}
              tone="orange"
            />
            <StatCard
              label="Team productivity"
              value={`${data.stats.productivity}%`}
              note="↑ 8% from last week"
              icon={Gauge}
              tone="blue"
            />
          </section>

          <section className="insights-grid">
            <article className="panel focus-panel" id="reports">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Performance</span>
                  <h2>Weekly focus</h2>
                </div>
                <button className="period-button">This week <ChevronDown size={14} /></button>
              </div>
              <div className="focus-summary">
                <div>
                  <strong>{formatMinutes(data.weeklyFocus.reduce((sum, day) => sum + day.minutes, 0))}</strong>
                  <span>focused time</span>
                </div>
                <span className="trend-badge">↗ 12.4%</span>
              </div>
              <div className="focus-chart">
                <div className="chart-target" style={{ bottom: `${(360 / 420) * 100}%` }}><span>6h target</span></div>
                {data.weeklyFocus.map((day, index) => (
                  <div className="chart-column" key={`${day.day}-${index}`}>
                    <div className={`chart-bar ${index === data.weeklyFocus.length - 2 ? "highlight" : ""}`} style={{ height: `${Math.max(8, (day.minutes / 420) * 100)}%` }}>
                      <span>{formatMinutes(day.minutes)}</span>
                    </div>
                    <small>{day.day}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel team-panel" id="team">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Live presence</span>
                  <h2>Team pulse</h2>
                </div>
                <span className="online-count"><i /> {onlineCount} active</span>
              </div>
              <div className="team-list">
                {data.employees.slice(0, 5).map((employee) => (
                  <div className="team-member" key={employee.id}>
                    <Avatar initials={employee.initials} color={employee.avatarColor} status={employee.status} />
                    <div className="member-copy">
                      <strong>{employee.name}</strong>
                      <small>{employee.status === "focus" ? "In focus mode" : employee.role}</small>
                    </div>
                    <div className="workload-meter">
                      <span><i style={{ width: `${employee.workload}%` }} /></span>
                      <small>{employee.taskCount} task{employee.taskCount === 1 ? "" : "s"}</small>
                    </div>
                  </div>
                ))}
              </div>
              <button className="panel-link" onClick={() => setToast("Team directory is synced")}>View all team members <ArrowUpRight size={14} /></button>
            </article>
          </section>

          <section className="work-grid">
            <article className="panel tasks-panel" id="tasks">
              <div className="panel-heading task-heading">
                <div>
                  <span className="panel-kicker">Work queue</span>
                  <h2>Team tasks <span>{filteredTasks.length}</span></h2>
                </div>
                <button className="secondary-button compact" onClick={() => setNewTaskOpen(true)}><Plus size={15} /> Add task</button>
              </div>
              <div className="task-toolbar">
                <div className="task-filters">
                  {taskFilters.map((item) => (
                    <button
                      key={item.id}
                      className={filter === item.id ? "active" : ""}
                      onClick={() => setFilter(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="sync-copy"><span /> Synced {timeAgo(data.generatedAt)}</span>
              </div>
              <div className="task-table-head">
                <span>Task</span><span>Project</span><span>Assignee</span><span>Due</span><span>Status</span><span>Tracked</span>
              </div>
              <div className="task-list">
                {filteredTasks.length ? (
                  filteredTasks.slice(0, 8).map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      timer={timer}
                      tick={tick}
                      onStatus={updateTaskStatus}
                      onTimer={handleTimer}
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
              {filteredTasks.length > 8 && <button className="show-more" onClick={() => setToast(`${filteredTasks.length} tasks loaded`)}>Show all {filteredTasks.length} tasks</button>}
            </article>

            <aside className="panel activity-panel" id="activity">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Real-time</span>
                  <h2>Activity</h2>
                </div>
                <span className="pulse-dot" title="Live updates" />
              </div>
              <div className="activity-list">
                {data.activities.slice(0, 7).map((item, index) => (
                  <div className="activity-item" key={item.id}>
                    <div className="activity-avatar-wrap">
                      {item.employee ? (
                        <Avatar initials={item.employee.initials} color={item.employee.avatarColor} size="sm" />
                      ) : (
                        <span className="activity-system"><Activity size={14} /></span>
                      )}
                      {index < Math.min(data.activities.length, 7) - 1 && <i />}
                    </div>
                    <p>
                      <strong>{item.employee?.name ?? "Disa Tracker"}</strong> {item.detail}
                      <small>{timeAgo(item.createdAt)}</small>
                    </p>
                  </div>
                ))}
              </div>
              <div className="activity-note">
                <MessageSquareText size={16} />
                <p><strong>Everything in one place.</strong><span>Updates appear here as your team works.</span></p>
              </div>
            </aside>
          </section>

          <section className="projects-section">
            <div className="section-title-row">
              <div><span className="panel-kicker">Portfolio</span><h2>Project health</h2></div>
              <button onClick={() => setToast("Portfolio report is current")}>View portfolio <ArrowUpRight size={14} /></button>
            </div>
            <div className="project-grid">
              {data.projects.map((project) => {
                const percent = Math.round((project.completed / Math.max(project.total, 1)) * 100);
                return (
                  <article className="project-card" key={project.name}>
                    <div className="project-top"><span style={{ backgroundColor: project.color }}><Target size={17} /></span><MoreHorizontal size={17} /></div>
                    <strong>{project.name}</strong>
                    <small>{project.completed} of {project.total} tasks completed</small>
                    <div className="project-progress"><span style={{ width: `${percent}%`, backgroundColor: project.color }} /></div>
                    <div className="project-footer"><div className="mini-avatars">{data.employees.slice(0, Math.min(3, project.total)).map((employee) => <Avatar key={employee.id} initials={employee.initials} color={employee.avatarColor} size="sm" />)}</div><b>{percent}%</b></div>
                  </article>
                );
              })}
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>Disa Financial workspace · All systems operational</span>
            <div><button><CircleHelp size={14} /> Help center</button><button>Privacy</button></div>
          </footer>
        </div>
      </main>

      {newTaskOpen && <NewTaskModal data={data} saving={saving} onClose={() => setNewTaskOpen(false)} onSubmit={createTask} />}
      {timer && (
        <div className="floating-timer">
          <span className="timer-wave"><i /><i /><i /></span>
          <div><small>Tracking now</small><strong>{data.tasks.find((task) => task.id === timer.taskId)?.title}</strong></div>
          <b>{formatTimer(Math.floor((tick - timer.startedAt) / 1000))}</b>
          <button onClick={() => { const task = data.tasks.find((item) => item.id === timer.taskId); if (task) void handleTimer(task); }}><Pause size={14} fill="currentColor" /> Stop</button>
        </div>
      )}
      {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  );
}
