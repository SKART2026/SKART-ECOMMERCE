import { NextResponse } from "next/server";
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
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

    const token = body.token?.trim();
    const password = body.password;

    if (!token || !password) {
      return NextResponse.json(
        {
          error: "Reset token and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    // Hash the token from the reset URL.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          error: "This password reset link is invalid.",
        },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          error: "This password reset link has already been used.",
        },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      return NextResponse.json(
        {
          error: "This password reset link has expired.",
        },
        { status: 400 }
      );
    }

    // Hash the new password.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and invalidate reset token.
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      }),

      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        error: "Unable to reset password.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}