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

const categories = await prisma.category.findMany({
  orderBy: {
    name: "asc",
  },
  include: {
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
console.error("ADMIN CATEGORIES GET ERROR:", error);

return NextResponse.json(
  {
    error: "Unable to load categories",
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

export async function POST(request: Request) {
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

const name = String(body.name || "").trim();

if (!name) {
  return NextResponse.json(
    {
      error: "Category name is required",
    },
    {
      status: 400,
    }
  );
}

if (name.length < 2) {
  return NextResponse.json(
    {
      error: "Category name must contain at least 2 characters",
    },
    {
      status: 400,
    }
  );
}

if (name.length > 50) {
  return NextResponse.json(
    {
      error: "Category name cannot exceed 50 characters",
    },
    {
      status: 400,
    }
  );
}

const existingCategory =
  await prisma.category.findUnique({
    where: {
      name,
    },
  });

if (existingCategory) {
  return NextResponse.json(
    {
      error: "A category with this name already exists",
    },
    {
      status: 409,
    }
  );
}

const category = await prisma.category.create({
  data: {
    name,
  },
});

return NextResponse.json(
  {
    message: "Category created successfully",
    category,
  },
  {
    status: 201,
  }
);

} catch (error) {
console.error("ADMIN CATEGORIES POST ERROR:", error);

return NextResponse.json(
  {
    error: "Unable to create category",
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
const name = String(body.name || "").trim();

if (!Number.isInteger(id) || id <= 0) {
  return NextResponse.json(
    {
      error: "Invalid category ID",
    },
    {
      status: 400,
    }
  );
}

if (!name) {
  return NextResponse.json(
    {
      error: "Category name is required",
    },
    {
      status: 400,
    }
  );
}

if (name.length < 2 || name.length > 50) {
  return NextResponse.json(
    {
      error: "Category name must be between 2 and 50 characters",
    },
    {
      status: 400,
    }
  );
}

const category = await prisma.category.findUnique({
  where: {
    id,
  },
});

if (!category) {
  return NextResponse.json(
    {
      error: "Category not found",
    },
    {
      status: 404,
    }
  );
}

const duplicate =
  await prisma.category.findFirst({
    where: {
      name,
      NOT: {
        id,
      },
    },
  });

if (duplicate) {
  return NextResponse.json(
    {
      error: "Another category already uses this name",
    },
    {
      status: 409,
    }
  );
}

const updatedCategory =
  await prisma.category.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });

return NextResponse.json({
  message: "Category updated successfully",
  category: updatedCategory,
});

} catch (error) {
console.error("ADMIN CATEGORIES PUT ERROR:", error);

return NextResponse.json(
  {
    error: "Unable to update category",
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

export async function DELETE(request: Request) {
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

if (!Number.isInteger(id) || id <= 0) {
  return NextResponse.json(
    {
      error: "Invalid category ID",
    },
    {
      status: 400,
    }
  );
}

const category = await prisma.category.findUnique({
  where: {
    id,
  },
  include: {
    _count: {
      select: {
        products: true,
      },
    },
  },
});

if (!category) {
  return NextResponse.json(
    {
      error: "Category not found",
    },
    {
      status: 404,
    }
  );
}

if (category._count.products > 0) {
  return NextResponse.json(
    {
      error:
        "This category contains products. Move or delete the products before deleting the category.",
      productCount: category._count.products,
    },
    {
      status: 409,
    }
  );
}

await prisma.category.delete({
  where: {
    id,
  },
});

return NextResponse.json({
  message: "Category deleted successfully",
});

} catch (error) {
console.error("ADMIN CATEGORIES DELETE ERROR:", error);

return NextResponse.json(
  {
    error: "Unable to delete category",
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
