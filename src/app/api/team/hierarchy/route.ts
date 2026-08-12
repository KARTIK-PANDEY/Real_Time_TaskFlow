import { db } from "@/db";
import { employees } from "@/db/schema";
import { isManagerOf } from "@/lib/permissions";
import { getDashboardData } from "@/lib/dashboard-data";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  try {
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

    // Only MD and Managers can reassign reports_to_id
    if (requestingUser.orgRole !== "MD" && requestingUser.orgRole !== "MANAGER") {
      return Response.json({ error: "Access denied. Only managers or the MD can edit organization hierarchy." }, { status: 403 });
    }

    const { employeeId, reportsToId } = await request.json();
    const empId = Number(employeeId);
    const newReportsToId = reportsToId === null ? null : Number(reportsToId);

    if (!Number.isInteger(empId)) {
      return Response.json({ error: "Invalid employee id." }, { status: 400 });
    }

    // Verify employee exists
    const [employee] = await db.select().from(employees).where(eq(employees.id, empId)).limit(1);
    if (!employee) {
      return Response.json({ error: "Employee not found." }, { status: 404 });
    }

    if (newReportsToId !== null) {
      if (empId === newReportsToId) {
        return Response.json({ error: "An employee cannot report to themselves." }, { status: 400 });
      }

      // Check circular dependency: is the target employee a manager of the new supervisor?
      const isSubordinate = await isManagerOf(empId, newReportsToId);
      if (isSubordinate) {
        return Response.json({ error: "Circular reporting hierarchy detected (a supervisor cannot report to their own subordinate)." }, { status: 400 });
      }

      // Verify the supervisor exists
      const [supervisor] = await db.select().from(employees).where(eq(employees.id, newReportsToId)).limit(1);
      if (!supervisor) {
        return Response.json({ error: "New supervisor not found." }, { status: 404 });
      }
    } else {
      // Trying to set reportsToId to null. Only one MD can exist in the system.
      // If setting reportsToId to null, verify if there's already an MD or if this employee is changing from MD.
      const [existingMd] = await db.select().from(employees).where(eq(employees.orgRole, "MD")).limit(1);
      if (existingMd && existingMd.id !== empId) {
        return Response.json({ error: "Only one Managing Director (MD) with no supervisor can exist in the system." }, { status: 400 });
      }
    }

    // Apply change
    await db.update(employees).set({ reportsToId: newReportsToId }).where(eq(employees.id, empId));

    // Recalculate orgRoles dynamically based on the hierarchy
    const allEmployees = await db.select().from(employees);
    const reportsToMap = new Set(allEmployees.map(e => e.reportsToId).filter(Boolean) as number[]);
    for (const emp of allEmployees) {
      let orgRole: "MD" | "MANAGER" | "EMPLOYEE" = "EMPLOYEE";
      if (emp.reportsToId === null) {
        orgRole = "MD";
      } else if (reportsToMap.has(emp.id)) {
        orgRole = "MANAGER";
      }
      
      await db.update(employees)
        .set({
          orgRole,
          isAdmin: orgRole === "MD" || orgRole === "MANAGER"
        })
        .where(eq(employees.id, emp.id));
    }

    return Response.json(await getDashboardData());
  } catch (error: any) {
    console.error("Unable to update org hierarchy", error);
    return Response.json({ error: error.message || "Failed to update hierarchy." }, { status: 500 });
  }
}
