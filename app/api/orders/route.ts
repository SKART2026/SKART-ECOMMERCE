import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { Pool } from "pg";

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

/* GET - Get logged-in customer's orders */
export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Please login to view your orders" },
      { status: 401 }
    );
  }

  const { prisma, pool } = getPrisma();

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

/* POST - Create new order */
export async function POST(request: NextRequest) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Please login before placing an order" },
      { status: 401 }
    );
  }

  const { prisma, pool } = getPrisma();

  try {
    const body = await request.json();

    const {
      addressId,
      paymentMethod,
      items: bodyItems,
      cart,
      couponCode,
    } = body;

    // Support both "items" and the current checkout "cart"
    const items = bodyItems ?? cart;

    if (!addressId) {
      return NextResponse.json(
        { error: "Please select a delivery address" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Please select a payment method" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    const address = await prisma.address.findFirst({
      where: {
        id: Number(addressId),
        userId,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Invalid delivery address" },
        { status: 400 }
      );
    }

    const productIds = items.map((item: any) =>
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

    const orderItems = items.map((item: any) => {
      const product = products.find(
  (p) => p.id === Number(item.productId ?? item.id)
);

      if (!product) {
        throw new Error("Product not found");
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (product.stock < quantity) {
        throw new Error(
          `${product.name} has only ${product.stock} item(s) available`
        );
      }

      const itemTotal = product.price * quantity;

      subtotal += itemTotal;

      return {
        productId: product.id,
        quantity,
        price: product.price,
      };
    });

    const deliveryFee = subtotal >= 999 ? 0 : 49;

    /*
     * COUPON VALIDATION
     */
    let discount = 0;
    let appliedCouponCode: string | null = null;
    let appliedCouponId: number | null = null;

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
          discount = Math.min(discount, coupon.maxDiscount);
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

      // Discount cannot exceed the product subtotal
      discount = Math.min(discount, subtotal);

      // Keep money values to 2 decimal places
      discount = Number(discount.toFixed(2));

      appliedCouponCode = coupon.code;
      appliedCouponId = coupon.id;
    }

    const total = Number(
      Math.max(0, subtotal + deliveryFee - discount).toFixed(2)
    );

    const orderNumber =
      "SK" +
      Date.now() +
      Math.floor(100 + Math.random() * 900);

    const order = await prisma.$transaction(async (tx) => {
      /*
       * Reserve coupon usage inside the transaction.
       *
       * For limited coupons, updateMany with a usage condition
       * prevents usage from exceeding the configured limit.
       */
      if (appliedCouponId !== null) {
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: appliedCouponId,
            isActive: true,
            ...(cleanCouponCode
              ? {
                  code: cleanCouponCode,
                }
              : {}),
            ...((
              await tx.coupon.findUnique({
                where: {
                  id: appliedCouponId,
                },
                select: {
                  usageLimit: true,
                },
              })
            )?.usageLimit !== null
              ? {
                  usedCount: {
                    lt:
                      (
                        await tx.coupon.findUnique({
                          where: {
                            id: appliedCouponId,
                          },
                          select: {
                            usageLimit: true,
                          },
                        })
                      )?.usageLimit ?? 0,
                  },
                }
              : {}),
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });

        if (couponUpdate.count !== 1) {
          throw new Error(
            "This coupon is no longer available. Please remove the coupon and try again."
          );
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId: Number(addressId),
          orderNumber,
          status: "CONFIRMED",
          paymentMethod,
          paymentStatus: "PENDING",
          subtotal,
          deliveryFee,
          discount,
          couponCode: appliedCouponCode,
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
      });

      for (const item of orderItems) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new Error(
            "One or more products no longer have enough stock."
          );
        }
      }

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          amount: total,
          method: paymentMethod,
          status: "PENDING",
        },
      });

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order,
      couponCode: appliedCouponCode,
      discount,
      subtotal,
      deliveryFee,
      total,
    });
  } catch (error: any) {
    console.error("CREATE ORDER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Failed to place order",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}