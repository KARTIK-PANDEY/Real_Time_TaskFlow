import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get("userId");
    if (!userIdStr) {
      return Response.json({ error: "Missing userId parameter." }, { status: 400 });
    }

    const userId = Number(userIdStr);
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return Response.json(list, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    console.error("Notifications GET error:", error);
    return Response.json({ error: error.message || "Failed to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, notificationId } = await request.json();

    if (!userId) {
      return Response.json({ error: "Missing userId." }, { status: 400 });
    }

    if (notificationId) {
      // Mark specific notification as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, Number(notificationId)),
            eq(notifications.userId, Number(userId))
          )
        );
    } else {
      // Mark all as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, Number(userId)));
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Notifications PATCH error:", error);
    return Response.json({ error: error.message || "Failed to update notifications." }, { status: 500 });
  }
}
