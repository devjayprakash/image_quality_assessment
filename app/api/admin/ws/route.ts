import { db } from "@/db";
import { userTable } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const users = await db.query.userTable.findMany({
      orderBy: [desc(userTable.updatedAt)],
      with: {
        batch: true,
      },
    });

    const activeSessions = users
      .filter(user => {
        const meta = user.meta as { lastActive?: string } | null;
        if (!meta?.lastActive) return false;
        const lastActive = new Date(meta.lastActive);
        return lastActive > new Date(Date.now() - 5 * 60 * 1000); // Active in last 5 minutes
      })
      .map(user => {
        const meta = user.meta as { lastActive?: string; progress?: number } | null;
        return {
          userId: user.id,
          lastActive: meta?.lastActive ? new Date(meta.lastActive) : user.updatedAt,
          progress: meta?.progress || 0,
          batchId: user.batch_id,
        };
      });

    return Response.json({ sessions: activeSessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return Response.json({ error: "Failed to fetch active sessions" }, { status: 500 });
  }
} 