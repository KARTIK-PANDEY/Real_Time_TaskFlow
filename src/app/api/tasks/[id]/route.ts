import { db } from "@/db";
import { activities, employees, tasks } from "@/db/schema";
import { getDashboardData } from "@/lib/dashboard-data";
import type { TaskStatus } from "@/lib/types";
import { canSetTaskStatus } from "@/lib/permissions";
import { eq } from "drizzle-orm";

const statuses: TaskStatus[] = ["todo", "in_progress", "review", "completed"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    const body = (await request.json()) as Record<string, unknown>;

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid task id." }, { status: 400 });
    }

    const userIdHeader = request.headers.get("x-user-id");
    if (!userIdHeader) {
      return Response.json({ error: "User identity header required." }, { status: 401 });
    }
    const requestingUserId = Number(userIdHeader);
    const [requestingUser] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, requestingUserId))
      .limit(1);

    if (!requestingUser) {
      return Response.json({ error: "Requesting user not found." }, { status: 401 });
    }

    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!existing) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }

    const update: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
    let detail = `updated ${existing.title}`;
    let action = "updated";

    if (statuses.includes(body.status as TaskStatus)) {
      const status = body.status as TaskStatus;
      
      // Enforce role-based status transition checks
      const validation = await canSetTaskStatus(
        { id: requestingUser.id, orgRole: requestingUser.orgRole },
        existing.assigneeId,
        status
      );

      if (!validation.allowed) {
        return Response.json({ error: validation.message || "Forbidden status transition." }, { status: 403 });
      }

      update.status = status;
      update.progress = status === "completed" ? 100 : status === "todo" ? 0 : existing.progress;
      action = status === "completed" ? "completed" : "updated";
      detail = `${status === "completed" ? "completed" : "moved"} ${existing.title}${
        status === "completed" ? "" : ` to ${status.replace("_", " ")}`
      }`;
    }

    if (typeof body.progress === "number") {
      update.progress = Math.max(0, Math.min(100, Math.round(body.progress)));
      detail = `set progress to ${update.progress}% on ${existing.title}`;
    }

    if (typeof body.trackedMinutes === "number") {
      update.trackedMinutes = Math.max(existing.trackedMinutes, Math.round(body.trackedMinutes));
      action = "tracked";
      detail = `logged time on ${existing.title}`;
    }

    await db.update(tasks).set(update).where(eq(tasks.id, id));
    await db.insert(activities).values({
      employeeId: existing.assigneeId,
      taskId: id,
      action,
      detail,
    });

    return Response.json(await getDashboardData());
  } catch (error) {
    console.error("Unable to update task", error);
    return Response.json({ error: "Unable to update the task." }, { status: 500 });
  }
}
