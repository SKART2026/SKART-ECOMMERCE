"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Category = {
id: number;
name: string;
};

type Product = {
id: number;
name: string;
description: string | null;
price: number;
oldPrice: number | null;
image: string | null;
stock: number;
rating: number;
reviews: number;
categoryId: number;
isActive: boolean;
category: Category;
};

type ProductForm = {
name: string;
description: string;
price: string;
oldPrice: string;
image: string;
stock: string;
rating: string;
reviews: string;
categoryId: string;
isActive: boolean;
};

const emptyForm: ProductForm = {
name: "",
description: "",
price: "",
oldPrice: "",
image: "",
stock: "0",
rating: "0",
reviews: "0",
categoryId: "",
isActive: true,
};

export default function AdminProductsPage() {
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const [search, setSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState("ALL");
const [statusFilter, setStatusFilter] = useState("ALL");

const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState<number | null>(null);
const [form, setForm] = useState<ProductForm>(emptyForm);

const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function loadProducts() {
try {
setLoading(true);
setError("");

  const response = await fetch("/api/admin/products", {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load products");
  }

  setProducts(data.products || []);
} catch (err) {
  setError(err instanceof Error ? err.message : "Unable to load products");
} finally {
  setLoading(false);
}

}

useEffect(() => {
loadProducts();
}, []);

const categories = useMemo(() => {
const map = new Map<number, Category>();

products.forEach((product) => {
  if (product.category) {
    map.set(product.category.id, product.category);
  }
});

return Array.from(map.values()).sort((a, b) =>
  a.name.localeCompare(b.name)
);

}, [products]);

const filteredProducts = useMemo(() => {
const searchText = search.trim().toLowerCase();

return products.filter((product) => {
  const matchesSearch =
    !searchText ||
    product.name.toLowerCase().includes(searchText) ||
    product.category?.name.toLowerCase().includes(searchText);

  const matchesCategory =
    categoryFilter === "ALL" ||
    String(product.categoryId) === categoryFilter;

  const matchesStatus =
    statusFilter === "ALL" ||
    (statusFilter === "ACTIVE" && product.isActive) ||
    (statusFilter === "INACTIVE" && !product.isActive);

  return matchesSearch && matchesCategory && matchesStatus;
});

}, [products, search, categoryFilter, statusFilter]);

function openAddForm() {
setEditingId(null);

setForm({
  ...emptyForm,
  categoryId: categories.length > 0 ? String(categories[0].id) : "",
});

setMessage("");
setError("");
setShowForm(true);

}

function openEditForm(product: Product) {
setEditingId(product.id);

setForm({
  name: product.name,
  description: product.description || "",
  price: String(product.price),
  oldPrice: product.oldPrice !== null ? String(product.oldPrice) : "",
  image: product.image || "",
  stock: String(product.stock),
  rating: String(product.rating),
  reviews: String(product.reviews),
  categoryId: String(product.categoryId),
  isActive: product.isActive,
});

setMessage("");
setError("");
setShowForm(true);

}

function closeForm() {
if (saving) return;

setShowForm(false);
setEditingId(null);
setForm(emptyForm);
setError("");

}

function updateForm(field: keyof ProductForm, value: string | boolean) {
setForm((current) => ({
...current,
[field]: value,
}));
}

async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();

setSaving(true);
setError("");
setMessage("");

try {
  if (!form.name.trim()) {
    throw new Error("Product name is required");
  }

  if (!form.price || Number(form.price) < 0) {
    throw new Error("Please enter a valid price");
  }

  if (!form.categoryId) {
    throw new Error("Please select a category");
  }

  const payload = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
    image: form.image.trim() || null,
    stock: Number(form.stock) || 0,
    rating: Number(form.rating) || 0,
    reviews: Number(form.reviews) || 0,
    categoryId: Number(form.categoryId),
    isActive: form.isActive,
  };

  const response = await fetch("/api/admin/products", {
    method: editingId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      editingId
        ? {
            id: editingId,
            ...payload,
          }
        : payload
    ),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to save product");
  }

  setMessage(
    editingId
      ? "Product updated successfully."
      : "Product created successfully."
  );

  setShowForm(false);
  setEditingId(null);
  setForm(emptyForm);

  await loadProducts();
} catch (err) {
  setError(err instanceof Error ? err.message : "Unable to save product");
} finally {
  setSaving(false);
}

}

async function toggleProduct(product: Product) {
const action = product.isActive ? "deactivate" : "activate";

const confirmed = window.confirm(
  `Are you sure you want to ${action} "${product.name}"?`
);

if (!confirmed) return;

try {
  setError("");
  setMessage("");

  const response = await fetch("/api/admin/products", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: product.id,
      isActive: !product.isActive,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Unable to ${action} product`);
  }

  setMessage(
    product.isActive
      ? "Product deactivated successfully."
      : "Product activated successfully."
  );

  await loadProducts();
} catch (err) {
  setError(
    err instanceof Error ? err.message : `Unable to ${action} product`
  );
}

}

async function deleteProduct(product: Product) {
const confirmed = window.confirm(
`Delete "${product.name}"?\n\nIf this product has previous orders, SKART will automatically deactivate it instead of permanently deleting it.`
);

if (!confirmed) return;

try {
  setError("");
  setMessage("");

  const response = await fetch("/api/admin/products", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: product.id,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to delete product");
  }

  setMessage(data.message || "Product deleted successfully.");

  await loadProducts();
} catch (err) {
  setError(err instanceof Error ? err.message : "Unable to delete product");
}

}

const totalProducts = products.length;
const activeProducts = products.filter((product) => product.isActive).length;
const inactiveProducts = products.filter((product) => !product.isActive).length;
const lowStockProducts = products.filter(
(product) => product.stock > 0 && product.stock <= 10
).length;
const outOfStockProducts = products.filter(
(product) => product.stock <= 0
).length;

return ( <main className="min-h-screen bg-slate-50"> <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"> <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> <div> <Link
           href="/admin"
           className="mb-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
         >
← Back to Admin Dashboard </Link>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Product Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add, edit, activate, deactivate and manage SKART products.
        </p>
      </div>

      <button
        onClick={openAddForm}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        + Add Product
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

    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
      <StatCard label="Total Products" value={totalProducts} />
      <StatCard label="Active" value={activeProducts} />
      <StatCard label="Inactive" value={inactiveProducts} />
      <StatCard label="Low Stock" value={lowStockProducts} />
      <StatCard label="Out of Stock" value={outOfStockProducts} />
    </div>

    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Search
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or category..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Products</h2>
          <p className="text-xs text-slate-500">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        <button
          onClick={loadProducts}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="px-6 py-16 text-center text-sm text-slate-500">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="text-4xl">📦</div>
          <h3 className="mt-3 font-semibold text-slate-900">
            No products found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-[260px] items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-2xl">
                        {product.image?.startsWith("http") ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          product.image || "📦"
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Product ID: #{product.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {product.category?.name || "-"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </div>

                    {product.oldPrice !== null && (
                      <div className="text-xs text-slate-400 line-through">
                        ₹{product.oldPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={
                        product.stock <= 0
                          ? "font-semibold text-red-600"
                          : product.stock <= 10
                          ? "font-semibold text-orange-600"
                          : "font-semibold text-green-600"
                      }
                    >
                      {product.stock}
                    </span>

                    {product.stock <= 10 && (
                      <div className="mt-1 text-[11px] text-slate-400">
                        {product.stock <= 0
                          ? "Out of stock"
                          : "Low stock"}
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="text-sm font-medium text-slate-800">
                      ⭐ {product.rating.toFixed(1)}
                    </div>

                    <div className="text-xs text-slate-400">
                      {product.reviews} reviews
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {product.isActive ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditForm(product)}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleProduct(product)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {product.isActive ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => deleteProduct(product)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>

  {showForm && (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {editingId
                ? "Update the product information below."
                : "Enter the product information to add it to SKART."}
            </p>
          </div>

          <button
            onClick={closeForm}
            className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={saveProduct} className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Product Name *">
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="Example: Wireless Headphones"
                className="form-input"
                required
              />
            </FormField>

            <FormField label="Category *">
              <select
                value={form.categoryId}
                onChange={(event) =>
                  updateForm("categoryId", event.target.value)
                }
                className="form-input bg-white"
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Price (₹) *">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  updateForm("price", event.target.value)
                }
                placeholder="1499"
                className="form-input"
                required
              />
            </FormField>

            <FormField label="Old Price (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.oldPrice}
                onChange={(event) =>
                  updateForm("oldPrice", event.target.value)
                }
                placeholder="2499"
                className="form-input"
              />
            </FormField>

            <FormField label="Stock">
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) =>
                  updateForm("stock", event.target.value)
                }
                placeholder="50"
                className="form-input"
              />
            </FormField>

            <FormField label="Rating">
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(event) =>
                  updateForm("rating", event.target.value)
                }
                placeholder="4.5"
                className="form-input"
              />
            </FormField>

            <FormField label="Reviews">
              <input
                type="number"
                min="0"
                step="1"
                value={form.reviews}
                onChange={(event) =>
                  updateForm("reviews", event.target.value)
                }
                placeholder="128"
                className="form-input"
              />
            </FormField>

            <FormField label="Image">
              <input
                type="text"
                value={form.image}
                onChange={(event) =>
                  updateForm("image", event.target.value)
                }
                placeholder="Emoji or image URL"
                className="form-input"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe the product..."
                  rows={4}
                  className="form-input resize-none"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm("isActive", event.target.checked)
                  }
                  className="h-4 w-4 rounded"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Product is active
                  </span>

                  <span className="block text-xs text-slate-500">
                    Active products can be displayed and purchased by
                    customers.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  <style jsx>{`
    .form-input {
      width: 100%;
      border-radius: 0.75rem;
      border: 1px solid rgb(203 213 225);
      padding: 0.7rem 0.9rem;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }

    .form-input:focus {
      border-color: rgb(59 130 246);
      box-shadow: 0 0 0 3px rgb(219 234 254);
    }
  `}</style>
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

function FormField({
label,
children,
}: {
label: string;
children: React.ReactNode;
}) {
return ( <div> <label className="mb-1.5 block text-sm font-medium text-slate-700">
{label} </label>

  {children}
</div>

);
}
