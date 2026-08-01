import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const employeeStatusEnum = pgEnum("employee_status", [
  "online",
  "focus",
  "away",
  "offline",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "review",
  "completed",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  loginId: varchar("login_id", { length: 60 }).unique(),
  password: varchar("password", { length: 100 }).notNull().default("password123"),
  role: varchar("role", { length: 120 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  avatarColor: varchar("avatar_color", { length: 20 }).notNull(),
  status: employeeStatusEnum("status").notNull().default("offline"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull().default(""),
  project: varchar("project", { length: 120 }).notNull(),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assigneeId: integer("assignee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes").notNull().default(60),
  trackedMinutes: integer("tracked_minutes").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, {
    onDelete: "set null",
  }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  action: varchar("action", { length: 80 }).notNull(),
  detail: varchar("detail", { length: 260 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 150 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Employee = typeof employees.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
