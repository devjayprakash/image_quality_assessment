import { NextResponse } from "next/server";
import { db } from "@/db";
import { resultsTable } from "@/db/schema";
import { desc } from "drizzle-orm";

type ResultsResponse = {
  id: string;
  userId: string;
  imageId: string;
  score: number;
  createdAt: Date;
  imageKey: string;
}

export async function GET(req: Request) {
  try {
    // Check authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Basic ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const results = await db.query.resultsTable.findMany({
      orderBy: [desc(resultsTable.createdAt)],
      with: {
        image: true,
      },
    });

    const formattedResults: ResultsResponse[] = results.map((result) => ({
      id: result.id,
      userId: result.user_id,
      imageId: result.image_id,
      score: result.score,
      createdAt: result.createdAt,
      imageKey: result.image.key,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
} 