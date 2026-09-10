import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import jwt from "jsonwebtoken";

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET;

function getUserIdFromRequest(request: Request): number | null {
if (!JWT_SECRET) {
return null;
}

const cookieHeader = request.headers.get("cookie") || "";

const tokenCookie = cookieHeader
.split(";")
.map((cookie) => cookie.trim())
.find((cookie) => cookie.startsWith("shopkart_token="));

if (!tokenCookie) {
return null;
}

const token = tokenCookie.substring("shopkart_token=".length);

try {
const payload = jwt.verify(token, JWT_SECRET) as {
userId?: number;
};

if (!payload.userId) {
  return null;
}

return Number(payload.userId);

} catch {
return null;
}
}

export async function GET(request: Request) {
try {
const { searchParams } = new URL(request.url);
const productId = Number(searchParams.get("productId"));

if (!productId || Number.isNaN(productId)) {
  return NextResponse.json(
    { error: "Valid productId is required" },
    { status: 400 }
  );
}

const reviews = await prisma.review.findMany({
  where: {
    productId,
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});

return NextResponse.json({ reviews });

} catch (error) {
console.error("GET REVIEWS ERROR:", error);

return NextResponse.json(
  { error: "Failed to load reviews" },
  { status: 500 }
);

}
}

export async function POST(request: Request) {
try {
const userId = getUserIdFromRequest(request);

if (!userId) {
  return NextResponse.json(
    { error: "Please login to submit a review" },
    { status: 401 }
  );
}

const body = await request.json();

const productId = Number(body.productId);
const rating = Number(body.rating);
const comment =
  typeof body.comment === "string" ? body.comment.trim() : "";

if (!productId || Number.isNaN(productId)) {
  return NextResponse.json(
    { error: "Valid productId is required" },
    { status: 400 }
  );
}

if (!rating || rating < 1 || rating > 5) {
  return NextResponse.json(
    { error: "Rating must be between 1 and 5" },
    { status: 400 }
  );
}

const product = await prisma.product.findUnique({
  where: {
    id: productId,
  },
});

if (!product) {
  return NextResponse.json(
    { error: "Product not found" },
    { status: 404 }
  );
}

const review = await prisma.review.upsert({
  where: {
    userId_productId: {
      userId,
      productId,
    },
  },
  update: {
    rating,
    comment: comment || null,
  },
  create: {
    userId,
    productId,
    rating,
    comment: comment || null,
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});

await updateProductRating(productId);

return NextResponse.json({
  message: "Review saved successfully",
  review,
});

} catch (error) {
console.error("POST REVIEW ERROR:", error);

return NextResponse.json(
  { error: "Failed to save review" },
  { status: 500 }
);

}
}

export async function DELETE(request: Request) {
try {
const userId = getUserIdFromRequest(request);

if (!userId) {
  return NextResponse.json(
    { error: "Please login first" },
    { status: 401 }
  );
}

const { searchParams } = new URL(request.url);
const reviewId = Number(searchParams.get("id"));

if (!reviewId || Number.isNaN(reviewId)) {
  return NextResponse.json(
    { error: "Valid review id is required" },
    { status: 400 }
  );
}

const review = await prisma.review.findUnique({
  where: {
    id: reviewId,
  },
});

if (!review) {
  return NextResponse.json(
    { error: "Review not found" },
    { status: 404 }
  );
}

if (review.userId !== userId) {
  return NextResponse.json(
    { error: "You can only delete your own review" },
    { status: 403 }
  );
}

await prisma.review.delete({
  where: {
    id: reviewId,
  },
});

await updateProductRating(review.productId);

return NextResponse.json({
  message: "Review deleted successfully",
});

} catch (error) {
console.error("DELETE REVIEW ERROR:", error);

return NextResponse.json(
  { error: "Failed to delete review" },
  { status: 500 }
);

}
}

async function updateProductRating(productId: number) {
const ratingSummary = await prisma.review.aggregate({
where: {
productId,
},
_avg: {
rating: true,
},
_count: {
rating: true,
},
});

await prisma.product.update({
where: {
id: productId,
},
data: {
rating: ratingSummary._avg.rating
? Number(ratingSummary._avg.rating.toFixed(1))
: 0,
reviews: ratingSummary._count.rating,
},
});
}
