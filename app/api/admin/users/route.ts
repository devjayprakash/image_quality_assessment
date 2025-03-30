import { db } from "@/db";
import { userTable } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const users = await db.query.userTable.findMany({
      orderBy: [desc(userTable.createdAt)],
    });

    return Response.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
} 