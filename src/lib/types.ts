export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type EmployeeStatus = "online" | "focus" | "away" | "offline";

export type EmployeeView = {
  id: number;
  name: string;
  email: string;
  loginId?: string | null;
  role: string;
  department: string;
  avatarColor: string;
  status: EmployeeStatus;
  initials: string;
  taskCount: number;
  completedCount: number;
  workload: number;
  reportsToId?: number | null;
  orgRole?: string;
  reportsToName?: string | null;
};

export type TaskView = {
  id: number;
  title: string;
  description: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  estimatedMinutes: number;
  trackedMinutes: number;
  dueAt: string;
  updatedAt: string;
  assignee: {
    id: number;
    name: string;
    initials: string;
    avatarColor: string;
    status: EmployeeStatus;
    reportsToId?: number | null;
    reportsToName?: string | null;
  };
};

export type ActivityView = {
  id: number;
  action: string;
  detail: string;
  createdAt: string;
  employee: {
    name: string;
    initials: string;
    avatarColor: string;
  } | null;
};

export type DashboardData = {
  stats: {
    activeTasks: number;
    completedTasks: number;
    teamMembers: number;
    trackedMinutes: number;
    productivity: number;
    dueToday: number;
  };
  employees: EmployeeView[];
  tasks: TaskView[];
  activities: ActivityView[];
  weeklyFocus: { day: string; minutes: number; target: number }[];
  projects: { name: string; total: number; completed: number; color: string }[];
  generatedAt: string;
};

export type NotificationView = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};
