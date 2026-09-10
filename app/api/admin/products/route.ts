import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { Pool } from "pg";

const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
adapter,
});

async function checkAdmin(request: Request) {
if (!JWT_SECRET) {
return null;
}

const cookieHeader = request.headers.get("cookie") || "";

const token = cookieHeader
.split(";")
.map((cookie) => cookie.trim())
.find((cookie) => cookie.startsWith("shopkart_token="))
?.split("=")[1];

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
  select: {
    role: true,
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

/* =========================
GET PRODUCTS
========================= */

export async function GET(request: Request) {
try {
const admin = await checkAdmin(request);

if (!admin) {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}

const products = await prisma.product.findMany({
  include: {
    category: true,
  },
  orderBy: {
    id: "desc",
  },
});

return NextResponse.json({
  products,
});

} catch (error) {
console.error("Admin products GET error:", error);

return NextResponse.json(
  { error: "Failed to load products" },
  { status: 500 }
);

}
}

/* =========================
CREATE PRODUCT
========================= */

export async function POST(request: Request) {
try {
const admin = await checkAdmin(request);

if (!admin) {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}

const body = await request.json();

const {
  name,
  description,
  price,
  oldPrice,
  image,
  stock,
  rating,
  reviews,
  categoryId,
  isActive,
} = body;

if (!name || price === undefined || stock === undefined || !categoryId) {
  return NextResponse.json(
    {
      error:
        "Name, price, stock and category are required",
    },
    { status: 400 }
  );
}

const category = await prisma.category.findUnique({
  where: {
    id: Number(categoryId),
  },
});

if (!category) {
  return NextResponse.json(
    { error: "Category not found" },
    { status: 400 }
  );
}

const product = await prisma.product.create({
  data: {
    name: String(name).trim(),
    description: description
      ? String(description).trim()
      : null,
    price: Number(price),
    oldPrice:
      oldPrice !== undefined &&
      oldPrice !== null &&
      oldPrice !== ""
        ? Number(oldPrice)
        : null,
    image: image
      ? String(image).trim()
      : null,
    stock: Number(stock),
    rating:
      rating !== undefined &&
      rating !== null &&
      rating !== ""
        ? Number(rating)
        : 0,
    reviews:
      reviews !== undefined &&
      reviews !== null &&
      reviews !== ""
        ? Number(reviews)
        : 0,
    categoryId: Number(categoryId),
    isActive:
      isActive !== undefined
        ? Boolean(isActive)
        : true,
  },
  include: {
    category: true,
  },
});

return NextResponse.json(
  {
    message: "Product created successfully",
    product,
  },
  { status: 201 }
);

} catch (error) {
console.error("Admin products POST error:", error);

return NextResponse.json(
  { error: "Failed to create product" },
  { status: 500 }
);

}
}

/* =========================
UPDATE PRODUCT
========================= */

export async function PUT(request: Request) {
try {
const admin = await checkAdmin(request);

if (!admin) {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}

const body = await request.json();

const {
  id,
  name,
  description,
  price,
  oldPrice,
  image,
  stock,
  rating,
  reviews,
  categoryId,
  isActive,
} = body;

if (!id) {
  return NextResponse.json(
    { error: "Product ID is required" },
    { status: 400 }
  );
}

const existingProduct = await prisma.product.findUnique({
  where: {
    id: Number(id),
  },
});

if (!existingProduct) {
  return NextResponse.json(
    { error: "Product not found" },
    { status: 404 }
  );
}

if (categoryId !== undefined) {
  const category = await prisma.category.findUnique({
    where: {
      id: Number(categoryId),
    },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 400 }
    );
  }
}

const product = await prisma.product.update({
  where: {
    id: Number(id),
  },
  data: {
    ...(name !== undefined && {
      name: String(name).trim(),
    }),

    ...(description !== undefined && {
      description:
        description === ""
          ? null
          : String(description).trim(),
    }),

    ...(price !== undefined && {
      price: Number(price),
    }),

    ...(oldPrice !== undefined && {
      oldPrice:
        oldPrice === "" ||
        oldPrice === null
          ? null
          : Number(oldPrice),
    }),

    ...(image !== undefined && {
      image:
        image === ""
          ? null
          : String(image).trim(),
    }),

    ...(stock !== undefined && {
      stock: Number(stock),
    }),

    ...(rating !== undefined && {
      rating: Number(rating),
    }),

    ...(reviews !== undefined && {
      reviews: Number(reviews),
    }),

    ...(categoryId !== undefined && {
      categoryId: Number(categoryId),
    }),

    ...(isActive !== undefined && {
      isActive: Boolean(isActive),
    }),
  },
  include: {
    category: true,
  },
});

return NextResponse.json({
  message: "Product updated successfully",
  product,
});

} catch (error) {
console.error("Admin products PUT error:", error);

return NextResponse.json(
  { error: "Failed to update product" },
  { status: 500 }
);

}
}

/* =========================
DELETE / DEACTIVATE PRODUCT
========================= */

export async function DELETE(request: Request) {
try {
const admin = await checkAdmin(request);

if (!admin) {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}

const body = await request.json();

const id = Number(body.id);

if (!id) {
  return NextResponse.json(
    { error: "Product ID is required" },
    { status: 400 }
  );
}

const product = await prisma.product.findUnique({
  where: {
    id,
  },
  include: {
    _count: {
      select: {
        orderItems: true,
      },
    },
  },
});

if (!product) {
  return NextResponse.json(
    { error: "Product not found" },
    { status: 404 }
  );
}

/*
  Products with previous orders are not physically
  deleted. They are deactivated instead.
*/

if (product._count.orderItems > 0) {
  const updatedProduct = await prisma.product.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json({
    message:
      "Product has previous orders, so it was deactivated instead of deleted.",
    product: updatedProduct,
  });
}

await prisma.product.delete({
  where: {
    id,
  },
});

return NextResponse.json({
  message: "Product deleted successfully",
});

} catch (error) {
console.error("Admin products DELETE error:", error);

return NextResponse.json(
  { error: "Failed to delete product" },
  { status: 500 }
);

}
}
