import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const JWT_SECRET = process.env.JWT_SECRET;

function getTokenFromRequest(request: Request) {
const cookieHeader = request.headers.get("cookie") || "";

const tokenCookie = cookieHeader
.split(";")
.map((cookie) => cookie.trim())
.find((cookie) => cookie.startsWith("shopkart_token="));

if (!tokenCookie) {
return null;
}

return tokenCookie.substring("shopkart_token=".length);
}

function createPrisma() {
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
throw new Error("DATABASE_URL is not configured");
}

const pool = new Pool({
connectionString,
max: 5,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
adapter,
});

return { prisma, pool };
}

async function getAdminUser(
request: Request,
prisma: PrismaClient
) {
if (!JWT_SECRET) {
throw new Error("JWT_SECRET is not configured");
}

const token = getTokenFromRequest(request);

if (!token) {
return null;
}

try {
const payload = jwt.verify(token, JWT_SECRET) as {
userId?: number;
};

if (!payload.userId) {
  return null;
}

const user = await prisma.user.findUnique({
  where: {
    id: Number(payload.userId),
  },
});

if (!user || user.role !== "ADMIN") {
  return null;
}

return user;

} catch {
return null;
}
}

export async function GET(request: Request) {
const { prisma, pool } = createPrisma();

try {
const admin = await getAdminUser(request, prisma);

if (!admin) {
  return NextResponse.json(
    {
      error: "Unauthorized. Admin access required.",
    },
    {
      status: 403,
    }
  );
}

const customers = await prisma.user.findMany({
  where: {
    role: "CUSTOMER",
  },
  orderBy: {
    createdAt: "desc",
  },
  select: {
    id: true,
    name: true,
    email: true,
    mobile: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        orders: true,
      },
    },
    orders: {
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        address: {
          select: {
            fullName: true,
            mobile: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    },
  },
});

const formattedCustomers = customers.map((customer) => {
  const activeOrders = customer.orders.filter(
    (order) => order.status !== "CANCELLED"
  );

  const totalSpent = activeOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    mobile: customer.mobile,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    orderCount: customer._count.orders,
    totalSpent,
    orders: customer.orders,
  };
});

const totalCustomers = formattedCustomers.length;

const totalOrders = formattedCustomers.reduce(
  (sum, customer) => sum + customer.orderCount,
  0
);

const totalSales = formattedCustomers.reduce(
  (sum, customer) => sum + customer.totalSpent,
  0
);

return NextResponse.json({
  customers: formattedCustomers,
  summary: {
    totalCustomers,
    totalOrders,
    totalSales,
  },
});

} catch (error) {
console.error("ADMIN CUSTOMERS GET ERROR:", error);

return NextResponse.json(
  {
    error: "Unable to load customers",
  },
  {
    status: 500,
  }
);

} finally {
await prisma.$disconnect();
await pool.end();
}
}
