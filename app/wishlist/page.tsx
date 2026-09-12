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
    <main className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-gray-900 text-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="text-2xl font-extrabold text-white"
          >
            SKART
          </Link>

          <nav className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              🏠 Home
            </Link>

            <Link
              href="/categories"
              className="px-3 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              🛍️ Categories
            </Link>

            <Link
              href="/cart"
              className="px-3 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              🛒 Cart
            </Link>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              ❤️ My Wishlist
            </h1>

            <p className="text-gray-500 mt-2">
              {wishlistCount}{" "}
              {wishlistCount === 1 ? "item" : "items"} saved
            </p>
          </div>

          <Link
            href="/"
            className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Continue Shopping
          </Link>
        </div>

        {wishlist.length === 0 ? (
          /* EMPTY WISHLIST */
          <div className="bg-white rounded-3xl border p-10 sm:p-16 text-center">
            <div className="text-7xl mb-6">❤️</div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="text-gray-500 mt-3 max-w-md mx-auto">
              Save products you love and come back to them later.
            </p>

            <Link
              href="/"
              className="inline-block mt-8 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* WISHLIST PRODUCTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition"
              >
                {/* PRODUCT IMAGE */}
                <Link
                  href={`/products/${product.id}`}
                  className="block"
                >
                  <div className="h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      product.image.startsWith("http") ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-7xl">
                          {product.image}
                        </span>
                      )
                    ) : (
                      <span className="text-7xl">📦</span>
                    )}
                  </div>
                </Link>

                {/* PRODUCT DETAILS */}
                <div className="p-5">
                  <Link href={`/products/${product.id}`}>
                    <h2 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">
                      {product.name}
                    </h2>
                  </Link>

                  <p className="text-gray-500 text-sm mt-1">
                    {product.category}
                  </p>

                  {/* RATING */}
                  <div className="mt-3 text-sm">
                    <span className="text-yellow-500 font-semibold">
                      ⭐ {product.rating.toFixed(1)}
                    </span>

                    <span className="text-gray-500 ml-2">
                      ({product.reviews} reviews)
                    </span>
                  </div>

                  {/* PRICE */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>

                    {product.oldPrice > product.price && (
                      <span className="text-gray-400 line-through">
                        ₹{product.oldPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* STOCK */}
                  <div className="mt-3">
                    {product.stock > 0 ? (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ In stock
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 font-medium">
                        Out of stock
                      </span>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => moveWishlistToCart(product)}
                      disabled={!product.stock}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      🛒 Move to Cart
                    </button>

                    <button
                      onClick={() =>
                        removeFromWishlist(product.id)
                      }
                      title="Remove from wishlist"
                      className="w-12 border border-gray-300 bg-white rounded-xl text-xl hover:bg-red-50 hover:border-red-300 transition"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* VIEW PRODUCT */}
                  <Link
                    href={`/products/${product.id}`}
                    className="block text-center border border-gray-300 text-gray-900 py-3 rounded-xl font-semibold mt-3 hover:bg-gray-50 transition"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-2">
            SKART
          </div>

          <p className="text-gray-400">
            Your one-stop online shopping destination.
          </p>

          <div className="border-t border-gray-700 mt-6 pt-5 text-sm text-gray-500">
            © 2026 SKART. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}