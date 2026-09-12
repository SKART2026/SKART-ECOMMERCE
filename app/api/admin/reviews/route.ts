import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
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

async function requireAdmin(request: Request) {
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
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);

    const ratingParam = url.searchParams.get("rating");
    const productIdParam =
      url.searchParams.get("productId");
    const search = (
      url.searchParams.get("search") || ""
    ).trim();

    const rating = ratingParam
      ? Number(ratingParam)
      : null;

    const productId = productIdParam
      ? Number(productIdParam)
      : null;

    const reviews = await prisma.review.findMany({
      where: {
        ...(rating &&
        Number.isInteger(rating) &&
        rating >= 1 &&
        rating <= 5
          ? {
              rating,
            }
          : {}),

        ...(productId && productId > 0
          ? {
              productId,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  comment: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  user: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  user: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  product: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const allReviews = await prisma.review.findMany({
      select: {
        rating: true,
      },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce(
            (sum, item) => sum + item.rating,
            0
          ) / allReviews.length
        : 0;

    const ratingCounts = {
      5: allReviews.filter(
        (item) => item.rating === 5
      ).length,
      4: allReviews.filter(
        (item) => item.rating === 4
      ).length,
      3: allReviews.filter(
        (item) => item.rating === 3
      ).length,
      2: allReviews.filter(
        (item) => item.rating === 2
      ).length,
      1: allReviews.filter(
        (item) => item.rating === 1
      ).length,
    };

    return NextResponse.json({
      reviews,
      products,
      summary: {
        totalReviews: allReviews.length,
        averageRating: Number(
          averageRating.toFixed(1)
        ),
        ratingCounts,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN REVIEWS GET ERROR:",
      error
    );

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

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const reviewId = Number(body.reviewId);

    if (!reviewId) {
      return NextResponse.json(
        {
          error: "Review ID is required.",
        },
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
        {
          error: "Review not found.",
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: {
          id: reviewId,
        },
      });

      const remainingReviews =
        await tx.review.findMany({
          where: {
            productId: review.productId,
          },
          select: {
            rating: true,
          },
        });

      const newReviewCount =
        remainingReviews.length;

      const newRating =
        newReviewCount > 0
          ? remainingReviews.reduce(
              (sum, item) => sum + item.rating,
              0
            ) / newReviewCount
          : 0;

      await tx.product.update({
        where: {
          id: review.productId,
        },
        data: {
          rating: Number(newRating.toFixed(1)),
          reviews: newReviewCount,
        },
      });
    });

    return NextResponse.json({
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN REVIEW DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete review.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}