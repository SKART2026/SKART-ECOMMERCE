import { NextResponse } from "next/server";
import "dotenv/config";
import crypto from "crypto";
import { Resend } from "resend";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error: "Email address is required.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    /*
     * Always return the same response if the account
     * does not exist. This prevents email enumeration.
     */
    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    /*
     * Remove previous reset tokens for this user.
     */
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    /*
     * Generate a secure random token.
     */
    const rawToken = crypto.randomBytes(32).toString("hex");

    /*
     * Store only the SHA-256 hash in the database.
     */
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    /*
     * Token expires after 1 hour.
     */
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl =
      process.env.APP_URL || "http://localhost:3000";

    const resetUrl =
      `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    /*
     * Create the Resend client only when the API
     * is actually called. This prevents build errors.
     */
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured.");

      await prisma.passwordResetToken.deleteMany({
        where: {
          tokenHash,
        },
      });

      return NextResponse.json(
        {
          error:
            "Email service is not configured. Please try again later.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject: "Reset your SKART password",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

              <h1 style="margin:0 0 10px;color:#2563eb;text-align:center;">
                SKART
              </h1>

              <h2 style="margin:30px 0 15px;text-align:center;color:#111827;">
                Reset Your Password
              </h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Hello ${escapeHtml(user.name)},
              </p>

              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                We received a request to reset the password for your SKART account.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a
                  href="${resetUrl}"
                  style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;"
                >
                  Reset Password
                </a>
              </div>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                This password reset link will expire in 1 hour and can only be used once.
              </p>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">

              <p style="color:#9ca3af;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} SKART. All rights reserved.
              </p>

            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Resend email error:", emailError);

      await prisma.passwordResetToken.deleteMany({
        where: {
          tokenHash,
        },
      });

      return NextResponse.json(
        {
          error: "Unable to send password reset email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        error: "Unable to process password reset request.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}