"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

type Order = {
id: number;
orderNumber: string;
status: string;
paymentMethod: string;
paymentStatus: string;
subtotal: number;
deliveryFee: number;
total: number;
createdAt: string;
items: OrderItem[];
};

export default function OrdersPage() {
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadOrders() {
try {
const response = await fetch("/api/orders");

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to load orders.");
      return;
    }

    setOrders(data.orders || []);
  } catch (error) {
    console.error(error);
    setError("Unable to load your orders.");
  } finally {
    setLoading(false);
  }
}

loadOrders();

}, []);

function formatDate(date: string) {
return new Date(date).toLocaleDateString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
});
}

function getItemCount(items: OrderItem[]) {
return items.reduce((total, item) => total + item.quantity, 0);
}

if (loading) {
return ( <main className="min-h-screen bg-gray-50 flex items-center justify-center"> <div className="text-center"> <div className="text-5xl mb-4">📦</div> <h2 className="text-2xl font-bold">
Loading your orders... </h2> </div> </main>
);
}

if (error) {
return ( <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6"> <div className="text-center bg-white rounded-2xl p-10 shadow"> <div className="text-5xl mb-4">⚠️</div>

      <h2 className="text-2xl font-bold">
        Unable to load orders
      </h2>

      <p className="text-red-500 mt-3">
        {error}
      </p>

      <Link
        href="/account"
        className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
      >
        Back to Account
      </Link>
    </div>
  </main>
);

}

return ( <main className="min-h-screen bg-gray-50 text-gray-900">

  <header className="bg-white border-b">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

      <Link
        href="/"
        className="text-2xl font-bold text-blue-600"
      >
        SKART
      </Link>

      <Link
        href="/account"
        className="font-semibold text-gray-600 hover:text-blue-600"
      >
        ← My Account
      </Link>

    </div>
  </header>

  <section className="max-w-6xl mx-auto px-6 py-10">

    <div className="mb-8">
      <h1 className="text-4xl font-bold">
        My Orders
      </h1>

      <p className="text-gray-500 mt-2">
        View your orders and track their status.
      </p>
    </div>

    {orders.length === 0 ? (
      <div className="bg-white rounded-2xl border p-12 text-center">

        <div className="text-6xl mb-5">
          📦
        </div>

        <h2 className="text-2xl font-bold">
          No Orders Yet
        </h2>

        <p className="text-gray-500 mt-2 mb-6">
          You haven't placed any orders yet.
        </p>

        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-7 py-3 rounded-xl font-bold"
        >
          Start Shopping
        </Link>

      </div>
    ) : (
      <div className="space-y-6">

        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border shadow-sm p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 border-b pb-6">

              <div>
                <p className="text-sm text-gray-500">
                  Order Number
                </p>

                <p className="font-bold text-lg mt-1">
                  {order.orderNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Order Date
                </p>

                <p className="font-semibold mt-1">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Items
                </p>

                <p className="font-semibold mt-1">
                  {getItemCount(order.items)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Total
                </p>

                <p className="font-bold text-lg mt-1">
                  ₹{order.total.toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <span className="inline-block mt-1 px-4 py-2 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                  {order.status}
                </span>
              </div>

            </div>

            <div className="mt-6 space-y-4">

              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4"
                >

                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">

                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        🛍️
                      </span>
                    )}

                  </div>

                  <div className="flex-1">

                    <p className="font-bold">
                      {item.product.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>

                  </div>

                  <p className="font-bold">
                    ₹{(
                      item.price * item.quantity
                    ).toLocaleString("en-IN")}
                  </p>

                </div>
              ))}

            </div>

            <div className="mt-6 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>
                <span className="text-gray-500">
                  Payment:
                </span>{" "}
                <span className="font-bold">
                  {order.paymentMethod}
                </span>
              </div>

              <Link
                href={`/orders/${order.id}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-center hover:bg-blue-700"
              >
                View Order Details
              </Link>

            </div>

          </div>
        ))}

      </div>
    )}

  </section>

</main>

);
}
