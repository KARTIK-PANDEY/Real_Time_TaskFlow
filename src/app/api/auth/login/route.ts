import { db } from "@/db";
import { employees } from "@/db/schema";
import { ensureSeedData } from "@/lib/dashboard-data";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email/User ID and password are required." }, { status: 400 });
    }

    const inputVal = email.toLowerCase().trim();

    // Lookup employee by email or loginId
    const [employee] = await db
      .select()
      .from(employees)
      .where(
        or(
          eq(employees.email, inputVal),
          eq(employees.loginId, inputVal)
        )
      )
      .limit(1);

    if (!employee) {
      return Response.json({ error: "Employee email or User ID not registered." }, { status: 404 });
    }

    // Exact password check
    if (password !== employee.password) {
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }

    // Compute initials
    const initials = employee.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return Response.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        avatarColor: employee.avatarColor,
        status: employee.status,
        initials,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return Response.json({ error: error.message || "Failed to log in." }, { status: 500 });
  }
}
