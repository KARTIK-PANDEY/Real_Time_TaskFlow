import { db } from "@/db";
import { employees } from "@/db/schema";
import { ensureSeedData } from "@/lib/dashboard-data";
import { eq, or } from "drizzle-orm";

const AVATAR_COLORS = [
  "#ec8d72",
  "#6877c9",
  "#58a998",
  "#d5a34a",
  "#a870b8",
  "#3c9b87",
  "#e77862"
];

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const { name, email, loginId, role, department, password } = await request.json();

    if (!name || !email || !role || !department || !password) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanLoginId = (loginId || name.split(" ")[0]).toLowerCase().trim();

    // Check if email or User ID already registered
    const [existing] = await db
      .select()
      .from(employees)
      .where(or(eq(employees.email, cleanEmail), eq(employees.loginId, cleanLoginId)))
      .limit(1);

    if (existing) {
      return Response.json({ error: "Email or User ID is already registered." }, { status: 409 });
    }

    // Pick random avatar color
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    // Insert new employee
    const [newEmployee] = await db
      .insert(employees)
      .values({
        name: name.trim(),
        email: cleanEmail,
        loginId: cleanLoginId,
        password: password,
        role: role.trim(),
        department: department.trim(),
        avatarColor,
        status: "online",
        isActive: true,
      })
      .returning();

    // Compute initials
    const initials = newEmployee.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return Response.json({
      success: true,
      user: {
        id: newEmployee.id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        avatarColor: newEmployee.avatarColor,
        status: newEmployee.status,
        initials,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return Response.json({ error: error.message || "Failed to sign up." }, { status: 500 });
  }
}
