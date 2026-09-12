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
    .find((cookie) => cookie.startsWith("shopkart_token="));

  if (!tokenMatch) {
    return null;
  }

  const token = tokenMatch.substring("shopkart_token=".length);

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

    const cartItems = await prisma.cartItem.findMany({
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
      cart: cartItems,
    });
  } catch (error) {
    console.error("Cart GET error:", error);

    return NextResponse.json(
      { error: "Unable to load cart." },
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
    const quantity = Number(body.quantity || 1);

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid product or quantity." },
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

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "Requested quantity is not available." },
        { status: 400 }
      );
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      return NextResponse.json(
        { error: `Only ${product.stock} item(s) available.` },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({
      success: true,
      cartItem,
    });
  } catch (error) {
    console.error("Cart POST error:", error);

    return NextResponse.json(
      { error: "Unable to add product to cart." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
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
    const quantity = Number(body.quantity);

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid product or quantity." },
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

    if (quantity > product.stock) {
      return NextResponse.json(
        { error: `Only ${product.stock} item(s) available.` },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      data: {
        quantity,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({
      success: true,
      cartItem,
    });
  } catch (error) {
    console.error("Cart PUT error:", error);

    return NextResponse.json(
      { error: "Unable to update cart." },
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
    const productId = Number(searchParams.get("productId"));

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    await prisma.cartItem.delete({
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
    console.error("Cart DELETE error:", error);

    return NextResponse.json(
      { error: "Unable to remove cart item." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}