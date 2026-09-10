"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
  } = useCart();

  const deliveryCharge = cartTotal >= 999 || cartTotal === 0 ? 0 : 49;

  const grandTotal = cartTotal + deliveryCharge;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            SKART
          </Link>

          <Link
            href="/"
            className="text-blue-600 font-semibold hover:underline"
          >
            ← Continue Shopping
          </Link>

        </div>
      </header>

      {/* CART */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">

          <h1 className="text-4xl font-bold">
            Shopping Cart
          </h1>

          <p className="text-gray-500 mt-2">
            {cartCount} item{cartCount !== 1 ? "s" : ""} in your cart
          </p>

        </div>

        {cart.length === 0 ? (

          /* EMPTY CART */
          <div className="bg-white rounded-3xl border p-16 text-center">

            <div className="text-8xl mb-6">
              🛒
            </div>

            <h2 className="text-3xl font-bold">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mt-3">
              Looks like you haven't added anything to your cart yet.
            </p>

            <Link
              href="/"
              className="inline-block mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* CART ITEMS */}
            <div className="lg:col-span-2 space-y-5">

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="bg-white rounded-2xl border p-5"
                >

                  <div className="flex flex-col sm:flex-row gap-5">

                    {/* IMAGE */}
                    <Link
                      href={`/products/${item.id}`}
                      className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center text-6xl flex-shrink-0 hover:bg-gray-200"
                    >
                      {item.image}
                    </Link>

                    {/* DETAILS */}
                    <div className="flex-1">

                      <div className="flex justify-between gap-4">

                        <div>

                          <Link
                            href={`/products/${item.id}`}
                            className="text-xl font-bold hover:text-blue-600"
                          >
                            {item.name}
                          </Link>

                          <p className="text-gray-500 text-sm mt-1">
                            {item.category}
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                          className="text-red-500 font-semibold hover:text-red-700"
                        >
                          Remove
                        </button>

                      </div>

                      {/* PRICE */}
                      <div className="mt-4">

                        <span className="text-xl font-bold">
                          ₹{item.price}
                        </span>

                        <span className="text-gray-400 line-through ml-3">
                          ₹{item.oldPrice}
                        </span>

                      </div>

                      {/* QUANTITY + TOTAL */}
                      <div className="flex items-center justify-between mt-5">

                        <div className="flex items-center gap-4">

                          <button
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            className="w-10 h-10 rounded-full bg-gray-200 font-bold text-xl hover:bg-gray-300"
                          >
                            −
                          </button>

                          <span className="font-bold text-lg w-6 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(item.id)
                            }
                            className="w-10 h-10 rounded-full bg-gray-200 font-bold text-xl hover:bg-gray-300"
                          >
                            +
                          </button>

                        </div>

                        <div className="text-xl font-bold">
                          ₹{item.price * item.quantity}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            {/* ORDER SUMMARY */}
            <div>

              <div className="bg-white rounded-2xl border p-6 sticky top-24">

                <h2 className="text-2xl font-bold mb-6">
                  Order Summary
                </h2>

                {/* SUBTOTAL */}
                <div className="flex justify-between mb-4">

                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ₹{cartTotal}
                  </span>

                </div>

                {/* DELIVERY */}
                <div className="flex justify-between mb-4">

                  <span className="text-gray-600">
                    Delivery
                  </span>

                  <span className="font-semibold">

                    {deliveryCharge === 0
                      ? "FREE"
                      : `₹${deliveryCharge}`}

                  </span>

                </div>

                {/* FREE DELIVERY MESSAGE */}
                {cartTotal < 999 && cartTotal > 0 && (

                  <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-sm mb-5">

                    Add ₹{999 - cartTotal} more to get
                    <strong> FREE delivery</strong>.

                  </div>

                )}

                <div className="border-t pt-5">

                  <div className="flex justify-between">

                    <span className="text-xl font-bold">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-blue-600">
                      ₹{grandTotal}
                    </span>

                  </div>

                </div>

                {/* CHECKOUT */}
                <Link
                  href="/checkout"
                  className="block text-center w-full mt-6 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/"
                  className="block text-center mt-4 text-blue-600 font-semibold hover:underline"
                >
                  Continue Shopping
                </Link>

              </div>

            </div>

          </div>

        )}

      </section>

      {/* FEATURES */}
      <section className="bg-white border-t border-b mt-10">

        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="text-center">

            <div className="text-4xl mb-3">
              🚚
            </div>

            <h3 className="font-bold text-lg">
              Fast Delivery
            </h3>

            <p className="text-gray-500">
              Quick and reliable delivery
            </p>

          </div>

          <div className="text-center">

            <div className="text-4xl mb-3">
              🔒
            </div>

            <h3 className="font-bold text-lg">
              Secure Payments
            </h3>

            <p className="text-gray-500">
              Safe and secure checkout
            </p>

          </div>

          <div className="text-center">

            <div className="text-4xl mb-3">
              ↩️
            </div>

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
            SKART
          </div>

          <p className="text-gray-400">
            Your one-stop online shopping destination.
          </p>

          <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-500">
            © 2026 SKART. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}