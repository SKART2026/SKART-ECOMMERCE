import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { jwtVerify } from "jose";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const JWT_SECRET = process.env.JWT_SECRET;

function getTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const tokenMatch = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("shopkart_token="));

  if (!tokenMatch) {
    return null;
  }

  return tokenMatch.substring("shopkart_token=".length);
}

async function getLoggedInUser(request: Request) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(JWT_SECRET)
  );

  const userId = Number(payload.userId);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return user;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const productId = Number(
      url.searchParams.get("productId")
    );

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json({
      reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error("REVIEWS GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load reviews.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getLoggedInUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Please login to submit a review.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          error: "Only customer accounts can submit reviews.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const productId = Number(body.productId);
    const rating = Number(body.rating);
    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          error: "Rating must be between 1 and 5.",
        },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        {
          error: "Review comment cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        rating: true,
        reviews: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          error:
            "You have already reviewed this product.",
        },
        { status: 409 }
      );
    }

    const oldReviewCount = Number(product.reviews || 0);
    const oldRating = Number(product.rating || 0);

    const newReviewCount = oldReviewCount + 1;

    const newRating =
      oldReviewCount > 0
        ? (oldRating * oldReviewCount + rating) /
          newReviewCount
        : rating;

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          userId: user.id,
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

      await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          rating: Number(newRating.toFixed(1)),
          reviews: newReviewCount,
        },
      });

      return createdReview;
    });

    return NextResponse.json(
      {
        message: "Review submitted successfully.",
        review,
        rating: Number(newRating.toFixed(1)),
        reviews: newReviewCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REVIEW POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to submit review.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}