"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Product, useCart } from "../context/CartContext";

type Category = {
  id: number;
  name: string;
  _count?: {
    products: number;
  };
};

export default function HomePage() {
  const {
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartCount,
    cartTotal,
    wishlistCount,
    wishlist,
    toggleWishlist,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("default");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();

          const formattedProducts: Product[] = (
            productsData.products || productsData
          ).map((product: any) => ({
            id: product.id,
            name: product.name,
            category:
              product.category?.name ||
              product.category ||
              "Uncategorized",
            price: Number(product.price),
            oldPrice:
              product.oldPrice !== null &&
              product.oldPrice !== undefined
                ? Number(product.oldPrice)
                : undefined,
            rating: Number(product.rating || 0),
            reviews: Number(product.reviews || 0),
            image: product.image || "🛍️",
            stock: Number(product.stock || 0),
          }));

          setProducts(formattedProducts);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }
      } catch (error) {
        console.error("Failed to load homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchText) ||
          product.category.toLowerCase().includes(searchText)
      );
    }

    const minimumPrice = Number(minPrice);
    const maximumPrice = Number(maxPrice);
    const minimumRating = Number(minRating);

    if (minPrice !== "" && !Number.isNaN(minimumPrice)) {
      result = result.filter((product) => product.price >= minimumPrice);
    }

    if (maxPrice !== "" && !Number.isNaN(maximumPrice)) {
      result = result.filter((product) => product.price <= maximumPrice);
    }

    if (minimumRating > 0) {
      result = result.filter(
        (product) => product.rating >= minimumRating
      );
    }

    if (inStockOnly) {
      result = result.filter((product) => product.stock > 0);
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "rating":
          return b.rating - a.rating;

        case "name":
          return a.name.localeCompare(b.name);

        default:
          return a.id - b.id;
      }
    });

    return result;
  }, [
    products,
    selectedCategory,
    search,
    sortOption,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
  ]);

  const activeFilterCount = [
    selectedCategory !== "All",
    search.trim() !== "",
    minPrice !== "",
    maxPrice !== "",
    minRating !== "0",
    inStockOnly,
    sortOption !== "default",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("All");
    setSearch("");
    setSortOption("default");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("0");
    setInStockOnly(false);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      return;
    }

    addToCart(product);

    setAddedProductId(product.id);

    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  };

  const handleWishlist = (product: Product) => {
    toggleWishlist(product);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
      setLogoutLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-IN");
  };

  const isProductWishlisted = (productId: number) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="shrink-0">
            <h1 className="text-2xl font-bold text-blue-600">SKART</h1>
            <p className="text-xs text-gray-500">Everything you need</p>
          </Link>

          <div className="hidden max-w-xl flex-1 md:block">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products or categories..."
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 outline-none transition focus:border-blue-500 focus:bg-white"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/wishlist"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-pink-50"
            >
              ❤️ Wishlist
              {wishlistCount > 0 && (
                <span className="ml-1 rounded-full bg-pink-500 px-2 py-0.5 text-xs text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-50"
            >
              🛒 Cart
              {cartCount > 0 && (
                <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              href="/categories"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-50 sm:block"
            >
              🛍️ Categories
            </Link>

            <Link
              href="/account"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-50 sm:block"
            >
              👤 Account
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:block"
            >
              {logoutLoading ? "Logging out..." : "🚪 Logout"}
            </button>
          </nav>
        </div>

        {/* MOBILE SEARCH */}
        <div className="mx-auto block max-w-7xl px-4 pb-4 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or categories..."
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-blue-500 focus:bg-white"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-100">
              Welcome to SKART
            </p>

            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              Shop everything you love in one place.
            </h2>

            <p className="mt-5 text-lg text-blue-100">
              Discover electronics, fashion, home essentials, beauty,
              sports products and groceries.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#products"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-blue-700 shadow hover:bg-gray-100"
              >
                Shop Now
              </a>

              <Link
                href="/categories"
                className="rounded-xl border border-white/40 px-5 py-3 font-semibold hover:bg-white/10"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold">Categories</h3>

            <Link
              href="/categories"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                selectedCategory === "All"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Products
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-10">
        {/* FILTER PANEL */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    Filter Products
                  </h3>

                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Refine products by price, rating and stock.
                </p>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="min-price"
                  className="mb-1 block text-xs font-semibold text-gray-600"
                >
                  Minimum Price
                </label>

                <input
                  id="min-price"
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="₹ Min"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="max-price"
                  className="mb-1 block text-xs font-semibold text-gray-600"
                >
                  Maximum Price
                </label>

                <input
                  id="max-price"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="₹ Max"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="min-rating"
                  className="mb-1 block text-xs font-semibold text-gray-600"
                >
                  Minimum Rating
                </label>

                <select
                  id="min-rating"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="0">Any Rating</option>
                  <option value="4">4★ & above</option>
                  <option value="4.5">4.5★ & above</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-4 w-4"
                  />

                  <span className="text-sm font-semibold text-gray-700">
                    In-stock only
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCT HEADER */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured Products</h2>

            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} products available`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="sort"
              className="text-sm font-medium text-gray-600"
            >
              Sort:
            </label>

            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="default">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* PRODUCT RESULTS */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="text-5xl">🔎</div>

            <h3 className="mt-4 text-xl font-bold">
              No products found
            </h3>

            <p className="mt-2 text-gray-500">
              Try another search or change your filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const isWishlisted = isProductWishlisted(product.id);

              return (
                <article
                  key={product.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative flex h-48 items-center justify-center bg-gray-50">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex h-full w-full items-center justify-center"
                    >
                      <span className="text-7xl transition group-hover:scale-110">
                        {product.image || "🛍️"}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleWishlist(product)}
                      aria-label={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-110 ${
                        isWishlisted
                          ? "text-red-500"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                    >
                      {isWishlisted ? "❤️" : "♡"}
                    </button>

                    {product.oldPrice &&
                      product.oldPrice > product.price && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                          SALE
                        </span>
                      )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {product.category}
                    </p>

                    <Link
                      href={`/products/${product.id}`}
                      className="mt-1 block"
                    >
                      <h3 className="line-clamp-2 min-h-[48px] font-semibold text-gray-900 hover:text-blue-600">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <span className="text-yellow-500">⭐</span>

                      <span className="font-semibold">
                        {product.rating.toFixed(1)}
                      </span>

                      <span className="text-gray-400">
                        ({product.reviews})
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        ₹{formatPrice(product.price)}
                      </span>

                      {product.oldPrice &&
                        product.oldPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{formatPrice(product.oldPrice)}
                          </span>
                        )}
                    </div>

                    <div className="mt-2 text-xs">
                      {product.stock > 0 ? (
                        <span className="text-green-600">
                          ✓ {product.stock} in stock
                        </span>
                      ) : (
                        <span className="font-semibold text-red-500">
                          Out of stock
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        product.stock <= 0
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : addedProductId === product.id
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {product.stock <= 0
                        ? "Out of Stock"
                        : addedProductId === product.id
                        ? "✓ Added to Cart"
                        : "🛒 Add to Cart"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="border-y bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-6">
            <div className="text-3xl">🚚</div>

            <h3 className="mt-3 font-bold">Fast Delivery</h3>

            <p className="mt-1 text-sm text-gray-600">
              Get your orders delivered quickly and safely.
            </p>
          </div>

          <div className="rounded-2xl bg-green-50 p-6">
            <div className="text-3xl">🔒</div>

            <h3 className="mt-3 font-bold">Secure Shopping</h3>

            <p className="mt-1 text-sm text-gray-600">
              Your account and order information stay protected.
            </p>
          </div>

          <div className="rounded-2xl bg-purple-50 p-6">
            <div className="text-3xl">💎</div>

            <h3 className="mt-3 font-bold">Quality Products</h3>

            <p className="mt-1 text-sm text-gray-600">
              Shop from multiple categories with great value.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-xl font-bold text-white">SKART</h3>

              <p className="mt-2 text-sm text-gray-400">
                Your one-stop online shopping destination.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white">Quick Links</h4>

              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link href="/" className="hover:text-white">
                  Home
                </Link>

                <Link href="/categories" className="hover:text-white">
                  Categories
                </Link>

                <Link href="/wishlist" className="hover:text-white">
                  Wishlist
                </Link>

                <Link href="/account" className="hover:text-white">
                  Account
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white">SKART</h4>

              <p className="mt-3 text-sm text-gray-400">
                Electronics • Fashion • Home • Beauty • Sports • Groceries
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © 2026 SKART. All rights reserved.
          </div>
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-xl font-bold">Shopping Cart</h2>

                <p className="text-sm text-gray-500">
                  {cartCount} item{cartCount === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg px-3 py-2 text-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="text-6xl">🛒</div>

                  <h3 className="mt-4 text-xl font-bold">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Add some products to get started.
                  </p>

                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-3xl">
                          {item.image || "🛍️"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold">{item.name}</h3>

                          <p className="mt-1 text-sm font-bold text-blue-600">
                            ₹{formatPrice(item.price)}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center rounded-lg border">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(item.id)}
                                className="px-3 py-1.5 hover:bg-gray-100"
                              >
                                −
                              </button>

                              <span className="min-w-8 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => increaseQuantity(item.id)}
                                className="px-3 py-1.5 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-sm font-medium text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">Subtotal</span>

                  <span className="text-xl font-bold">
                    ₹{formatPrice(cartTotal)}
                  </span>
                </div>

                <p className="mb-4 text-xs text-gray-500">
                  Delivery is free on orders above ₹999.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="rounded-xl border border-gray-300 px-4 py-3 font-semibold hover:bg-gray-50"
                  >
                    Continue Shopping
                  </button>

                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}