
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        setUser(data.user || data);
      } catch (error) {
        console.error("Account loading error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading account...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold text-blue-600"
            >
              ShopKart
            </Link>

            <Link
              href="/login"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </header>

        <section className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-sm border p-10">
            <div className="text-6xl mb-5">👤</div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to ShopKart
            </h1>

            <p className="text-gray-600 mb-8">
              Please login to view your account, orders and saved addresses.
            </p>

            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Login to Account
            </Link>

            <div className="mt-6">
              <Link
                href="/"
                className="text-blue-600 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            ShopKart
          </Link>

          <Link
            href="/"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Account
        </h1>

        <p className="text-gray-600 mb-8">
          Manage your ShopKart account and orders.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl">
                👤
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h2>

                <p className="text-gray-600">
                  {user.email}
                </p>

                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                  Customer
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Account Information
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">
                    {user.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="font-medium text-gray-900">
                    {user.mobile || "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <Link
              href="/orders"
              className="block bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-bold text-lg text-gray-900">
                My Orders
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View your orders and order status.
              </p>
            </Link>

            <Link
              href="/wishlist"
              className="block bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">❤️</div>
              <h3 className="font-bold text-lg text-gray-900">
                My Wishlist
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View your saved products.
              </p>
            </Link>

            <Link
              href="/cart"
              className="block bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">🛒</div>
              <h3 className="font-bold text-lg text-gray-900">
                My Cart
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review products before checkout.
              </p>
            </Link>

            <Link
              href="/checkout"
              className="block bg-blue-600 text-white rounded-2xl p-5 hover:bg-blue-700 transition"
            >
              <div className="text-3xl mb-2">💳</div>
              <h3 className="font-bold text-lg">
                Checkout
              </h3>
              <p className="text-sm text-blue-100 mt-1">
                Proceed to secure checkout.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2026 ShopKart. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

