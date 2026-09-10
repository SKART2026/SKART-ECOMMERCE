"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AdminStats = {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalSales: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/admin/login");
          return;
        }

        const data = await response.json();

        if (!data.user || data.user.role !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        setUser(data.user);

        const statsResponse = await fetch("/api/admin/stats");

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error("Failed to load admin statistics");
        }
      } catch (error) {
        console.error(error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  async function handleLogout() {
    try {
      setLogoutLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚙️</div>

          <h2 className="text-2xl font-bold">
            Loading Admin Panel...
          </h2>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold">
              SKART Admin
            </h1>

            <p className="text-gray-400 text-sm">
              Administration Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">

            <span className="text-sm">
              👤 {user.name}
            </span>

            <Link
              href="/"
              className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
            >
              View Store
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-500"
            >
              {logoutLoading ? "Logging out..." : "Logout"}
            </button>

          </div>

        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <p className="text-gray-500 mt-1">
            Manage your SKART ecommerce business.
          </p>

        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          {/* TOTAL ORDERS */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-4xl mb-4">
              📦
            </div>

            <p className="text-gray-500">
              Total Orders
            </p>

            <p className="text-3xl font-bold mt-1">
              {statsLoading ? "..." : stats?.totalOrders ?? 0}
            </p>
          </div>

          {/* TOTAL SALES */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-4xl mb-4">
              💰
            </div>

            <p className="text-gray-500">
              Total Sales
            </p>

            <p className="text-3xl font-bold mt-1">
              {statsLoading
                ? "..."
                : `₹${(stats?.totalSales ?? 0).toLocaleString("en-IN")}`}
            </p>
          </div>

          {/* CUSTOMERS */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-4xl mb-4">
              👥
            </div>

            <p className="text-gray-500">
              Customers
            </p>

            <p className="text-3xl font-bold mt-1">
              {statsLoading ? "..." : stats?.totalCustomers ?? 0}
            </p>
          </div>

          {/* PRODUCTS */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-4xl mb-4">
              🛍️
            </div>

            <p className="text-gray-500">
              Products
            </p>

            <p className="text-3xl font-bold mt-1">
              {statsLoading ? "..." : stats?.totalProducts ?? 0}
            </p>
          </div>

        </div>

        {/* ORDER STATUS */}
        <h2 className="text-2xl font-bold mb-5">
          Order Overview
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">

          <div className="bg-white border rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Pending
            </p>

            <p className="text-2xl font-bold mt-2">
              {statsLoading ? "..." : stats?.pendingOrders ?? 0}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Processing
            </p>

            <p className="text-2xl font-bold mt-2">
              {statsLoading ? "..." : stats?.processingOrders ?? 0}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Shipped
            </p>

            <p className="text-2xl font-bold mt-2">
              {statsLoading ? "..." : stats?.shippedOrders ?? 0}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Delivered
            </p>

            <p className="text-2xl font-bold mt-2">
              {statsLoading ? "..." : stats?.deliveredOrders ?? 0}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Cancelled
            </p>

            <p className="text-2xl font-bold mt-2">
              {statsLoading ? "..." : stats?.cancelledOrders ?? 0}
            </p>
          </div>

        </div>

        {/* MANAGEMENT */}
        <h2 className="text-2xl font-bold mb-5">
          Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Link
            href="/admin/products"
            className="bg-white border rounded-2xl p-7 hover:shadow-lg transition"
          >
            <div className="text-5xl mb-5">
              🛍️
            </div>

            <h3 className="text-xl font-bold">
              Products
            </h3>

            <p className="text-gray-500 mt-2">
              Add, edit, deactivate products and manage stock.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white border rounded-2xl p-7 hover:shadow-lg transition"
          >
            <div className="text-5xl mb-5">
              📦
            </div>

            <h3 className="text-xl font-bold">
              Orders
            </h3>

            <p className="text-gray-500 mt-2">
              View customer orders and update order status.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="bg-white border rounded-2xl p-7 hover:shadow-lg transition"
          >
            <div className="text-5xl mb-5">
              👥
            </div>

            <h3 className="text-xl font-bold">
              Customers
            </h3>

            <p className="text-gray-500 mt-2">
              View customers and their order history.
            </p>
          </Link>

        </div>

        {/* ADMIN INFORMATION */}
        <div className="bg-white border rounded-2xl p-6 mt-8">

          <h2 className="text-xl font-bold mb-4">
            Admin Account
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div>
              <p className="text-sm text-gray-500">
                Name
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
                Role
              </p>

              <p className="font-semibold mt-1">
                {user.role}
              </p>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}