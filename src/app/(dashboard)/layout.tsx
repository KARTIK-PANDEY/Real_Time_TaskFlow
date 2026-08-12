"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
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
  MoreHorizontal,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { DashboardData, TaskStatus, TaskView } from "@/lib/types";

// Dynamic Dashboard Context
interface DashboardContextProps {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  refreshData: (force?: boolean) => Promise<void>;
  createTask: (task: any) => Promise<void>;
  updateTaskStatus: (taskId: number, status: string) => Promise<void>;
  timer: { taskId: number; startedAt: number; baseMinutes: number } | null;
  setTimer: any;
  tick: number;
  handleTimer: (task: TaskView) => Promise<void>;
  toast: string;
  setToast: (msg: string) => void;
  query: string;
  setQuery: (q: string) => void;
  user: any;
  isAdmin: boolean;
  notifications: any[];
  unreadCount: number;
  markNotificationsAsRead: () => Promise<void>;
  logOut: () => void;
  setNewTaskOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

function Avatar({ initials, color, status, size = "md" }: { initials: string; color: string; status?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";
  return (
    <div className={`avatar ${sizeClass}`} style={{ backgroundColor: color }}>
      <span>{initials}</span>
      {status && <i className={`status-badge is-${status}`} />}
    </div>
  );
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

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // User-specific notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Timer states
  const [timer, setTimer] = useState<{ taskId: number; startedAt: number; baseMinutes: number } | null>(null);
  const [tick, setTick] = useState(() => Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user ? !!user.isAdmin : false;

  // Dynamically recalculate task tracked minutes based on active timer elapsed time
  const adjustedData = useMemo(() => {
    if (!data) return null;
    if (!timer) return data;

    const elapsedMinutes = Math.floor((tick - timer.startedAt) / 60000);
    if (elapsedMinutes <= 0) return data;

    const updatedTasks = data.tasks.map((task) => {
      if (task.id === timer.taskId) {
        return {
          ...task,
          trackedMinutes: task.trackedMinutes + elapsedMinutes,
        };
      }
      return task;
    });

    const totalTracked = updatedTasks.reduce((sum, t) => sum + t.trackedMinutes, 0);

    return {
      ...data,
      tasks: updatedTasks,
      stats: {
        ...data.stats,
        trackedMinutes: totalTracked,
      },
    };
  }, [data, timer, tick]);

  // Check auth
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
      setAuthChecked(true);
    }
  }, [router]);

  // Load initial timer from localStorage if present
  useEffect(() => {
    const savedTimer = localStorage.getItem("active_timer");
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        setTimer(parsed);
      } catch (err) {
        console.error("Failed to restore timer:", err);
      }
    }
  }, []);

  // Sync timer to localStorage when it changes
  useEffect(() => {
    if (timer) {
      localStorage.setItem("active_timer", JSON.stringify(timer));
    } else {
      localStorage.removeItem("active_timer");
    }
  }, [timer]);

  // Load dashboard data
  const refreshData = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setToast("Error reloading dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      void refreshData();
    }
  }, [authChecked, refreshData]);

  // Notifications SSE & Polling Sync
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok) {
          const list = await res.json();
          setNotifications(list);
          setUnreadCount(list.filter((n: any) => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    void fetchNotifications();

    let eventSource: EventSource | null = null;
    let sseTimeout: NodeJS.Timeout | null = null;

    const startSSE = () => {
      eventSource = new EventSource(`/api/notifications/sse?userId=${user.id}`);

      eventSource.onmessage = (event) => {
        try {
          const list = JSON.parse(event.data);
          if (Array.isArray(list) && list.length > 0) {
            setNotifications((prev) => {
              const prevIds = new Set(prev.map((n) => n.id));
              const fresh = list.filter((n) => !prevIds.has(n.id));

              if (fresh.length > 0) {
                // Flash alert
                fresh.forEach((notif) => {
                  setToast(notif.message);

                  // Speak details using Speech Synthesis
                  if ("speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(notif.title + ". " + notif.message);
                    utterance.rate = 1.05;
                    window.speechSynthesis.speak(utterance);
                  }
                });

                // Play Audio Chime
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = "sine";
                  osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
                  gain.gain.setValueAtTime(0.12, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.5);
                } catch (audioErr) {
                  console.warn("Failed to play audio chime:", audioErr);
                }
              }

              const combined = [...list, ...prev];
              const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
              setUnreadCount(unique.filter((n) => !n.isRead).length);
              return unique;
            });
          }
        } catch (parseErr) {
          console.error("SSE parse error:", parseErr);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        sseTimeout = setTimeout(() => {
          if (user) startSSE();
        }, 10000);
      };
    };

    startSSE();

    const fallbackPoll = setInterval(() => {
      if (!eventSource) {
        void fetchNotifications();
      }
    }, 6000);

    return () => {
      if (eventSource) eventSource.close();
      if (sseTimeout) clearTimeout(sseTimeout);
      clearInterval(fallbackPoll);
    };
  }, [user]);

  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Timer Tick
  useEffect(() => {
    if (timer) {
      setTick(Date.now());
      timerIntervalRef.current = setInterval(() => {
        setTick(Date.now());
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer]);

  // Log Out
  const logOut = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  // Create Task
  const createTask = async (taskData: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user ? String(user.id) : "",
        },
        body: JSON.stringify(taskData),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to create task");
      setData(updated);
      setNewTaskOpen(false);
      setToast("Task created successfully");
    } catch (err: any) {
      setToast(err.message || "Failed to create task");
    }
  };

  // Update Task Status
  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user ? String(user.id) : "",
        },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to update task");
      setData(updated);
      setToast(`Task status updated to ${status.replace("_", " ")}`);
    } catch (err: any) {
      setToast(err.message || "Failed to update task status");
    }
  };

  // Handle Timer Start/Stop
  const handleTimer = async (task: TaskView) => {
    if (timer && timer.taskId === task.id) {
      const elapsedSeconds = Math.floor((Date.now() - timer.startedAt) / 1000);
      const elapsedMinutes = Math.round(elapsedSeconds / 60);
      const totalMinutes = timer.baseMinutes + elapsedMinutes;

      setTimer(null);
      setToast("Saving tracked time...");

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user ? String(user.id) : "",
          },
          body: JSON.stringify({ trackedMinutes: totalMinutes }),
        });
        const updated = await res.json();
        if (!res.ok) throw new Error(updated.error || "Failed to save time");
        setData(updated);
        setToast(`Logged ${elapsedMinutes}m to ${task.title}`);
      } catch (err: any) {
        setToast(err.message || "Failed to log time");
      }
    } else {
      if (timer) {
        setToast("Please stop your active timer first.");
        return;
      }
      setTimer({
        taskId: task.id,
        startedAt: Date.now(),
        baseMinutes: task.trackedMinutes,
      });
      setToast(`Started timer for ${task.title}`);
      if (task.status !== "in_progress") {
        void updateTaskStatus(task.id, "in_progress");
      }
    }
  };

  if (!authChecked || loading || !data || !user) {
    return (
      <div className="layout-loading-screen">
        <style jsx>{`
          .layout-loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #0d0d1e;
            color: #ffffff;
            font-family: sans-serif;
            gap: 16px;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 3.5px solid rgba(255, 255, 255, 0.08);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="spinner" />
        <span style={{ fontSize: "15px", color: "#94a3b8" }}>Loading your workspace...</span>
      </div>
    );
  }

  // Set default initials/avatar in case user is missing properties
  const userInitials = user.initials || "AS";
  const userColor = user.avatarColor || "#a870b8";
  const userName = user.name || "Anita Sheikh";
  const userRole = user.role || "Sales Manager";

  const navItems = [
    { id: "/", label: "Overview", icon: LayoutDashboard },
    { id: "/tasks", label: "Tasks", icon: ListChecks },
    ...(isAdmin
      ? [
          { id: "/team", label: "Team", icon: Users },
          { id: "/reports", label: "Reports", icon: BarChart3 },
        ]
      : []),
  ];

  const onlineCount = data.employees.filter((emp) => emp.status === "online" || emp.status === "focus").length;
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <DashboardContext.Provider
      value={{
        data: adjustedData,
        loading,
        refreshing,
        refreshData,
        createTask,
        updateTaskStatus,
        timer,
        setTimer,
        tick,
        handleTimer,
        toast,
        setToast,
        query,
        setQuery,
        user,
        isAdmin,
        notifications,
        unreadCount,
        markNotificationsAsRead,
        logOut,
        setNewTaskOpen,
      }}
    >
      <div className="app-shell">
        <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
          <div className="sidebar-top">
            <Link className="brand" href="/">
              <span className="brand-mark">
                <Zap size={18} fill="currentColor" />
              </span>
              <span>Disa Tracker</span>
            </Link>
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
              const isActive = pathname === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.id}
                  className={`sidebar-link-btn ${isActive ? "active" : ""}`}
                  onClick={() => setMobileNav(false)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {item.id === "/tasks" && <em>{data.stats.activeTasks}</em>}
                </Link>
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
            <Link href="/settings" className={`sidebar-link-btn ${pathname === "/settings" ? "active" : ""}`} onClick={() => setMobileNav(false)}>
              <Settings size={18} strokeWidth={1.8} />
              <span>Settings</span>
            </Link>
          </nav>

          <div className="sidebar-promo">
            <span><Sparkles size={14} /> Focus tip</span>
            <strong>Protect your team’s deep work.</strong>
            <p>Workload is balanced across {data.employees.filter(e => e.workload > 50).length} of {data.employees.length} teammates.</p>
            <Link href="/team" className="view-capacity-link" onClick={() => setMobileNav(false)}>
              View capacity <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <Avatar initials={userInitials} color={userColor} status="online" />
            <span>
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </span>
            <MoreHorizontal size={17} />

            {userMenuOpen && (
              <div className="user-dropdown-menu">
                <style jsx>{`
                  .user-dropdown-menu {
                    position: absolute;
                    bottom: 74px;
                    left: 20px;
                    right: 20px;
                    background: #1a1a2e;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    padding: 8px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    z-index: 100;
                  }
                  .user-dropdown-btn {
                    padding: 10px 12px;
                    background: none;
                    border: none;
                    border-radius: 8px;
                    color: #cbd5e1;
                    font-size: 14px;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    width: 100%;
                  }
                  .user-dropdown-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #ffffff;
                  }
                  .user-dropdown-btn.logout-btn {
                    color: #f87171;
                  }
                  .user-dropdown-btn.logout-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                  }
                `}</style>
                <Link href="/settings" className="user-dropdown-btn" style={{ textDecoration: "none" }}>My Settings</Link>
                <button className="user-dropdown-btn logout-btn" onClick={logOut}>Sign Out</button>
              </div>
            )}
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, projects, or people…"
                aria-label="Search tasks, projects, or people"
              />
              <kbd><Command size={11} /> K</kbd>
            </div>
            <div className="topbar-actions">
              <button className="live-pill" onClick={() => void refreshData(true)}>
                <span /> Live
              </button>
              <button
                className={`icon-button ${refreshing ? "spin" : ""}`}
                onClick={() => void refreshData(true)}
                aria-label="Refresh dashboard"
              >
                <RefreshCw size={17} />
              </button>
              <div className="notification-wrap">
                <button
                  className="icon-button notification-button"
                  onClick={() => {
                    const nextVal = !notificationsOpen;
                    setNotificationsOpen(nextVal);
                    if (nextVal) void markNotificationsAsRead();
                  }}
                  aria-label="Open notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notification-badge-count">{unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className="notification-panel">
                    <style jsx>{`
                      .notification-badge-count {
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        background: #ef4444;
                        color: white;
                        font-size: 9.5px;
                        font-weight: 700;
                        width: 17px;
                        height: 17px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1.5px solid #fff;
                      }
                      .notification-item.unread {
                        background: linear-gradient(90deg, rgba(108, 94, 219, 0.05) 0%, transparent 100%) !important;
                        border-left: 3px solid #6c5edb !important;
                        padding-left: 17px !important;
                      }
                    `}</style>
                    <div className="notification-heading">
                      <div>
                        <strong>Notifications</strong>
                        <small>Workspace updates</small>
                      </div>
                      <button className="icon-button" onClick={() => setNotificationsOpen(false)}><X size={16} /></button>
                    </div>
                    <div className="notification-list-scroll" style={{ maxHeight: "280px", overflowY: "auto" }}>
                      {notifications.length > 0 ? (
                        notifications.slice(0, 10).map((item) => (
                          <div className={`notification-item ${!item.isRead ? "unread" : ""}`} key={item.id}>
                            <span className="activity-system" style={{ background: "#f0f0f3", color: "#6c5edb", padding: "8px", borderRadius: "50%", display: "grid", placeItems: "center", width: "32px", height: "32px", flexShrink: 0 }}><Inbox size={15} /></span>
                            <p>
                              <strong>{item.title}</strong>
                              <span style={{ display: "block", color: "#64748b", fontSize: "12px", marginTop: "3px" }}>{item.message}</span>
                              <small>{timeAgo(item.createdAt)}</small>
                            </p>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "30px 20px", textAlign: "center", color: "#8a8e9b" }}>
                          <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                          <strong style={{ display: "block" }}>No notifications</strong>
                          <p style={{ margin: "4px 0 0", fontSize: "12px" }}>You are all caught up.</p>
                        </div>
                      )}
                    </div>
                    <button className="notification-footer" onClick={() => { setNotificationsOpen(false); }}>
                      Dismiss Panel
                    </button>
                  </div>
                )}
              </div>
              <span className="topbar-divider" />
              <div style={{ cursor: "pointer" }} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <Avatar initials={userInitials} color={userColor} size="sm" />
              </div>
            </div>
          </header>

          <div className="dashboard-content">
            {children}
          </div>
        </main>

        {newTaskOpen && (
          <NewTaskModal
            data={data}
            onClose={() => setNewTaskOpen(false)}
            onSubmit={createTask}
          />
        )}

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
    </DashboardContext.Provider>
  );
}

function NewTaskModal({
  data,
  onClose,
  onSubmit,
}: {
  data: DashboardData;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      title: String(form.get("title")),
      description: String(form.get("description") || ""),
      project: String(form.get("project")),
      assigneeId: Number(form.get("assigneeId")),
      dueAt: new Date(String(form.get("dueAt"))).toISOString(),
      priority: String(form.get("priority")),
    });
  };

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
        <form onSubmit={handleSubmit} className="task-form">
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
            <button type="submit" className="primary-button">
              <Plus size={17} />
              Create task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
