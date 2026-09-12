"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  image: string;
  stock: number;
};

export type CartItem = Product & {
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  wishlist: Product[];

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  increaseQuantity: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;

  cartCount: number;
  cartTotal: number;

  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  moveWishlistToCart: (product: Product) => void;
  wishlistCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeProduct(item: any): Product {
  return {
    id: Number(item.id),
    name: item.name,
    category: item.category,
    price: Number(item.price),
    oldPrice: Number(item.oldPrice ?? item.price),
    rating: Number(item.rating ?? 0),
    reviews: Number(item.reviews ?? 0),
    image: item.image ?? "",
    stock: Number(item.stock ?? 999999),
  };
}

function normalizeCartItem(item: any): CartItem {
  return {
    ...normalizeProduct(item.product ?? item),
    quantity: Number(item.quantity ?? 1),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const loadCartAndWishlist = async () => {
      let localCart: CartItem[] = [];
      let localWishlist: Product[] = [];

      try {
        const savedCart = localStorage.getItem("shopkart_cart");
        const savedWishlist = localStorage.getItem("shopkart_wishlist");

        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);

          localCart = parsedCart.map((item: CartItem) => ({
            ...item,
            oldPrice: item.oldPrice ?? item.price,
            rating: item.rating ?? 0,
            reviews: item.reviews ?? 0,
            stock: item.stock ?? 999999,
          }));

          setCart(localCart);
        }

        if (savedWishlist) {
          const parsedWishlist = JSON.parse(savedWishlist);

          localWishlist = parsedWishlist.map((item: Product) => ({
            ...item,
            oldPrice: item.oldPrice ?? item.price,
            rating: item.rating ?? 0,
            reviews: item.reviews ?? 0,
            stock: item.stock ?? 999999,
          }));

          setWishlist(localWishlist);
        }
      } catch (error) {
        console.error("Failed to load local cart/wishlist:", error);
      }

      try {
        const authResponse = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!authResponse.ok) {
          setLoggedIn(false);
          setLoaded(true);
          return;
        }

        setLoggedIn(true);

        /* =========================
           LOAD DATABASE CART
        ========================= */

        const cartResponse = await fetch("/api/cart", {
          credentials: "include",
        });

        if (cartResponse.ok) {
          const cartData = await cartResponse.json();

          const databaseCart: CartItem[] = Array.isArray(cartData.cart)
            ? cartData.cart.map(normalizeCartItem)
            : [];

          for (const localItem of localCart) {
            const existingDatabaseItem = databaseCart.find(
              (item) => item.id === localItem.id
            );

            if (!existingDatabaseItem) {
              try {
                const addResponse = await fetch("/api/cart", {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    productId: localItem.id,
                    quantity: Math.min(
                      localItem.quantity,
                      localItem.stock
                    ),
                  }),
                });

                if (addResponse.ok) {
                  const addData = await addResponse.json();

                  if (addData.cartItem) {
                    databaseCart.push(
                      normalizeCartItem(addData.cartItem)
                    );
                  }
                }
              } catch (error) {
                console.error(
                  "Failed to merge local cart item:",
                  error
                );
              }
            }
          }

          setCart(databaseCart);

          localStorage.setItem(
            "shopkart_cart",
            JSON.stringify(databaseCart)
          );
        }

        /* =========================
           LOAD DATABASE WISHLIST
        ========================= */

        const wishlistResponse = await fetch("/api/wishlist", {
          credentials: "include",
        });

        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();

          const databaseWishlist: Product[] = Array.isArray(
            wishlistData.wishlist
          )
            ? wishlistData.wishlist.map((item: any) =>
                normalizeProduct(item.product ?? item)
              )
            : [];

          /*
           * Merge guest wishlist into database wishlist.
           */
          for (const localItem of localWishlist) {
            const exists = databaseWishlist.some(
              (item) => item.id === localItem.id
            );

            if (!exists) {
              try {
                const addResponse = await fetch("/api/wishlist", {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    productId: localItem.id,
                  }),
                });

                if (addResponse.ok) {
                  const addData = await addResponse.json();

                  if (addData.wishlistItem) {
                    databaseWishlist.push(
                      normalizeProduct(
                        addData.wishlistItem.product ??
                          addData.wishlistItem
                      )
                    );
                  }
                }
              } catch (error) {
                console.error(
                  "Failed to merge local wishlist item:",
                  error
                );
              }
            }
          }

          setWishlist(databaseWishlist);

          localStorage.setItem(
            "shopkart_wishlist",
            JSON.stringify(databaseWishlist)
          );
        }
      } catch (error) {
        console.error(
          "Failed to load customer cart/wishlist:",
          error
        );
      }

      setLoaded(true);
    };

    loadCartAndWishlist();
  }, []);

  /* =========================
     LOCAL STORAGE
  ========================= */

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "shopkart_cart",
      JSON.stringify(cart)
    );
  }, [cart, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "shopkart_wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist, loaded]);

  /* =========================
     DATABASE CART HELPERS
  ========================= */

  async function addToDatabaseCart(
    productId: number,
    quantity: number
  ) {
    try {
      await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });
    } catch (error) {
      console.error("Database cart add error:", error);
    }
  }

  async function updateDatabaseCart(
    productId: number,
    quantity: number
  ) {
    try {
      await fetch("/api/cart", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });
    } catch (error) {
      console.error("Database cart update error:", error);
    }
  }

  async function removeFromDatabaseCart(productId: number) {
    try {
      await fetch(
        `/api/cart?productId=${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Database cart delete error:",
        error
      );
    }
  }

  /* =========================
     DATABASE WISHLIST HELPERS
  ========================= */

  async function addToDatabaseWishlist(productId: number) {
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });
    } catch (error) {
      console.error(
        "Database wishlist add error:",
        error
      );
    }
  }

  async function removeFromDatabaseWishlist(productId: number) {
    try {
      await fetch(
        `/api/wishlist?productId=${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Database wishlist delete error:",
        error
      );
    }
  }

  /* =========================
     CART FUNCTIONS
  ========================= */

  function addToCart(
    product: Product,
    quantity: number = 1
  ) {
    if (product.stock <= 0) {
      return;
    }

    const safeQuantity = Math.max(
      1,
      Math.min(quantity, product.stock)
    );

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + safeQuantity,
          product.stock
        );

        if (loggedIn) {
          updateDatabaseCart(
            product.id,
            newQuantity
          );
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...product,
                quantity: newQuantity,
              }
            : item
        );
      }

      if (loggedIn) {
        addToDatabaseCart(
          product.id,
          safeQuantity
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: safeQuantity,
        },
      ];
    });
  }

  function increaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        if (item.quantity >= item.stock) {
          return item;
        }

        const newQuantity = item.quantity + 1;

        if (loggedIn) {
          updateDatabaseCart(
            productId,
            newQuantity
          );
        }

        return {
          ...item,
          quantity: newQuantity,
        };
      })
    );
  }

  function decreaseQuantity(productId: number) {
    setCart((currentCart) => {
      const item = currentCart.find(
        (cartItem) => cartItem.id === productId
      );

      if (!item) {
        return currentCart;
      }

      const newQuantity = item.quantity - 1;

      if (newQuantity <= 0) {
        if (loggedIn) {
          removeFromDatabaseCart(productId);
        }

        return currentCart.filter(
          (cartItem) => cartItem.id !== productId
        );
      }

      if (loggedIn) {
        updateDatabaseCart(
          productId,
          newQuantity
        );
      }

      return currentCart.map((cartItem) =>
        cartItem.id === productId
          ? {
              ...cartItem,
              quantity: newQuantity,
            }
          : cartItem
      );
    });
  }

  function removeFromCart(productId: number) {
    if (loggedIn) {
      removeFromDatabaseCart(productId);
    }

    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  }

  function updateQuantity(
    productId: number,
    quantity: number
  ) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        const safeQuantity = Math.max(
          1,
          Math.min(quantity, item.stock)
        );

        if (loggedIn) {
          updateDatabaseCart(
            productId,
            safeQuantity
          );
        }

        return {
          ...item,
          quantity: safeQuantity,
        };
      })
    );
  }

  function clearCart() {
    if (loggedIn) {
      cart.forEach((item) => {
        removeFromDatabaseCart(item.id);
      });
    }

    setCart([]);
  }

  /* =========================
     WISHLIST FUNCTIONS
  ========================= */

  function addToWishlist(product: Product) {
    const alreadyExists = wishlist.some(
      (item) => item.id === product.id
    );

    if (alreadyExists) {
      return;
    }

    if (loggedIn) {
      addToDatabaseWishlist(product.id);
    }

    setWishlist((currentWishlist) => {
      const exists = currentWishlist.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return currentWishlist;
      }

      return [...currentWishlist, product];
    });
  }

  function removeFromWishlist(productId: number) {
    if (loggedIn) {
      removeFromDatabaseWishlist(productId);
    }

    setWishlist((currentWishlist) =>
      currentWishlist.filter(
        (item) => item.id !== productId
      )
    );
  }

  function toggleWishlist(product: Product) {
    const alreadyExists = wishlist.some(
      (item) => item.id === product.id
    );

    if (alreadyExists) {
      if (loggedIn) {
        removeFromDatabaseWishlist(product.id);
      }

      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (item) => item.id !== product.id
        )
      );

      return;
    }

    if (loggedIn) {
      addToDatabaseWishlist(product.id);
    }

    setWishlist((currentWishlist) => {
      const exists = currentWishlist.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return currentWishlist;
      }

      return [...currentWishlist, product];
    });
  }

  function isInWishlist(productId: number) {
    return wishlist.some(
      (item) => item.id === productId
    );
  }

  function moveWishlistToCart(product: Product) {
    if (product.stock <= 0) {
      return;
    }

    addToCart(product, 1);
    removeFromWishlist(product.id);
  }

  /* =========================
     TOTALS
  ========================= */

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,

        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        updateQuantity,
        clearCart,

        cartCount,
        cartTotal,

        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        moveWishlistToCart,
        wishlistCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider"
    );
  }

  return context;
}