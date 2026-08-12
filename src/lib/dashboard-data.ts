import { db } from "@/db";
import { activities, employees, tasks, notifications } from "@/db/schema";
import { asc, count, desc, eq } from "drizzle-orm";
import type { DashboardData, EmployeeStatus } from "./types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeDate(days: number, hour = 17) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export async function ensureSeedData(force = false) {
  const mdTeammate = await db.select().from(employees).where(eq(employees.name, "Sanjiv Rathi")).limit(1);
  const [{ value }] = await db.select({ value: count() }).from(employees);

  if (force || mdTeammate.length === 0 || Number(value) < 28) {
    // Clear old data to re-seed with only actual Disa Financial new team
    await db.delete(notifications);
    await db.delete(activities);
    await db.delete(tasks);
    await db.delete(employees);
  } else {
    return;
  }

  await db.transaction(async (tx) => {
    // 1. Insert MD
    const [md] = await tx.insert(employees).values({
      name: "Sanjiv Rathi",
      email: "sanjiv.rathi@disafinancial.com",
      loginId: "sanjiv",
      password: "sanjiv123",
      role: "Managing Director",
      department: "Management",
      avatarColor: "#3c9b87",
      status: "online",
      isAdmin: true,
      orgRole: "MD",
      reportsToId: null,
    }).returning();

    const nameToId: Record<string, number> = {
      "Sanjiv Rathi": md.id
    };

    // 2. Level 2 (reports to Sanjiv Rathi)
    const level2Values = [
      { name: "Sheikh Irfan", email: "sheikh.irfan@disafinancial.com", loginId: "irfan", role: "Head of Operations", dept: "OPERATION" },
      { name: "Alka Gopawar", email: "alka.gopawar@disafinancial.com", loginId: "alka", role: "Head of Finance", dept: "FINANCE" },
      { name: "Loknath Sahu", email: "loknath.sahu@disafinancial.com", loginId: "loknath", role: "Head of Sales", dept: "SALES" },
      { name: "Kirti Shrivastava", email: "kirti.shrivastava@disafinancial.com", loginId: "kirti", role: "Senior Wealth Advisor", dept: "WEALTH" },
      { name: "Prashita Sheolikar", email: "prashita.sheolikar@disafinancial.com", loginId: "prashita", role: "Senior Advisor", dept: "WEALTH" },
      { name: "Anmol Singh Hariyaow", email: "anmol.singh@disafinancial.com", loginId: "anmol", role: "Advisor", dept: "WEALTH" },
      { name: "Karandeep Kaur Bhullar", email: "karandeep.kaur@disafinancial.com", loginId: "karandeep", role: "Advisor", dept: "WEALTH" },
      { name: "Aditya Pandey", email: "aditya.pandey@disafinancial.com", loginId: "aditya", role: "Advisor", dept: "WEALTH" },
      { name: "Kartik Pandey", email: "kartik.pandey@disafinancial.com", loginId: "kartik", role: "Senior Developer", dept: "TECHNOLOGY" },
      { name: "Anita Sheikh", email: "anita.sheikh@disafinancial.com", loginId: "anita", role: "Sales Manager", dept: "Marketing" }
    ];

    const level2Employees = await tx.insert(employees).values(
      level2Values.map(item => ({
        name: item.name,
        email: item.email,
        loginId: item.loginId,
        password: `${item.loginId}123`,
        role: item.role,
        department: item.dept,
        avatarColor: "#a870b8",
        status: "online" as const,
        isAdmin: true,
        orgRole: "MANAGER",
        reportsToId: md.id
      }))
    ).returning();

    level2Employees.forEach(emp => {
      nameToId[emp.name] = emp.id;
    });

    // 3. Level 3
    const level3Values = [
      { name: "Sagar Gadamwar", email: "sagar.gadamwar@disafinancial.com", loginId: "sagar", role: "Operations Lead", dept: "OPERATION", reportsTo: "Sheikh Irfan" },
      { name: "Snehil Khare", email: "snehil.khare@disafinancial.com", loginId: "snehil", role: "Assistant Manager", dept: "OPERATION", reportsTo: "Sheikh Irfan" },
      { name: "Seema Sahu", email: "seema.sahu@disafinancial.com", loginId: "seema", role: "Executive", dept: "OPERATION", reportsTo: "Sheikh Irfan" },
      { name: "Nitin Lulla", email: "nitin.lulla@disafinancial.com", loginId: "nitin", role: "Executive", dept: "OPERATION", reportsTo: "Sheikh Irfan" },
      { name: "Deepa Chatterjee", email: "deepa.chatterjee@disafinancial.com", loginId: "deepa", role: "Finance Assistant", dept: "FINANCE", reportsTo: "Alka Gopawar" },
      { name: "Narsingh Das Manikpuri", email: "narsingh.das@disafinancial.com", loginId: "narsingh", role: "Sales Executive", dept: "SALES", reportsTo: "Loknath Sahu" },
      { name: "Miss Dolly Thakur", email: "dolly.thakur@disafinancial.com", loginId: "dolly", role: "Wealth Advisor Assistant", dept: "WEALTH", reportsTo: "Kirti Shrivastava" },
      { name: "Dipika Sen", email: "dipika.sen@disafinancial.com", loginId: "dipika", role: "Advisor Assistant", dept: "WEALTH", reportsTo: "Prashita Sheolikar" },

      // Existing teammates under Anita Sheikh
      { name: "Lumeshwari Nirmal", email: "lumeshwari.nirmal@disafinancial.com", loginId: "lumeshwari", role: "Back Office", dept: "OPERATION", reportsTo: "Anita Sheikh" },
      { name: "Rupa Gupta", email: "rupa.gupta@disafinancial.com", loginId: "rupa", role: "Back Office", dept: "OPERATION", reportsTo: "Anita Sheikh" },
      { name: "RENU TANDI", email: "renu.tandi@disafinancial.com", loginId: "renu", role: "Back Office", dept: "OPERATION", reportsTo: "Anita Sheikh" },
      { name: "RISHU PATLE", email: "rishu.patle@disafinancial.com", loginId: "rishu", role: "Back Office", dept: "OPERATION", reportsTo: "Anita Sheikh" },
      { name: "RANJAY TANDI", email: "ranjay.tandi@disafinancial.com", loginId: "ranjay", role: "Office Boy", dept: "Housekeeping", reportsTo: "Anita Sheikh" },
      { name: "Shrishti Manekar", email: "shrishti.manekar@disafinancial.com", loginId: "shrishti", role: "Operation Executive", dept: "Operations/ Marketing", reportsTo: "Anita Sheikh" }
    ];

    const level3Employees = await tx.insert(employees).values(
      level3Values.map(item => ({
        name: item.name,
        email: item.email,
        loginId: item.loginId,
        password: `${item.loginId.toLowerCase()}123`,
        role: item.role,
        department: item.dept,
        avatarColor: item.name === "RENU TANDI" ? "#d5a34a" : item.name === "Rupa Gupta" ? "#a870b8" : "#ec8d72",
        status: (item.name === "RENU TANDI" ? "away" : item.name === "RANJAY TANDI" ? "offline" : "online") as "online" | "focus" | "away" | "offline",
        isAdmin: false,
        orgRole: "EMPLOYEE",
        reportsToId: nameToId[item.reportsTo]
      }))
    ).returning();

    level3Employees.forEach(emp => {
      nameToId[emp.name] = emp.id;
    });

    // 4. Level 4 (reports to Snehil Khare)
    const level4Values = [
      { name: "S. Venkatesh Rao", email: "venkatesh.rao@disafinancial.com", loginId: "venkatesh", role: "Support Staff", dept: "OPERATION", reportsTo: "Snehil Khare" },
      { name: "Shekhar Nirmalkar", email: "shekhar.nirmalkar@disafinancial.com", loginId: "shekhar", role: "Support Staff", dept: "OPERATION", reportsTo: "Snehil Khare" },
      { name: "Padma", email: "padma@disafinancial.com", loginId: "padma", role: "Support Staff", dept: "OPERATION", reportsTo: "Snehil Khare" }
    ];

    const level4Employees = await tx.insert(employees).values(
      level4Values.map(item => ({
        name: item.name,
        email: item.email,
        loginId: item.loginId,
        password: `${item.loginId}123`,
        role: item.role,
        department: item.dept,
        avatarColor: "#6877c9",
        status: "online" as const,
        isAdmin: false,
        orgRole: "EMPLOYEE",
        reportsToId: nameToId[item.reportsTo]
      }))
    ).returning();

    level4Employees.forEach(emp => {
      nameToId[emp.name] = emp.id;
    });

    // Recalculate orgRoles dynamically based on the hierarchy
    const allEmployees = await tx.select().from(employees);
    const reportsToMap = new Set(allEmployees.map(e => e.reportsToId).filter(Boolean) as number[]);
    for (const emp of allEmployees) {
      let orgRole: "MD" | "MANAGER" | "EMPLOYEE" = "EMPLOYEE";
      if (emp.reportsToId === null) {
        orgRole = "MD";
      } else if (reportsToMap.has(emp.id)) {
        orgRole = "MANAGER";
      }

      await tx.update(employees)
        .set({
          orgRole,
          isAdmin: orgRole === "MD" || orgRole === "MANAGER"
        })
        .where(eq(employees.id, emp.id));
    }

    const employee = Object.fromEntries(allEmployees.map((item) => [item.name, item]));

    const seededTasks = await tx
      .insert(tasks)
      .values([
        {
          title: "Audit client onboarding files",
          description: "Perform weekly audit on back office operations and files.",
          project: "Operations Compliance",
          status: "in_progress",
          priority: "medium",
          assigneeId: employee["Lumeshwari Nirmal"].id,
          progress: 45,
          estimatedMinutes: 240,
          trackedMinutes: 110,
          dueAt: relativeDate(1),
        },
        {
          title: "Process mutual fund applications",
          description: "Review and submit pending mutual fund distribution documents.",
          project: "Operations Compliance",
          status: "todo",
          priority: "high",
          assigneeId: employee["Rupa Gupta"].id,
          progress: 0,
          estimatedMinutes: 180,
          trackedMinutes: 0,
          dueAt: relativeDate(2),
        },
        {
          title: "Update daily transaction logs",
          description: "Reconcile daily transaction records with the system database.",
          project: "Operations Compliance",
          status: "completed",
          priority: "low",
          assigneeId: employee["RENU TANDI"].id,
          progress: 100,
          estimatedMinutes: 120,
          trackedMinutes: 120,
          dueAt: relativeDate(-1),
        },
        {
          title: "Validate KYCs for new clients",
          description: "Verify identities and document submissions for incoming accounts.",
          project: "Operations Compliance",
          status: "review",
          priority: "medium",
          assigneeId: employee["RISHU PATLE"].id,
          progress: 85,
          estimatedMinutes: 300,
          trackedMinutes: 250,
          dueAt: relativeDate(0, 16),
        },
        {
          title: "Distribute monthly office supplies",
          description: "Reorganize the inventory closet and verify supply levels.",
          project: "Facility Management",
          status: "completed",
          priority: "low",
          assigneeId: employee["RANJAY TANDI"].id,
          progress: 100,
          estimatedMinutes: 90,
          trackedMinutes: 90,
          dueAt: relativeDate(-2),
        },
        {
          title: "Coordinate investor meet marketing collateral",
          description: "Design and prepare flyers for the upcoming Wealth Summit.",
          project: "Marketing Campaigns",
          status: "in_progress",
          priority: "high",
          assigneeId: employee["Anita Sheikh"].id,
          progress: 60,
          estimatedMinutes: 360,
          trackedMinutes: 216,
          dueAt: relativeDate(2),
        },
        {
          title: "Perform security clearance check",
          description: "Verify physical and digital credentials for the compliance auditor.",
          project: "Operations Compliance",
          status: "todo",
          priority: "medium",
          assigneeId: employee["Shrishti Manekar"].id,
          progress: 0,
          estimatedMinutes: 180,
          trackedMinutes: 0,
          dueAt: relativeDate(3),
        },
        {
          title: "Scan old registration documents",
          description: "Digitize files from the Q4 physical storage archive.",
          project: "Operations Compliance",
          status: "completed",
          priority: "low",
          assigneeId: employee["Lumeshwari Nirmal"].id,
          progress: 100,
          estimatedMinutes: 120,
          trackedMinutes: 120,
          dueAt: relativeDate(-2),
        },
        {
          title: "Archive Q1 mutual fund receipts",
          description: "Upload confirmed transactions to the secure clouds.",
          project: "Operations Compliance",
          status: "review",
          priority: "low",
          assigneeId: employee["Rupa Gupta"].id,
          progress: 75,
          estimatedMinutes: 90,
          trackedMinutes: 75,
          dueAt: relativeDate(0, 14),
        },
        {
          title: "Update compliance logs for operation",
          description: "Log daily compliance audits and flags.",
          project: "Operations Compliance",
          status: "in_progress",
          priority: "high",
          assigneeId: employee["RISHU PATLE"].id,
          progress: 80,
          estimatedMinutes: 240,
          trackedMinutes: 180,
          dueAt: relativeDate(1),
        },
      ])
      .returning();

    const task = Object.fromEntries(seededTasks.map((item) => [item.title, item]));
    const now = Date.now();

    await tx.insert(activities).values([
      {
        employeeId: employee["RENU TANDI"].id,
        taskId: task["Update daily transaction logs"].id,
        action: "completed",
        detail: "completed Update daily transaction logs",
        createdAt: new Date(now - 15 * 60 * 1000),
      },
      {
        employeeId: employee["Lumeshwari Nirmal"].id,
        taskId: task["Audit client onboarding files"].id,
        action: "updated",
        detail: "set progress to 45% on Audit client onboarding files",
        createdAt: new Date(now - 42 * 60 * 1000),
      },
      {
        employeeId: employee["RISHU PATLE"].id,
        taskId: task["Validate KYCs for new clients"].id,
        action: "commented",
        detail: "left a note on Validate KYCs for new clients",
        createdAt: new Date(now - 75 * 60 * 1000),
      },
      {
        employeeId: employee["RANJAY TANDI"].id,
        taskId: task["Distribute monthly office supplies"].id,
        action: "completed",
        detail: "completed Distribute monthly office supplies",
        createdAt: new Date(now - 110 * 60 * 1000),
      },
      {
        employeeId: employee["Anita Sheikh"].id,
        taskId: task["Coordinate investor meet marketing collateral"].id,
        action: "updated",
        detail: "moved Coordinate investor meet marketing collateral to In progress",
        createdAt: new Date(now - 8 * 60 * 1000),
      },
    ]);
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureSeedData();

  const [employeeRows, taskRows, activityRows] = await Promise.all([
    db.select().from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.id)),
    db
      .select({ task: tasks, employee: employees })
      .from(tasks)
      .innerJoin(employees, eq(tasks.assigneeId, employees.id))
      .orderBy(desc(tasks.updatedAt)),
    db
      .select({ activity: activities, employee: employees })
      .from(activities)
      .leftJoin(employees, eq(activities.employeeId, employees.id))
      .orderBy(desc(activities.createdAt))
      .limit(12),
  ]);

  const employeeNameMap = new Map(employeeRows.map(emp => [emp.id, emp.name]));

  const employeeViews = employeeRows.map((employee) => {
    const assigned = taskRows.filter((row) => row.task.assigneeId === employee.id);
    const active = assigned.filter((row) => row.task.status !== "completed");
    const estimated = active.reduce((sum, row) => sum + row.task.estimatedMinutes, 0);

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      loginId: employee.loginId,
      role: employee.role,
      department: employee.department,
      avatarColor: employee.avatarColor,
      status: employee.status as EmployeeStatus,
      initials: initials(employee.name),
      taskCount: active.length,
      completedCount: assigned.filter((row) => row.task.status === "completed").length,
      workload: Math.min(100, Math.round((estimated / 720) * 100)),
      reportsToId: employee.reportsToId,
      orgRole: employee.orgRole,
      reportsToName: employee.reportsToId ? employeeNameMap.get(employee.reportsToId) : null,
    };
  });

  const taskViews = taskRows.map(({ task, employee }) => {
    const assigneeReportsToId = employee.reportsToId;
    const assigneeReportsToName = assigneeReportsToId ? employeeNameMap.get(assigneeReportsToId) : null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      project: task.project,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      estimatedMinutes: task.estimatedMinutes,
      trackedMinutes: task.trackedMinutes,
      dueAt: task.dueAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee: {
        id: employee.id,
        name: employee.name,
        initials: initials(employee.name),
        avatarColor: employee.avatarColor,
        status: employee.status as EmployeeStatus,
        reportsToId: assigneeReportsToId,
        reportsToName: assigneeReportsToName,
      },
    };
  });

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const trackedMinutes = taskRows.reduce((sum, row) => sum + row.task.trackedMinutes, 0);
  const activeTasks = taskRows.filter((row) => row.task.status !== "completed").length;
  const completedTasks = taskRows.length - activeTasks;
  const productivity = Math.round(
    taskRows.reduce((sum, row) => sum + row.task.progress, 0) / Math.max(taskRows.length, 1),
  );

  const projectColors = ["#6558d9", "#e77862", "#3c9b87", "#d69a38"];
  const projectMap = new Map<string, { total: number; completed: number }>();
  for (const row of taskRows) {
    const current = projectMap.get(row.task.project) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (row.task.status === "completed") current.completed += 1;
    projectMap.set(row.task.project, current);
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const weeklyValues = [292, 354, 318, 386, 341, 244, 108];
  const weeklyFocus = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return {
      day: dayFormatter.format(date).slice(0, 2),
      minutes: weeklyValues[index],
      target: 360,
    };
  });

  return {
    stats: {
      activeTasks,
      completedTasks,
      teamMembers: employeeRows.length,
      trackedMinutes,
      productivity,
      dueToday: taskRows.filter((row) => row.task.dueAt.toISOString().slice(0, 10) === todayKey)
        .length,
    },
    employees: employeeViews,
    tasks: taskViews,
    activities: activityRows.map(({ activity, employee }) => ({
      id: activity.id,
      action: activity.action,
      detail: activity.detail,
      createdAt: activity.createdAt.toISOString(),
      employee: employee
        ? {
          name: employee.name,
          initials: initials(employee.name),
          avatarColor: employee.avatarColor,
        }
        : null,
    })),
    weeklyFocus,
    projects: Array.from(projectMap.entries()).map(([name, value], index) => ({
      name,
      ...value,
      color: projectColors[index % projectColors.length],
    })),
    generatedAt: new Date().toISOString(),
  };
}
