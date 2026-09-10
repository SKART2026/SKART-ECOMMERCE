import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("DATABASE TEST ERROR:", error);

    return NextResponse.json(
      {
        error: "Database connection failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}