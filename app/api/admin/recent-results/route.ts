import { db } from "@/db";
import { resultsTable } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const recentResults = await db.query.resultsTable.findMany({
      orderBy: [desc(resultsTable.createdAt)],
      limit: 10,
    });

    return Response.json(recentResults);
  } catch (error) {
    console.error("Error fetching recent results:", error);
    return Response.json({ error: "Failed to fetch recent results" }, { status: 500 });
  }
} 