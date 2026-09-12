import { NextRequest, NextResponse } from "next/server";
import { calculateCouponDiscount } from "../../../../lib/coupon";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const code = String(body.code || "");
    const subtotal = Number(body.subtotal);

    if (!code.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a coupon code.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(subtotal) ||
      subtotal < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order amount.",
        },
        { status: 400 }
      );
    }

    const result =
      await calculateCouponDiscount(
        code,
        subtotal
      );

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          discount: 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      couponId: result.couponId,
      couponCode: result.couponCode,
      discount: result.discount,
      subtotal,
    });
  } catch (error) {
    console.error(
      "COUPON VALIDATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to validate coupon.",
      },
      { status: 500 }
    );
  }
}
