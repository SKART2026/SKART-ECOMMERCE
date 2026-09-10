"use client";

import { useEffect, useState } from "react";

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
      alert(
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
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
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
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
              }}
            >
              Category Management
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: "8px",
              }}
            >
              Manage your SKART product categories
            </p>
          </div>

          <a
            href="/admin"
            style={{
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "#111827",
              color: "white",
              fontWeight: 600,
            }}
          >
            ← Admin Dashboard
          </a>
        </div>

        <section
          style={{
            background: "white",
            padding: "22px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            {editingId !== null ? "Edit Category" : "Add New Category"}
          </h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter category name"
              maxLength={50}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  saveCategory();
                }
              }}
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />

            <button
              type="button"
              onClick={saveCategory}
              disabled={saving}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
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
                style={{
                  padding: "12px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {message && (
            <p
              style={{
                marginBottom: 0,
                marginTop: "15px",
                fontWeight: 600,
              }}
            >
              {message}
            </p>
          )}
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              Categories ({categories.length})
            </h2>
          </div>

          {loading ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
              }}
            >
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#666",
              }}
            >
              No categories found.
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
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "14px 18px" }}>ID</th>
                    <th style={{ padding: "14px 18px" }}>Category</th>
                    <th style={{ padding: "14px 18px" }}>Products</th>
                    <th style={{ padding: "14px 18px" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        {category.id}
                      </td>

                      <td
                        style={{
                          padding: "14px 18px",
                          fontWeight: 600,
                        }}
                      >
                        {category.name}
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        {category._count.products}
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            style={{
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              background: "white",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteCategory(category)}
                            disabled={category._count.products > 0}
                            style={{
                              padding: "8px 12px",
                              border: "none",
                              borderRadius: "6px",
                              background:
                                category._count.products > 0
                                  ? "#e5e7eb"
                                  : "#dc2626",
                              color:
                                category._count.products > 0
                                  ? "#666"
                                  : "white",
                              cursor:
                                category._count.products > 0
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight: 600,
                            }}
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
        </section>
      </div>
    </main>
  );
}