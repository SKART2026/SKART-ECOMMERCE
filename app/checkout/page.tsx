"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

type PaymentMethod = "COD" | "UPI" | "CARD";

type Address = {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  checkout_config_id?: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  theme?: {
    color?: string;
  };

  handler: (
    response: RazorpayHandlerResponse
  ) => void;

  modal?: {
    ondismiss?: () => void;
  };

  [key: string]: unknown;
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    cartTotal,
    clearCart,
  } = useCart();

  const [addresses, setAddresses] = useState<Address[]>(
    []
  );

  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [email, setEmail] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("COD");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const deliveryFee = cartTotal >= 999 ? 0 : 49;

  const grandTotal = cartTotal + deliveryFee;

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const response = await fetch("/api/addresses");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (
        data.addresses &&
        data.addresses.length > 0
      ) {
        setAddresses(data.addresses);

        const firstAddress =
          data.addresses[0];

        setSelectedAddressId(
          firstAddress.id
        );

        fillAddress(firstAddress);
      }
    } catch (error) {
      console.error(
        "ADDRESS LOAD ERROR:",
        error
      );
    }
  }

  function fillAddress(address: Address) {
    setFullName(
      address.fullName || ""
    );

    setPhone(
      address.phone || ""
    );

    setAddressLine1(
      address.addressLine1 || ""
    );

    setAddressLine2(
      address.addressLine2 || ""
    );

    setCity(
      address.city || ""
    );

    setState(
      address.state || ""
    );

    setPincode(
      address.pincode || ""
    );
  }

  function selectAddress(
    address: Address
  ) {
    setSelectedAddressId(
      address.id
    );

    fillAddress(address);
  }

  async function loadRazorpayScript() {
    return new Promise<boolean>(
      (resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const existingScript =
          document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
          );

        if (existingScript) {
          existingScript.addEventListener(
            "load",
            () => resolve(true)
          );

          existingScript.addEventListener(
            "error",
            () => resolve(false)
          );

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        script.onload = () =>
          resolve(true);

        script.onerror = () =>
          resolve(false);

        document.body.appendChild(
          script
        );
      }
    );
  }

  async function handleCODOrder() {
    if (!selectedAddressId) {
      throw new Error(
        "Please select or enter a delivery address."
      );
    }

    const response = await fetch(
      "/api/orders",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          addressId:
            selectedAddressId,

          cart,

          paymentMethod: "COD",
        }),
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          "Unable to place order."
      );
    }

    clearCart();

    router.push(
      `/orders?success=1&order=${data.order.orderNumber}`
    );
  }

  async function handleOnlinePayment() {
    if (!selectedAddressId) {
      throw new Error(
        "Please select or enter a delivery address."
      );
    }

    const scriptLoaded =
      await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error(
        "Unable to load Razorpay. Please check your internet connection."
      );
    }

    /*
     * Create Razorpay Order
     */
    const createOrderResponse =
      await fetch(
        "/api/payment/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount: grandTotal,

            paymentMethod:
              paymentMethod,
          }),
        }
      );

    const createOrderData =
      await createOrderResponse.json();

    if (
      !createOrderResponse.ok ||
      !createOrderData.success
    ) {
      throw new Error(
        createOrderData.error ||
          "Unable to create Razorpay order."
      );
    }

    const razorpayOrder =
      createOrderData.order;

    const razorpayKey =
      createOrderData.keyId;

    /*
     * Razorpay Checkout
     *
     * IMPORTANT:
     * The configuration ID is applied
     * here, NOT inside razorpay.orders.create().
     */
    const options: RazorpayOptions =
      {
        key: razorpayKey,

        amount:
          razorpayOrder.amount,

        currency: "INR",

        name: "SKART",

        description:
          "SKART Online Purchase",

        order_id:
          razorpayOrder.id,

        checkout_config_id:
          "config_TZaUWcItFqJTEq",

        prefill: {
          name: fullName,

          email: email,

          contact: phone,
        },

        theme: {
          color: "#2563eb",
        },

        handler:
          async (
            razorpayResponse
          ) => {
            try {
              setLoading(true);

              setMessage(
                "Payment successful. Confirming your order..."
              );

              /*
               * Send the successful
               * Razorpay payment to our
               * SKART server.
               */
              const orderResponse =
                await fetch(
                  "/api/orders/online",
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({
                      addressId:
                        selectedAddressId,

                      cart,

                      amount:
                        grandTotal,

                      paymentMethod:
                        paymentMethod,

                      razorpayOrderId:
                        razorpayResponse.razorpay_order_id,

                      razorpayPaymentId:
                        razorpayResponse.razorpay_payment_id,

                      razorpaySignature:
                        razorpayResponse.razorpay_signature,
                    }),
                  }
                );

              const orderData =
                await orderResponse.json();

              if (
                !orderResponse.ok ||
                !orderData.success
              ) {
                throw new Error(
                  orderData.error ||
                    "Payment was successful, but order creation failed."
                );
              }

              clearCart();

              router.push(
                `/orders?success=1&order=${orderData.order.orderNumber}`
              );
            } catch (error) {
              console.error(
                "ONLINE ORDER ERROR:",
                error
              );

              setMessage(
                error instanceof Error
                  ? error.message
                  : "Unable to confirm your order."
              );

              setLoading(false);
            }
          },

        modal: {
          ondismiss: () => {
            setLoading(false);

            setMessage(
              "Payment was cancelled."
            );
          },
        },
      };

    const razorpay =
      new window.Razorpay(
        options
      );

    razorpay.open();
  }

  async function handlePlaceOrder() {
    setMessage("");

    if (cart.length === 0) {
      setMessage(
        "Your cart is empty."
      );

      return;
    }

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode
    ) {
      setMessage(
        "Please complete your delivery address."
      );

      return;
    }

    if (
      (paymentMethod === "UPI" ||
        paymentMethod === "CARD") &&
      !email
    ) {
      setMessage(
        "Please enter your email address for online payment."
      );

      return;
    }

    setLoading(true);

    try {
      if (
        paymentMethod === "COD"
      ) {
        await handleCODOrder();
      } else {
        await handleOnlinePayment();
      }
    } catch (error) {
      console.error(
        "CHECKOUT ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to place order."
      );

      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <h1>
          Your Cart Is Empty
        </h1>

        <p
          style={{
            marginTop: 12,
          }}
        >
          Add some products before
          checkout.
        </p>

        <Link
          href="/"
          style={{
            display:
              "inline-block",

            marginTop: 25,

            padding:
              "12px 22px",

            background:
              "#2563eb",

            color: "white",

            borderRadius: 8,

            textDecoration:
              "none",
          }}
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",

        background:
          "#f8fafc",

        padding:
          "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,

          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginBottom: 30,

            gap: 15,

            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>
              Checkout
            </h1>

            <p
              style={{
                color:
                  "#64748b",

                marginTop: 5,
              }}
            >
              Complete your order
              securely.
            </p>
          </div>

          <Link
            href="/cart"
            style={{
              textDecoration:
                "none",

              color:
                "#2563eb",

              fontWeight: 600,
            }}
          >
            ← Back to Cart
          </Link>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 20,

              padding: 14,

              background:
                "#fee2e2",

              color:
                "#991b1b",

              borderRadius: 8,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "minmax(0, 1.5fr) minmax(300px, 0.8fr)",

            gap: 25,
          }}
        >
          <section>
            {addresses.length >
              0 && (
              <div
                style={{
                  background:
                    "white",

                  padding: 22,

                  borderRadius:
                    12,

                  marginBottom:
                    20,

                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <h2
                  style={{
                    marginBottom:
                      15,
                  }}
                >
                  Saved Addresses
                </h2>

                <div
                  style={{
                    display:
                      "grid",

                    gap: 12,
                  }}
                >
                  {addresses.map(
                    (
                      address
                    ) => (
                      <button
                        key={
                          address.id
                        }
                        type="button"
                        onClick={() =>
                          selectAddress(
                            address
                          )
                        }
                        style={{
                          textAlign:
                            "left",

                          padding:
                            15,

                          borderRadius:
                            8,

                          border:
                            selectedAddressId ===
                            address.id
                              ? "2px solid #2563eb"
                              : "1px solid #cbd5e1",

                          background:
                            selectedAddressId ===
                            address.id
                              ? "#eff6ff"
                              : "white",

                          cursor:
                            "pointer",
                        }}
                      >
                        <strong>
                          {
                            address.fullName
                          }
                        </strong>

                        <div
                          style={{
                            marginTop:
                              5,

                            color:
                              "#475569",
                          }}
                        >
                          {
                            address.addressLine1
                          }

                          {address.addressLine2 &&
                            `, ${address.addressLine2}`}

                          <br />

                          {
                            address.city
                          }
                          ,{" "}
                          {
                            address.state
                          }{" "}
                          -{" "}
                          {
                            address.pincode
                          }

                          <br />

                          Phone:{" "}
                          {
                            address.phone
                          }
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                background:
                  "white",

                padding: 22,

                borderRadius: 12,

                marginBottom: 20,

                border:
                  "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  marginBottom:
                    18,
                }}
              >
                Delivery Address
              </h2>

              <div
                style={{
                  display:
                    "grid",

                  gap: 14,
                }}
              >
                <input
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  placeholder="Full Name"
                  style={
                    inputStyle
                  }
                />

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="Phone Number"
                  style={
                    inputStyle
                  }
                />

                <input
                  value={
                    addressLine1
                  }
                  onChange={(e) =>
                    setAddressLine1(
                      e.target.value
                    )
                  }
                  placeholder="Address Line 1"
                  style={
                    inputStyle
                  }
                />

                <input
                  value={
                    addressLine2
                  }
                  onChange={(e) =>
                    setAddressLine2(
                      e.target.value
                    )
                  }
                  placeholder="Address Line 2 (Optional)"
                  style={
                    inputStyle
                  }
                />

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "1fr 1fr",

                    gap: 14,
                  }}
                >
                  <input
                    value={city}
                    onChange={(e) =>
                      setCity(
                        e.target.value
                      )
                    }
                    placeholder="City"
                    style={
                      inputStyle
                    }
                  />

                  <input
                    value={state}
                    onChange={(e) =>
                      setState(
                        e.target.value
                      )
                    }
                    placeholder="State"
                    style={
                      inputStyle
                    }
                  />
                </div>

                <input
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value
                    )
                  }
                  placeholder="Pincode"
                  style={
                    inputStyle
                  }
                />
              </div>
            </div>

            <div
              style={{
                background:
                  "white",

                padding: 22,

                borderRadius: 12,

                border:
                  "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  marginBottom:
                    18,
                }}
              >
                Payment Method
              </h2>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(3, 1fr)",

                  gap: 12,
                }}
              >
                <PaymentButton
                  active={
                    paymentMethod ===
                    "COD"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "COD"
                    )
                  }
                  title="Cash on Delivery"
                  subtitle="Pay when delivered"
                />

                <PaymentButton
                  active={
                    paymentMethod ===
                    "UPI"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "UPI"
                    )
                  }
                  title="UPI"
                  subtitle="Google Pay, PhonePe, etc."
                />

                <PaymentButton
                  active={
                    paymentMethod ===
                    "CARD"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "CARD"
                    )
                  }
                  title="Card"
                  subtitle="Credit / Debit Card"
                />
              </div>

              {(paymentMethod ===
                "UPI" ||
                paymentMethod ===
                  "CARD") && (
                <div
                  style={{
                    marginTop:
                      18,
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="Email Address"
                    style={
                      inputStyle
                    }
                  />

                  <p
                    style={{
                      marginTop:
                        8,

                      fontSize:
                        13,

                      color:
                        "#64748b",
                    }}
                  >
                    Razorpay will
                    securely process
                    your payment.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside
            style={{
              background:
                "white",

              padding: 22,

              borderRadius: 12,

              border:
                "1px solid #e2e8f0",

              height:
                "fit-content",

              position:
                "sticky",

              top: 20,
            }}
          >
            <h2
              style={{
                marginBottom:
                  20,
              }}
            >
              Order Summary
            </h2>

            <div
              style={{
                display:
                  "grid",

                gap: 15,
              }}
            >
              {cart.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      gap: 10,
                    }}
                  >
                    <div>
                      <strong>
                        {
                          item.name
                        }
                      </strong>

                      <div
                        style={{
                          color:
                            "#64748b",

                          fontSize:
                            14,
                        }}
                      >
                        Qty:{" "}
                        {
                          item.quantity
                        }
                      </div>
                    </div>

                    <strong>
                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(
                        2
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            <hr
              style={{
                margin:
                  "20px 0",

                border: 0,

                borderTop:
                  "1px solid #e2e8f0",
              }}
            />

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                marginBottom:
                  10,
              }}
            >
              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {cartTotal.toFixed(
                  2
                )}
              </strong>
            </div>

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                marginBottom:
                  15,
              }}
            >
              <span>
                Delivery
              </span>

              <strong>
                {deliveryFee ===
                0
                  ? "FREE"
                  : `₹${deliveryFee.toFixed(
                      2
                    )}`}
              </strong>
            </div>

            <hr
              style={{
                margin:
                  "15px 0",

                border: 0,

                borderTop:
                  "1px solid #e2e8f0",
              }}
            />

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                fontSize: 20,

                fontWeight: 700,

                marginBottom:
                  20,
              }}
            >
              <span>
                Total
              </span>

              <span>
                ₹
                {grandTotal.toFixed(
                  2
                )}
              </span>
            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                handlePlaceOrder
              }
              style={{
                width:
                  "100%",

                padding:
                  "15px 20px",

                border: 0,

                borderRadius:
                  8,

                background:
                  loading
                    ? "#94a3b8"
                    : "#2563eb",

                color:
                  "white",

                fontSize:
                  16,

                fontWeight:
                  700,

                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Processing..."
                : paymentMethod ===
                  "COD"
                ? "Place COD Order"
                : `Pay ₹${grandTotal.toFixed(
                    2
                  )}`}
            </button>

            <p
              style={{
                textAlign:
                  "center",

                marginTop:
                  12,

                fontSize:
                  12,

                color:
                  "#64748b",
              }}
            >
              🔒 Secure checkout
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",

  padding:
    "12px 14px",

  border:
    "1px solid #cbd5e1",

  borderRadius: 8,

  fontSize: 15,

  boxSizing:
    "border-box" as const,
};

function PaymentButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign:
          "left",

        padding: 15,

        borderRadius:
          8,

        border: active
          ? "2px solid #2563eb"
          : "1px solid #cbd5e1",

        background: active
          ? "#eff6ff"
          : "white",

        cursor:
          "pointer",
      }}
    >
      <strong
        style={{
          display:
            "block",

          marginBottom:
            5,
        }}
      >
        {title}
      </strong>

      <span
        style={{
          fontSize:
            12,

          color:
            "#64748b",
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}