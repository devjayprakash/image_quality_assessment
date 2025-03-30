import { NextResponse } from "next/server";
import { db } from "@/db";
import { userTable, imageTable, resultsTable } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get total users
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTable)
      .then((result) => result[0].count);

    // Get total images
    const totalImages = await db
      .select({ count: sql<number>`count(*)` })
      .from(imageTable)
      .then((result) => result[0].count);

    // Get total results
    const totalResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(resultsTable)
      .then((result) => result[0].count);

    // Get active sessions (users who have submitted results in the last hour)
    const activeSessions = await db
      .select({ count: sql<number>`count(distinct ${userTable.id})` })
      .from(userTable)
      .innerJoin(
        resultsTable,
        sql`${resultsTable.user_id} = ${userTable.id}`
      )
      .where(
        sql`${resultsTable.createdAt} > now() - interval '1 hour'`
      )
      .then((result) => result[0].count);

    return NextResponse.json({
      totalUsers,
      totalImages,
      totalResults,
      activeSessions,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
} 