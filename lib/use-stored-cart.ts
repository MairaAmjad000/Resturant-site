"use client";

import { useEffect, useState } from "react";
import {
  CART_STORAGE_KEY,
  parseStoredCart,
  type CartLine,
} from "@/lib/cart";

/**
 * Hydrates the cart from localStorage on the client.
 * Returns null until hydration has run (SSR-safe).
 */
export function useStoredCart(
  catalog: Map<string, import("@/types/menu").MenuItem>
): CartLine[] | null {
  const [cart, setCart] = useState<CartLine[] | null>(null);

  useEffect(() => {
    const read = () => {
      setCart(
        parseStoredCart(
          window.localStorage.getItem(CART_STORAGE_KEY),
          catalog
        )
      );
    };

    read();

    /* Cart edits made outside this component's own state (e.g. the cart
       drawer mounted in the checkout header) dispatch this event so every
       consumer re-reads localStorage and stays in sync. */
    window.addEventListener("porto:cart-changed", read);
    return () => window.removeEventListener("porto:cart-changed", read);
  }, [catalog]);

  return cart;
}
