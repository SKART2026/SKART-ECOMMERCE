import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { Pool } from "pg";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
throw new Error("JWT_SECRET is not configured");
}

export async function GET(
request: Request,
context: {
params: Promise<{ id: string }>;
}
) {
const cookieStore = await cookies();
const token = cookieStore.get("shopkart_token")?.value;

if (!token) {
return NextResponse.json(
{ error: "Please login to view this order" },
{ status: 401 }
);
}

let userId: number;

try {
const secret = new TextEncoder().encode(JWT_SECRET);

const { payload } = await jwtVerify(token, secret);

if (!payload.userId) {
  return NextResponse.json(
    { error: "Invalid login session" },
    { status: 401 }
  );
}

userId = Number(payload.userId);

} catch {
return NextResponse.json(
{ error: "Invalid login session" },
{ status: 401 }
);
}

const { id } = await context.params;
const orderId = Number(id);

if (!Number.isInteger(orderId)) {
return NextResponse.json(
{ error: "Invalid order ID" },
{ status: 400 }
);
}

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
const order = await prisma.order.findFirst({
where: {
id: orderId,
userId,
},
include: {
items: {
include: {
product: true,
},
},
address: true,
payments: true,
},
});

if (!order) {
  return NextResponse.json(
    { error: "Order not found" },
    { status: 404 }
  );
}

return NextResponse.json({
  success: true,
  order,
});

} catch (error) {
console.error("GET ORDER DETAILS ERROR:", error);

return NextResponse.json(
  { error: "Failed to load order details" },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
await pool.end();
}
}
