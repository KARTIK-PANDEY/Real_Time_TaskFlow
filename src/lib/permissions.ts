import { db } from "../db";
import { employees } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Checks if managerId is an ancestor of employeeId in the org reporting chain.
 * Returns true if managerId === employeeId, or if employeeId reports to managerId (directly/indirectly).
 */
export async function isManagerOf(managerId: number, employeeId: number): Promise<boolean> {
  if (managerId === employeeId) return true;

  let currentId: number | null = employeeId;
  const visited = new Set<number>();

  while (currentId !== null && !visited.has(currentId)) {
    visited.add(currentId);

    const [emp] = await db
      .select({ reportsToId: employees.reportsToId })
      .from(employees)
      .where(eq(employees.id, currentId))
      .limit(1);

    if (!emp) break;
    if (emp.reportsToId === managerId) return true;
    currentId = emp.reportsToId;
  }

  return false;
}

/**
 * Evaluates whether a user can set a task to a specific status.
 * Rules:
 * - EMPLOYEE: can move their own tasks to review/in_progress/todo. Cannot set completed.
 * - MANAGER: can complete/update tasks for themselves or their direct/indirect reports.
 * - MD: can complete/update any task in the workspace.
 */
export async function canSetTaskStatus(
  requestingUser: { id: number; orgRole: string },
  taskAssigneeId: number,
  newStatus: string
): Promise<{ allowed: boolean; message?: string }> {
  // If not setting to complete, standard users can edit their own assigned tasks
  if (newStatus !== "completed") {
    // Standard validation: must be assignee or manager/MD to update status
    if (requestingUser.id === taskAssigneeId || requestingUser.orgRole === "MD") {
      return { allowed: true };
    }
    const isSupervisor = await isManagerOf(requestingUser.id, taskAssigneeId);
    if (isSupervisor) {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: "You can only update status on tasks assigned to you or your reporting chain."
    };
  }

  // Enforce complete status rules
  if (requestingUser.orgRole === "MD") {
    return { allowed: true };
  }

  if (requestingUser.orgRole === "MANAGER") {
    const isSupervisor = await isManagerOf(requestingUser.id, taskAssigneeId);
    if (isSupervisor) {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: "You can only mark tasks complete if they are assigned to you or to members in your reporting chain."
    };
  }

  // EMPLOYEE
  return {
    allowed: false,
    message: "Only your manager or the MD can mark this task complete."
  };
}
