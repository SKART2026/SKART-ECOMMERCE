import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { Pool } from "pg";
import Razorpay from "razorpay";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

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

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("shopkart_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId) {
      return null;
    }

    return Number(payload.userId);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Please login before making a payment" },
      { status: 401 }
    );
  }

  const { prisma, pool } = getPrisma();

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      cart,
      couponCode,
    } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    /*
     * Validate cart using database prices.
     * Never trust price or amount sent from the browser.
     */
    const productIds = cart.map((item: any) =>
  Number(item.productId ?? item.id)
);

    const uniqueProductIds = [...new Set(productIds)];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: uniqueProductIds,
        },
        isActive: true,
      },
    });

    if (products.length !== uniqueProductIds.length) {
      return NextResponse.json(
        { error: "One or more products are no longer available" },
        { status: 400 }
      );
    }

    let subtotal = 0;

    for (const item of cart) {
      const product = products.find(
        (p) => p.id === Number(item.productId ?? item.id)
      );

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid product quantity" },
          { status: 400 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `${product.name} has only ${product.stock} item(s) available`,
          },
          { status: 400 }
        );
      }

      subtotal += product.price * quantity;
    }

    subtotal = Number(subtotal.toFixed(2));

    /*
     * Delivery fee
     * Orders ₹999 and above get free delivery.
     */
    const deliveryFee = subtotal >= 999 ? 0 : 49;

    /*
     * Coupon validation
     */
    let discount = 0;
    let appliedCouponCode: string | null = null;

    const cleanCouponCode = String(couponCode || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (cleanCouponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: {
          code: cleanCouponCode,
        },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "Invalid coupon code." },
          { status: 400 }
        );
      }

      if (!coupon.isActive) {
        return NextResponse.json(
          { error: "This coupon is inactive." },
          { status: 400 }
        );
      }

      const now = new Date();

      if (coupon.startsAt && now < coupon.startsAt) {
        return NextResponse.json(
          { error: "This coupon is not active yet." },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && now > coupon.expiresAt) {
        return NextResponse.json(
          { error: "This coupon has expired." },
          { status: 400 }
        );
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return NextResponse.json(
          { error: "This coupon usage limit has been reached." },
          { status: 400 }
        );
      }

      if (subtotal < coupon.minOrderAmount) {
        return NextResponse.json(
          {
            error: `Minimum order amount is ₹${coupon.minOrderAmount.toFixed(
              2
            )}.`,
          },
          { status: 400 }
        );
      }

      if (coupon.type === "PERCENTAGE") {
        if (coupon.value <= 0 || coupon.value > 100) {
          return NextResponse.json(
            { error: "Invalid coupon percentage." },
            { status: 400 }
          );
        }

        discount = (subtotal * coupon.value) / 100;

        if (coupon.maxDiscount !== null) {
          discount = Math.min(
            discount,
            coupon.maxDiscount
          );
        }
      } else {
        if (coupon.value <= 0) {
          return NextResponse.json(
            { error: "Invalid coupon discount." },
            { status: 400 }
          );
        }

        discount = coupon.value;
      }

      discount = Math.min(discount, subtotal);
      discount = Number(discount.toFixed(2));

      appliedCouponCode = coupon.code;
    }

    /*
     * Final server-calculated amount.
     *
     * Browser amount is completely ignored.
     */
    const total = Number(
      Math.max(
        0,
        subtotal + deliveryFee - discount
      ).toFixed(2)
    );

    if (total <= 0) {
      return NextResponse.json(
        {
          error:
            "The order total must be greater than ₹0 for online payment.",
        },
        { status: 400 }
      );
    }

    /*
     * Create Razorpay order using ONLY the server-calculated amount.
     */
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      order,
      keyId,
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode: appliedCouponCode,
    });
  } catch (error) {
    console.error(
      "Razorpay order creation error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}