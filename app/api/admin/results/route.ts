import { NextResponse } from "next/server";
import { db } from "@/db";
import { resultsTable } from "@/db/schema";
import { desc } from "drizzle-orm";

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
        image: {
          with: {
            imageBatch: {
              with: {
                batch: true,
              },
            },
          },
        },
        user: true,
      },
    });

    // Group results by batch and image batch
    const groupedResults = results.reduce((acc, result) => {
      if (!result.image?.imageBatch?.batch) return acc;

      const batchId = result.image.imageBatch.batch.id;
      const imageBatchId = result.image.imageBatch.id;
      const className = result.image.imageBatch.class_name;

      if (!acc[batchId]) {
        acc[batchId] = {
          id: batchId,
          createdAt: result.image.imageBatch.batch.createdAt,
          imageBatches: {},
        };
      }

      if (!acc[batchId].imageBatches[imageBatchId]) {
        acc[batchId].imageBatches[imageBatchId] = {
          id: imageBatchId,
          className,
          results: [],
        };
      }

      acc[batchId].imageBatches[imageBatchId].results.push({
        id: result.id,
        userId: String(result.user_id),
        score: result.score,
        createdAt: result.createdAt,
        imageKey: result.image.key || "",
      });

      return acc;
    }, {} as Record<number, any>);

    // Convert to array format
    const formattedResults = Object.values(groupedResults).map((batch: any) => ({
      ...batch,
      imageBatches: Object.values(batch.imageBatches),
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