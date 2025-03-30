import { WebSocketServer } from "ws";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const wss = new WebSocketServer({ noServer: true });

// Store active WebSocket connections
const clients = new Set<WebSocket>();

// Broadcast active sessions to all connected clients
async function broadcastActiveSessions() {
  const users = await db.query.userTable.findMany({
    where: eq(userTable.isActive, true),
    with: {
      results: true,
    },
  });

  const activeSessions = users.map((user) => ({
    userId: user.id,
    lastActive: user.updatedAt,
    currentImageId: user.currentImageId,
    progress: (user.results.length / 100) * 100, // Assuming 100 images per batch
  }));

  const message = JSON.stringify({
    type: "activeSessions",
    sessions: activeSessions,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);

  // Send initial active sessions
  broadcastActiveSessions();

  // Handle client disconnect
  ws.on("close", () => {
    clients.delete(ws);
  });
});

export async function GET(req: Request) {
  if (!req.headers.get("upgrade")?.includes("websocket")) {
    return new NextResponse("Expected Upgrade: WebSocket", { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  // Handle the WebSocket connection
  wss.handleUpgrade(req, socket, Buffer.alloc(0), (ws: WebSocket) => {
    wss.emit("connection", ws);
  });

  return response;
} 