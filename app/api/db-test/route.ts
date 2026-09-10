import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

export async function GET() {
  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    const prisma = new PrismaClient({ adapter });

    await prisma.$queryRaw`SELECT 1`;

    await prisma.$disconnect();

    return NextResponse.json({
      status: "SUCCESS",
      message: "Vercel can connect to the database",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}