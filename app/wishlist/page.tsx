"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function WishlistPage() {
const {
wishlist,
removeFromWishlist,
moveWishlistToCart,
wishlistCount,
} = useCart();

return (
<main
style={{
minHeight: "100vh",
background: "#f5f7fb",
color: "#111827",
}}
>
<header
style={{
background: "#111827",
color: "white",
padding: "18px 30px",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: "20px",
flexWrap: "wrap",
}}
>
<Link
href="/"
style={{
color: "white",
textDecoration: "none",
fontSize: "28px",
fontWeight: "800",
}}
>
🛍️ SKART </Link>

    <nav
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/"
        style={{
          color: "white",
          textDecoration: "none",
          padding: "9px 14px",
          borderRadius: "8px",
        }}
      >
        🏠 Home
      </Link>

      <Link
        href="/categories"
        style={{
          color: "white",
          textDecoration: "none",
          padding: "9px 14px",
          borderRadius: "8px",
        }}
      >
        🛍️ Categories
      </Link>

      <Link
        href="/cart"
        style={{
          color: "white",
          textDecoration: "none",
          padding: "9px 14px",
          borderRadius: "8px",
        }}
      >
        🛒 Cart
      </Link>
    </nav>
  </header>

  <section
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "35px 20px 60px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "30px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "32px",
            margin: "0 0 8px",
          }}
        >
          ❤️ My Wishlist
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
          }}
        >
          {wishlistCount} {wishlistCount === 1 ? "item" : "items"} saved
        </p>
      </div>

      <Link
        href="/"
        style={{
          background: "#111827",
          color: "white",
          textDecoration: "none",
          padding: "11px 18px",
          borderRadius: "8px",
          fontWeight: "600",
        }}
      >
        Continue Shopping
      </Link>
    </div>

    {wishlist.length === 0 ? (
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "70px 20px",
          textAlign: "center",
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            marginBottom: "15px",
          }}
        >
          ❤️
        </div>

        <h2
          style={{
            margin: "0 0 10px",
          }}
        >
          Your wishlist is empty
        </h2>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "25px",
          }}
        >
          Save products you love and come back to them later.
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#111827",
            color: "white",
            textDecoration: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          Start Shopping
        </Link>
      </div>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "22px",
        }}
      >
        {wishlist.map((product) => (
          <div
            key={product.id}
            style={{
              background: "white",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
            }}
          >
            <Link
              href={`/products/${product.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  height: "210px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3f4f6",
                  fontSize: "80px",
                }}
              >
                {product.image || "📦"}
              </div>
            </Link>

            <div style={{ padding: "18px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  margin: "0 0 7px",
                }}
              >
                {product.name}
              </h2>

              <p
                style={{
                  margin: "0 0 8px",
                  color: "#6b7280",
                }}
              >
                {product.category}
              </p>

              <div
                style={{
                  marginBottom: "10px",
                  color: "#f59e0b",
                }}
              >
                ⭐ {product.rating}{" "}
                <span
                  style={{
                    color: "#6b7280",
                  }}
                >
                  ({product.reviews})
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >
                <strong
                  style={{
                    fontSize: "22px",
                  }}
                >
                  ₹{product.price.toLocaleString("en-IN")}
                </strong>

                {product.oldPrice && (
                  <span
                    style={{
                      color: "#9ca3af",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{product.oldPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <button
                  onClick={() => moveWishlistToCart(product)}
                  disabled={!product.stock}
                  style={{
                    flex: 1,
                    border: "none",
                    background: product.stock
                      ? "#111827"
                      : "#9ca3af",
                    color: "white",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: product.stock
                      ? "pointer"
                      : "not-allowed",
                    fontWeight: "600",
                  }}
                >
                  🛒 Move to Cart
                </button>

                <button
                  onClick={() => removeFromWishlist(product.id)}
                  title="Remove from wishlist"
                  style={{
                    width: "45px",
                    border: "1px solid #e5e7eb",
                    background: "white",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  🗑️
                </button>
              </div>

              <Link
                href={`/products/${product.id}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  textDecoration: "none",
                  padding: "9px",
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
  </section>

  <footer
    style={{
      background: "#111827",
      color: "#d1d5db",
      textAlign: "center",
      padding: "25px",
    }}
  >
    © 2026 SKART. All rights reserved.
  </footer>
</main>

);
}
