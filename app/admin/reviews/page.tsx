"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Review = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  product: {
    id: number;
    name: string;
    image?: string | null;
  };
};

type Product = {
  id: number;
  name: string;
};

type Summary = {
  totalReviews: number;
  averageRating: number;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [productId, setProductId] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (rating) {
        params.set("rating", rating);
      }

      if (productId) {
        params.set("productId", productId);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/reviews${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load reviews."
        );
      }

      setReviews(
        Array.isArray(data.reviews)
          ? data.reviews
          : []
      );

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );

      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("ADMIN REVIEWS LOAD ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load reviews."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews;
  }, [reviews]);

  async function handleDelete(reviewId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(reviewId);
      setError("");

      const response = await fetch(
        "/api/admin/reviews",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reviewId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete review."
        );
      }

      await loadReviews();
    } catch (error) {
      console.error(
        "ADMIN REVIEW DELETE ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete review."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function renderStars(rating: number) {
    return (
      <span
        style={{
          color: "#f59e0b",
          letterSpacing: 2,
          fontSize: 18,
        }}
      >
        {Array.from({ length: 5 }, (_, index) =>
          index < rating ? "★" : "☆"
        ).join("")}
      </span>
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f6f8",
        padding: "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 25,
          }}
        >
          <div>
            <Link
              href="/admin"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              ← Back to Admin Dashboard
            </Link>

            <h1
              style={{
                fontSize: 32,
                margin: "10px 0 5px",
              }}
            >
              Customer Reviews
            </h1>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              Manage customer ratings and reviews
            </p>
          </div>

          <button
            onClick={loadReviews}
            disabled={loading}
            style={{
              padding: "12px 18px",
              border: "1px solid #ddd",
              borderRadius: 9,
              background: "#fff",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fff0f0",
              border: "1px solid #ffcaca",
              color: "#c62828",
              padding: 14,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 25,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 22,
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: 14,
              }}
            >
              Total Reviews
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {summary.totalReviews}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 22,
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: 14,
              }}
            >
              Average Rating
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              ⭐ {summary.averageRating.toFixed(1)}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 22,
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: 14,
              }}
            >
              5 Star Reviews
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {summary.ratingCounts[5]}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 22,
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: 14,
              }}
            >
              1–2 Star Reviews
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {summary.ratingCounts[1] +
                summary.ratingCounts[2]}
            </div>
          </div>
        </div>

        <section
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 2fr) minmax(160px, 1fr) minmax(220px, 1fr) auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                Search
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadReviews();
                  }
                }}
                placeholder="Customer, email, product or comment"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #ccc",
                  borderRadius: 9,
                  padding: "12px 13px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                Rating
              </label>

              <select
                value={rating}
                onChange={(event) =>
                  setRating(event.target.value)
                }
                style={{
                  width: "100%",
                  border: "1px solid #ccc",
                  borderRadius: 9,
                  padding: "12px 13px",
                  background: "#fff",
                }}
              >
                <option value="">All Ratings</option>
                <option value="5">★★★★★ 5 Stars</option>
                <option value="4">★★★★☆ 4 Stars</option>
                <option value="3">★★★☆☆ 3 Stars</option>
                <option value="2">★★☆☆☆ 2 Stars</option>
                <option value="1">★☆☆☆☆ 1 Star</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                Product
              </label>

              <select
                value={productId}
                onChange={(event) =>
                  setProductId(event.target.value)
                }
                style={{
                  width: "100%",
                  border: "1px solid #ccc",
                  borderRadius: 9,
                  padding: "12px 13px",
                  background: "#fff",
                }}
              >
                <option value="">
                  All Products
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadReviews}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: 9,
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              onClick={() => {
                setSearch("");
                setRating("");
                setProductId("");

                setTimeout(() => {
                  loadReviews();
                }, 0);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#2563eb",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #eee",
              fontWeight: 800,
            }}
          >
            Reviews ({filteredReviews.length})
          </div>

          {loading ? (
            <div
              style={{
                padding: 50,
                textAlign: "center",
                color: "#666",
              }}
            >
              Loading reviews...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "#666",
              }}
            >
              <div
                style={{
                  fontSize: 45,
                  marginBottom: 10,
                }}
              >
                💬
              </div>

              <strong>No reviews found</strong>

              <p style={{ marginBottom: 0 }}>
                Try changing your filters or search.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: 22,
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(240px, 1fr) minmax(200px, 2fr) auto",
                      gap: 22,
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 17,
                        }}
                      >
                        {review.user.name}
                      </div>

                      <div
                        style={{
                          color: "#666",
                          fontSize: 13,
                          marginTop: 4,
                          wordBreak: "break-word",
                        }}
                      >
                        {review.user.email}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                        }}
                      >
                        {renderStars(
                          review.rating
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 5,
                          color: "#888",
                          fontSize: 13,
                        }}
                      >
                        {formatDate(
                          review.createdAt
                        )}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        📦 {review.product.name}
                      </div>

                      <div
                        style={{
                          background: "#f7f7f7",
                          borderRadius: 9,
                          padding: 14,
                          color: "#555",
                          lineHeight: 1.6,
                          minHeight: 40,
                        }}
                      >
                        {review.comment ||
                          "No comment provided."}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleDelete(review.id)
                      }
                      disabled={
                        deletingId === review.id
                      }
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 14px",
                        background: "#dc2626",
                        color: "#fff",
                        fontWeight: 700,
                        cursor:
                          deletingId === review.id
                            ? "not-allowed"
                            : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {deletingId === review.id
                        ? "Deleting..."
                        : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          main {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }

        @media (max-width: 700px) {
          section > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 800px) {
          section:last-child > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}