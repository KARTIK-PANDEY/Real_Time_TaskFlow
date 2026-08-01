import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userIdStr = searchParams.get("userId");

  if (!userIdStr) {
    return new Response("Missing userId", { status: 400 });
  }

  const userId = Number(userIdStr);
  const encoder = new TextEncoder();

  // Create stream
  const customStream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`: heartbeat\n\n`));

      let lastChecked = new Date();

      const interval = setInterval(async () => {
        try {
          // Check for any unread notifications created after connection start or last check
          const list = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
              )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(5);

          if (list.length > 0) {
            // Push events to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(list)}\n\n`));
          } else {
            // Heartbeat keep-alive
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          }
        } catch (err) {
          console.error("SSE interval loop error:", err);
        }
      }, 3000); // Check every 3 seconds

      // Listen for client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
