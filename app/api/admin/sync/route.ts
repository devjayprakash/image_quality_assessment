import { NextResponse } from "next/server";
import { syncDataFromS3 } from "@/app/admin/admin.action";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Set up Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const progress of syncDataFromS3()) {
          const data = JSON.stringify(progress) + "\n";
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        console.error("Error during sync:", error);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ error: "Sync failed", details: error }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
} 