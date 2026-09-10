import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    const amount = Number(body.amount);
    const paymentMethod = String(
      body.paymentMethod || ""
    ).toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment amount.",
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

    const amountInPaise = Math.round(amount * 100);

    const receipt = `SKPAY${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        source: "SKART",
        paymentMethod,
      },
    });

    return NextResponse.json({
      success: true,

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },

      keyId,
    });
  } catch (error) {
    console.error(
      "RAZORPAY CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}
