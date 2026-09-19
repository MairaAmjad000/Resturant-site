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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration
    setCart(
      parseStoredCart(
        window.localStorage.getItem(CART_STORAGE_KEY),
        catalog
      )
    );
  }, [catalog]);

  return cart;
}
