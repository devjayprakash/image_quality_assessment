import { NextResponse } from "next/server";
import { db } from "@/db";
import { userTable } from "@/db/schema";
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

    const users = await db.query.userTable.findMany({
      orderBy: [desc(userTable.createdAt)],
      with: {
        results: true,
      },
    });

    // Ensure we return an array even if no users are found
    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json([], { status: 500 }); // Return empty array on error
  }
} 