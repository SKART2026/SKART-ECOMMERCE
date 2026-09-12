import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

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

export type CouponCalculation = {
  valid: boolean;
  message: string;
  couponId?: number;
  couponCode?: string;
  discount: number;
};

export async function calculateCouponDiscount(
  code: string,
  subtotal: number
): Promise<CouponCalculation> {
  const cleanCode = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!cleanCode) {
    return {
      valid: false,
      message: "Coupon code is required.",
      discount: 0,
    };
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return {
      valid: false,
      message: "Invalid order amount.",
      discount: 0,
    };
  }

  const { prisma, pool } = getPrisma();

  try {
    const coupon = await prisma.coupon.findUnique({
      where: {
        code: cleanCode,
      },
    });

    if (!coupon) {
      return {
        valid: false,
        message: "Invalid coupon code.",
        discount: 0,
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        message: "This coupon is inactive.",
        discount: 0,
      };
    }

    const now = new Date();

    if (
      coupon.startsAt &&
      now < coupon.startsAt
    ) {
      return {
        valid: false,
        message: "This coupon is not active yet.",
        discount: 0,
      };
    }

    if (
      coupon.expiresAt &&
      now > coupon.expiresAt
    ) {
      return {
        valid: false,
        message: "This coupon has expired.",
        discount: 0,
      };
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return {
        valid: false,
        message: "This coupon usage limit has been reached.",
        discount: 0,
      };
    }

    if (
      subtotal < coupon.minOrderAmount
    ) {
      return {
        valid: false,
        message: `Minimum order amount is ₹${coupon.minOrderAmount.toFixed(
          2
        )}.`,
        discount: 0,
      };
    }

    let discount = 0;

    if (coupon.type === "PERCENTAGE") {
      discount =
        (subtotal * coupon.value) / 100;

      if (
        coupon.maxDiscount !== null
      ) {
        discount = Math.min(
          discount,
          coupon.maxDiscount
        );
      }
    } else {
      discount = coupon.value;
    }

    discount = Math.min(
      discount,
      subtotal
    );

    discount = Math.max(
      0,
      Number(discount.toFixed(2))
    );

    return {
      valid: true,
      message: "Coupon applied successfully.",
      couponId: coupon.id,
      couponCode: coupon.code,
      discount,
    };
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}