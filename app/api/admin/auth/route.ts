import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    return new NextResponse("Authentication required", { status: 401 });
  }

  const [type, credentials] = authHeader.split(" ");
  if (type !== "Basic") {
    return new NextResponse("Invalid authentication type", { status: 401 });
  }

  const [email, password] = Buffer.from(credentials, "base64")
    .toString()
    .split(":");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }

  return NextResponse.json({ success: true });
} 