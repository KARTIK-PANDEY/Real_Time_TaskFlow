import { db } from "@/db";
import { activities, employees, tasks, notifications } from "@/db/schema";
import { getDashboardData } from "@/lib/dashboard-data";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { eq } from "drizzle-orm";

const priorities: TaskPriority[] = ["low", "medium", "high"];
const statuses: TaskStatus[] = ["todo", "in_progress", "review", "completed"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tasksList } = body;

    if (!Array.isArray(tasksList) || tasksList.length === 0) {
      return Response.json({ error: "Invalid tasks list format." }, { status: 400 });
    }

    // Load active employees list to validate assignees
    const allEmployees = await db.select().from(employees);
    const employeeIds = new Set(allEmployees.map((e) => e.id));

    const insertValues: Array<typeof tasks.$inferInsert> = [];

    for (const t of tasksList) {
      const title = typeof t.title === "string" ? t.title.trim() : "";
      const project = typeof t.project === "string" ? t.project.trim() : "";
      const assigneeId = Number(t.assigneeId);
      const priority = priorities.includes(t.priority as TaskPriority)
        ? (t.priority as TaskPriority)
        : "medium";
      const status = statuses.includes(t.status as TaskStatus)
        ? (t.status as TaskStatus)
        : "todo";
      
      const estimatedMinutes = Number(t.estimatedMinutes) || 60;
      const progress = status === "completed" ? 100 : status === "todo" ? 0 : Number(t.progress) || 0;
      const dueAt = t.dueAt ? new Date(String(t.dueAt)) : new Date();

      if (!title || !project || !employeeIds.has(assigneeId)) {
        continue; // skip invalid row
      }

      insertValues.push({
        title,
        project,
        description: typeof t.description === "string" ? t.description.trim() : "",
        assigneeId,
        priority,
        status,
        progress,
        estimatedMinutes,
        trackedMinutes: 0,
        dueAt,
      });
    }

    if (insertValues.length === 0) {
      return Response.json({ error: "No valid tasks to insert." }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      const insertedTasks = await tx.insert(tasks).values(insertValues).returning();

      const activitiesValues = insertedTasks.map((t) => ({
        employeeId: t.assigneeId,
        taskId: t.id,
        action: "created",
        detail: `was assigned ${t.title} (bulk)`,
      }));

      const notificationsValues = insertedTasks.map((t) => ({
        userId: t.assigneeId,
        title: "New Task Assigned",
        message: `You have been assigned: "${t.title}" in project "${t.project}" (bulk).`,
      }));

      if (activitiesValues.length > 0) {
        await tx.insert(activities).values(activitiesValues);
      }
      if (notificationsValues.length > 0) {
        await tx.insert(notifications).values(notificationsValues);
      }
    });

    return Response.json(await getDashboardData(), { status: 201 });
  } catch (error: any) {
    console.error("Unable to bulk create tasks:", error);
    return Response.json({ error: error.message || "Failed to bulk create tasks." }, { status: 500 });
  }
}
