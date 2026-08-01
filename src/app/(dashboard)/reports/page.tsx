"use client";

import { useDashboard } from "../layout";
import { useMemo } from "react";
import { CircleHelp, BarChart3, TrendingUp, Award, Clock } from "lucide-react";

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default function ReportsPage() {
  const { data, user, isAdmin } = useDashboard();

  const userTasks = useMemo(() => {
    if (!data || !user) return [];
    return isAdmin ? data.tasks : data.tasks.filter((t) => t.assignee.id === user.id);
  }, [data, user, isAdmin]);

  const totalTimeTracked = useMemo(() => {
    return userTasks.reduce((sum, task) => sum + task.trackedMinutes, 0);
  }, [userTasks]);

  const productivityPercent = useMemo(() => {
    if (userTasks.length === 0) return 0;
    return Math.round(
      userTasks.reduce((sum, t) => sum + t.progress, 0) / userTasks.length
    );
  }, [userTasks]);

  const projectDistribution = useMemo(() => {
    if (!data) return [];
    return data.projects.map((proj) => {
      const projTasks = userTasks.filter((task) => task.project === proj.name);
      const completed = projTasks.filter((task) => task.status === "completed").length;
      const time = projTasks.reduce((sum, task) => sum + task.trackedMinutes, 0);
      return { 
        ...proj, 
        total: projTasks.length,
        completed,
        minutesTracked: time 
      };
    }).filter((proj) => proj.total > 0 || isAdmin); // Non-admins only see projects they have tasks in
  }, [data, userTasks, isAdmin]);

  const userWeeklyFocus = useMemo(() => {
    if (!data) return [];
    const totalTeamTracked = data.tasks.reduce((sum, t) => sum + t.trackedMinutes, 0);
    const userTrackedFactor = isAdmin ? 1.0 : (totalTeamTracked > 0 ? (totalTimeTracked / totalTeamTracked) : 0.15);
    return data.weeklyFocus.map(day => ({
      ...day,
      minutes: Math.max(10, Math.round(day.minutes * userTrackedFactor))
    }));
  }, [data, totalTimeTracked, isAdmin]);

  if (!data || !user) return null;

  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>{isAdmin ? "Analytics & Reports" : "My Work Analytics"}</h1>
          <p>{isAdmin ? "Analyze company focus metrics, project progression, and tracking trends." : "Review your focus hours, completed tasks, and performance trends."}</p>
        </div>
      </section>

      <section className="stat-grid" aria-label="Performance insights">
        <article className="stat-card">
          <div className="stat-icon purple">
            <Clock size={18} />
          </div>
          <div className="stat-card-copy">
            <span>Cumulative Tracked</span>
            <strong>{formatMinutes(totalTimeTracked)}</strong>
            <small>Total project hours</small>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={18} />
          </div>
          <div className="stat-card-copy">
            <span>Productivity Ratio</span>
            <strong>{isAdmin ? data.stats.productivity : productivityPercent}%</strong>
            <small>Completion rate</small>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon blue">
            <Award size={18} />
          </div>
          <div className="stat-card-copy">
            <span>Focus Level</span>
            <strong>{productivityPercent > 70 || isAdmin ? "Excellent" : "On Track"}</strong>
            <small>Workspace quality</small>
          </div>
        </article>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginTop: "24px" }}>
        {/* Weekly Focus Panel */}
        <article className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Performance Trends</span>
              <h2>Weekly Focus Log</h2>
            </div>
          </div>
          <div className="focus-summary">
            <div>
              <strong>{formatMinutes(userWeeklyFocus.reduce((sum, day) => sum + day.minutes, 0))}</strong>
              <span>focused time this week</span>
            </div>
            <span className="trend-badge">↗ 12.4%</span>
          </div>
          <div className="focus-chart" style={{ marginTop: "20px" }}>
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

        {/* Project Metrics Panel */}
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Distribution</span>
              <h2>Project Progression & Time</h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "24px" }}>
            {projectDistribution.map((proj) => {
              const completionPercent = Math.round((proj.completed / Math.max(proj.total, 1)) * 100);
              return (
                <div key={proj.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ fontWeight: "600", color: "#ffffff" }}>{proj.name}</span>
                    <span style={{ color: "#cbd5e1" }}>{completionPercent}% completed · <span style={{ color: "#64748b" }}>{formatMinutes(proj.minutesTracked)}</span></span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${completionPercent}%`,
                        backgroundColor: proj.color,
                        borderRadius: "3px"
                      }}
                    />
                  </div>
                </div>
              );
            })}
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
