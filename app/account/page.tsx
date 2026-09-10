"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
id: number;
name: string;
email: string;
mobile: string | null;
role: string;
createdAt: string;
};

export default function AccountPage() {
const router = useRouter();

const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [loggingOut, setLoggingOut] = useState(false);
const [error, setError] = useState("");

useEffect(() => {
async function loadAccount() {
try {
const response = await fetch("/api/auth/me");

    if (!response.ok) {
      router.push("/login");
      return;
    }

    const data = await response.json();
    setUser(data.user);
  } catch (error) {
    console.error(error);
    setError("Unable to load your account.");
  } finally {
    setLoading(false);
  }
}

loadAccount();

}, [router]);

async function handleLogout() {
try {
setLoggingOut(true);

  await fetch("/api/auth/logout", {
    method: "POST",
  });

  router.push("/login");
  router.refresh();
} catch (error) {
  console.error(error);
  setLoggingOut(false);
}

}

if (loading) {
return ( <main className="min-h-screen bg-gray-50 flex items-center justify-center"> <div className="text-center"> <div className="text-6xl mb-4 animate-pulse">
👤 </div>

      <h2 className="text-2xl font-bold">
        Loading your account...
      </h2>
    </div>
  </main>
);

}

if (error) {
return ( <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6"> <div className="text-center"> <div className="text-6xl mb-4">
⚠️ </div>

      <h2 className="text-2xl font-bold">
        Something went wrong
      </h2>

      <p className="text-red-500 mt-2">
        {error}
      </p>

      <Link
        href="/"
        className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
      >
        Back to Shop
      </Link>
    </div>
  </main>
);

}

if (!user) {
return null;
}

return ( <main className="min-h-screen bg-gray-50 text-gray-900">

  {/* HEADER */}
  <header className="bg-white border-b">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

      <Link
        href="/"
        className="text-2xl font-bold text-blue-600"
      >
        SKART
      </Link>

      <Link
        href="/"
        className="text-gray-600 hover:text-blue-600 font-semibold"
      >
        ← Continue Shopping
      </Link>

    </div>
  </header>

  {/* ACCOUNT */}
  <section className="max-w-5xl mx-auto px-6 py-12">

    <div className="mb-8">

      <h1 className="text-4xl font-bold">
        My Account
      </h1>

      <p className="text-gray-500 mt-2">
        Manage your SKART account
      </p>

    </div>

    {/* PROFILE CARD */}
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

      <div className="bg-blue-600 text-white p-8">

        <div className="flex items-center gap-5">

          <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              {user.name}
            </h2>

            <p className="text-blue-100">
              {user.email}
            </p>

          </div>

        </div>

      </div>

      <div className="p-8">

        <h2 className="text-xl font-bold mb-6">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <p className="text-sm text-gray-500">
              Full Name
            </p>

            <p className="font-semibold mt-1">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email
            </p>

            <p className="font-semibold mt-1">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Mobile Number
            </p>

            <p className="font-semibold mt-1">
              {user.mobile || "Not added"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Account Type
            </p>

            <p className="font-semibold mt-1">
              {user.role}
            </p>
          </div>

        </div>

      </div>

    </div>

    {/* ACCOUNT OPTIONS */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

      {/* MY ORDERS */}
      <Link
        href="/orders"
        className="bg-white border rounded-2xl p-6 hover:shadow-lg transition"
      >

        <div className="text-4xl mb-4">
          📦
        </div>

        <h3 className="text-xl font-bold">
          My Orders
        </h3>

        <p className="text-gray-500 mt-2">
          View your orders and order status.
        </p>

      </Link>

      {/* MY ADDRESSES */}
      <Link
        href="/addresses"
        className="bg-white border rounded-2xl p-6 hover:shadow-lg transition"
      >

        <div className="text-4xl mb-4">
          📍
        </div>

        <h3 className="text-xl font-bold">
          My Addresses
        </h3>

        <p className="text-gray-500 mt-2">
          Manage your delivery addresses.
        </p>

      </Link>

      {/* MY CART */}
      <Link
        href="/cart"
        className="bg-white border rounded-2xl p-6 hover:shadow-lg transition"
      >

        <div className="text-4xl mb-4">
          🛒
        </div>

        <h3 className="text-xl font-bold">
          My Cart
        </h3>

        <p className="text-gray-500 mt-2">
          View products in your shopping cart.
        </p>

      </Link>

    </div>

    {/* LOGOUT */}
    <div className="mt-8 bg-white border rounded-2xl p-6">

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-400"
      >
        {loggingOut
          ? "Logging out..."
          : "Logout"}
      </button>

    </div>

  </section>

</main>

);
}
