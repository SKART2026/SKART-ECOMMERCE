import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay configuration is missing.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const razorpayOrderId = String(body.razorpay_order_id || "");
    const razorpayPaymentId = String(body.razorpay_payment_id || "");
    const razorpaySignature = String(body.razorpay_signature || "");

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

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "utf8"),
      Buffer.from(razorpaySignature, "utf8")
    );

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      payment: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
    });
  } catch (error) {
    console.error("RAZORPAY VERIFY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}