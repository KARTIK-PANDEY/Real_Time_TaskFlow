import { db } from "@/db";
import { activities, employees, tasks, notifications } from "@/db/schema";
import { ensureSeedData, getDashboardData } from "@/lib/dashboard-data";
import type { TaskPriority } from "@/lib/types";
import { eq } from "drizzle-orm";

const priorities: TaskPriority[] = ["low", "medium", "high"];

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const project = typeof body.project === "string" ? body.project.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const assigneeId = Number(body.assigneeId);
    const priority = priorities.includes(body.priority as TaskPriority)
      ? (body.priority as TaskPriority)
      : "medium";
    const dueAt = new Date(String(body.dueAt));

    if (!title || !project || !Number.isInteger(assigneeId) || Number.isNaN(dueAt.getTime())) {
      return Response.json({ error: "Title, project, assignee, and due date are required." }, { status: 400 });
    }

    const [assignee] = await db.select().from(employees).where(eq(employees.id, assigneeId)).limit(1);
    if (!assignee) {
      return Response.json({ error: "Assignee not found." }, { status: 404 });
    }

    const [task] = await db
      .insert(tasks)
      .values({
        title,
        project,
        description,
        assigneeId,
        priority,
        dueAt,
        status: "todo",
        progress: 0,
        estimatedMinutes: 240,
        trackedMinutes: 0,
      })
      .returning();

    await db.insert(activities).values({
      employeeId: assigneeId,
      taskId: task.id,
      action: "created",
      detail: `was assigned ${title}`,
    });

    await db.insert(notifications).values({
      userId: assigneeId,
      title: "New Task Assigned",
      message: `You have been assigned: "${title}" in project "${project}".`,
    });

    return Response.json(await getDashboardData(), { status: 201 });
  } catch (error) {
    console.error("Unable to create task", error);
    return Response.json({ error: "Unable to create the task." }, { status: 500 });
  }
}
