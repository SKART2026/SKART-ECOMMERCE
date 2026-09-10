"use client";

import { useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

const categories = [
  "All Products",
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty",
  "Sports",
  "Groceries",
];

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 1499,
    oldPrice: 2499,
    rating: 4.5,
    reviews: 128,
    image: "🎧",
  },
  {
    id: 2,
    name: "Smart Watch",
    category: "Electronics",
    price: 1999,
    oldPrice: 3499,
    rating: 4.4,
    reviews: 96,
    image: "⌚",
  },
  {
    id: 3,
    name: "Men's Casual Shirt",
    category: "Fashion",
    price: 799,
    oldPrice: 1299,
    rating: 4.3,
    reviews: 74,
    image: "👕",
  },
  {
    id: 4,
    name: "Women's Handbag",
    category: "Fashion",
    price: 1199,
    oldPrice: 1999,
    rating: 4.6,
    reviews: 112,
    image: "👜",
  },
  {
    id: 5,
    name: "Home Decor Lamp",
    category: "Home & Living",
    price: 899,
    oldPrice: 1499,
    rating: 4.2,
    reviews: 63,
    image: "💡",
  },
  {
    id: 6,
    name: "Face Care Kit",
    category: "Beauty",
    price: 699,
    oldPrice: 999,
    rating: 4.5,
    reviews: 89,
    image: "🧴",
  },
  {
    id: 7,
    name: "Running Shoes",
    category: "Sports",
    price: 1799,
    oldPrice: 2999,
    rating: 4.7,
    reviews: 145,
    image: "👟",
  },
  {
    id: 8,
    name: "Premium Grocery Pack",
    category: "Groceries",
    price: 599,
    oldPrice: 799,
    rating: 4.4,
    reviews: 51,
    image: "🛒",
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] =
    useState("All Products");

  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "All Products" ||
      product.category === selectedCategory;

    const searchMatch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  };

  const increaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            ShopKart
          </Link>

          <div className="flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-blue-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-blue-700"
          >
            🛒 Cart

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </header>

      {/* CATEGORIES */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-3 overflow-x-auto">

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-medium ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}

        </div>
      </section>

      {/* HERO */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need,
            <br />
            All in One Place
          </h1>

          <p className="text-lg text-blue-100 mb-6">
            Shop electronics, fashion, beauty, sports,
            groceries and more.
          </p>

          <button
            onClick={() =>
              window.scrollTo({
                top: 500,
                behavior: "smooth",
              })
            }
            className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100"
          >
            Shop Now
          </button>

        </div>
      </section>

      {/* PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-12">

        <div className="flex items-center justify-between mb-8">

          <div>
            <h2 className="text-3xl font-bold">
              {selectedCategory}
            </h2>

            <p className="text-gray-500 mt-1">
              {filteredProducts.length} products available
            </p>
          </div>

        </div>

        {filteredProducts.length === 0 ? (

          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>

            <h3 className="text-2xl font-bold">
              No products found
            </h3>

            <p className="text-gray-500 mt-2">
              Try another search or category.
            </p>
          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {filteredProducts.map((product) => {

              const discount = Math.round(
                ((product.oldPrice - product.price) /
                  product.oldPrice) *
                  100
              );

              return (

                <div
                  key={product.id}
                  className="bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-shadow"
                >

                  {/* CLICKABLE IMAGE */}
                  <Link
                    href={`/products/${product.id}`}
                    className="block"
                  >
                    <div className="h-56 bg-gray-100 flex items-center justify-center text-8xl hover:bg-gray-200 transition-colors">
                      {product.image}
                    </div>
                  </Link>

                  <div className="p-5">

                    {/* CLICKABLE PRODUCT NAME */}
                    <Link
                      href={`/products/${product.id}`}
                      className="block"
                    >
                      <h3 className="text-lg font-bold hover:text-blue-600">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-500 mt-1">
                      {product.category}
                    </p>

                    <div className="flex items-center gap-2 mt-3">

                      <span className="text-yellow-500">
                        ★
                      </span>

                      <span className="font-semibold">
                        {product.rating}
                      </span>

                      <span className="text-gray-400 text-sm">
                        ({product.reviews})
                      </span>

                    </div>

                    <div className="mt-4 flex items-center gap-2">

                      <span className="text-2xl font-bold">
                        ₹{product.price}
                      </span>

                      <span className="text-gray-400 line-through">
                        ₹{product.oldPrice}
                      </span>

                    </div>

                    <div className="text-green-600 font-semibold text-sm mt-1">
                      {discount}% OFF
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </section>

      {/* FEATURES */}
      <section className="bg-white border-t border-b">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="text-center">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-bold text-lg">
              Fast Delivery
            </h3>
            <p className="text-gray-500">
              Quick and reliable delivery
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-bold text-lg">
              Secure Payments
            </h3>
            <p className="text-gray-500">
              Safe and secure checkout
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-3">↩️</div>
            <h3 className="font-bold text-lg">
              Easy Returns
            </h3>
            <p className="text-gray-500">
              Simple and hassle-free returns
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="text-2xl font-bold text-blue-400 mb-3">
            ShopKart
          </div>

          <p className="text-gray-400">
            Your one-stop online shopping destination.
          </p>

          <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-500">
            © 2026 ShopKart. All rights reserved.
          </div>

        </div>
      </footer>

      {/* CART OVERLAY */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setCartOpen(false)}
        >

          {/* CART DRAWER */}
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Your Cart
              </h2>

              <button
                onClick={() => setCartOpen(false)}
                className="text-2xl"
              >
                ✕
              </button>

            </div>

            {cart.length === 0 ? (

              <div className="text-center py-20">

                <div className="text-6xl mb-4">
                  🛒
                </div>

                <h3 className="text-xl font-bold">
                  Your cart is empty
                </h3>

                <p className="text-gray-500 mt-2">
                  Add some products to get started.
                </p>

              </div>

            ) : (

              <>

                <div className="space-y-5">

                  {cart.map((item) => (

                    <div
                      key={item.id}
                      className="border-b pb-5"
                    >

                      <div className="flex gap-4">

                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">
                          {item.image}
                        </div>

                        <div className="flex-1">

                          <h3 className="font-bold">
                            {item.name}
                          </h3>

                          <p className="text-blue-600 font-semibold mt-1">
                            ₹{item.price}
                          </p>

                          <div className="flex items-center gap-3 mt-3">

                            <button
                              onClick={() =>
                                decreaseQuantity(item.id)
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 font-bold"
                            >
                              −
                            </button>

                            <span className="font-bold">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(item.id)
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 font-bold"
                            >
                              +
                            </button>

                            <button
                              onClick={() =>
                                removeFromCart(item.id)
                              }
                              className="text-red-500 text-sm ml-auto"
                            >
                              Remove
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

                <div className="border-t mt-6 pt-6">

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{cartTotal}</span>
                  </div>

                  <button
                    className="w-full mt-5 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700"
                    onClick={() =>
                      alert("Checkout will be added next.")
                    }
                  >
                    Proceed to Checkout
                  </button>

                </div>

              </>

            )}

          </div>

        </div>
      )}

    </main>
  );
}