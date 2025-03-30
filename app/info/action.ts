"use server";
import { db } from "@/db";
import { batchTable, userTable } from "@/db/schema";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import { count, eq } from "drizzle-orm";

export const createSession = async () => {
  console.log("Starting server-side session creation...");
  
  const batchesWithUserCount = await db
    .select({
      batchId: batchTable.id,
      createdAt: batchTable.createdAt,
      userCount: count(userTable.id)
    })
    .from(batchTable)
    .leftJoin(userTable, eq(batchTable.id, userTable.batch_id))
    .groupBy(batchTable.id, batchTable.createdAt);

  console.log("Found batches:", batchesWithUserCount);

  const sortedBatches = batchesWithUserCount.sort((a, b) => a.userCount - b.userCount);
  console.log("Sorted batches:", sortedBatches);

  if (sortedBatches.length === 0) {
    console.error("No batches found");
    return {
      result: false,
      msg: "No batches available",
      session_id: null,
    };
  }

  try {
    console.log("Creating new user in batch:", sortedBatches[0].batchId);
    const new_user = await db
      .insert(userTable)
      .values({
        session_id: v4(),
        batch_id: sortedBatches[0].batchId
      })
      .returning();

    console.log("New user created:", new_user);

    if (!new_user || new_user.length === 0) {
      console.error("Failed to create user");
      return {
        result: false,
        msg: "Error creating user",
        session_id: null,
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: new_user[0].id,
        sessionId: new_user[0].session_id 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    return {
      result: true,
      msg: "Session created successfully",
      session_id: token,
    };
  } catch (error) {
    console.error("Error in createSession:", error);
    return {
      result: false,
      msg: error instanceof Error ? error.message : "Error creating session",
      session_id: null,
    };
  }
};
