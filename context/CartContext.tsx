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

export function CartProvider({ children }: { children: ReactNode }) {
const [cart, setCart] = useState<CartItem[]>([]);
const [wishlist, setWishlist] = useState<Product[]>([]);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
try {
const savedCart = localStorage.getItem("shopkart_cart");
const savedWishlist = localStorage.getItem("shopkart_wishlist");

  if (savedCart) {
    const parsedCart = JSON.parse(savedCart);

    const safeCart = parsedCart.map((item: CartItem) => ({
      ...item,
      oldPrice: item.oldPrice ?? item.price,
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      stock: item.stock ?? 999999,
    }));

    setCart(safeCart);
  }

  if (savedWishlist) {
    const parsedWishlist = JSON.parse(savedWishlist);

    const safeWishlist = parsedWishlist.map((item: Product) => ({
      ...item,
      oldPrice: item.oldPrice ?? item.price,
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      stock: item.stock ?? 999999,
    }));

    setWishlist(safeWishlist);
  }
} catch (error) {
  console.error("Failed to load cart/wishlist:", error);
}

setLoaded(true);

}, []);

useEffect(() => {
if (!loaded) return;

localStorage.setItem("shopkart_cart", JSON.stringify(cart));

}, [cart, loaded]);

useEffect(() => {
if (!loaded) return;

localStorage.setItem(
  "shopkart_wishlist",
  JSON.stringify(wishlist)
);

}, [wishlist, loaded]);

function addToCart(product: Product, quantity: number = 1) {
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

    return {
      ...item,
      quantity: item.quantity + 1,
    };
  })
);

}

function decreaseQuantity(productId: number) {
setCart((currentCart) =>
currentCart
.map((item) => {
if (item.id !== productId) {
return item;
}

      return {
        ...item,
        quantity: item.quantity - 1,
      };
    })
    .filter((item) => item.quantity > 0)
);

}

function removeFromCart(productId: number) {
setCart((currentCart) =>
currentCart.filter((item) => item.id !== productId)
);
}

function updateQuantity(productId: number, quantity: number) {
setCart((currentCart) =>
currentCart.map((item) => {
if (item.id !== productId) {
return item;
}

    const safeQuantity = Math.max(
      1,
      Math.min(quantity, item.stock)
    );

    return {
      ...item,
      quantity: safeQuantity,
    };
  })
);

}

function clearCart() {
setCart([]);
}

function addToWishlist(product: Product) {
setWishlist((currentWishlist) => {
const alreadyExists = currentWishlist.some(
(item) => item.id === product.id
);

  if (alreadyExists) {
    return currentWishlist;
  }

  return [...currentWishlist, product];
});

}

function removeFromWishlist(productId: number) {
setWishlist((currentWishlist) =>
currentWishlist.filter((item) => item.id !== productId)
);
}

function toggleWishlist(product: Product) {
setWishlist((currentWishlist) => {
const alreadyExists = currentWishlist.some(
(item) => item.id === product.id
);

  if (alreadyExists) {
    return currentWishlist.filter(
      (item) => item.id !== product.id
    );
  }

  return [...currentWishlist, product];
});

}

function isInWishlist(productId: number) {
return wishlist.some((item) => item.id === productId);
}

function moveWishlistToCart(product: Product) {
if (product.stock <= 0) {
return;
}

addToCart(product, 1);
removeFromWishlist(product.id);

}

const cartCount = cart.reduce(
(total, item) => total + item.quantity,
0
);

const cartTotal = cart.reduce(
(total, item) => total + item.price * item.quantity,
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
