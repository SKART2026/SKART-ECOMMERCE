import { NextResponse } from "next/server";
import "dotenv/config";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

const adapter = new PrismaPg({
connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
adapter,
});

const JWT_SECRET = process.env.JWT_SECRET;

async function getUserId(request: Request) {
if (!JWT_SECRET) {
throw new Error("JWT_SECRET is not configured.");
}

const cookieHeader = request.headers.get("cookie");

if (!cookieHeader) {
return null;
}

const tokenMatch = cookieHeader
.split(";")
.map((cookie) => cookie.trim())
.find((cookie) =>
cookie.startsWith("shopkart_token=")
);

if (!tokenMatch) {
return null;
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
return null;
}

return userId;
}

export async function GET(request: Request) {
try {
const userId = await getUserId(request);


if (!userId) {
  return NextResponse.json(
    { error: "Not logged in." },
    { status: 401 }
  );
}

const wishlistItems =
  await prisma.wishlistItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

return NextResponse.json({
  wishlist: wishlistItems,
});


} catch (error) {
console.error("Wishlist GET error:", error);


return NextResponse.json(
  { error: "Unable to load wishlist." },
  { status: 500 }
);


} finally {
await prisma.$disconnect();
}
}

export async function POST(request: Request) {
try {
const userId = await getUserId(request);


if (!userId) {
  return NextResponse.json(
    { error: "Please login first." },
    { status: 401 }
  );
}

const body = await request.json();

const productId = Number(body.productId);

if (!productId) {
  return NextResponse.json(
    { error: "Product ID is required." },
    { status: 400 }
  );
}

const product = await prisma.product.findUnique({
  where: {
    id: productId,
  },
});

if (!product || !product.isActive) {
  return NextResponse.json(
    { error: "Product not found." },
    { status: 404 }
  );
}

const existingItem =
  await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

if (existingItem) {
  return NextResponse.json({
    success: true,
    alreadyExists: true,
    wishlistItem: existingItem,
  });
}

const wishlistItem =
  await prisma.wishlistItem.create({
    data: {
      userId,
      productId,
    },
    include: {
      product: true,
    },
  });

return NextResponse.json({
  success: true,
  wishlistItem,
});


} catch (error) {
console.error("Wishlist POST error:", error);


return NextResponse.json(
  { error: "Unable to add product to wishlist." },
  { status: 500 }
);


} finally {
await prisma.$disconnect();
}
}

export async function DELETE(request: Request) {
try {
const userId = await getUserId(request);


if (!userId) {
  return NextResponse.json(
    { error: "Please login first." },
    { status: 401 }
  );
}

const { searchParams } = new URL(request.url);

const productId = Number(
  searchParams.get("productId")
);

if (!productId) {
  return NextResponse.json(
    { error: "Product ID is required." },
    { status: 400 }
  );
}

await prisma.wishlistItem.delete({
  where: {
    userId_productId: {
      userId,
      productId,
    },
  },
});

return NextResponse.json({
  success: true,
});


} catch (error) {
console.error("Wishlist DELETE error:", error);


return NextResponse.json(
  { error: "Unable to remove wishlist item." },
  { status: 500 }
);


} finally {
await prisma.$disconnect();
}
}
