"use client";

import { useDashboard } from "./layout";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CircleHelp,
  Gauge,
  ListChecks,
  MessageSquareText,
  MoreHorizontal,
  Target,
} from "lucide-react";
import Link from "next/link";

function Avatar({ initials, color, status, size = "md" }: { initials: string; color: string; status?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";
  return (
    <div className={`avatar ${sizeClass}`} style={{ backgroundColor: color }}>
      <span>{initials}</span>
      {status && <i className={`status-badge is-${status}`} />}
    </div>
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
  icon: any;
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

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
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

export default function OverviewPage() {
  const { data, user } = useDashboard();

  if (!data || !user) return null;

  const isAdmin = !!user.isAdmin;

  const onlineCount = data.employees.filter((emp) => emp.status === "online" || emp.status === "focus").length;
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const userFirstName = user.name ? user.name.split(" ")[0] : "Anita";

  // Filter metrics based on role
  const userTasks = isAdmin ? data.tasks : data.tasks.filter((t) => t.assignee.id === user.id);
  const activeTasksCount = userTasks.filter((t) => t.status !== "completed").length;
  const completedTasksCount = userTasks.filter((t) => t.status === "completed").length;
  const totalTrackedMinutes = userTasks.reduce((sum, t) => sum + t.trackedMinutes, 0);
  const productivityPercent = userTasks.length > 0 
    ? Math.round(userTasks.reduce((sum, t) => sum + t.progress, 0) / userTasks.length) 
    : 0;

  const todayKey = new Date().toISOString().slice(0, 10);
  const dueTodayCount = userTasks.filter((t) => t.dueAt.slice(0, 10) === todayKey).length;
  const trackedToday = Math.round(totalTrackedMinutes * 0.12);

  const userTrackedFactor = isAdmin ? 1.0 : (data.stats.trackedMinutes > 0 ? (totalTrackedMinutes / data.stats.trackedMinutes) : 0.15);
  const userWeeklyFocus = data.weeklyFocus.map(day => ({
    ...day,
    minutes: Math.max(10, Math.round(day.minutes * userTrackedFactor))
  }));

  return (
    <>
      <section className="welcome-row">
        <div>
          <span className="date-line"><CalendarDays size={14} /> {today}</span>
          <h1>Good morning, {userFirstName} <span>👋</span></h1>
          <p>{isAdmin ? "Here’s how your team is moving work forward today." : "Here’s your personal work plan and progress details for today."}</p>
        </div>
        <Link href="/tasks" className="primary-button new-task-button" style={{ textDecoration: "none" }}>
          Go to tasks <ArrowUpRight size={18} />
        </Link>
      </section>

      <section className="stat-grid" aria-label="Team summary">
        <StatCard
          label={isAdmin ? "Active tasks" : "My active tasks"}
          value={String(activeTasksCount)}
          note={`${dueTodayCount} due today`}
          icon={ListChecks}
          tone="purple"
        />
        <StatCard
          label={isAdmin ? "Completed" : "My completed"}
          value={String(completedTasksCount)}
          note={`${completedTasksCount} completed`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label={isAdmin ? "Time tracked" : "My tracked time"}
          value={formatMinutes(totalTrackedMinutes)}
          note={`${formatMinutes(trackedToday)} today`}
          icon={Clock3}
          tone="orange"
        />
        <StatCard
          label={isAdmin ? "Team productivity" : "My productivity"}
          value={`${productivityPercent}%`}
          note={isAdmin ? "↑ 8% from last week" : "Personal task ratio"}
          icon={Gauge}
          tone="blue"
        />
      </section>

      <section className="insights-grid">
        <article className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Performance</span>
              <h2>Weekly focus</h2>
            </div>
            <button className="period-button">This week <ChevronDown size={14} /></button>
          </div>
          <div className="focus-summary">
            <div>
              <strong>{formatMinutes(userWeeklyFocus.reduce((sum, day) => sum + day.minutes, 0))}</strong>
              <span>focused time</span>
            </div>
            <span className="trend-badge">↗ 12.4%</span>
          </div>
          <div className="focus-chart">
            <div className="chart-target" style={{ bottom: `${(360 / 420) * 100}%` }}><span>6h target</span></div>
            {userWeeklyFocus.map((day, index) => (
              <div className="chart-column" key={`${day.day}-${index}`}>
                <div className={`chart-bar ${index === userWeeklyFocus.length - 2 ? "highlight" : ""}`} style={{ height: `${Math.max(8, (day.minutes / 420) * 100)}%` }}>
                  <span>{formatMinutes(day.minutes)}</span>
                </div>
                <small>{day.day}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel team-panel">
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
          <Link href="/team" className="panel-link" style={{ textDecoration: "none" }}>View all team members <ArrowUpRight size={14} /></Link>
        </article>
      </section>

      <section className="insights-grid" style={{ marginTop: "24px" }}>
        <article className="panel" style={{ flex: 2 }}>
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Portfolio</span>
              <h2>Project health</h2>
            </div>
          </div>
          <div className="project-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "16px" }}>
            {data.projects.map((project) => {
              const percent = Math.round((project.completed / Math.max(project.total, 1)) * 100);
              return (
                <article className="project-card" key={project.name} style={{ margin: 0 }}>
                  <div className="project-top"><span style={{ backgroundColor: project.color }}><Target size={17} /></span><MoreHorizontal size={17} /></div>
                  <strong>{project.name}</strong>
                  <small>{project.completed} of {project.total} tasks completed</small>
                  <div className="project-progress"><span style={{ width: `${percent}%`, backgroundColor: project.color }} /></div>
                  <div className="project-footer">
                    <div className="mini-avatars">
                      {data.employees.slice(0, Math.min(3, project.total)).map((employee) => (
                        <Avatar key={employee.id} initials={employee.initials} color={employee.avatarColor} size="sm" />
                      ))}
                    </div>
                    <b>{percent}%</b>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <aside className="panel activity-panel" style={{ flex: 1.2 }}>
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Real-time</span>
              <h2>Activity</h2>
            </div>
            <span className="pulse-dot" title="Live updates" />
          </div>
          <div className="activity-list">
            {data.activities.slice(0, 5).map((item, index) => (
              <div className="activity-item" key={item.id}>
                <div className="activity-avatar-wrap">
                  {item.employee ? (
                    <Avatar initials={item.employee.initials} color={item.employee.avatarColor} size="sm" />
                  ) : (
                    <span className="activity-system"><Activity size={14} /></span>
                  )}
                  {index < Math.min(data.activities.length, 5) - 1 && <i />}
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

      <footer className="dashboard-footer">
        <span>Disa Financial workspace · All systems operational</span>
        <div><button><CircleHelp size={14} /> Help center</button><button>Privacy</button></div>
      </footer>
    </>
  );
}
