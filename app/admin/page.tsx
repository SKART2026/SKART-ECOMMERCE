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
          <div className="text-5xl mb-4">⏳</div>

          <h2 className="text-2xl font-bold text-gray-900">
            Loading Admin Panel...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const statValue = (value: number | undefined) =>
    statsLoading ? "..." : value ?? 0;

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}
      <header className="bg-gray-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white text-gray-950 flex items-center justify-center font-black text-lg">
                  S
                </div>

                <div>
                  <h1 className="text-2xl font-bold">
                    SKART Admin
                  </h1>

                  <p className="text-gray-400 text-sm">
                    Ecommerce Management Dashboard
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">

              <div className="hidden sm:block text-sm text-gray-300 mr-2">
                Welcome, <span className="font-semibold text-white">{user.name}</span>
              </div>

              <Link
                href="/"
                className="bg-white text-gray-900 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                View Store
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-500"
              >
                {logoutLoading ? "Logging out..." : "Logout"}
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* PAGE TITLE */}
        <div className="mb-8">

          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Overview
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold mt-1">
            Dashboard
          </h2>

          <p className="text-gray-500 mt-2">
            Monitor your SKART ecommerce business from one place.
          </p>

        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

          {/* ORDERS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>

                <p className="text-3xl font-bold mt-2">
                  {statValue(stats?.totalOrders)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                📦
              </div>

            </div>

            <Link
              href="/admin/orders"
              className="inline-block mt-5 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View orders →
            </Link>

          </div>

          {/* SALES */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Sales
                </p>

                <p className="text-3xl font-bold mt-2">
                  {statsLoading
                    ? "..."
                    : `₹${(stats?.totalSales ?? 0).toLocaleString("en-IN")}`}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                ₹
              </div>

            </div>

            <p className="text-sm text-gray-500 mt-5">
              Confirmed order sales
            </p>

          </div>

          {/* CUSTOMERS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Customers
                </p>

                <p className="text-3xl font-bold mt-2">
                  {statValue(stats?.totalCustomers)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                👥
              </div>

            </div>

            <Link
              href="/admin/customers"
              className="inline-block mt-5 text-sm font-semibold text-purple-600 hover:text-purple-800"
            >
              View customers →
            </Link>

          </div>

          {/* PRODUCTS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Products
                </p>

                <p className="text-3xl font-bold mt-2">
                  {statValue(stats?.totalProducts)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                🛍️
              </div>

            </div>

            <Link
              href="/admin/products"
              className="inline-block mt-5 text-sm font-semibold text-orange-600 hover:text-orange-800"
            >
              Manage products →
            </Link>

          </div>

        </div>

        {/* ORDER STATUS */}
        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-2xl font-bold">
              Order Overview
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Current order status across your store
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="hidden sm:block text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Manage orders →
          </Link>

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">

          {/* PENDING */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Pending
              </p>

              <span className="w-3 h-3 rounded-full bg-yellow-400" />
            </div>

            <p className="text-2xl font-bold mt-3">
              {statValue(stats?.pendingOrders)}
            </p>

          </div>

          {/* PROCESSING */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Processing
              </p>

              <span className="w-3 h-3 rounded-full bg-blue-500" />
            </div>

            <p className="text-2xl font-bold mt-3">
              {statValue(stats?.processingOrders)}
            </p>

          </div>

          {/* SHIPPED */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Shipped
              </p>

              <span className="w-3 h-3 rounded-full bg-purple-500" />
            </div>

            <p className="text-2xl font-bold mt-3">
              {statValue(stats?.shippedOrders)}
            </p>

          </div>

          {/* DELIVERED */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Delivered
              </p>

              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>

            <p className="text-2xl font-bold mt-3">
              {statValue(stats?.deliveredOrders)}
            </p>

          </div>

          {/* CANCELLED */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Cancelled
              </p>

              <span className="w-3 h-3 rounded-full bg-red-500" />
            </div>

            <p className="text-2xl font-bold mt-3">
              {statValue(stats?.cancelledOrders)}
            </p>

          </div>

        </div>

        {/* MANAGEMENT */}
        <div className="mb-5">

          <h2 className="text-2xl font-bold">
            Management
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Quickly access the main areas of your ecommerce store.
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">

          {/* PRODUCTS */}
          <Link
            href="/admin/products"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-3xl mb-5">
              🛍️
            </div>

            <h3 className="text-xl font-bold">
              Products
            </h3>

            <p className="text-gray-500 mt-2">
              Add, edit, deactivate products and manage stock.
            </p>

            <p className="text-orange-600 font-semibold text-sm mt-5 group-hover:translate-x-1 transition">
              Manage Products →
            </p>

          </Link>

          {/* ORDERS */}
          <Link
            href="/admin/orders"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-3xl mb-5">
              📦
            </div>

            <h3 className="text-xl font-bold">
              Orders
            </h3>

            <p className="text-gray-500 mt-2">
              View customer orders and update order status.
            </p>

            <p className="text-blue-600 font-semibold text-sm mt-5 group-hover:translate-x-1 transition">
              Manage Orders →
            </p>

          </Link>

          {/* CUSTOMERS */}
          <Link
            href="/admin/customers"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-3xl mb-5">
              👥
            </div>

            <h3 className="text-xl font-bold">
              Customers
            </h3>

            <p className="text-gray-500 mt-2">
              View customers and their order history.
            </p>

            <p className="text-purple-600 font-semibold text-sm mt-5 group-hover:translate-x-1 transition">
              View Customers →
            </p>

          </Link>

          {/* CATEGORIES */}
          <Link
            href="/admin/categories"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-3xl mb-5">
              🗂️
            </div>

            <h3 className="text-xl font-bold">
              Categories
            </h3>

            <p className="text-gray-500 mt-2">
              Organize products and manage your store categories.
            </p>

            <p className="text-green-600 font-semibold text-sm mt-5 group-hover:translate-x-1 transition">
              Manage Categories →
            </p>

          </Link>

          {/* COUPONS */}
          <Link
            href="/admin/coupons"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center text-3xl mb-5">
              🎟️
            </div>

            <h3 className="text-xl font-bold">
              Coupons
            </h3>

            <p className="text-gray-500 mt-2">
              Create and manage discount coupons for customers.
            </p>

            <p className="text-yellow-600 font-semibold text-sm mt-5 group-hover:translate-x-1 transition">
              Manage Coupons →
            </p>

          </Link>

          {/* REVIEWS */}
          <Link
            href="/admin/reviews"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center text-3xl mb-5">
              ⭐
            </div>

            <h3 className="text-xl font-bold">
              Reviews
            </h3>

            <p className="text-gray-500 mt-2">
              Review and manage customer product reviews.
            </p>

            <p className="text-pink-600 font-semibold text-sm mt-5 group-hover:translate-x-1 transition">
              Manage Reviews →
            </p>

          </Link>

        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-8 mb-10">

          <h2 className="text-2xl font-bold">
            Quick Actions
          </h2>

          <p className="text-gray-400 mt-1">
            Common actions for managing your store.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

            <Link
              href="/admin/products"
              className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition"
            >
              <p className="font-semibold">
                + Add Product
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Create a new product
              </p>
            </Link>

            <Link
              href="/admin/categories"
              className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition"
            >
              <p className="font-semibold">
                + Add Category
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Create a category
              </p>
            </Link>

            <Link
              href="/admin/coupons"
              className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition"
            >
              <p className="font-semibold">
                + Create Coupon
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Add a discount
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition"
            >
              <p className="font-semibold">
                View Orders
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Check latest orders
              </p>
            </Link>

          </div>

        </div>

        {/* ADMIN INFORMATION */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                Admin Account
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Current administrator information
              </p>
            </div>

            <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
              {user.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="font-semibold mt-1 break-words">
                {user.name}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="font-semibold mt-1 break-words">
                {user.email}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
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

      {/* FOOTER */}
      <footer className="border-t bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
          SKART Admin Panel
        </div>
      </footer>

    </main>
  );
}