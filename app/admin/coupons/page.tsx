
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/coupons", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load coupons.");
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
  }

  function startNewCoupon() {
    setMessage("");
    setError("");
    resetForm();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function editCoupon(coupon: Coupon) {
    setMessage("");
    setError("");
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

  function formatDateTimeLocal(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function saveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const code = form.code.trim();
    const value = Number(form.value);

    if (!code) {
      setError("Please enter a coupon code.");
      return;
    }

    if (code.length < 3) {
      setError("Coupon code must contain at least 3 characters.");
      return;
    }

    if (!form.value || Number.isNaN(value) || value <= 0) {
      setError("Please enter a valid discount value.");
      return;
    }

    if (form.type === "PERCENTAGE" && value > 100) {
      setError("Percentage discount cannot be greater than 100%.");
      return;
    }

    if (
      form.minOrderAmount &&
      (Number.isNaN(Number(form.minOrderAmount)) ||
        Number(form.minOrderAmount) < 0)
    ) {
      setError("Please enter a valid minimum order amount.");
      return;
    }

    if (
      form.maxDiscount &&
      (Number.isNaN(Number(form.maxDiscount)) ||
        Number(form.maxDiscount) < 0)
    ) {
      setError("Please enter a valid maximum discount.");
      return;
    }

    if (
      form.usageLimit &&
      (Number.isNaN(Number(form.usageLimit)) ||
        Number(form.usageLimit) < 1)
    ) {
      setError("Usage limit must be at least 1.");
      return;
    }

    if (
      form.startsAt &&
      form.expiresAt &&
      new Date(form.expiresAt) <= new Date(form.startsAt)
    ) {
      setError("Expiry date must be later than the start date.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        code,
        description: form.description.trim(),
        type: form.type,
        value: form.value,
        minOrderAmount: form.minOrderAmount,
        maxDiscount: form.maxDiscount,
        usageLimit: form.usageLimit,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };

      const response = await fetch("/api/admin/coupons", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save coupon.");
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
      setUpdatingId(coupon.id);

      const response = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: coupon.id,
          code: coupon.code,
          description: coupon.description || "",
          type: coupon.type,
          value: coupon.value,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscount: coupon.maxDiscount,
          usageLimit: coupon.usageLimit,
          startsAt: coupon.startsAt || null,
          expiresAt: coupon.expiresAt || null,
          isActive: !coupon.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update coupon.");
      }

      setMessage(
        coupon.isActive
          ? `"${coupon.code}" has been deactivated.`
          : `"${coupon.code}" has been activated.`
      );

      await loadCoupons();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update coupon."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");
      setDeletingId(coupon.id);

      const response = await fetch(
        `/api/admin/coupons?id=${coupon.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete coupon.");
      }

      setMessage(`Coupon "${coupon.code}" deleted successfully.`);

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
    } finally {
      setDeletingId(null);
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
      coupon.usedCount >= coupon.usageLimit
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

  const filteredCoupons = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        !searchText ||
        coupon.code.toLowerCase().includes(searchText) ||
        (coupon.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && coupon.isActive) ||
        (statusFilter === "INACTIVE" && !coupon.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  const totalCoupons = coupons.length;

  const activeCoupons = coupons.filter((coupon) => {
    const status = getCouponStatus(coupon);
    return status.label === "Active";
  }).length;

  const scheduledCoupons = coupons.filter((coupon) => {
    const status = getCouponStatus(coupon);
    return status.label === "Scheduled";
  }).length;

  const expiredCoupons = coupons.filter((coupon) => {
    const status = getCouponStatus(coupon);

    return (
      status.label === "Expired" ||
      status.label === "Limit Reached"
    );
  }).length;

  const usedCoupons = coupons.reduce(
    (total, coupon) => total + coupon.usedCount,
    0
  );

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <div>
            <div className="eyebrow">
              PROMOTIONS
            </div>

            <h1>Coupons & Discounts</h1>

            <p>
              Create, manage and monitor customer discount
              coupons from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={startNewCoupon}
            className="primary-button"
          >
            + New Coupon
          </button>
        </header>

        {message && (
          <div className="alert success-alert">
            <span className="alert-icon">✓</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert error-alert">
            <span className="alert-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            label="Total Coupons"
            value={totalCoupons}
            icon="🎟️"
            description="All coupons"
          />

          <StatCard
            label="Active Coupons"
            value={activeCoupons}
            icon="✓"
            description="Currently available"
          />

          <StatCard
            label="Scheduled"
            value={scheduledCoupons}
            icon="◷"
            description="Starting later"
          />

          <StatCard
            label="Expired / Used"
            value={expiredCoupons}
            icon="!"
            description={`${usedCoupons} total uses`}
          />
        </section>

        <section className="card form-card">
          <div className="section-header">
            <div>
              <div className="section-label">
                {editingId ? "EDIT COUPON" : "NEW COUPON"}
              </div>

              <h2>
                {editingId
                  ? "Update coupon"
                  : "Create a discount coupon"}
              </h2>

              <p>
                Configure the discount, limits and validity period.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="secondary-button"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={saveCoupon}>
            <div className="form-grid">
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
                  className="input"
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
                  className="input"
                />
              </FormField>

              <FormField label="Discount Type *">
                <select
                  value={form.type}
                  onChange={(e) =>
                    updateForm(
                      "type",
                      e.target.value as CouponType
                    )
                  }
                  className="input"
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
                <div className="input-with-suffix">
                  <input
                    type="number"
                    min="0"
                    max={
                      form.type === "PERCENTAGE"
                        ? "100"
                        : undefined
                    }
                    step="0.01"
                    value={form.value}
                    onChange={(e) =>
                      updateForm(
                        "value",
                        e.target.value
                      )
                    }
                    placeholder={
                      form.type === "PERCENTAGE"
                        ? "10"
                        : "100"
                    }
                    className="input input-no-border"
                  />

                  <span>
                    {form.type === "PERCENTAGE" ? "%" : "₹"}
                  </span>
                </div>
              </FormField>

              <FormField label="Minimum Order Amount (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) =>
                    updateForm(
                      "minOrderAmount",
                      e.target.value
                    )
                  }
                  placeholder="999"
                  className="input"
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
                  placeholder="No limit"
                  className="input"
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
                  placeholder="Unlimited"
                  className="input"
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
                  className="input"
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
                  className="input"
                />
              </FormField>

              <div className="active-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      updateForm(
                        "isActive",
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    <strong>Coupon is active</strong>
                    <small>
                      Customers can use this coupon when
                      eligible.
                    </small>
                  </span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className="primary-button"
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
                  className="secondary-button"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <div className="section-header list-header">
            <div>
              <div className="section-label">
                COUPON INVENTORY
              </div>

              <h2>All Coupons</h2>

              <p>
                {filteredCoupons.length} of {coupons.length}{" "}
                coupons shown.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCoupons}
              disabled={loading}
              className="secondary-button"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <span>⌕</span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by coupon code or description..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="clear-search"
                >
                  ×
                </button>
              )}
            </div>

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
              className="filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎟️</div>

              <h3>No coupons found</h3>

              <p>
                {coupons.length === 0
                  ? "Create your first coupon to offer discounts to customers."
                  : "Try changing your search or status filter."}
              </p>

              {coupons.length === 0 && (
                <button
                  type="button"
                  onClick={startNewCoupon}
                  className="primary-button"
                >
                  + Create First Coupon
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Coupon</th>
                    <th>Discount</th>
                    <th>Minimum Order</th>
                    <th>Usage</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    const isUpdating = updatingId === coupon.id;
                    const isDeleting = deletingId === coupon.id;

                    return (
                      <tr key={coupon.id}>
                        <td>
                          <div className="coupon-code">
                            {coupon.code}
                          </div>

                          {coupon.description && (
                            <div className="coupon-description">
                              {coupon.description}
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="discount-main">
                            {getDiscountText(coupon)}
                          </div>

                          {coupon.maxDiscount !== null &&
                            coupon.type === "PERCENTAGE" && (
                              <div className="secondary-text">
                                Max ₹
                                {coupon.maxDiscount.toFixed(2)}
                              </div>
                            )}
                        </td>

                        <td>
                          <strong>
                            ₹
                            {coupon.minOrderAmount.toFixed(2)}
                          </strong>
                        </td>

                        <td>
                          <div className="usage-number">
                            {coupon.usedCount}
                            <span>
                              {" / "}
                              {coupon.usageLimit === null
                                ? "∞"
                                : coupon.usageLimit}
                            </span>
                          </div>

                          {coupon.usageLimit !== null && (
                            <div className="usage-bar">
                              <div
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (coupon.usedCount /
                                      Math.max(
                                        coupon.usageLimit,
                                        1
                                      )) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="validity">
                            <span>
                              <strong>Start:</strong>{" "}
                              {formatDate(coupon.startsAt)}
                            </span>

                            <span>
                              <strong>End:</strong>{" "}
                              {formatDate(coupon.expiresAt)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`status-pill ${status.className}`}
                          >
                            <span className="status-dot" />
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              onClick={() =>
                                editCoupon(coupon)
                              }
                              className="action-button"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleCoupon(coupon)
                              }
                              disabled={
                                isUpdating || isDeleting
                              }
                              className="action-button"
                            >
                              {isUpdating
                                ? "..."
                                : coupon.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteCoupon(coupon)
                              }
                              disabled={
                                isDeleting || isUpdating
                              }
                              className="action-button danger-button"
                            >
                              {isDeleting
                                ? "..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

        body {
          margin: 0;
        }

        .page {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 32px 20px 70px;
          color: #0f172a;
        }

        .container {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 28px;
        }

        .eyebrow,
        .section-label {
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .page-header h1 {
          margin: 5px 0 7px;
          font-size: 32px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .page-header p,
        .section-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .primary-button,
        .secondary-button,
        .action-button {
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .primary-button {
          min-height: 44px;
          border: 0;
          border-radius: 9px;
          padding: 0 17px;
          background: #2563eb;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .primary-button:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .secondary-button {
          min-height: 42px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 15px;
          background: white;
          color: #334155;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
        }

        .secondary-button:hover {
          background: #f8fafc;
        }

        .secondary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 15px;
          margin-bottom: 18px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
        }

        .success-alert {
          background: #ecfdf3;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .alert-icon {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.65);
          flex: 0 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .stat-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 18px;
          font-weight: 800;
        }

        .stat-label {
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .stat-value {
          margin-top: 11px;
          font-size: 27px;
          font-weight: 800;
          line-height: 1;
        }

        .stat-description {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 12px;
        }

        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          margin-bottom: 22px;
          overflow: hidden;
        }

        .form-card {
          padding: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 22px;
        }

        .section-header h2 {
          margin: 5px 0 5px;
          font-size: 21px;
          letter-spacing: -0.01em;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .input {
          width: 100%;
          min-height: 45px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          background: white;
          color: #0f172a;
          font-size: 14px;
          outline: none;
        }

        .input:focus,
        .search-box:focus-within {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .input::placeholder {
          color: #94a3b8;
        }

        .input-with-suffix {
          display: flex;
          align-items: center;
          min-height: 45px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .input-with-suffix:focus-within {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .input-with-suffix .input {
          border: 0;
          box-shadow: none;
        }

        .input-with-suffix span {
          padding: 0 13px;
          color: #64748b;
          font-weight: 700;
        }

        .active-toggle {
          display: flex;
          align-items: center;
          min-height: 45px;
          padding-top: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: #2563eb;
          cursor: pointer;
        }

        .checkbox-label span {
          display: grid;
          gap: 3px;
        }

        .checkbox-label strong {
          font-size: 14px;
        }

        .checkbox-label small {
          color: #64748b;
          font-size: 12px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .list-header {
          padding: 22px 24px 0;
          margin-bottom: 20px;
        }

        .filter-bar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 190px;
          gap: 12px;
          padding: 0 24px 20px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 45px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
        }

        .search-box > span {
          color: #64748b;
          font-size: 21px;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
          color: #0f172a;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .clear-search {
          border: 0;
          background: transparent;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
        }

        .filter-select {
          min-height: 45px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 12px;
          background: white;
          color: #334155;
          font-size: 14px;
          outline: none;
        }

        .table-wrapper {
          overflow-x: auto;
          border-top: 1px solid #e2e8f0;
        }

        table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        th {
          padding: 13px 14px;
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        td {
          padding: 15px 14px;
          border-top: 1px solid #e2e8f0;
          vertical-align: top;
          font-size: 13px;
          color: #334155;
        }

        tbody tr:hover {
          background: #fafcff;
        }

        .coupon-code {
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .coupon-description {
          max-width: 230px;
          margin-top: 5px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.45;
        }

        .discount-main {
          color: #166534;
          font-size: 14px;
          font-weight: 800;
        }

        .secondary-text {
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
        }

        .usage-number {
          font-weight: 800;
          color: #0f172a;
        }

        .usage-number span {
          color: #64748b;
          font-weight: 500;
        }

        .usage-bar {
          width: 85px;
          height: 5px;
          margin-top: 7px;
          overflow: hidden;
          border-radius: 99px;
          background: #e2e8f0;
        }

        .usage-bar div {
          height: 100%;
          border-radius: inherit;
          background: #2563eb;
        }

        .validity {
          display: grid;
          gap: 5px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.45;
          white-space: nowrap;
        }

        .validity strong {
          color: #475569;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
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

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          min-width: 205px;
        }

        .action-button {
          min-height: 31px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 0 9px;
          background: white;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .action-button:hover {
          background: #f8fafc;
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .danger-button {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .danger-button:hover {
          background: #fee2e2;
        }

        .loading-state,
        .empty-state {
          padding: 55px 25px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }

        .loading-state p {
          margin: 12px 0 0;
          font-size: 13px;
        }

        .spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-icon {
          font-size: 35px;
          margin-bottom: 10px;
        }

        .empty-state h3 {
          margin: 0 0 6px;
          color: #334155;
          font-size: 17px;
        }

        .empty-state p {
          max-width: 480px;
          margin: 0 auto 18px;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 1050px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 800px) {
          .page {
            padding: 22px 12px 50px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .page-header h1 {
            font-size: 27px;
          }

          .form-card {
            padding: 18px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .filter-bar {
            grid-template-columns: 1fr;
            padding-left: 18px;
            padding-right: 18px;
          }

          .list-header {
            padding-left: 18px;
            padding-right: 18px;
          }
        }

        @media (max-width: 550px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: stretch;
          }

          .active-toggle {
            padding-top: 0;
          }

          .form-actions .primary-button,
          .form-actions .secondary-button {
            width: 100%;
          }

          .page-header .primary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: string;
  description: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-description">
        {description}
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
          color: "#334155",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

