"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
id: number;
name: string;
_count: {
products: number;
};
};

export default function CategoriesPage() {
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadCategories() {
try {
const response = await fetch("/api/categories");

    if (!response.ok) {
      throw new Error("Failed to load categories");
    }

    const data = await response.json();
    setCategories(data.categories || []);
  } catch (error) {
    console.error(error);
    setError("Unable to load categories");
  } finally {
    setLoading(false);
  }
}

loadCategories();

}, []);

return (
<main
style={{
minHeight: "100vh",
background: "#f5f5f5",
padding: "40px 20px",
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
marginBottom: "30px",
}}
> <div>
<h1
style={{
fontSize: "32px",
margin: 0,
fontWeight: "700",
}}
>
Shop by Category </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#666",
          }}
        >
          Choose a category to explore products
        </p>
      </div>

      <Link
        href="/"
        style={{
          textDecoration: "none",
          background: "#111",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: "8px",
          fontWeight: "600",
        }}
      >
        Home
      </Link>
    </div>

    {loading && (
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        Loading categories...
      </div>
    )}

    {error && (
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          textAlign: "center",
          color: "red",
        }}
      >
        {error}
      </div>
    )}

    {!loading && !error && categories.length === 0 && (
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        No categories available.
      </div>
    )}

    {!loading && !error && categories.length > 0 && (
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            style={{
              textDecoration: "none",
              color: "#111",
              background: "#fff",
              borderRadius: "14px",
              padding: "30px 20px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              transition: "transform 0.2s",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "12px",
              }}
            >
              🛍️
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "21px",
              }}
            >
              {category.name}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#777",
              }}
            >
              {category._count.products}{" "}
              {category._count.products === 1
                ? "Product"
                : "Products"}
            </p>
          </Link>
        ))}
      </div>
    )}
  </div>
</main>

);
}
