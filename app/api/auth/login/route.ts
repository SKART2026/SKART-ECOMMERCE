import { NextResponse } from "next/server";
import "dotenv/config";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";

const adapter = new PrismaPg({
connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
adapter,
});

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
try {
if (!JWT_SECRET) {
return NextResponse.json(
{
error: "JWT_SECRET is not configured.",
},
{ status: 500 }
);
}

const body = await request.json();

const email = body.email?.trim().toLowerCase();
const password = body.password;

if (!email || !password) {
  return NextResponse.json(
    {
      error: "Email and password are required.",
    },
    { status: 400 }
  );
}

const user = await prisma.user.findUnique({
  where: {
    email,
  },
});

if (!user) {
  return NextResponse.json(
    {
      error: "Invalid email or password.",
    },
    { status: 401 }
  );
}

const passwordValid = await bcrypt.compare(
  password,
  user.password
);

if (!passwordValid) {
  return NextResponse.json(
    {
      error: "Invalid email or password.",
    },
    { status: 401 }
  );
}

const token = await new SignJWT({
  userId: user.id,
  email: user.email,
  role: user.role,
})
  .setProtectedHeader({
    alg: "HS256",
  })
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(new TextEncoder().encode(JWT_SECRET));

const response = NextResponse.json({
  message: "Login successful.",
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
  },
});

response.cookies.set({
  name: "shopkart_token",
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
});

return response;

} catch (error) {
console.error("Login error:", error);

return NextResponse.json(
  {
    error: "Unable to login.",
  },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
}
}
