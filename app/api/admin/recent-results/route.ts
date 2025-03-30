import { NextResponse } from "next/server";
import { db } from "@/db";
import { resultTable, imageTable } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const results = await db.query.resultTable.findMany({
      orderBy: [desc(resultTable.createdAt)],
      limit: 10,
      with: {
        image: true,
      },
    });

    const formattedResults = results.map((result) => ({
      id: result.id,
      userId: result.user_id,
      imageId: result.image_id,
      score: result.score,
      createdAt: result.createdAt,
      imageKey: result.image.key,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error fetching recent results:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent results" },
      { status: 500 }
    );
  }
} 