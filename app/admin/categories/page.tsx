"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadCategories() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to load categories");
        return;
      }

      setCategories(data.categories || []);
    } catch {
      setMessage("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setMessage("");
  }

  async function saveCategory() {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setMessage("Category name must be at least 2 characters.");
      return;
    }

    if (trimmedName.length > 50) {
      setMessage("Category name cannot exceed 50 characters.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const isEditing = editingId !== null;

      const response = await fetch("/api/admin/categories", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? {
                id: editingId,
                name: trimmedName,
              }
            : {
                name: trimmedName,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to save category");
        return;
      }

      setMessage(
        isEditing
          ? "Category updated successfully."
          : "Category added successfully."
      );

      setEditingId(null);
      setName("");

      await loadCategories();
    } catch {
      setMessage("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    if (category._count.products > 0) {
      setMessage(
        `Cannot delete "${category.name}" because it has ${category._count.products} product(s).`
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setMessage("");

      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: category.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to delete category");
        return;
      }

      setMessage("Category deleted successfully.");

      if (editingId === category.id) {
        setEditingId(null);
        setName("");
      }

      await loadCategories();
    } catch {
      setMessage("Failed to connect to server");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const totalProducts = categories.reduce(
    (total, category) => total + category._count.products,
    0
  );

  const emptyCategories = categories.filter(
    (category) => category._count.products === 0
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                #
              </span>
              Admin Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Category Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, edit and manage your ShopKart product categories.
            </p>
          </div>

          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            ← Admin Dashboard
          </a>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Categories
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {categories.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                #
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Products
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalProducts}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                📦
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Empty Categories
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {emptyCategories}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
                !
              </div>
            </div>
          </div>
        </div>

        {/* Add / Edit */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId !== null ? "Edit Category" : "Add New Category"}
            </h2>

            <p className="text-sm text-slate-500">
              {editingId !== null
                ? "Update the selected category name."
                : "Create a new category for your products."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter category name"
              maxLength={50}
              disabled={saving}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  saveCategory();
                }
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            />

            <button
              type="button"
              onClick={saveCategory}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Update Category"
                : "Add Category"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            )}
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {message}
            </div>
          )}
        </section>

        {/* Category list */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Categories ({filteredCategories.length})
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage all categories and their product assignments.
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-64"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="text-sm font-medium text-slate-500">
                  Loading categories...
                </p>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                #
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {search ? "No categories found" : "No categories yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Create your first product category using the form above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      ID
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Products
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map((category) => {
                    const hasProducts = category._count.products > 0;
                    const isDeleting = deletingId === category.id;

                    return (
                      <tr
                        key={category.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-600">
                            {category.id}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {category.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            Category ID #{category.id}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {category._count.products}
                          </span>

                          <span className="ml-1 text-sm text-slate-500">
                            {category._count.products === 1
                              ? "product"
                              : "products"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {hasProducts ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              In Use
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                              Empty
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteCategory(category)}
                              disabled={hasProducts || isDeleting}
                              title={
                                hasProducts
                                  ? "Remove all products from this category before deleting it."
                                  : "Delete category"
                              }
                              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                hasProducts
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
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
    </main>
  );
}