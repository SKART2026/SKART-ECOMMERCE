import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { Pool } from "pg";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
throw new Error("JWT_SECRET is not configured");
}

function getPrisma() {
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

return {
prisma: new PrismaClient({ adapter }),
pool,
};
}

async function getUserId() {
const cookieStore = await cookies();
const token = cookieStore.get("shopkart_token")?.value;

if (!token) {
return null;
}

try {
const secret = new TextEncoder().encode(JWT_SECRET);

const { payload } = await jwtVerify(token, secret);

if (!payload.userId) {
  return null;
}

return Number(payload.userId);

} catch {
return null;
}
}

/* GET - Get logged-in customer's orders */
export async function GET() {
const userId = await getUserId();

if (!userId) {
return NextResponse.json(
{ error: "Please login to view your orders" },
{ status: 401 }
);
}

const { prisma, pool } = getPrisma();

try {
const orders = await prisma.order.findMany({
where: {
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
orderBy: {
createdAt: "desc",
},
});

return NextResponse.json({
  success: true,
  orders,
});

} catch (error) {
console.error("GET ORDERS ERROR:", error);

return NextResponse.json(
  { error: "Failed to load orders" },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
await pool.end();
}
}

/* POST - Create new order */
export async function POST(request: NextRequest) {
const userId = await getUserId();

if (!userId) {
return NextResponse.json(
{ error: "Please login before placing an order" },
{ status: 401 }
);
}

const { prisma, pool } = getPrisma();

try {
const body = await request.json();

const {
  addressId,
  paymentMethod,
  items,
} = body;

if (!addressId) {
  return NextResponse.json(
    { error: "Please select a delivery address" },
    { status: 400 }
  );
}

if (!paymentMethod) {
  return NextResponse.json(
    { error: "Please select a payment method" },
    { status: 400 }
  );
}

if (!items || !Array.isArray(items) || items.length === 0) {
  return NextResponse.json(
    { error: "Your cart is empty" },
    { status: 400 }
  );
}

const address = await prisma.address.findFirst({
  where: {
    id: Number(addressId),
    userId,
  },
});

if (!address) {
  return NextResponse.json(
    { error: "Invalid delivery address" },
    { status: 400 }
  );
}

const productIds = items.map((item: any) => Number(item.productId));

const products = await prisma.product.findMany({
  where: {
    id: {
      in: productIds,
    },
    isActive: true,
  },
});

if (products.length !== items.length) {
  return NextResponse.json(
    { error: "One or more products are no longer available" },
    { status: 400 }
  );
}

let subtotal = 0;

const orderItems = items.map((item: any) => {
  const product = products.find(
    (p) => p.id === Number(item.productId)
  );

  if (!product) {
    throw new Error("Product not found");
  }

  const quantity = Number(item.quantity);

  if (quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  if (product.stock < quantity) {
    throw new Error(
      `${product.name} has only ${product.stock} item(s) available`
    );
  }

  const itemTotal = product.price * quantity;

  subtotal += itemTotal;

  return {
    productId: product.id,
    quantity,
    price: product.price,
  };
});

const deliveryFee = subtotal >= 999 ? 0 : 49;
const total = subtotal + deliveryFee;

const orderNumber =
  "SK" +
  Date.now() +
  Math.floor(100 + Math.random() * 900);

const order = await prisma.$transaction(async (tx) => {
  const createdOrder = await tx.order.create({
    data: {
      userId,
      addressId: Number(addressId),
      orderNumber,
      status: "CONFIRMED",
      paymentMethod,
      paymentStatus: "PENDING",
      subtotal,
      deliveryFee,
      total,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      address: true,
    },
  });

  for (const item of orderItems) {
    await tx.product.update({
      where: {
        id: item.productId,
      },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  }

  await tx.payment.create({
    data: {
      orderId: createdOrder.id,
      amount: total,
      method: paymentMethod,
      status: "PENDING",
    },
  });

  return createdOrder;
});

return NextResponse.json({
  success: true,
  message: "Order placed successfully",
  order,
});

} catch (error: any) {
console.error("CREATE ORDER ERROR:", error);

return NextResponse.json(
  {
    error:
      error?.message || "Failed to place order",
  },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
await pool.end();
}
}
