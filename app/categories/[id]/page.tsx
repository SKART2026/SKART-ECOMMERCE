"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";

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
  category?: string;
};

type Category = {
  id: number;
  name: string;
};

export default function CategoryProductsPage() {
  const params = useParams();
  const categoryId = params.id;

  const { addToCart } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/category-products?categoryId=${categoryId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load products");
        }

        setCategory(data.category);
        setProducts(data.products || []);
      } catch (error) {
        console.error(error);
        setError("Unable to load products");
      } finally {
        setLoading(false);
      }
    }

    if (categoryId) {
      loadProducts();
    }
  }, [categoryId]);

  function handleAddToCart(product: Product) {
    if (product.stock <= 0) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      category: product.category || category?.name || "",
      price: product.price,
      oldPrice: product.oldPrice ?? product.price,
      rating: product.rating ?? 0,
      reviews: product.reviews ?? 0,
      image: product.image || "🛍️",
      stock: product.stock,
    });

    setAddedProductId(product.id);

    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  }

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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: "700",
              }}
            >
              {category ? category.name : "Products"}
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#666",
              }}
            >
              {products.length}{" "}
              {products.length === 1 ? "product" : "products"} available
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <Link
              href="/categories"
              style={{
                textDecoration: "none",
                background: "#fff",
                color: "#111",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontWeight: "600",
              }}
            >
              Categories
            </Link>

            <Link
              href="/cart"
              style={{
                textDecoration: "none",
                background: "#2563eb",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "8px",
                fontWeight: "600",
              }}
            >
              🛒 Cart
            </Link>

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
        </div>

        {loading && (
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            Loading products...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "14px",
              textAlign: "center",
              color: "#d00",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            No products available in this category.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "22px",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    height: "210px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fafafa",
                    fontSize: "80px",
                  }}
                >
                  {product.image || "🛍️"}
                </div>

                <div
                  style={{
                    padding: "20px",
                  }}
                >
                  <h2
                    style={{
                      margin: "0 0 8px",
                      fontSize: "20px",
                    }}
                  >
                    {product.name}
                  </h2>

                  <div
                    style={{
                      marginBottom: "10px",
                      fontSize: "14px",
                    }}
                  >
                    ⭐ {product.rating.toFixed(1)} ({product.reviews} reviews)
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: "700",
                      }}
                    >
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>

                    {product.oldPrice && (
                      <span
                        style={{
                          color: "#888",
                          textDecoration: "line-through",
                          fontSize: "14px",
                        }}
                      >
                        ₹{product.oldPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      marginBottom: "16px",
                      fontSize: "14px",
                      color: product.stock > 0 ? "green" : "red",
                      fontWeight: "600",
                    }}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginBottom: "10px",
                      border: "none",
                      borderRadius: "8px",
                      background:
                        product.stock <= 0
                          ? "#d1d5db"
                          : addedProductId === product.id
                          ? "#16a34a"
                          : "#f59e0b",
                      color: "#fff",
                      fontWeight: "700",
                      cursor:
                        product.stock <= 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    {product.stock <= 0
                      ? "Out of Stock"
                      : addedProductId === product.id
                      ? "✓ Added to Cart"
                      : "🛒 Add to Cart"}
                  </button>

                  <Link
                    href={`/products/${product.id}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      background: "#111",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "8px",
                      fontWeight: "600",
                    }}
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}