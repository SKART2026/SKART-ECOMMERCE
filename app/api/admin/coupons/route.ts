import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { Pool } from "pg";
import { requireAdmin } from "../../../../lib/admin-auth";

function getPrisma() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);

  return {
    prisma: new PrismaClient({ adapter }),
    pool,
  };
}

function cleanCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/* GET - Admin: list coupons */
export async function GET() {
  try {
    await requireAdmin();

    const { prisma, pool } = getPrisma();

    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        coupons,
      });
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  } catch (error: any) {
    console.error("GET ADMIN COUPONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "Unable to load coupons.",
      },
      {
        status:
          error?.message === "Unauthorized"
            ? 401
            : 500,
      }
    );
  }
}

/* POST - Admin: create coupon */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const code = cleanCode(body.code);
    const description = String(
      body.description || ""
    ).trim();

    const type =
      String(body.type || "").toUpperCase() ===
      "FIXED"
        ? "FIXED"
        : "PERCENTAGE";

    const value = Number(body.value);
    const minOrderAmount =
      body.minOrderAmount === "" ||
      body.minOrderAmount === undefined ||
      body.minOrderAmount === null
        ? 0
        : Number(body.minOrderAmount);

    const maxDiscount =
      body.maxDiscount === "" ||
      body.maxDiscount === undefined ||
      body.maxDiscount === null
        ? null
        : Number(body.maxDiscount);

    const usageLimit =
      body.usageLimit === "" ||
      body.usageLimit === undefined ||
      body.usageLimit === null
        ? null
        : Number(body.usageLimit);

    const startsAt = body.startsAt
      ? new Date(body.startsAt)
      : null;

    const expiresAt = body.expiresAt
      ? new Date(body.expiresAt)
      : null;

    const isActive =
      body.isActive === undefined
        ? true
        : Boolean(body.isActive);

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon code is required.",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon code can contain only letters, numbers, hyphen and underscore.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Discount value must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      type === "PERCENTAGE" &&
      value > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Percentage discount cannot be more than 100%.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(minOrderAmount) ||
      minOrderAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum order amount cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) ||
        maxDiscount <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum discount must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      usageLimit !== null &&
      (!Number.isInteger(usageLimit) ||
        usageLimit <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Usage limit must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    if (
      startsAt &&
      Number.isNaN(startsAt.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid start date.",
        },
        { status: 400 }
      );
    }

    if (
      expiresAt &&
      Number.isNaN(expiresAt.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid expiry date.",
        },
        { status: 400 }
      );
    }

    if (
      startsAt &&
      expiresAt &&
      expiresAt <= startsAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Expiry date must be after the start date.",
        },
        { status: 400 }
      );
    }

    const { prisma, pool } = getPrisma();

    try {
      const existingCoupon =
        await prisma.coupon.findUnique({
          where: {
            code,
          },
        });

      if (existingCoupon) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A coupon with this code already exists.",
          },
          { status: 409 }
        );
      }

      const coupon = await prisma.coupon.create({
        data: {
          code,
          description: description || null,
          type,
          value,
          minOrderAmount,
          maxDiscount,
          usageLimit,
          startsAt,
          expiresAt,
          isActive,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Coupon created successfully.",
        coupon,
      });
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  } catch (error: any) {
    console.error(
      "CREATE ADMIN COUPON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to create coupon.",
      },
      {
        status:
          error?.message === "Unauthorized"
            ? 401
            : 500,
      }
    );
  }
}

/* PUT - Admin: update coupon */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coupon ID.",
        },
        { status: 400 }
      );
    }

    const code = cleanCode(body.code);

    const description = String(
      body.description || ""
    ).trim();

    const type =
      String(body.type || "").toUpperCase() ===
      "FIXED"
        ? "FIXED"
        : "PERCENTAGE";

    const value = Number(body.value);

    const minOrderAmount =
      body.minOrderAmount === "" ||
      body.minOrderAmount === undefined ||
      body.minOrderAmount === null
        ? 0
        : Number(body.minOrderAmount);

    const maxDiscount =
      body.maxDiscount === "" ||
      body.maxDiscount === undefined ||
      body.maxDiscount === null
        ? null
        : Number(body.maxDiscount);

    const usageLimit =
      body.usageLimit === "" ||
      body.usageLimit === undefined ||
      body.usageLimit === null
        ? null
        : Number(body.usageLimit);

    const startsAt = body.startsAt
      ? new Date(body.startsAt)
      : null;

    const expiresAt = body.expiresAt
      ? new Date(body.expiresAt)
      : null;

    const isActive =
      body.isActive === undefined
        ? true
        : Boolean(body.isActive);

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon code is required.",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon code can contain only letters, numbers, hyphen and underscore.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Discount value must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      type === "PERCENTAGE" &&
      value > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Percentage discount cannot be more than 100%.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(minOrderAmount) ||
      minOrderAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum order amount cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) ||
        maxDiscount <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum discount must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      usageLimit !== null &&
      (!Number.isInteger(usageLimit) ||
        usageLimit <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Usage limit must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    if (
      startsAt &&
      Number.isNaN(startsAt.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid start date.",
        },
        { status: 400 }
      );
    }

    if (
      expiresAt &&
      Number.isNaN(expiresAt.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid expiry date.",
        },
        { status: 400 }
      );
    }

    if (
      startsAt &&
      expiresAt &&
      expiresAt <= startsAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Expiry date must be after the start date.",
        },
        { status: 400 }
      );
    }

    const { prisma, pool } = getPrisma();

    try {
      const existingCoupon =
        await prisma.coupon.findFirst({
          where: {
            code,
            NOT: {
              id,
            },
          },
        });

      if (existingCoupon) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Another coupon already uses this code.",
          },
          { status: 409 }
        );
      }

      const coupon = await prisma.coupon.update({
        where: {
          id,
        },
        data: {
          code,
          description: description || null,
          type,
          value,
          minOrderAmount,
          maxDiscount,
          usageLimit,
          startsAt,
          expiresAt,
          isActive,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Coupon updated successfully.",
        coupon,
      });
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  } catch (error: any) {
    console.error(
      "UPDATE ADMIN COUPON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to update coupon.",
      },
      {
        status:
          error?.message === "Unauthorized"
            ? 401
            : 500,
      }
    );
  }
}

/* DELETE - Admin: delete coupon */
export async function DELETE(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coupon ID.",
        },
        { status: 400 }
      );
    }

    const { prisma, pool } = getPrisma();

    try {
      await prisma.coupon.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Coupon deleted successfully.",
      });
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  } catch (error: any) {
    console.error(
      "DELETE ADMIN COUPON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to delete coupon.",
      },
      {
        status:
          error?.message === "Unauthorized"
            ? 401
            : 500,
      }
    );
  }
}