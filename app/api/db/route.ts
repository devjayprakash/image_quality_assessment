import { NextResponse } from "next/server";
import { db } from "@/db";
import { imageTable, resultsTable, userTable  } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log("Received request:", { action, data });

    switch (action) {
      case "getUser":
        const user = await db.query.userTable.findFirst({
          where: eq(userTable.session_id, data.sessionId),
        });
        console.log("Found user:", user);
        return NextResponse.json({ user });

      case "getLastResult":
        const lastResult = await db.query.resultsTable.findFirst({
          where: eq(resultsTable.user_id, data.userId),
          orderBy: (results, { desc }) => [desc(results.createdAt)],
        });
        console.log("Found last result:", lastResult);
        return NextResponse.json({ lastResult });

      case "getImage":
        const image = await db.query.imageTable.findFirst({
          where: eq(imageTable.id, data.imageId),
        });
        console.log("Found image:", image);
        return NextResponse.json({ image });

      case "getAvailableBatches":
        try {
          const batches = await db.query.batchTable.findMany({
            with: {
              imageBatches: {
                with: {
                  images: true,
                },
              },
            },
          });
          console.log("Found batches:", batches);
          return NextResponse.json({ batches });
        } catch (error) {
          console.error("Error fetching batches:", error);
          return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
        }

      case "createUser":
        const newUser = await db.insert(userTable).values({
          session_id: data.sessionId,
          batch_id: data.batchId,
        }).returning();
        console.log("Created new user:", newUser);
        return NextResponse.json({ user: newUser[0] });

      case "submitScore":
        const result = await db.insert(resultsTable).values({
          image_id: data.imageId,
          score: data.score,
          user_id: data.userId,
        }).returning();
        console.log("Created new result:", result);
        return NextResponse.json({ result: result[0] });

      case "getNextImage":
        const nextImage = await db.query.imageTable.findFirst({
          where: and(
            eq(imageTable.image_batch_id, data.imageBatchId || 0),
            eq(imageTable.id, data.currentImageId + 1)
          ),
        });
        console.log("Found next image:", nextImage);
        return NextResponse.json({ nextImage });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 