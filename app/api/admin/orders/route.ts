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

const orders = await prisma.order.findMany({
  orderBy: {
    createdAt: "desc",
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
    },
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
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    },
    payments: true,
  },
});

return NextResponse.json({
  orders,
});

} catch (error) {
console.error("ADMIN ORDERS GET ERROR:", error);

return NextResponse.json(
  {
    error: "Unable to load orders",
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

export async function PUT(request: Request) {
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

const body = await request.json();

const id = Number(body.id);
const newStatus = String(body.status || "").toUpperCase();

if (!Number.isInteger(id) || id <= 0) {
  return NextResponse.json(
    {
      error: "Invalid order ID",
    },
    {
      status: 400,
    }
  );
}

const allowedStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

if (!allowedStatuses.includes(newStatus)) {
  return NextResponse.json(
    {
      error: "Invalid order status",
    },
    {
      status: 400,
    }
  );
}

const existingOrder = await prisma.order.findUnique({
  where: {
    id,
  },
  include: {
    items: true,
    payments: true,
  },
});

if (!existingOrder) {
  return NextResponse.json(
    {
      error: "Order not found",
    },
    {
      status: 404,
    }
  );
}

const oldStatus = String(existingOrder.status);
const paymentMethod = String(existingOrder.paymentMethod);

if (oldStatus === newStatus) {
  return NextResponse.json(
    {
      error: `Order is already ${newStatus}.`,
    },
    {
      status: 400,
    }
  );
}

if (oldStatus === "DELIVERED") {
  return NextResponse.json(
    {
      error: "A delivered order cannot be changed.",
    },
    {
      status: 400,
    }
  );
}

if (oldStatus === "CANCELLED") {
  return NextResponse.json(
    {
      error: "A cancelled order cannot be reopened.",
    },
    {
      status: 400,
    }
  );
}

if (
  newStatus === "CANCELLED" &&
  oldStatus === "SHIPPED"
) {
  return NextResponse.json(
    {
      error: "A shipped order cannot be cancelled.",
    },
    {
      status: 400,
    }
  );
}

const updatedOrder = await prisma.$transaction(async (tx) => {

  /*
   * RESTORE STOCK WHEN ORDER IS CANCELLED
   */
  if (
    newStatus === "CANCELLED" &&
    oldStatus !== "CANCELLED"
  ) {
    for (const item of existingOrder.items) {
      const product = await tx.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new Error(
          `Product ${item.productId} not found`
        );
      }

      await tx.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: product.stock + item.quantity,
        },
      });
    }
  }

  /*
   * DETERMINE CORRECT PAYMENT STATUS
   *
   * COD:
   * - Delivered = PAID
   * - Cancelled = PENDING
   *
   * UPI / CARD:
   * - Remain PENDING until a real payment gateway
   *   confirms successful payment.
   */
  let newPaymentStatus:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED" = "PENDING";

  if (
    newStatus === "DELIVERED" &&
    paymentMethod === "COD"
  ) {
    newPaymentStatus = "PAID";
  }

  if (
    newStatus === "CANCELLED" &&
    paymentMethod !== "COD"
  ) {
    const wasAlreadyPaid =
      existingOrder.paymentStatus === "PAID";

    newPaymentStatus = wasAlreadyPaid
      ? "REFUNDED"
      : "PENDING";
  }

  if (
    newStatus === "CANCELLED" &&
    paymentMethod === "COD"
  ) {
    newPaymentStatus = "PENDING";
  }

  /*
   * UPDATE ORDER
   */
  const order = await tx.order.update({
    where: {
      id,
    },
    data: {
      status:
        newStatus as
          | "PENDING"
          | "CONFIRMED"
          | "PROCESSING"
          | "SHIPPED"
          | "DELIVERED"
          | "CANCELLED",

      paymentStatus: newPaymentStatus,
    },
  });

  /*
   * UPDATE PAYMENT RECORDS
   *
   * Keep the Payment table synchronized with
   * the Order payment status.
   */
  if (existingOrder.payments.length > 0) {
    await tx.payment.updateMany({
      where: {
        orderId: id,
      },
      data: {
        status: newPaymentStatus,
      },
    });
  }

  return order;
});

const completeOrder = await prisma.order.findUnique({
  where: {
    id: updatedOrder.id,
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
    },
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
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            stock: true,
          },
        },
      },
    },
    payments: true,
  },
});

return NextResponse.json({
  message:
    newStatus === "CANCELLED"
      ? "Order cancelled and stock restored successfully."
      : "Order status and payment status updated successfully.",
  order: completeOrder,
});

} catch (error) {
console.error("ADMIN ORDERS PUT ERROR:", error);

return NextResponse.json(
  {
    error:
      error instanceof Error
        ? error.message
        : "Unable to update order",
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
