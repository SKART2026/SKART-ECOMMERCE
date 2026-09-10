import { NextResponse } from "next/server";
import "dotenv/config";
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

const name = body.name?.trim();
const email = body.email?.trim().toLowerCase();
const mobile = body.mobile?.trim();
const password = body.password;

if (!name || !email || !password) {
  return NextResponse.json(
    {
      error: "Name, email and password are required.",
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

const existingUser = await prisma.user.findUnique({
  where: {
    email,
  },
});

if (existingUser) {
  return NextResponse.json(
    {
      error: "An account with this email already exists.",
    },
    { status: 409 }
  );
}

if (mobile) {
  const existingMobile = await prisma.user.findUnique({
    where: {
      mobile,
    },
  });

  if (existingMobile) {
    return NextResponse.json(
      {
        error: "An account with this mobile number already exists.",
      },
      { status: 409 }
    );
  }
}

const hashedPassword = await bcrypt.hash(password, 12);

const user = await prisma.user.create({
  data: {
    name,
    email,
    mobile: mobile || null,
    password: hashedPassword,
  },
});

return NextResponse.json(
  {
    message: "Account created successfully.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    },
  },
  { status: 201 }
);

} catch (error) {
console.error("Registration error:", error);

return NextResponse.json(
  {
    error: "Unable to create account.",
  },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
}
}
