import { NextResponse } from "next/server";
import "dotenv/config";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";

const adapter = new PrismaPg({
connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
adapter,
});

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: Request) {
try {
if (!JWT_SECRET) {
return NextResponse.json(
{ error: "JWT_SECRET is not configured." },
{ status: 500 }
);
}

const cookieHeader = request.headers.get("cookie");

if (!cookieHeader) {
  return NextResponse.json(
    { error: "Not logged in." },
    { status: 401 }
  );
}

const tokenMatch = cookieHeader
  .split(";")
  .map((cookie) => cookie.trim())
  .find((cookie) =>
    cookie.startsWith("shopkart_token=")
  );

if (!tokenMatch) {
  return NextResponse.json(
    { error: "Not logged in." },
    { status: 401 }
  );
}

const token = tokenMatch.substring(
  "shopkart_token=".length
);

const { payload } = await jwtVerify(
  token,
  new TextEncoder().encode(JWT_SECRET)
);

const userId = Number(payload.userId);

if (!userId) {
  return NextResponse.json(
    { error: "Invalid session." },
    { status: 401 }
  );
}

const user = await prisma.user.findUnique({
  where: {
    id: userId,
  },
  select: {
    id: true,
    name: true,
    email: true,
    mobile: true,
    role: true,
    createdAt: true,
  },
});

if (!user) {
  return NextResponse.json(
    { error: "User not found." },
    { status: 404 }
  );
}

return NextResponse.json({
  user,
});

} catch (error) {
console.error("Authentication error:", error);

return NextResponse.json(
  { error: "Invalid or expired session." },
  { status: 401 }
);

} finally {
await prisma.$disconnect();
}
}
