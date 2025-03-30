import { NextResponse } from "next/server";
import { db } from "@/db";
import { resultsTable } from "@/db/schema";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json(
        { error: "Authentication required", details: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: number };
      const userId = decoded.userId;

      // Parse request body
      const body = await req.json();
      const { imageId, score } = body;

      if (!imageId || typeof score !== "number") {
        console.error("Invalid request body:", body);
        return NextResponse.json(
          { error: "Invalid request", details: "Missing or invalid imageId or score" },
          { status: 400 }
        );
      }

      console.log("Submitting score:", { userId, imageId, score });

      // Insert the score
      await db.insert(resultsTable).values({
        user_id: userId,
        image_id: imageId,
        score: score,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Invalid or expired token:", error);
      return NextResponse.json(
        { error: "Authentication failed", details: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { 
        error: "Failed to submit score", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 