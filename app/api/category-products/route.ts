import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
prisma: PrismaClient | undefined;
pool: Pool | undefined;
};

const pool =
globalForPrisma.pool ??
new Pool({
connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma =
globalForPrisma.prisma ??
new PrismaClient({
adapter,
});

if (process.env.NODE_ENV !== "production") {
globalForPrisma.pool = pool;
globalForPrisma.prisma = prisma;
}

export async function GET(request: NextRequest) {
try {
const categoryId = request.nextUrl.searchParams.get("categoryId");

if (!categoryId) {
  return NextResponse.json(
    { error: "Category ID is required" },
    { status: 400 }
  );
}

const id = Number(categoryId);

if (!Number.isInteger(id)) {
  return NextResponse.json(
    { error: "Invalid category ID" },
    { status: 400 }
  );
}

const category = await prisma.category.findUnique({
  where: {
    id,
  },
  select: {
    id: true,
    name: true,
  },
});

if (!category) {
  return NextResponse.json(
    { error: "Category not found" },
    { status: 404 }
  );
}

const products = await prisma.product.findMany({
  where: {
    categoryId: id,
    isActive: true,
  },
  orderBy: {
    name: "asc",
  },
  select: {
    id: true,
    name: true,
    description: true,
    price: true,
    oldPrice: true,
    image: true,
    stock: true,
    rating: true,
    reviews: true,
    categoryId: true,
  },
});

return NextResponse.json({
  category,
  products,
});

} catch (error) {
console.error("Category products error:", error);

return NextResponse.json(
  { error: "Failed to load category products" },
  { status: 500 }
);

}
}
