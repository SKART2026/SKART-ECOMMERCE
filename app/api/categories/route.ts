import { NextResponse } from "next/server";
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

export async function GET() {
try {
const categories = await prisma.category.findMany({
orderBy: {
name: "asc",
},
select: {
id: true,
name: true,
_count: {
select: {
products: true,
},
},
},
});

return NextResponse.json({
  categories,
});

} catch (error) {
console.error("Categories API error:", error);

return NextResponse.json(
  {
    error: "Failed to load categories",
  },
  {
    status: 500,
  }
);

}
}
