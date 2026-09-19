"use client";

import { useEffect, useState } from "react";
import { cartQuantity, cartSubtotal, type CartLine } from "@/lib/cart";

interface CartBannerProps {
  cartItems: CartLine[];
  onClick: () => void;
}

export default function CartBanner({ cartItems, onClick }: CartBannerProps) {
  const count = cartQuantity(cartItems);
  const total = cartSubtotal(cartItems);
  const hasItems = count > 0;

  const [shown, setShown] = useState(hasItems);

  /* Show instantly when the cart gains items
     (render-time adjustment, per React docs) */
  const [prevHasItems, setPrevHasItems] = useState(hasItems);
  if (prevHasItems !== hasItems) {
    setPrevHasItems(hasItems);
    if (hasItems) setShown(true);
  }

  /* Stay mounted briefly after the cart empties
     so the slide-out transition can play */
  useEffect(() => {
    if (hasItems) return;

    const timer = setTimeout(() => setShown(false), 350);

    return () => clearTimeout(timer);
  }, [hasItems]);

  if (!shown) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-4 left-1/2 z-[85] w-[calc(100%-2rem)] max-w-[640px] -translate-x-1/2 transition-all duration-300 ${
        hasItems
          ? "translate-y-0 opacity-100"
          : "translate-y-[120%] opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open basket, ${count} ${
          count === 1 ? "item" : "items"
        }, £${total.toFixed(2)}`}
        className="pointer-events-auto flex w-full items-center gap-4 rounded-full bg-[#0e3b2e] py-[14px] pl-[14px] pr-6 text-left shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:bg-[#0c3227]"
      >
        {/* Count chip */}
        <span className="flex h-[46px] min-w-[46px] items-center justify-center rounded-full bg-white px-2 text-[16px] font-bold text-[#0e3b2e]">
          {count > 99 ? "99+" : count}
        </span>

        {/* Label + total */}
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold uppercase tracking-[1.5px] text-[#cfe8db]">
            Your basket
          </span>

          <span className="mt-[2px] block text-[17px] font-bold leading-tight text-white">
            £{total.toFixed(2)}
          </span>
        </span>
      </button>
    </div>
  );
}
