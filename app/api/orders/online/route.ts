import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto";
import Razorpay from "razorpay";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getUserIdFromRequest(request: NextRequest): number | null {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const tokenPart = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("shopkart_token="));

    if (!tokenPart) {
      return null;
    }

    const token = decodeURIComponent(
      tokenPart.substring("shopkart_token=".length)
    );

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    const userId = Number(decodedPayload.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please login before placing the order.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const addressId = Number(body.addressId);
    const paymentMethod = String(
      body.paymentMethod || ""
    ).toUpperCase();

    // Support both old "items" and current checkout "cart"
    const items = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.cart)
        ? body.cart
        : [];

    const couponCode = String(
      body.couponCode || ""
    )
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    const razorpayOrderId = String(
      body.razorpayOrderId || ""
    );

    const razorpayPaymentId = String(
      body.razorpayPaymentId || ""
    );

    const razorpaySignature = String(
      body.razorpaySignature || ""
    );

    if (!Number.isInteger(addressId) || addressId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address.",
        },
        { status: 400 }
      );
    }

    if (
      paymentMethod !== "UPI" &&
      paymentMethod !== "CARD"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid online payment method.",
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Razorpay payment information.",
        },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay configuration is missing.",
        },
        { status: 500 }
      );
    }

    /*
     * Verify Razorpay payment signature
     */
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    if (
      generatedSignature.length !==
        razorpaySignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "utf8"),
        Buffer.from(razorpaySignature, "utf8")
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    /*
     * Fetch the Razorpay order.
     *
     * This allows us to verify that the amount paid
     * belongs to the server-calculated order total.
     */
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder =
      await razorpay.orders.fetch(
        razorpayOrderId
      );

    const razorpayAmount =
      Number(razorpayOrder.amount) / 100;

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected address was not found.",
        },
        { status: 400 }
      );
    }

    /*
     * Get products using database prices.
     * Never trust product prices sent by the browser.
     */
    const productIds = items.map((item: any) =>
  Number(item.productId ?? item.id)
);

    const uniqueProductIds = [
  ...new Set(productIds),
] as number[];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: uniqueProductIds,
        },
        isActive: true,
      },
    });

    if (
      products.length !== uniqueProductIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more products are no longer available.",
        },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );

    const orderItems: {
      productId: number;
      quantity: number;
      price: number;
    }[] = [];

    let subtotal = 0;

    for (const item of items) {
      const productId = Number(item.productId ?? item.id);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid product.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid quantity.",
          },
          { status: 400 }
        );
      }

      const product = productMap.get(productId);

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product ${productId} is not available.`,
          },
          { status: 400 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `${product.name} does not have enough stock.`,
          },
          { status: 400 }
        );
      }

      const price = Number(product.price);

      subtotal += price * quantity;

      orderItems.push({
        productId,
        quantity,
        price,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    /*
     * Delivery fee
     */
    const deliveryFee =
      subtotal >= 999 ? 0 : 49;

    /*
     * Coupon validation
     */
    let discount = 0;
    let appliedCouponId: number | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const coupon =
        await prisma.coupon.findUnique({
          where: {
            code: couponCode,
          },
        });

      if (!coupon) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid coupon code.",
          },
          { status: 400 }
        );
      }

      if (!coupon.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "This coupon is inactive.",
          },
          { status: 400 }
        );
      }

      const now = new Date();

      if (
        coupon.startsAt &&
        now < coupon.startsAt
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This coupon is not active yet.",
          },
          { status: 400 }
        );
      }

      if (
        coupon.expiresAt &&
        now > coupon.expiresAt
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "This coupon has expired.",
          },
          { status: 400 }
        );
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This coupon usage limit has been reached.",
          },
          { status: 400 }
        );
      }

      if (
        subtotal < coupon.minOrderAmount
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order amount is ₹${coupon.minOrderAmount.toFixed(
              2
            )}.`,
          },
          { status: 400 }
        );
      }

      if (coupon.type === "PERCENTAGE") {
        if (
          coupon.value <= 0 ||
          coupon.value > 100
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Invalid coupon percentage.",
            },
            { status: 400 }
          );
        }

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
        if (coupon.value <= 0) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Invalid coupon discount.",
            },
            { status: 400 }
          );
        }

        discount = coupon.value;
      }

      discount = Math.min(
        discount,
        subtotal
      );

      discount = Number(
        discount.toFixed(2)
      );

      appliedCouponId = coupon.id;
      appliedCouponCode = coupon.code;
    }

    /*
     * Final server-calculated total
     */
    const total = Number(
      Math.max(
        0,
        subtotal +
          deliveryFee -
          discount
      ).toFixed(2)
    );

    /*
     * Verify Razorpay amount against
     * the server-calculated amount.
     */
    if (
      Math.round(razorpayAmount * 100) !==
      Math.round(total * 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment amount does not match the order total.",
        },
        { status: 400 }
      );
    }

    /*
     * Create order and update stock/coupon
     * usage in one database transaction.
     */
    const orderNumber =
      `SK${Date.now()}${Math.floor(
        100 + Math.random() * 900
      )}`;

    const result =
      await prisma.$transaction(
        async (tx: any) => {
          /*
           * Safely increment coupon usage.
           */
          if (appliedCouponId !== null) {
            const coupon =
              await tx.coupon.findUnique({
                where: {
                  id: appliedCouponId,
                },
              });

            if (!coupon) {
              throw new Error(
                "Coupon is no longer available."
              );
            }

            if (
              !coupon.isActive
            ) {
              throw new Error(
                "This coupon is no longer active."
              );
            }

            if (
              coupon.usageLimit !== null &&
              coupon.usedCount >=
                coupon.usageLimit
            ) {
              throw new Error(
                "This coupon usage limit has been reached."
              );
            }

            await tx.coupon.update({
              where: {
                id: coupon.id,
              },
              data: {
                usedCount: {
                  increment: 1,
                },
              },
            });
          }

          const order =
            await tx.order.create({
              data: {
                orderNumber,

                user: {
                  connect: {
                    id: userId,
                  },
                },

                address: {
                  connect: {
                    id: addressId,
                  },
                },

                status: "CONFIRMED",
                paymentMethod,
                paymentStatus: "PAID",
                subtotal,
                deliveryFee,
                discount,
                couponCode:
                  appliedCouponCode,
                total,

                items: {
                  create:
                    orderItems.map(
                      (item) => ({
                        productId:
                          item.productId,
                        quantity:
                          item.quantity,
                        price:
                          item.price,
                      })
                    ),
                },
              },
            });

          /*
           * Reduce stock safely.
           */
          for (const item of orderItems) {
            const updatedProduct =
              await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stock: {
                    gte: item.quantity,
                  },
                },
                data: {
                  stock: {
                    decrement:
                      item.quantity,
                  },
                },
              });

            if (
              updatedProduct.count !== 1
            ) {
              throw new Error(
                `Insufficient stock for product ${item.productId}.`
              );
            }
          }

          const payment =
            await tx.payment.create({
              data: {
                orderId: order.id,
                amount: total,
                method: paymentMethod,
                status: "PAID",
              },
            });

          return {
            order,
            payment,
          };
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Payment successful and order placed successfully.",

      order: {
        id: result.order.id,
        orderNumber:
          result.order.orderNumber,
        subtotal:
          result.order.subtotal,
        deliveryFee:
          result.order.deliveryFee,
        discount:
          result.order.discount,
        couponCode:
          result.order.couponCode,
        total:
          result.order.total,
        paymentStatus:
          result.payment.status,
      },

      payment: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status:
          result.payment.status,
      },
    });
  } catch (error) {
    console.error(
      "ONLINE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to place online order.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}