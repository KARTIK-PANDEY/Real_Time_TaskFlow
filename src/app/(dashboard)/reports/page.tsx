"use client";

import { useDashboard } from "../layout";
import { useMemo } from "react";
import { CircleHelp, BarChart3, TrendingUp, Award, Clock, FileDown, Printer } from "lucide-react";

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
    }).filter((proj) => proj.total > 0 || isAdmin);
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

  const downloadExcel = () => {
    let csvContent = "\uFEFF"; // Add UTF-8 BOM
    csvContent += "DISA FINANCIAL WORKSPACE REPORT\n";
    csvContent += `Generated On: ${new Date().toLocaleString()}\n`;
    csvContent += `Report Scope: ${isAdmin ? "All Team Tasks" : `Individual - ${user?.name}`}\n\n`;
    
    csvContent += "PROJECT DISTRIBUTION\n";
    csvContent += "Project,Total Tasks,Completed Tasks,Completion %,Tracked Time\n";
    projectDistribution.forEach(proj => {
      const completionPercent = Math.round((proj.completed / Math.max(proj.total, 1)) * 100);
      const hours = Math.round((proj.minutesTracked / 60) * 10) / 10;
      csvContent += `"${proj.name.replace(/"/g, '""')}",${proj.total},${proj.completed},${completionPercent}%,${hours}h\n`;
    });
    
    csvContent += "\nWEEKLY PERFORMANCE LOG\n";
    csvContent += "Day,Focus Duration (minutes)\n";
    userWeeklyFocus.forEach(day => {
      csvContent += `${day.day},${day.minutes}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Disa_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    window.print();
  };

  if (!data || !user) return null;

  return (
    <>
      <style jsx global>{`
        .reports-toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .reports-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-excel {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .btn-excel:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.3);
          transform: translateY(-1px);
        }
        .btn-pdf {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
        }
        .btn-pdf:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        
        /* Vibrant Stats Styling */
        .stat-card.vibrant-blue {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(9, 13, 22, 0.6) 100%) !important;
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
          backdrop-filter: blur(12px) !important;
        }
        .stat-card.vibrant-blue:hover {
          border-color: rgba(59, 130, 246, 0.4) !important;
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.15) !important;
        }
        .stat-card.vibrant-green {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(9, 13, 22, 0.6) 100%) !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
          backdrop-filter: blur(12px) !important;
        }
        .stat-card.vibrant-green:hover {
          border-color: rgba(16, 185, 129, 0.4) !important;
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.15) !important;
        }
        .stat-card.vibrant-purple {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(9, 13, 22, 0.6) 100%) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          backdrop-filter: blur(12px) !important;
        }
        .stat-card.vibrant-purple:hover {
          border-color: rgba(139, 92, 246, 0.4) !important;
          box-shadow: 0 12px 30px rgba(139, 92, 246, 0.15) !important;
        }

        .stat-card.vibrant-blue strong { color: #60a5fa !important; }
        .stat-card.vibrant-green strong { color: #34d399 !important; }
        .stat-card.vibrant-purple strong { color: #a78bfa !important; }

        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .dashboard-sidebar, 
          .dashboard-footer, 
          .reports-toolbar, 
          .welcome-row p,
          header {
            display: none !important;
          }
          main, .dashboard-main, .main-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .panel {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            color: #000000 !important;
            page-break-inside: avoid;
          }
          .panel h2, .panel span, .panel strong, .panel small, .panel label {
            color: #000000 !important;
          }
          .stat-card {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          .stat-card strong, .stat-card span, .stat-card small {
            color: #000000 !important;
          }
          .chart-bar {
            background-color: #4f46e5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .chart-column small {
            color: #000000 !important;
          }
        }
      `}</style>

      <section className="welcome-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>{isAdmin ? "Analytics & Reports" : "My Work Analytics"}</h1>
          <p>{isAdmin ? "Analyze company focus metrics, project progression, and tracking trends." : "Review your focus hours, completed tasks, and performance trends."}</p>
        </div>
        <div className="reports-toolbar">
          <button onClick={downloadExcel} className="reports-btn btn-excel">
            <FileDown size={16} /> Export to Excel
          </button>
          <button onClick={downloadPDF} className="reports-btn btn-pdf">
            <Printer size={16} /> Save as PDF
          </button>
        </div>
      </section>

      <section className="stat-grid" aria-label="Performance insights">
        <article className="stat-card vibrant-blue">
          <div className="stat-icon blue">
            <Clock size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div className="stat-card-copy">
            <span>Cumulative Tracked</span>
            <strong>{formatMinutes(totalTimeTracked)}</strong>
            <small>Total project hours</small>
          </div>
        </article>
        <article className="stat-card vibrant-green">
          <div className="stat-icon green">
            <TrendingUp size={18} style={{ color: "#10b981" }} />
          </div>
          <div className="stat-card-copy">
            <span>Productivity Ratio</span>
            <strong>{isAdmin ? data.stats.productivity : productivityPercent}%</strong>
            <small>Completion rate</small>
          </div>
        </article>
        <article className="stat-card vibrant-purple">
          <div className="stat-icon purple">
            <Award size={18} style={{ color: "#8b5cf6" }} />
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
            <span className="trend-badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>↗ 12.4%</span>
          </div>
          <div className="focus-chart" style={{ marginTop: "20px" }}>
            <div className="chart-target" style={{ bottom: `${(360 / 420) * 100}%`, borderTop: "1px dashed rgba(255,255,255,0.15)" }}><span style={{ color: "#94a3b8" }}>6h target</span></div>
            {userWeeklyFocus.map((day, index) => (
              <div className="chart-column" key={`${day.day}-${index}`}>
                <div className={`chart-bar ${index === userWeeklyFocus.length - 2 ? "highlight" : ""}`} style={{ height: `${Math.max(8, (day.minutes / 420) * 100)}%`, background: index === userWeeklyFocus.length - 2 ? "linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)" : "linear-gradient(180deg, rgba(99, 102, 241, 0.6) 0%, rgba(79, 70, 229, 0.4) 100%)" }}>
                  <span>{formatMinutes(day.minutes)}</span>
                </div>
                <small style={{ color: "#cbd5e1" }}>{day.day}</small>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                    <span style={{ fontWeight: "600", color: "#ffffff" }}>{proj.name}</span>
                    <span style={{ color: "#cbd5e1" }}>{completionPercent}% completed · <span style={{ color: "#818cf8", fontWeight: "500" }}>{formatMinutes(proj.minutesTracked)}</span></span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${completionPercent}%`,
                        backgroundColor: proj.color,
                        borderRadius: "4px",
                        boxShadow: `0 0 8px ${proj.color}44`
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
