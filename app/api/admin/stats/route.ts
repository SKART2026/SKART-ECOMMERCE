import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { Pool } from "pg";

const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
adapter,
});

export async function GET(request: Request) {
try {
if (!JWT_SECRET) {
return NextResponse.json(
{ error: "JWT_SECRET is not configured" },
{ status: 500 }
);
}

const cookieHeader = request.headers.get("cookie") || "";

const token = cookieHeader
  .split(";")
  .map((cookie) => cookie.trim())
  .find((cookie) => cookie.startsWith("shopkart_token="))
  ?.split("=")[1];

if (!token) {
  return NextResponse.json(
    { error: "Not logged in" },
    { status: 401 }
  );
}

const payload = jwt.verify(token, JWT_SECRET) as {
  userId?: number;
};

if (!payload.userId) {
  return NextResponse.json(
    { error: "Invalid login session" },
    { status: 401 }
  );
}

const admin = await prisma.user.findUnique({
  where: {
    id: Number(payload.userId),
  },
  select: {
    role: true,
  },
});

if (!admin || admin.role !== "ADMIN") {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}

const [
  totalOrders,
  totalCustomers,
  totalProducts,
  salesResult,
  pendingOrders,
  processingOrders,
  shippedOrders,
  deliveredOrders,
  cancelledOrders,
] = await Promise.all([
  prisma.order.count(),

  prisma.user.count({
    where: {
      role: "CUSTOMER",
    },
  }),

  prisma.product.count(),

  prisma.order.aggregate({
    _sum: {
      total: true,
    },
    where: {
      status: {
        not: "CANCELLED",
      },
    },
  }),

  prisma.order.count({
    where: {
      status: "PENDING",
    },
  }),

  prisma.order.count({
    where: {
      status: "PROCESSING",
    },
  }),

  prisma.order.count({
    where: {
      status: "SHIPPED",
    },
  }),

  prisma.order.count({
    where: {
      status: "DELIVERED",
    },
  }),

  prisma.order.count({
    where: {
      status: "CANCELLED",
    },
  }),
]);

return NextResponse.json({
  totalOrders,
  totalCustomers,
  totalProducts,
  totalSales: salesResult._sum.total || 0,
  pendingOrders,
  processingOrders,
  shippedOrders,
  deliveredOrders,
  cancelledOrders,
});

} catch (error) {
console.error("Admin stats error:", error);

return NextResponse.json(
  { error: "Failed to load admin statistics" },
  { status: 500 }
);

}
}
