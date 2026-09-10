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

type CustomerOrder = {
id: number;
orderNumber: string;
status: string;
paymentMethod: string;
paymentStatus: string;
subtotal: number;
deliveryFee: number;
total: number;
createdAt: string;
updatedAt: string;
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

type Customer = {
id: number;
name: string;
email: string;
mobile: string | null;
createdAt: string;
updatedAt: string;
orderCount: number;
totalSpent: number;
orders: CustomerOrder[];
};

type Summary = {
totalCustomers: number;
totalOrders: number;
totalSales: number;
};

export default function AdminCustomersPage() {
const [customers, setCustomers] = useState<Customer[]>([]);
const [summary, setSummary] = useState<Summary>({
totalCustomers: 0,
totalOrders: 0,
totalSales: 0,
});

const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [selectedCustomer, setSelectedCustomer] =
useState<Customer | null>(null);

useEffect(() => {
loadCustomers();
}, []);

async function loadCustomers() {
try {
setLoading(true);
setError("");

  const response = await fetch("/api/admin/customers", {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load customers");
  }

  setCustomers(data.customers || []);

  setSummary(
    data.summary || {
      totalCustomers: 0,
      totalOrders: 0,
      totalSales: 0,
    }
  );
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Unable to load customers"
  );
} finally {
  setLoading(false);
}

}

const filteredCustomers = useMemo(() => {
const searchText = search.trim().toLowerCase();

if (!searchText) {
  return customers;
}

return customers.filter((customer) => {
  return (
    customer.name.toLowerCase().includes(searchText) ||
    customer.email.toLowerCase().includes(searchText) ||
    (customer.mobile || "")
      .toLowerCase()
      .includes(searchText)
  );
});

}, [customers, search]);

function formatCurrency(value: number) {
return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
}

function formatDate(value: string) {
return new Date(value).toLocaleDateString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
});
}

function formatDateTime(value: string) {
return new Date(value).toLocaleString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
});
}

function getStatusStyle(status: string) {
const styles: Record<
string,
{ background: string; color: string }
> = {
PENDING: {
background: "#fef3c7",
color: "#92400e",
},
CONFIRMED: {
background: "#dbeafe",
color: "#1e40af",
},
PROCESSING: {
background: "#e0e7ff",
color: "#3730a3",
},
SHIPPED: {
background: "#cffafe",
color: "#155e75",
},
DELIVERED: {
background: "#dcfce7",
color: "#166534",
},
CANCELLED: {
background: "#fee2e2",
color: "#991b1b",
},
};

return (
  styles[status] || {
    background: "#f3f4f6",
    color: "#374151",
  }
);

}

if (loading) {
return (
<main
style={{
minHeight: "100vh",
padding: "40px",
background: "#f5f7fb",
fontFamily: "Arial, sans-serif",
}}
> <h1>Admin Customers</h1> <p>Loading customers...</p> </main>
);
}

if (error) {
return (
<main
style={{
minHeight: "100vh",
padding: "40px",
background: "#f5f7fb",
fontFamily: "Arial, sans-serif",
}}
> <h1>Admin Customers</h1>

    <div
      style={{
        marginTop: "20px",
        padding: "20px",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        borderRadius: "12px",
        color: "#991b1b",
      }}
    >
      {error}
    </div>

    <button
      onClick={loadCustomers}
      style={{
        marginTop: "15px",
        padding: "10px 18px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Try Again
    </button>
  </main>
);

}

return (
<main
style={{
minHeight: "100vh",
padding: "30px",
background: "#f5f7fb",
fontFamily: "Arial, sans-serif",
}}
>
<div
style={{
maxWidth: "1400px",
margin: "0 auto",
}}
>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "20px",
flexWrap: "wrap",
marginBottom: "30px",
}}
> <div>
<Link
href="/admin"
style={{
textDecoration: "none",
color: "#555",
fontSize: "14px",
}}
>
← Back to Admin Dashboard </Link>

        <h1
          style={{
            margin: "10px 0 5px",
            fontSize: "32px",
          }}
        >
          Customers
        </h1>

        <p
          style={{
            margin: 0,
            color: "#666",
          }}
        >
          Manage and review your SKART customers.
        </p>
      </div>

      <button
        onClick={loadCustomers}
        style={{
          padding: "11px 18px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "white",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        ↻ Refresh
      </button>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "22px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ color: "#666", fontSize: "14px" }}>
          Total Customers
        </div>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "700",
            marginTop: "8px",
          }}
        >
          {summary.totalCustomers}
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "22px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ color: "#666", fontSize: "14px" }}>
          Total Orders
        </div>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "700",
            marginTop: "8px",
          }}
        >
          {summary.totalOrders}
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "22px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ color: "#666", fontSize: "14px" }}>
          Total Customer Sales
        </div>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "700",
            marginTop: "8px",
          }}
        >
          {formatCurrency(summary.totalSales)}
        </div>
      </div>
    </div>

    <div
      style={{
        background: "white",
        padding: "18px",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        marginBottom: "20px",
      }}
    >
      <input
        type="text"
        placeholder="Search by customer name, email or mobile..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{
          width: "100%",
          padding: "13px 15px",
          border: "1px solid #d1d5db",
          borderRadius: "9px",
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>

    <div
      style={{
        background: "white",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        overflow: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "900px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f8fafc",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "15px" }}>Customer</th>
            <th style={{ padding: "15px" }}>Email</th>
            <th style={{ padding: "15px" }}>Mobile</th>
            <th style={{ padding: "15px" }}>Orders</th>
            <th style={{ padding: "15px" }}>Total Spent</th>
            <th style={{ padding: "15px" }}>Registered</th>
            <th style={{ padding: "15px" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredCustomers.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: "50px 20px",
                  textAlign: "center",
                  color: "#777",
                }}
              >
                {search
                  ? "No customers match your search."
                  : "No customers found."}
              </td>
            </tr>
          ) : (
            filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                style={{
                  borderTop: "1px solid #eee",
                }}
              >
                <td style={{ padding: "15px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                      }}
                    >
                      {customer.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                        }}
                      >
                        {customer.name}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#777",
                        }}
                      >
                        ID: {customer.id}
                      </div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: "15px" }}>
                  {customer.email}
                </td>

                <td style={{ padding: "15px" }}>
                  {customer.mobile || "-"}
                </td>

                <td style={{ padding: "15px" }}>
                  {customer.orderCount}
                </td>

                <td
                  style={{
                    padding: "15px",
                    fontWeight: "700",
                  }}
                >
                  {formatCurrency(customer.totalSpent)}
                </td>

                <td style={{ padding: "15px" }}>
                  {formatDate(customer.createdAt)}
                </td>

                <td style={{ padding: "15px" }}>
                  <button
                    onClick={() =>
                      setSelectedCustomer(customer)
                    }
                    style={{
                      padding: "8px 13px",
                      border: "1px solid #d1d5db",
                      borderRadius: "7px",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    <div
      style={{
        marginTop: "15px",
        color: "#666",
        fontSize: "14px",
      }}
    >
      Showing {filteredCustomers.length} of{" "}
      {customers.length} customers
    </div>
  </div>

  {selectedCustomer && (
    <div
      onClick={() => setSelectedCustomer(null)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "26px",
              }}
            >
              {selectedCustomer.name}
            </h2>

            <div
              style={{
                marginTop: "5px",
                color: "#666",
              }}
            >
              Customer ID: {selectedCustomer.id}
            </div>
          </div>

          <button
            onClick={() => setSelectedCustomer(null)}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "28px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                color: "#666",
                fontSize: "13px",
              }}
            >
              Email
            </div>
            <div
              style={{
                fontWeight: "600",
                marginTop: "5px",
                wordBreak: "break-word",
              }}
            >
              {selectedCustomer.email}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                color: "#666",
                fontSize: "13px",
              }}
            >
              Mobile
            </div>
            <div
              style={{
                fontWeight: "600",
                marginTop: "5px",
              }}
            >
              {selectedCustomer.mobile || "-"}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                color: "#666",
                fontSize: "13px",
              }}
            >
              Total Orders
            </div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "20px",
                marginTop: "5px",
              }}
            >
              {selectedCustomer.orderCount}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                color: "#666",
                fontSize: "13px",
              }}
            >
              Total Spent
            </div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "20px",
                marginTop: "5px",
              }}
            >
              {formatCurrency(
                selectedCustomer.totalSpent
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ margin: 0 }}>
            Order History
          </h3>

          <span
            style={{
              color: "#666",
              fontSize: "14px",
            }}
          >
            {selectedCustomer.orders.length} order(s)
          </span>
        </div>

        {selectedCustomer.orders.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              background: "#f8fafc",
              borderRadius: "12px",
              textAlign: "center",
              color: "#777",
            }}
          >
            This customer has not placed any orders yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "15px",
            }}
          >
            {selectedCustomer.orders.map((order) => {
              const statusStyle = getStatusStyle(
                order.status
              );

              return (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                      flexWrap: "wrap",
                      marginBottom: "15px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "17px",
                        }}
                      >
                        {order.orderNumber}
                      </div>

                      <div
                        style={{
                          color: "#777",
                          fontSize: "13px",
                          marginTop: "4px",
                        }}
                      >
                        {formatDateTime(order.createdAt)}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background:
                          statusStyle.background,
                        color: statusStyle.color,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                        }}
                      >
                        Payment Method
                      </div>
                      <div
                        style={{
                          fontWeight: "600",
                          marginTop: "3px",
                        }}
                      >
                        {order.paymentMethod}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                        }}
                      >
                        Payment Status
                      </div>
                      <div
                        style={{
                          fontWeight: "600",
                          marginTop: "3px",
                        }}
                      >
                        {order.paymentStatus}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                        }}
                      >
                        Items
                      </div>
                      <div
                        style={{
                          fontWeight: "600",
                          marginTop: "3px",
                        }}
                      >
                        {order.items.reduce(
                          (sum, item) =>
                            sum + item.quantity,
                          0
                        )}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                        }}
                      >
                        Order Total
                      </div>
                      <div
                        style={{
                          fontWeight: "700",
                          marginTop: "3px",
                        }}
                      >
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #eee",
                      paddingTop: "15px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        marginBottom: "10px",
                      }}
                    >
                      Products
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                            padding: "9px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                          }}
                        >
                          <div>
                            {item.product.name}
                          </div>

                          <div
                            style={{
                              whiteSpace: "nowrap",
                              color: "#555",
                            }}
                          >
                            × {item.quantity}{" "}
                            {formatCurrency(
                              item.price *
                                item.quantity
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.address && (
                    <div
                      style={{
                        borderTop: "1px solid #eee",
                        marginTop: "15px",
                        paddingTop: "15px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          marginBottom: "7px",
                        }}
                      >
                        Delivery Address
                      </div>

                      <div
                        style={{
                          color: "#555",
                          lineHeight: "1.6",
                          fontSize: "14px",
                        }}
                      >
                        {order.address.fullName}
                        <br />
                        {order.address.mobile}
                        <br />
                        {order.address.address}
                        <br />
                        {order.address.city},{" "}
                        {order.address.state} -{" "}
                        {order.address.pincode}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: "1px solid #eee",
                      marginTop: "15px",
                      paddingTop: "15px",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "15px",
                      flexWrap: "wrap",
                      fontSize: "14px",
                    }}
                  >
                    <div>
                      Subtotal:{" "}
                      <strong>
                        {formatCurrency(
                          order.subtotal
                        )}
                      </strong>
                    </div>

                    <div>
                      Delivery:{" "}
                      <strong>
                        {order.deliveryFee === 0
                          ? "FREE"
                          : formatCurrency(
                              order.deliveryFee
                            )}
                      </strong>
                    </div>

                    <div>
                      Total:{" "}
                      <strong>
                        {formatCurrency(order.total)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: "25px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setSelectedCustomer(null)}
            style={{
              padding: "11px 22px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
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
