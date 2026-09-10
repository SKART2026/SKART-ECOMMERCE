import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export type AdminSession = {
  userId: number;
  email: string;
  role: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return null;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("shopkart_token")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userId = Number(payload.userId);
    const email = String(payload.email || "");
    const role = String(payload.role || "");

    if (!userId || !email || role !== "ADMIN") {
      return null;
    }

    return {
      userId,
      email,
      role,
    };
  } catch (error) {
    console.error("Admin session verification failed:", error);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}