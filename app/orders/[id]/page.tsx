"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  image: string | null;
};

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: Product;
};

type Address = {
  id: number;
  fullName: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type Payment = {
  id: number;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: Address | null;
  payments: Payment[];
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load order.");
          return;
        }

        setOrder(data.order);
      } catch (error) {
        console.error(error);
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusClass(status: string) {
    if (status === "CONFIRMED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "PROCESSING") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "SHIPPED") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "DELIVERED") {
      return "bg-purple-100 text-purple-700";
    }

    if (status === "CANCELLED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📦</div>

          <h2 className="text-2xl font-bold">
            Loading order details...
          </h2>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h2 className="text-2xl font-bold">
            Order Not Found
          </h2>

          <p className="text-red-500 mt-3">
            {error || "This order could not be found."}
          </p>

          <Link
            href="/orders"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            SKART
          </Link>

          <Link
            href="/orders"
            className="font-semibold text-gray-600 hover:text-blue-600"
          >
            ← My Orders
          </Link>

        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">

        {/* TITLE */}
        <div className="mb-8">

          <p className="text-sm text-gray-500">
            Order Number
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-1">
            {order.orderNumber}
          </h1>

          <p className="text-gray-500 mt-2">
            Placed on {formatDate(order.createdAt)}
          </p>

        </div>

        {/* STATUS */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold mb-5">
            Order Status
          </h2>

          <div className="flex flex-col md:flex-row md:items-center gap-5">

            <div className="flex-1">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                  ✓
                </div>

                <div>

                  <p className="font-bold text-lg">
                    {order.status}
                  </p>

                  <p className="text-sm text-gray-500">
                    Your order has been confirmed.
                  </p>

                </div>

              </div>

            </div>

            <span
              className={`px-5 py-2 rounded-full font-bold ${statusClass(
                order.status
              )}`}
            >
              {order.status}
            </span>

          </div>

        </div>

        {/* PRODUCTS */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold mb-6">
            Products
          </h2>

          <div className="space-y-5">

            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 border-b pb-5 last:border-b-0 last:pb-0"
              >

                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">

                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">
                      🛍️
                    </span>
                  )}

                </div>

                <div className="flex-1">

                  <h3 className="font-bold text-lg">
                    {item.product.name}
                  </h3>

                  <p className="text-gray-500 mt-1">
                    Quantity: {item.quantity}
                  </p>

                  <p className="text-gray-500">
                    Price: ₹{item.price.toLocaleString("en-IN")}
                  </p>

                </div>

                <div className="font-bold text-lg">
                  ₹{(
                    item.price * item.quantity
                  ).toLocaleString("en-IN")}
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* TWO COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* DELIVERY ADDRESS */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">

            <h2 className="text-xl font-bold mb-5">
              Delivery Address
            </h2>

            {order.address ? (
              <div className="space-y-2">

                <p className="font-bold">
                  {order.address.fullName}
                </p>

                <p>
                  {order.address.mobile}
                </p>

                <p className="text-gray-600">
                  {order.address.address}
                </p>

                <p className="text-gray-600">
                  {order.address.city},{" "}
                  {order.address.state}
                </p>

                <p className="font-semibold">
                  PIN: {order.address.pincode}
                </p>

              </div>
            ) : (
              <p className="text-gray-500">
                Delivery address unavailable.
              </p>
            )}

          </div>

          {/* PAYMENT */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">

            <h2 className="text-xl font-bold mb-5">
              Payment Information
            </h2>

            <div className="space-y-3">

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Payment Method
                </span>

                <span className="font-bold">
                  {order.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Payment Status
                </span>

                <span className="font-bold">
                  {order.paymentStatus}
                </span>
              </div>

              {order.payments.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Amount
                  </span>

                  <span className="font-bold">
                    ₹{order.payments[0].amount.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mt-6">

          <h2 className="text-xl font-bold mb-5">
            Order Summary
          </h2>

          <div className="space-y-3">

            {/* SUBTOTAL */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold">
                ₹{order.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* DELIVERY FEE */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                Delivery Fee
              </span>

              <span className="font-semibold">
                {order.deliveryFee === 0
                  ? "FREE"
                  : `₹${order.deliveryFee.toLocaleString("en-IN")}`}
              </span>
            </div>

            {/* COUPON DISCOUNT */}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600 font-medium">
                  Coupon Discount
                  {order.couponCode
                    ? ` (${order.couponCode})`
                    : ""}
                </span>

                <span className="font-semibold text-green-600">
                  -₹{order.discount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {/* TOTAL */}
            <div className="border-t pt-4 flex justify-between text-xl">

              <span className="font-bold">
                Total
              </span>

              <span className="font-bold text-blue-600">
                ₹{order.total.toLocaleString("en-IN")}
              </span>

            </div>

          </div>

        </div>

        {/* BUTTONS */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">

          <Link
            href="/orders"
            className="flex-1 text-center bg-white border border-gray-300 px-6 py-4 rounded-xl font-bold hover:bg-gray-100"
          >
            ← Back to My Orders
          </Link>

          <Link
            href="/"
            className="flex-1 text-center bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700"
          >
            Continue Shopping
          </Link>

        </div>

      </section>

    </main>
  );
}