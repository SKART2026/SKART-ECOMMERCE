import { NextResponse } from "next/server";
import "dotenv/config";
import { jwtVerify } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

const adapter = new PrismaPg({
connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
adapter,
});

const JWT_SECRET = process.env.JWT_SECRET;

async function getUserId(request: Request) {
if (!JWT_SECRET) {
return null;
}

const cookieHeader = request.headers.get("cookie");

if (!cookieHeader) {
return null;
}

const tokenMatch = cookieHeader
.split(";")
.map((cookie) => cookie.trim())
.find((cookie) =>
cookie.startsWith("shopkart_token=")
);

if (!tokenMatch) {
return null;
}

const token = tokenMatch.substring(
"shopkart_token=".length
);

try {
const { payload } = await jwtVerify(
token,
new TextEncoder().encode(JWT_SECRET)
);

const userId = Number(payload.userId);

return userId || null;

} catch {
return null;
}
}

export async function GET(request: Request) {
try {
const userId = await getUserId(request);

if (!userId) {
  return NextResponse.json(
    { error: "Not logged in." },
    { status: 401 }
  );
}

const addresses = await prisma.address.findMany({
  where: {
    userId,
  },
  orderBy: {
    id: "desc",
  },
});

return NextResponse.json({
  addresses,
});

} catch (error) {
console.error("Get addresses error:", error);

return NextResponse.json(
  { error: "Unable to load addresses." },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
}
}

export async function POST(request: Request) {
try {
const userId = await getUserId(request);

if (!userId) {
  return NextResponse.json(
    { error: "Not logged in." },
    { status: 401 }
  );
}

const body = await request.json();

const fullName = body.fullName?.trim();
const mobile = body.mobile?.trim();
const address = body.address?.trim();
const city = body.city?.trim();
const state = body.state?.trim();
const pincode = body.pincode?.trim();

if (
  !fullName ||
  !mobile ||
  !address ||
  !city ||
  !state ||
  !pincode
) {
  return NextResponse.json(
    {
      error: "Please fill all address fields.",
    },
    { status: 400 }
  );
}

const newAddress = await prisma.address.create({
  data: {
    userId,
    fullName,
    mobile,
    address,
    city,
    state,
    pincode,
  },
});

return NextResponse.json(
  {
    message: "Address added successfully.",
    address: newAddress,
  },
  { status: 201 }
);

} catch (error) {
console.error("Create address error:", error);

return NextResponse.json(
  { error: "Unable to add address." },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
}
}

export async function DELETE(request: Request) {
try {
const userId = await getUserId(request);

if (!userId) {
  return NextResponse.json(
    { error: "Not logged in." },
    { status: 401 }
  );
}

const body = await request.json();
const addressId = Number(body.id);

if (!addressId) {
  return NextResponse.json(
    { error: "Invalid address." },
    { status: 400 }
  );
}

const address = await prisma.address.findFirst({
  where: {
    id: addressId,
    userId,
  },
});

if (!address) {
  return NextResponse.json(
    { error: "Address not found." },
    { status: 404 }
  );
}

await prisma.address.delete({
  where: {
    id: addressId,
  },
});

return NextResponse.json({
  message: "Address deleted successfully.",
});

} catch (error) {
console.error("Delete address error:", error);

return NextResponse.json(
  { error: "Unable to delete address." },
  { status: 500 }
);

} finally {
await prisma.$disconnect();
}
}
