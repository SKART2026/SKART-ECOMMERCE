"use client";

import { FormEvent, useEffect, useState } from "react";

type CouponType = "PERCENTAGE" | "FIXED";

type Coupon = {
  id: number;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CouponForm = {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: CouponForm = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<CouponForm>(emptyForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/coupons",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load coupons."
        );
      }

      setCoupons(data.coupons || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load coupons."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm(
    field: keyof CouponForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function editCoupon(coupon: Coupon) {
    setEditingId(coupon.id);

    setForm({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: String(coupon.value),
      minOrderAmount:
        coupon.minOrderAmount > 0
          ? String(coupon.minOrderAmount)
          : "",
      maxDiscount:
        coupon.maxDiscount !== null
          ? String(coupon.maxDiscount)
          : "",
      usageLimit:
        coupon.usageLimit !== null
          ? String(coupon.usageLimit)
          : "",
      startsAt: coupon.startsAt
        ? formatDateTimeLocal(coupon.startsAt)
        : "",
      expiresAt: coupon.expiresAt
        ? formatDateTimeLocal(coupon.expiresAt)
        : "",
      isActive: coupon.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function formatDateTimeLocal(
    value: string
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      date.getDate()
    ).padStart(2, "0");
    const hours = String(
      date.getHours()
    ).padStart(2, "0");
    const minutes = String(
      date.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function saveCoupon(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.code.trim()) {
      setError("Please enter a coupon code.");
      return;
    }

    if (!form.value) {
      setError("Please enter a discount value.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...(editingId
          ? { id: editingId }
          : {}),
        code: form.code,
        description: form.description,
        type: form.type,
        value: form.value,
        minOrderAmount:
          form.minOrderAmount,
        maxDiscount:
          form.maxDiscount,
        usageLimit:
          form.usageLimit,
        startsAt:
          form.startsAt || null,
        expiresAt:
          form.expiresAt || null,
        isActive: form.isActive,
      };

      const response = await fetch(
        "/api/admin/coupons",
        {
          method: editingId
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to save coupon."
        );
      }

      setMessage(
        editingId
          ? "Coupon updated successfully."
          : "Coupon created successfully."
      );

      resetForm();
      await loadCoupons();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save coupon."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    try {
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/admin/coupons",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: coupon.id,
            code: coupon.code,
            description:
              coupon.description || "",
            type: coupon.type,
            value: coupon.value,
            minOrderAmount:
              coupon.minOrderAmount,
            maxDiscount:
              coupon.maxDiscount,
            usageLimit:
              coupon.usageLimit,
            startsAt:
              coupon.startsAt || null,
            expiresAt:
              coupon.expiresAt || null,
            isActive: !coupon.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to update coupon."
        );
      }

      setMessage(
        coupon.isActive
          ? "Coupon deactivated."
          : "Coupon activated."
      );

      await loadCoupons();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update coupon."
      );
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/coupons?id=${coupon.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to delete coupon."
        );
      }

      setMessage(
        "Coupon deleted successfully."
      );

      if (editingId === coupon.id) {
        resetForm();
      }

      await loadCoupons();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete coupon."
      );
    }
  }

  function getCouponStatus(coupon: Coupon) {
    const now = new Date();

    if (!coupon.isActive) {
      return {
        label: "Inactive",
        className: "status-inactive",
      };
    }

    if (
      coupon.startsAt &&
      new Date(coupon.startsAt) > now
    ) {
      return {
        label: "Scheduled",
        className: "status-scheduled",
      };
    }

    if (
      coupon.expiresAt &&
      new Date(coupon.expiresAt) < now
    ) {
      return {
        label: "Expired",
        className: "status-expired",
      };
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >=
        coupon.usageLimit
    ) {
      return {
        label: "Limit Reached",
        className: "status-expired",
      };
    }

    return {
      label: "Active",
      className: "status-active",
    };
  }

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  }

  function getDiscountText(coupon: Coupon) {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}% OFF`;
    }

    return `₹${coupon.value.toFixed(2)} OFF`;
  }

  const filteredCoupons = coupons.filter(
    (coupon) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        coupon.code
          .toLowerCase()
          .includes(searchText) ||
        (coupon.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          coupon.isActive) ||
        (statusFilter === "INACTIVE" &&
          !coupon.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  const totalCoupons = coupons.length;

  const activeCoupons = coupons.filter(
    (coupon) =>
      coupon.isActive &&
      !(
        coupon.expiresAt &&
        new Date(coupon.expiresAt) <
          new Date()
      ) &&
      !(
        coupon.usageLimit !== null &&
        coupon.usedCount >=
          coupon.usageLimit
      )
  ).length;

  const usedCoupons = coupons.reduce(
    (total, coupon) =>
      total + coupon.usedCount,
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: 1250,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 15,
            flexWrap: "wrap",
            marginBottom: 25,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
              }}
            >
              Coupons & Discounts
            </h1>

            <p
              style={{
                marginTop: 7,
                color: "#64748b",
              }}
            >
              Create and manage customer
              discount coupons.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            style={primaryButton}
          >
            + New Coupon
          </button>
        </div>

        {message && (
          <div style={successBox}>
            {message}
          </div>
        )}

        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: 15,
            marginBottom: 25,
          }}
          className="summary-grid"
        >
          <SummaryCard
            title="Total Coupons"
            value={totalCoupons}
          />

          <SummaryCard
            title="Active Coupons"
            value={activeCoupons}
          />

          <SummaryCard
            title="Total Uses"
            value={usedCoupons}
          />
        </div>

        <section
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 22,
            marginBottom: 25,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 20,
              fontSize: 21,
            }}
          >
            {editingId
              ? "Edit Coupon"
              : "Create Coupon"}
          </h2>

          <form onSubmit={saveCoupon}>
            <div
              className="coupon-form-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 15,
              }}
            >
              <FormField label="Coupon Code *">
                <input
                  value={form.code}
                  onChange={(e) =>
                    updateForm(
                      "code",
                      e.target.value
                        .toUpperCase()
                        .replace(/\s+/g, "")
                    )
                  }
                  placeholder="SAVE10"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Description">
                <input
                  value={form.description}
                  onChange={(e) =>
                    updateForm(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="10% discount on orders"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Discount Type *">
                <select
                  value={form.type}
                  onChange={(e) =>
                    updateForm(
                      "type",
                      e.target
                        .value as CouponType
                    )
                  }
                  style={inputStyle}
                >
                  <option value="PERCENTAGE">
                    Percentage
                  </option>
                  <option value="FIXED">
                    Fixed Amount
                  </option>
                </select>
              </FormField>

              <FormField
                label={
                  form.type === "PERCENTAGE"
                    ? "Discount Percentage *"
                    : "Discount Amount (₹) *"
                }
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) =>
                    updateForm(
                      "value",
                      e.target.value
                    )
                  }
                  placeholder={
                    form.type ===
                    "PERCENTAGE"
                      ? "10"
                      : "100"
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Minimum Order Amount (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.minOrderAmount
                  }
                  onChange={(e) =>
                    updateForm(
                      "minOrderAmount",
                      e.target.value
                    )
                  }
                  placeholder="999"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Maximum Discount (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    updateForm(
                      "maxDiscount",
                      e.target.value
                    )
                  }
                  placeholder="Leave blank for no limit"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Usage Limit">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) =>
                    updateForm(
                      "usageLimit",
                      e.target.value
                    )
                  }
                  placeholder="Leave blank for unlimited"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Start Date & Time">
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    updateForm(
                      "startsAt",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Expiry Date & Time">
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) =>
                    updateForm(
                      "expiresAt",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 28,
                }}
              >
                <input
                  id="coupon-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    updateForm(
                      "isActive",
                      e.target.checked
                    )
                  }
                  style={{
                    width: 18,
                    height: 18,
                  }}
                />

                <label
                  htmlFor="coupon-active"
                  style={{
                    fontWeight: 600,
                  }}
                >
                  Coupon is active
                </label>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 22,
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...primaryButton,
                  opacity: saving
                    ? 0.6
                    : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Coupon"
                  : "Create Coupon"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={secondaryButton}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 21,
              }}
            >
              All Coupons
            </h2>

            <button
              type="button"
              onClick={loadCoupons}
              style={secondaryButton}
            >
              Refresh
            </button>
          </div>

          <div
            className="coupon-filter-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1fr) 180px",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search coupon..."
              style={inputStyle}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "ALL"
                    | "ACTIVE"
                    | "INACTIVE"
                )
              }
              style={inputStyle}
            >
              <option value="ALL">
                All Status
              </option>
              <option value="ACTIVE">
                Active
              </option>
              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Loading coupons...
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div
              style={{
                padding: 35,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No coupons found.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: 1050,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#f8fafc",
                    }}
                  >
                    <th style={thStyle}>
                      Coupon
                    </th>

                    <th style={thStyle}>
                      Discount
                    </th>

                    <th style={thStyle}>
                      Minimum Order
                    </th>

                    <th style={thStyle}>
                      Usage
                    </th>

                    <th style={thStyle}>
                      Validity
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCoupons.map(
                    (coupon) => {
                      const status =
                        getCouponStatus(
                          coupon
                        );

                      return (
                        <tr
                          key={coupon.id}
                          style={{
                            borderTop:
                              "1px solid #e2e8f0",
                          }}
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize: 16,
                              }}
                            >
                              {coupon.code}
                            </strong>

                            {coupon.description && (
                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop: 4,
                                  color:
                                    "#64748b",
                                  fontSize: 13,
                                }}
                              >
                                {
                                  coupon.description
                                }
                              </span>
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <strong>
                              {getDiscountText(
                                coupon
                              )}
                            </strong>

                            {coupon.maxDiscount !==
                              null &&
                              coupon.type ===
                                "PERCENTAGE" && (
                                <span
                                  style={{
                                    display:
                                      "block",
                                    marginTop: 4,
                                    color:
                                      "#64748b",
                                    fontSize: 12,
                                  }}
                                >
                                  Max ₹
                                  {coupon.maxDiscount.toFixed(
                                    2
                                  )}
                                </span>
                              )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            ₹
                            {coupon.minOrderAmount.toFixed(
                              2
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {coupon.usedCount}

                            {" / "}

                            {coupon.usageLimit ===
                            null
                              ? "∞"
                              : coupon.usageLimit}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontSize: 12,
                              lineHeight: 1.6,
                            }}
                          >
                            <div>
                              Start:{" "}
                              {formatDate(
                                coupon.startsAt
                              )}
                            </div>

                            <div>
                              End:{" "}
                              {formatDate(
                                coupon.expiresAt
                              )}
                            </div>
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <span
                              className={
                                status.className
                              }
                              style={{
                                display:
                                  "inline-block",
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  999,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {
                                status.label
                              }
                            </span>
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 7,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  editCoupon(
                                    coupon
                                  )
                                }
                                style={
                                  smallButton
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleCoupon(
                                    coupon
                                  )
                                }
                                style={
                                  smallButton
                                }
                              >
                                {coupon.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteCoupon(
                                    coupon
                                  )
                                }
                                style={{
                                  ...smallButton,
                                  background:
                                    "#fee2e2",
                                  color:
                                    "#991b1b",
                                  borderColor:
                                    "#fecaca",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-inactive {
          background: #e2e8f0;
          color: #475569;
        }

        .status-scheduled {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-expired {
          background: #fee2e2;
          color: #991b1b;
        }

        @media (max-width: 800px) {
          .summary-grid {
            grid-template-columns: 1fr !important;
          }

          .coupon-form-grid {
            grid-template-columns: 1fr !important;
          }

          .coupon-filter-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          main {
            padding: 18px 10px 40px !important;
          }

          h1 {
            font-size: 25px !important;
          }

          section {
            padding: 15px !important;
            border-radius: 10px !important;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#334155",
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: 46,
  padding: "11px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 15,
  outline: "none",
  background: "white",
};

const primaryButton = {
  border: 0,
  borderRadius: 8,
  padding: "11px 17px",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 15px",
  background: "white",
  color: "#334155",
  fontWeight: 600,
  cursor: "pointer",
};

const smallButton = {
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  padding: "7px 10px",
  background: "white",
  color: "#334155",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};

const thStyle = {
  padding: "12px 10px",
  textAlign: "left" as const,
  fontSize: 12,
  color: "#475569",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "14px 10px",
  verticalAlign: "top" as const,
  fontSize: 13,
};

const successBox = {
  marginBottom: 18,
  padding: 13,
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: 8,
};

const errorBox = {
  marginBottom: 18,
  padding: 13,
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 8,
};