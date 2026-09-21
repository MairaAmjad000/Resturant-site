"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Bike,
  ShoppingBag,
  Plus,
  Minus,
  CircleHelp,
} from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { MAX_ITEM_QUANTITY, lineTotal, selectionsSummary } from "@/lib/cart";
import { deliveryFeeFor, FREE_DELIVERY_THRESHOLD, saveCheckoutSession, readCheckoutSession } from "@/lib/checkout-session";

type OrderType = "delivery" | "collection";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartLine[];
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onClear?: () => void;
  onCheckout?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: CartDrawerProps) {
  const router = useRouter();

  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      const session = readCheckoutSession();
      return session?.orderType ?? "collection";
    } catch { return "collection"; }
  });
  const [notes, setNotes] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // Persist order-type changes so checkout opens with it pre-selected.
  useEffect(() => {
    try {
      const existing = readCheckoutSession();
      if (existing) {
        if (existing.orderType !== orderType) {
          saveCheckoutSession({ ...existing, orderType });
        }
      } else {
        // No session yet — create a minimal one so checkout reads the order type.
        saveCheckoutSession({
          orderType,
          timing: "asap",
          scheduledDate: "",
          scheduledTime: "",
          tip: 0,
          cutlery: false,
          customer: { firstName: "", lastName: "", phone: "" },
          delivery: { street: "", floor: "", postcode: "", company: "", orderInstructions: "", deliveryNotes: "" },
        });
      }
    } catch { /* ignore */ }
  }, [orderType]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const [prevCount, setPrevCount] = useState(cartItems.length);
  if (prevCount !== cartItems.length) {
    setPrevCount(cartItems.length);
    if (cartItems.length === 0) {
      setShowSummary(false);
    }
  }

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (total, cartItem) => total + lineTotal(cartItem),
    0
  );

  const hasItems = cartItems.length > 0;
  const serviceFee = hasItems ? 0.5 : 0;
  const bagCharges = hasItems ? 0.35 : 0;
  const deliveryFee = orderType === "delivery" ? deliveryFeeFor("delivery", subtotal) : 0;
  /** Pennies-rounded so repeated float adds can't drift (95.68+0.5+0.35 → 96.52999…). */
  const total = Math.round((subtotal + serviceFee + bagCharges + deliveryFee) * 100) / 100;

  const handleCheckout = () => {
    if (!hasItems) return;

    // Persist the selected order type so checkout opens with it pre-selected.
    try {
      const existing = readCheckoutSession();
      if (existing) {
        saveCheckoutSession({ ...existing, orderType });
      }
    } catch { /* ignore */ }

    // Cart is intentionally kept — it must survive into the
    // checkout page and is only cleared after confirmation.
    if (onCheckout) {
      onCheckout();
    } else {
      router.push("/checkout");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-[120] flex h-dvh w-full max-w-[395px] flex-col bg-[#fde9dc] shadow-[-8px_0_30px_rgba(0,0,0,0.08)]"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="shrink-0 px-[21px] pb-2 pt-[22px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#ff8500]">
                Your order
              </p>
              <h2 className="mt-3 text-[30px] font-bold leading-none text-[#15181a]">
                Cart
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="flex h-[27px] w-[27px] items-center justify-center rounded-full bg-white text-[#555] transition hover:bg-[#f2f2f2]"
            >
              <X className="h-[14px] w-[14px]" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[21px] pb-5 [scrollbar-width:thin]">
          <div className="mt-5 grid grid-cols-2 gap-[10px]">
            <button
  type="button"
  onClick={() => setOrderType("delivery")}
  aria-pressed={orderType === "delivery"}
  className="btn-option flex h-[93px] flex-col items-center justify-center gap-1 rounded-[13px]"
>
  <Bike className="h-[21px] w-[21px]" />
  <span className="text-[14px] font-semibold leading-none">Delivery</span>
  <span className="text-[11px] leading-none text-black">From 17:00</span>
</button>

<button
  type="button"
  onClick={() => setOrderType("collection")}
  aria-pressed={orderType === "collection"}
  className="btn-option flex h-[93px] flex-col items-center justify-center gap-1 rounded-[13px]"
>
  <ShoppingBag className="h-[21px] w-[21px]" />
  <span className="text-[14px] font-semibold leading-none">Collection</span>
  <span className="text-[11px] leading-none text-black">From 17:00</span>
</button>

          </div>

          {!hasItems ? (
            <div className="py-7">
              <p className="text-[13px] leading-[19px] text-[#ff3b19]">
                Your cart is empty. Add something delicious from the menu.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {cartItems.map((cartItem) => {
                const summary = selectionsSummary(
                  cartItem.item,
                  cartItem.selections
                );

                return (
                <div
                  key={cartItem.lineId}
                  className="rounded-[12px] bg-white p-3"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14px] font-semibold text-[#15181a]">
                        {cartItem.item.name}
                      </h3>
                      {summary.length > 0 && (
                        <p className="mt-0.5 truncate text-[12px] text-[#999]">
                          {summary.join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-[13px] text-[#666]">
                        £{lineTotal(cartItem).toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(cartItem.lineId)}
                      className="text-[11px] text-[#999] hover:text-[#ff3b19]"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-[#ddd] bg-white">
                      <button
                        type="button"
                        onClick={() => onDecrease(cartItem.lineId)}
                        className="flex h-8 w-8 items-center justify-center"
                        aria-label={`Decrease ${cartItem.item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="w-7 text-center text-[13px] font-semibold">
                        {cartItem.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => onIncrease(cartItem.lineId)}
                        disabled={cartItem.quantity >= MAX_ITEM_QUANTITY}
                        className="flex h-8 w-8 items-center justify-center disabled:opacity-40"
                        aria-label={`Increase ${cartItem.item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="text-[15px] font-bold">
                      £{lineTotal(cartItem).toFixed(2)}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 space-y-3 text-[13px] text-[#555]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                Service fee
                <CircleHelp
                  className="h-3 w-3 text-[#999]"
                  aria-label="Covers payment processing"
                />
              </span>
              <span>£{serviceFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Bag charges</span>
              <span>£{bagCharges.toFixed(2)}</span>
            </div>

            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>£{deliveryFee.toFixed(2)}</span>
              </div>
            )}
          </div>

          {showSummary && (
            <p className="mt-3 text-[12px] leading-[18px] text-[#666]">
              {orderType === "delivery"
                ? subtotal >= FREE_DELIVERY_THRESHOLD
                  ? "Free delivery — order is above the £20.00 threshold."
                  : `Standard delivery £3.99 — add £${(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)} more for free delivery.`
                : "Collection from Shawlands from 17:00."}
            </p>
          )}

          <div className="my-4 h-px bg-[#e7cfc0]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-bold text-[#15181a]">
                Total
                <span className="ml-1 text-[11px] font-normal text-[#777]">
                  (incl. fees and tax)
                </span>
              </p>

              <button
                type="button"
                onClick={() => setShowSummary((value) => !value)}
                className="mt-1 text-[11px] text-[#666] underline"
              >
                {showSummary ? "Hide summary" : "See summary"}
              </button>
            </div>

            <span className="text-[22px] font-bold text-[#ff8500]">
              £{total.toFixed(2)}
            </span>
          </div>

          <div className="mt-6">
            <label
              htmlFor="order-notes"
              className="mb-2 block text-[13px] font-semibold text-[#15181a]"
            >
              Notes
            </label>

            <textarea
              id="order-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add notes or special instructions..."
              rows={2}
              className="w-full resize-none rounded-[11px] border-0 bg-white px-[14px] py-[12px] text-[12px] text-[#333] outline-none placeholder:text-[#999] focus:ring-1 focus:ring-[#ff8500]"
            />
          </div>
        </div>

        <div className="shrink-0 bg-[#fde9dc] px-[21px] pb-[21px] pt-2">
          <button
            type="button"
            disabled={!hasItems}
            onClick={handleCheckout}
            className="h-[51px] w-full rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-[#f58200] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
