"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product, useCart } from "../../../context/CartContext";

type ApiProduct = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  image?: string | null;
  stock: number;
  rating?: number | null;
  reviews?: number | null;
  category?: {
    name?: string;
  } | null;
};

type Review = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  const productId = Number(params.id);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        const products: ApiProduct[] = Array.isArray(data)
          ? data
          : data.products || [];

        const found = products.find(
          (item) => item.id === productId
        );

        if (!found) {
          setProduct(null);
          return;
        }

        const formattedProduct: Product = {
          id: found.id,
          name: found.name,
          category: found.category?.name || "General",
          price: Number(found.price),
          oldPrice: Number(found.oldPrice ?? found.price),
          rating: Number(found.rating ?? 0),
          reviews: Number(found.reviews ?? 0),
          image: found.image || "🛍️",
          stock: Number(found.stock ?? 0),
        };

        setProduct(formattedProduct);
      } catch (error) {
        console.error("PRODUCT LOAD ERROR:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    async function loadReviews() {
      try {
        setReviewsLoading(true);

        const response = await fetch(
          `/api/reviews?productId=${productId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load reviews");
        }

        const data = await response.json();

        setReviews(
          Array.isArray(data.reviews)
            ? data.reviews
            : []
        );
      } catch (error) {
        console.error("REVIEWS LOAD ERROR:", error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    }

    if (productId) {
      loadProduct();
      loadReviews();
    } else {
      setLoading(false);
      setReviewsLoading(false);
    }
  }, [productId]);

  function handleAddToCart() {
    if (!product || product.stock <= 0) {
      return;
    }

    addToCart(product, quantity);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  function handleBuyNow() {
    if (!product || product.stock <= 0) {
      return;
    }

    setBuying(true);

    addToCart(product, quantity);

    router.push("/checkout");
  }

  function increaseQuantity() {
    if (!product) return;

    setQuantity((current) =>
      Math.min(current + 1, product.stock)
    );
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  async function handleSubmitReview() {
    setReviewMessage("");
    setReviewError("");

    if (!product) {
      return;
    }

    if (
      !Number.isInteger(selectedRating) ||
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setReviewError("Please select a rating.");
      return;
    }

    if (reviewComment.trim().length > 1000) {
      setReviewError(
        "Review comment cannot exceed 1000 characters."
      );
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          rating: selectedRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push(
          `/login?redirect=/products/${product.id}`
        );
        return;
      }

      if (!response.ok) {
        setReviewError(
          data.error || "Failed to submit review."
        );
        return;
      }

      setReviewMessage(
        "✓ Your review has been submitted successfully."
      );

      setReviewComment("");
      setSelectedRating(5);

      if (data.rating !== undefined) {
        setProduct((current) =>
          current
            ? {
                ...current,
                rating: Number(data.rating),
                reviews: Number(data.reviews ?? current.reviews),
              }
            : current
        );
      }

      if (data.review) {
        setReviews((current) => [
          data.review,
          ...current,
        ]);
      }

      setTimeout(() => {
        setReviewMessage("");
      }, 4000);
    } catch (error) {
      console.error("REVIEW SUBMIT ERROR:", error);

      setReviewError(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmittingReview(false);
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

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f7f7f7",
          padding: "40px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            textAlign: "center",
            padding: "80px 20px",
          }}
        >
          <h2>Loading product...</h2>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f7f7f7",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            textAlign: "center",
            padding: "80px 20px",
          }}
        >
          <h1>Product Not Found</h1>

          <p
            style={{
              marginTop: 12,
              color: "#666",
            }}
          >
            The product you are looking for does not
            exist.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "12px 22px",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            ← Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const discount =
    product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) /
            product.oldPrice) *
            100
        )
      : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        paddingBottom: 60,
      }}
    >
      <header
        style={{
          background: "#111",
          color: "#fff",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            🛍️ SKart
          </Link>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/categories"
              style={{
                color: "#fff",
                textDecoration: "none",
                padding: "8px 12px",
              }}
            >
              Categories
            </Link>

            <Link
              href="/wishlist"
              style={{
                color: "#fff",
                textDecoration: "none",
                padding: "8px 12px",
              }}
            >
              ❤️ Wishlist
            </Link>

            <Link
              href="/cart"
              style={{
                color: "#fff",
                textDecoration: "none",
                padding: "8px 12px",
              }}
            >
              🛒 Cart
            </Link>

            <Link
              href="/account"
              style={{
                color: "#fff",
                textDecoration: "none",
                padding: "8px 12px",
              }}
            >
              👤 Account
            </Link>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 20px",
        }}
      >
        <div
          style={{
            marginBottom: 20,
            fontSize: 14,
            color: "#666",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#666",
              textDecoration: "none",
            }}
          >
            Home
          </Link>

          {" / "}

          <Link
            href="/categories"
            style={{
              color: "#666",
              textDecoration: "none",
            }}
          >
            Categories
          </Link>

          {" / "}

          <span>{product.name}</span>
        </div>

        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            display: "grid",
            gridTemplateColumns:
              "minmax(300px, 1fr) minmax(300px, 1fr)",
            gap: 40,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              minHeight: 430,
              background: "#f4f4f4",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {product.image &&
            (product.image.startsWith("http") ||
              product.image.startsWith("/")) ? (
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: 430,
                  objectFit: "contain",
                  padding: 30,
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: 100,
                }}
              >
                {product.image || "🛍️"}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                display: "inline-block",
                padding: "6px 10px",
                background: "#f1f1f1",
                borderRadius: 20,
                fontSize: 13,
                color: "#555",
                marginBottom: 14,
              }}
            >
              {product.category}
            </div>

            <h1
              style={{
                fontSize: 36,
                lineHeight: 1.2,
                margin: "0 0 14px",
              }}
            >
              {product.name}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: "#16823b",
                  color: "#fff",
                  padding: "5px 9px",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                ⭐ {product.rating.toFixed(1)}
              </span>

              <span style={{ color: "#666" }}>
                {product.reviews}{" "}
                {product.reviews === 1
                  ? "review"
                  : "reviews"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                }}
              >
                ₹{product.price.toLocaleString("en-IN")}
              </span>

              {product.oldPrice > product.price && (
                <>
                  <span
                    style={{
                      fontSize: 20,
                      color: "#888",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹
                    {product.oldPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                  <span
                    style={{
                      color: "#16823b",
                      fontWeight: 700,
                    }}
                  >
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            <div
              style={{
                marginBottom: 20,
                fontWeight: 700,
                color:
                  product.stock > 0
                    ? "#16823b"
                    : "#c62828",
              }}
            >
              {product.stock > 0
                ? `✓ ${product.stock} in stock`
                : "✕ Out of stock"}
            </div>

            <p
              style={{
                color: "#555",
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              This product is available on SKART with
              secure checkout and reliable delivery.
            </p>

            {product.stock > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                <strong>Quantity:</strong>

                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  style={{
                    width: 38,
                    height: 38,
                    border: "1px solid #ccc",
                    background: "#fff",
                    borderRadius: 8,
                    cursor:
                      quantity <= 1
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  −
                </button>

                <span
                  style={{
                    minWidth: 30,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {quantity}
                </span>

                <button
                  onClick={increaseQuantity}
                  disabled={
                    quantity >= product.stock
                  }
                  style={{
                    width: 38,
                    height: 38,
                    border: "1px solid #ccc",
                    background: "#fff",
                    borderRadius: 8,
                    cursor:
                      quantity >= product.stock
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  +
                </button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "15px 20px",
                  border: "none",
                  borderRadius: 10,
                  background:
                    product.stock <= 0
                      ? "#ccc"
                      : "#111",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor:
                    product.stock <= 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {added
                  ? "✓ Added to Cart"
                  : "🛒 Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={
                  product.stock <= 0 || buying
                }
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "15px 20px",
                  border: "none",
                  borderRadius: 10,
                  background:
                    product.stock <= 0
                      ? "#ccc"
                      : "#ff6b00",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor:
                    product.stock <= 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {buying
                  ? "Opening Checkout..."
                  : "⚡ Buy Now"}
              </button>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 24,
            background: "#fff",
            borderRadius: 16,
            padding: 28,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            Product Details
          </h2>

          <p
            style={{
              color: "#555",
              lineHeight: 1.8,
            }}
          >
            {product.name} is available in the{" "}
            {product.category} category. Shop with
            confidence on SKART with secure ordering
            and delivery support.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              marginTop: 24,
            }}
          >
            <div
              style={{
                padding: 18,
                background: "#f7f7f7",
                borderRadius: 10,
              }}
            >
              <strong>⭐ Rating</strong>

              <div style={{ marginTop: 6 }}>
                {product.rating.toFixed(1)} / 5
              </div>
            </div>

            <div
              style={{
                padding: 18,
                background: "#f7f7f7",
                borderRadius: 10,
              }}
            >
              <strong>💬 Reviews</strong>

              <div style={{ marginTop: 6 }}>
                {product.reviews}{" "}
                {product.reviews === 1
                  ? "review"
                  : "reviews"}
              </div>
            </div>

            <div
              style={{
                padding: 18,
                background: "#f7f7f7",
                borderRadius: 10,
              }}
            >
              <strong>📦 Stock</strong>

              <div style={{ marginTop: 6 }}>
                {product.stock} available
              </div>
            </div>

            <div
              style={{
                padding: 18,
                background: "#f7f7f7",
                borderRadius: 10,
              }}
            >
              <strong>🚚 Delivery</strong>

              <div style={{ marginTop: 6 }}>
                Fast delivery available
              </div>
            </div>

            <div
              style={{
                padding: 18,
                background: "#f7f7f7",
                borderRadius: 10,
              }}
            >
              <strong>🔒 Payment</strong>

              <div style={{ marginTop: 6 }}>
                Secure checkout
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 24,
            background: "#fff",
            borderRadius: 16,
            padding: 28,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                }}
              >
                Customer Reviews
              </h2>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {renderStars(
                  Math.round(product.rating)
                )}

                <strong>
                  {product.rating.toFixed(1)} / 5
                </strong>

                <span style={{ color: "#666" }}>
                  ({product.reviews}{" "}
                  {product.reviews === 1
                    ? "review"
                    : "reviews"})
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 14,
              padding: 22,
              marginBottom: 28,
              background: "#fafafa",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 18,
              }}
            >
              Write a Review
            </h3>

            <p
              style={{
                color: "#666",
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              Share your experience with this product.
              You need to be logged in to submit a review.
            </p>

            <div style={{ marginBottom: 18 }}>
              <strong>Your Rating</strong>

              <div
                style={{
                  display: "flex",
                  gap: 5,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setSelectedRating(star)
                    }
                    aria-label={`${star} star rating`}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 34,
                      cursor: "pointer",
                      padding: "2px 4px",
                      color:
                        star <= selectedRating
                          ? "#f59e0b"
                          : "#ccc",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                htmlFor="reviewComment"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Your Review
              </label>

              <textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(event) =>
                  setReviewComment(event.target.value)
                }
                placeholder="Write your review here..."
                maxLength={1000}
                rows={5}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #ccc",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 15,
                  resize: "vertical",
                  outline: "none",
                }}
              />

              <div
                style={{
                  textAlign: "right",
                  color: "#777",
                  fontSize: 13,
                  marginTop: 5,
                }}
              >
                {reviewComment.length}/1000
              </div>
            </div>

            {reviewError && (
              <div
                style={{
                  background: "#fff0f0",
                  border: "1px solid #ffcaca",
                  color: "#c62828",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                }}
              >
                {reviewError}
              </div>
            )}

            {reviewMessage && (
              <div
                style={{
                  background: "#effaf2",
                  border: "1px solid #b7e4c1",
                  color: "#16823b",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                }}
              >
                {reviewMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "14px 20px",
                border: "none",
                borderRadius: 10,
                background: submittingReview
                  ? "#aaa"
                  : "#111",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: submittingReview
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {submittingReview
                ? "Submitting..."
                : "⭐ Submit Review"}
            </button>
          </div>

          <div>
            {reviewsLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 30,
                  color: "#666",
                }}
              >
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 35,
                  background: "#f7f7f7",
                  borderRadius: 12,
                  color: "#666",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    marginBottom: 10,
                  }}
                >
                  💬
                </div>

                <strong>
                  No customer reviews yet
                </strong>

                <p style={{ marginBottom: 0 }}>
                  Be the first customer to review this
                  product.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      border: "1px solid #e5e5e5",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
                        gap: 15,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong>
                          {review.user.name}
                        </strong>

                        <div
                          style={{
                            marginTop: 6,
                          }}
                        >
                          {renderStars(
                            review.rating
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          color: "#888",
                          fontSize: 13,
                        }}
                      >
                        {new Date(
                          review.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {review.comment && (
                      <p
                        style={{
                          color: "#555",
                          lineHeight: 1.7,
                          marginBottom: 0,
                          marginTop: 14,
                        }}
                      >
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer
        style={{
          marginTop: 30,
          textAlign: "center",
          color: "#777",
          padding: 20,
        }}
      >
        © {new Date().getFullYear()} SKART. All rights
        reserved.
      </footer>
    </main>
  );
}