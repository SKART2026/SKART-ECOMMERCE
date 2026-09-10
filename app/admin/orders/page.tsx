"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OrderItem = {
id: number;
quantity: number;
price: number;
product: {
id: number;
name: string;
image: string | null;
};
};

type Customer = {
id: number;
name: string;
email: string;
mobile: string | null;
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
user: Customer | null;
address: {
fullName: string;
mobile: string;
address: string;
city: string;
state: string;
pincode: string;
} | null;
items: OrderItem[];
};

const statuses = [
"ALL",
"PENDING",
"CONFIRMED",
"PROCESSING",
"SHIPPED",
"DELIVERED",
"CANCELLED",
];

export default function AdminOrdersPage() {
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");

const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
const [updating, setUpdating] = useState(false);

const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function loadOrders() {
try {
setLoading(true);
setError("");

  const response = await fetch("/api/admin/orders", {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load orders");
  }

  setOrders(data.orders || []);
} catch (err) {
  setError(err instanceof Error ? err.message : "Unable to load orders");
} finally {
  setLoading(false);
}

}

useEffect(() => {
loadOrders();
}, []);

const filteredOrders = useMemo(() => {
const searchText = search.trim().toLowerCase();

return orders.filter((order) => {
  const matchesSearch =
    !searchText ||
    order.orderNumber.toLowerCase().includes(searchText) ||
    order.user?.name?.toLowerCase().includes(searchText) ||
    order.user?.email?.toLowerCase().includes(searchText) ||
    order.address?.fullName?.toLowerCase().includes(searchText);

  const matchesStatus =
    statusFilter === "ALL" || order.status === statusFilter;

  return matchesSearch && matchesStatus;
});

}, [orders, search, statusFilter]);

const totalOrders = orders.length;

const pendingOrders = orders.filter(
(order) => order.status === "PENDING"
).length;

const processingOrders = orders.filter(
(order) =>
order.status === "CONFIRMED" || order.status === "PROCESSING"
).length;

const shippedOrders = orders.filter(
(order) => order.status === "SHIPPED"
).length;

const deliveredOrders = orders.filter(
(order) => order.status === "DELIVERED"
).length;

const cancelledOrders = orders.filter(
(order) => order.status === "CANCELLED"
).length;

const totalSales = orders
.filter((order) => order.status !== "CANCELLED")
.reduce((sum, order) => sum + order.total, 0);

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
switch (status) {
case "PENDING":
return "bg-yellow-100 text-yellow-700";

  case "CONFIRMED":
    return "bg-blue-100 text-blue-700";

  case "PROCESSING":
    return "bg-purple-100 text-purple-700";

  case "SHIPPED":
    return "bg-indigo-100 text-indigo-700";

  case "DELIVERED":
    return "bg-green-100 text-green-700";

  case "CANCELLED":
    return "bg-red-100 text-red-700";

  default:
    return "bg-slate-100 text-slate-700";
}

}

async function updateOrderStatus(order: Order, newStatus: string) {
if (order.status === newStatus) return;

const confirmed = window.confirm(
  `Change order ${order.orderNumber} from ${order.status} to ${newStatus}?`
);

if (!confirmed) return;

try {
  setUpdating(true);
  setError("");
  setMessage("");

  const response = await fetch("/api/admin/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: order.id,
      status: newStatus,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to update order");
  }

  setMessage(
    `Order ${order.orderNumber} updated to ${newStatus}.`
  );

  setSelectedOrder(null);

  await loadOrders();
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Unable to update order"
  );
} finally {
  setUpdating(false);
}

}

return ( <main className="min-h-screen bg-slate-50"> <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"> <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> <div> <Link
           href="/admin"
           className="mb-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
         >
← Back to Admin Dashboard </Link>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Order Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View customer orders and manage order status.
        </p>
      </div>

      <button
        onClick={loadOrders}
        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        ↻ Refresh Orders
      </button>
    </div>

    {message && (
      <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        {message}
      </div>
    )}

    {error && (
      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {error}
      </div>
    )}

    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
      <StatCard label="Total" value={totalOrders} />

      <StatCard label="Pending" value={pendingOrders} />

      <StatCard label="Processing" value={processingOrders} />

      <StatCard label="Shipped" value={shippedOrders} />

      <StatCard label="Delivered" value={deliveredOrders} />

      <StatCard label="Cancelled" value={cancelledOrders} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Sales
        </p>

        <p className="mt-2 text-xl font-bold text-slate-900">
          ₹{totalSales.toLocaleString("en-IN")}
        </p>
      </div>
    </div>

    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Search Orders
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, customer name or email..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Order Status
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Statuses" : status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">
            Customer Orders
          </h2>

          <p className="text-xs text-slate-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-16 text-center text-sm text-slate-500">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="text-4xl">🛒</div>

          <h3 className="mt-3 font-semibold text-slate-900">
            No orders found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      {order.orderNumber}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      ID #{order.id}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[180px]">
                      <p className="font-medium text-slate-800">
                        {order.user?.name ||
                          order.address?.fullName ||
                          "Guest Customer"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {order.user?.email || "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {order.user?.mobile ||
                          order.address?.mobile ||
                          "-"}
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="text-sm font-medium text-slate-700">
                      {order.paymentMethod}
                    </div>

                    <div
                      className={`mt-1 text-xs font-medium ${
                        order.paymentStatus === "PAID"
                          ? "text-green-600"
                          : order.paymentStatus === "FAILED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {order.paymentStatus}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      ₹{order.total.toLocaleString("en-IN")}
                    </div>

                    {order.deliveryFee === 0 && (
                      <div className="text-xs text-green-600">
                        Free delivery
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                    {formatDate(order.createdAt)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>

  {selectedOrder && (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Order {selectedOrder.orderNumber}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Placed on {formatDate(selectedOrder.createdAt)}
            </p>
          </div>

          <button
            onClick={() => setSelectedOrder(null)}
            className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              title="Customer"
              value={
                selectedOrder.user?.name ||
                selectedOrder.address?.fullName ||
                "Guest"
              }
              extra={selectedOrder.user?.email || ""}
            />

            <InfoCard
              title="Payment"
              value={selectedOrder.paymentMethod}
              extra={`Status: ${selectedOrder.paymentStatus}`}
            />

            <InfoCard
              title="Order Total"
              value={`₹${selectedOrder.total.toLocaleString("en-IN")}`}
              extra={`Delivery: ${
                selectedOrder.deliveryFee === 0
                  ? "FREE"
                  : `₹${selectedOrder.deliveryFee}`
              }`}
            />
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">
              Update Order Status
            </h3>

            <div className="flex flex-wrap gap-2">
              {statuses
                .filter((status) => status !== "ALL")
                .map((status) => (
                  <button
                    key={status}
                    disabled={
                      updating ||
                      selectedOrder.status === status
                    }
                    onClick={() =>
                      updateOrderStatus(selectedOrder, status)
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      selectedOrder.status === status
                        ? `${statusClass(status)} cursor-default`
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:opacity-50`}
                  >
                    {status}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">
              Ordered Products
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="divide-y divide-slate-100">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-2xl">
                      {item.product.image?.startsWith("http") ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        item.product.image || "📦"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        ₹{item.price.toLocaleString("en-IN")} ×{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <div className="font-semibold text-slate-900">
                      ₹
                      {(item.price * item.quantity).toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedOrder.address && (
            <div>
              <h3 className="mb-3 font-semibold text-slate-900">
                Delivery Address
              </h3>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">
                  {selectedOrder.address.fullName}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {selectedOrder.address.mobile}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedOrder.address.address}
                  <br />
                  {selectedOrder.address.city},{" "}
                  {selectedOrder.address.state} -{" "}
                  {selectedOrder.address.pincode}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>
                ₹
                {selectedOrder.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>Delivery Fee</span>
              <span>
                {selectedOrder.deliveryFee === 0
                  ? "FREE"
                  : `₹${selectedOrder.deliveryFee.toLocaleString(
                      "en-IN"
                    )}`}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>
                ₹{selectedOrder.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 text-right">
          <button
            onClick={() => setSelectedOrder(null)}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
</main>

);
}

function StatCard({
label,
value,
}: {
label: string;
value: number;
}) {
return ( <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"> <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
{label} </p>

  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
</div>

);
}

function InfoCard({
title,
value,
extra,
}: {
title: string;
value: string;
extra: string;
}) {
return ( <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"> <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
{title} </p>

  <p className="mt-2 font-semibold text-slate-900">{value}</p>

  {extra && (
    <p className="mt-1 text-xs text-slate-500">{extra}</p>
  )}
</div>

);
}
