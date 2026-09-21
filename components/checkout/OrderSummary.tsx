"use client";

import { useState } from "react";
import Link from "next/link";
import { CirclePlus, Clock, ShoppingBag, Tag, Utensils, Wallet, X } from "lucide-react";
import SafeImage from "@/components/restaurant/SafeImage";
import type { CartLine } from "@/lib/cart";
import { lineTotal, selectionsSummary } from "@/lib/cart";
import {
  BAG_CHARGE,
  FREE_DELIVERY_THRESHOLD,
  MIN_ORDER_TOTAL,
  SERVICE_FEE,
  STANDARD_DELIVERY_FEE,
  deliveryFeeFor,
  type AppliedCoupon,
  type OrderType,
} from "@/lib/checkout-session";
import { readActiveCoupons, markCouponUsed } from "@/lib/account";
import type { SiteContent } from "@/lib/menu-data";

interface OrderSummaryProps {
  site: SiteContent;
  cart: CartLine[];
  catalog: Map<string, { name: string; price: number; description?: string }>;
  orderType: OrderType;
  timingLabel: string;
  tip: number;
  onTipChange: (tip: number) => void;
  /** Hide the coupon box (payment step keeps the summary read-only). */
  showCoupon?: boolean;
  /** Hide the "Add more items" link (payment step summary is read-only). */
  showAddMore?: boolean;
  /** Show the interactive tip editor; false renders the selected tip as a static row. */
  showTipEditor?: boolean;
  /** Show a static "Cutlery: Yes/No" row (payment + confirmation). */
  cutlery?: boolean;
  /** Coupon applied at checkout — rendered as a static discount row. */
  coupon?: AppliedCoupon | null;
  /** Fired when a coupon is successfully applied (checkout step). */
  onCouponApplied?: (coupon: AppliedCoupon) => void;
  /** Fired when the applied coupon is removed (checkout step). */
  onCouponRemoved?: () => void;
  /** Interactive wallet section (checkout step only). */
  showWallet?: boolean;
  /** Current wallet balance in £. */
  walletBalance?: number;
  /** How much wallet money the user chose to spend on this order. */
  walletAmountUsed?: number;
  /** Parent handler for the chosen wallet amount. */
  onWalletAmountChange?: (amount: number) => void;
}

const TIP_PRESETS = [1, 2, 5];

export default function OrderSummary({
  cart,
  catalog,
  orderType,
  timingLabel,
  tip,
  onTipChange,
  showCoupon = true,
  showAddMore = true,
  showTipEditor = true,
  cutlery,
  coupon,
  onCouponApplied,
  onCouponRemoved,
  showWallet = false,
  walletBalance = 0,
  walletAmountUsed = 0,
  onWalletAmountChange,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);

  /** Round to pennies — naive float sums like 95.68 + 0.50 + 0.35 land on
   *  96.52999999999999, which then wrongly rejects an input of 96.53. */
  const pennies = (value: number) => Math.round(value * 100) / 100;

  const subtotal = pennies(
    cart.reduce((sum, line) => sum + lineTotal(line), 0)
  );

  const bagCharges = BAG_CHARGE;
  const couponDiscount = coupon?.discount ?? 0;
  /** Discounted basket value — drives the free-delivery threshold. */
  const basketValue = pennies(Math.max(0, subtotal - couponDiscount));
  const deliveryFee = deliveryFeeFor(orderType, basketValue);
  const belowMinOrder = basketValue < MIN_ORDER_TOTAL;
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - basketValue);
  /** Order value before wallet deduction. */
  const orderTotal = pennies(
    subtotal + deliveryFee + SERVICE_FEE + bagCharges + tip - couponDiscount
  );
  /** What the user chose to pay from the wallet, clamped to what's valid. */
  const maxWalletUsable = pennies(Math.min(walletBalance, orderTotal));
  const walletApplied = pennies(Math.min(walletAmountUsed, maxWalletUsable));
  const total = pennies(orderTotal - walletApplied);

  /** Validates the entered code against the account's active coupons and
   *  reports the result via onCouponApplied (parent owns session state). */
  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;

    const match = readActiveCoupons().find(
      (entry) => entry.code.toUpperCase() === code.toUpperCase()
    );

    if (!match) {
      setCouponMessage(
        "This coupon code is not valid or has already been used."
      );
      return;
    }

    const discount =
      match.type === "percent"
        ? Math.round(subtotal * (match.value / 100) * 100) / 100
        : Math.min(match.value, subtotal);

    markCouponUsed(match.id);
    setCouponMessage(null);
    setCouponInput("");
    onCouponApplied?.({ code: match.code, discount });
  };

  const removeCoupon = () => {
    setCouponMessage(null);
    onCouponRemoved?.();
  };

  /** Wallet spend entry: positive number, no more than the wallet
   *  balance, and never more than the order itself. Errors otherwise —
   *  the user chooses exactly how much wallet money to spend. */
  const applyWalletAmount = () => {
    const parsed = Number(walletInput);

    if (!walletInput.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      setWalletError("Enter a valid amount to use.");
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;

    if (rounded > walletBalance + 0.005) {
      setWalletError(
        `You only have £${walletBalance.toFixed(2)} in your wallet.`
      );
      return;
    }
    if (rounded > orderTotal + 0.005) {
      setWalletError(
        `That's more than the order total (£${orderTotal.toFixed(2)}).`
      );
      return;
    }

    setWalletError(null);
    setWalletInput("");
    onWalletAmountChange?.(rounded);
  };

  const clearWalletAmount = () => {
    setWalletInput("");
    setWalletError(null);
    onWalletAmountChange?.(0);
  };

  const selectPreset = (amount: number) => {
    setCustomTip("");
    onTipChange(amount);
  };

  const selectNoTip = () => {
    setCustomTip("");
    onTipChange(0);
  };

  const selectCustom = (value: string) => {
    setCustomTip(value);
    const parsed = Number(value);
    onTipChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  };

  return (
    <div className="flex flex-col gap-4 rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <h2 className="text-[20px] font-bold text-[#15181a]">Order Summary</h2>

      {/* Items */}
      <ul className="flex flex-col divide-y divide-[#f0f0f0]">
        {cart.map((line) => {
          const entry = catalog.get(line.item.id);
          const description = entry?.description ?? line.item.description;

          return (
            <li key={line.lineId} className="flex gap-3 py-3 first:pt-0">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#fdecd8]">
                <SafeImage
                  src="/images/logo.png"
                  alt=""
                  width={30}
                  height={30}
                  className="object-contain opacity-80"
                  fallback={<ShoppingBag className="h-4 w-4 text-[#c9a882]" />}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-snug text-[#15181a]">
                  {line.item.name}
                </span>
                {selectionsSummary(line.item, line.selections).length > 0 ? (
                  <span className="mt-0.5 block truncate text-[12px] leading-snug text-[#9aa0a5]">
                    {selectionsSummary(line.item, line.selections).join(" · ")}
                  </span>
                ) : (
                  description && (
                    <span className="mt-0.5 block text-[12px] leading-snug text-[#9aa0a5]">
                      {description}
                    </span>
                  )
                )}
                <span className="mt-0.5 block text-[12px] text-[#9aa0a5]">
                  × {line.quantity}
                </span>
              </span>

              <span className="shrink-0 text-[14px] font-bold text-[#15181a]">
                £{lineTotal(line).toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Add more items — back to the menu (checkout step only) */}
      {showAddMore !== false && (
        <Link
          href="/#menu"
          className="flex h-[44px] items-center justify-center gap-2 rounded-full border border-[#d8d0c5] bg-white text-[14px] font-semibold text-[#15181a] transition-colors hover:border-[#ff8500] hover:text-[#ff8500]"
        >
          <CirclePlus className="h-[18px] w-[18px]" />
          Add more items
        </Link>
      )}

      {/* Timing strip */}
      <div className="flex items-center gap-2 rounded-[10px] bg-[#fdecd8] px-4 py-3">
        <Clock className="h-4 w-4 shrink-0 text-[#ff8500]" />
        <span className="truncate text-[14px] font-bold text-[#ff8500]">
          {timingLabel}
        </span>
      </div>

      {/* Coupon — input when none applied; green applied chip otherwise */}
      {showCoupon &&
        (coupon ? (
          <div className="flex items-center justify-between rounded-[10px] border border-[#bfe8cf] bg-[#eefaf2] px-4 py-3">
            <span className="flex min-w-0 items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-[#178A4B]" />
              <span className="truncate text-[13px] font-bold text-[#178A4B]">
                {coupon.code}
              </span>
              <span className="shrink-0 text-[12px] text-[#3d4348]">
                −£{coupon.discount.toFixed(2)}
              </span>
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              aria-label={`Remove coupon ${coupon.code}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#178A4B] transition hover:bg-[#d6f2e0]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="rounded-[10px] border border-[#ececec] p-4">
            <p className="text-[14px] font-semibold text-[#15181a]">
              Have a coupon code?
            </p>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyCoupon();
                }}
                placeholder="Enter coupon code"
                className="h-[44px] min-w-0 flex-1 rounded-[10px] border-0 bg-[#f5f5f5] px-[14px] text-[13px] text-[#15181a] outline-none placeholder:text-[#9aa0a5] focus:ring-1 focus:ring-[#ff8500]"
              />

              <button
                type="button"
                onClick={applyCoupon}
                className="h-[44px] shrink-0 rounded-full bg-[#ff8500] px-5 text-[13px] font-bold text-white transition hover:bg-[#f58200]"
              >
                Apply
              </button>
            </div>

            {couponMessage && (
              <p className="mt-2 text-[12px] text-[#c0392b]">{couponMessage}</p>
            )}
          </div>
        ))}

      {/* Wallet — spend exactly how much you want from your balance */}
      {showWallet && (
        <div className="rounded-[10px] border border-[#ececec] p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-[#15181a]">
              <Wallet className="h-4 w-4 text-[#ff8500]" />
              Wallet
            </p>
            <span className="text-[14px] font-bold text-[#15181a]">
              £{walletBalance.toFixed(2)}{" "}
              <span className="text-[11px] font-normal text-[#9aa0a5]">
                balance
              </span>
            </span>
          </div>

          {/* Applied chip or entry input */}
          {walletAmountUsed > 0 ? (
            <div className="mt-3 flex items-center justify-between rounded-[10px] border border-[#bfe8cf] bg-[#eefaf2] px-3 py-2.5">
              <span className="flex items-center gap-2 text-[13px] font-bold text-[#178A4B]">
                <Wallet className="h-3.5 w-3.5" />
                Paying £{walletApplied.toFixed(2)} with wallet
              </span>
              <button
                type="button"
                onClick={clearWalletAmount}
                aria-label="Remove wallet payment"
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#178A4B] transition hover:bg-[#d6f2e0]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : walletBalance > 0 ? (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[13px] text-[#15181a]">
                  Use from wallet
                </span>
                <input
                  type="number"
                  min="0"
                  max={maxWalletUsable}
                  step="0.5"
                  value={walletInput}
                  onChange={(event) => {
                    setWalletInput(event.target.value);
                    setWalletError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyWalletAmount();
                  }}
                  placeholder={`0 – ${maxWalletUsable.toFixed(2)}`}
                  aria-invalid={!!walletError}
                  className={`h-[38px] min-w-0 flex-1 rounded-[8px] border bg-white px-3 text-[13px] outline-none transition focus:ring-2 ${
                    walletError
                      ? "border-[#e5484d] focus:ring-[#e5484d]/25"
                      : "border-[#e2e2e2] focus:border-[#ff8500] focus:ring-[#ff8500]/25"
                  }`}
                />
                <button
                  type="button"
                  onClick={applyWalletAmount}
                  className="h-[38px] shrink-0 rounded-full bg-[#ff8500] px-4 text-[12px] font-bold text-white transition hover:bg-[#f07d00]"
                >
                  Use
                </button>
              </div>

              {/* Quick amounts — full balance and half */}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWalletInput(maxWalletUsable.toFixed(2));
                    setWalletError(null);
                  }}
                  className="h-[26px] rounded-full border border-[#e2e2e2] bg-white px-3 text-[11px] font-semibold text-[#15181a] transition hover:border-[#ff8500]"
                >
                  Use all £{maxWalletUsable.toFixed(2)}
                </button>
                {walletBalance / 2 < maxWalletUsable && (
                  <button
                    type="button"
                    onClick={() => {
                      setWalletInput((Math.round((walletBalance / 2) * 100) / 100).toFixed(2));
                      setWalletError(null);
                    }}
                    className="h-[26px] rounded-full border border-[#e2e2e2] bg-white px-3 text-[11px] font-semibold text-[#15181a] transition hover:border-[#ff8500]"
                  >
                    Use half £{(Math.round((walletBalance / 2) * 100) / 100).toFixed(2)}
                  </button>
                )}
              </div>

              {walletError && (
                <p className="mt-1.5 text-[12px] font-semibold text-[#e5484d]">
                  {walletError}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-[#9aa0a5]">
              Your balance is empty — top up from the Wallet page in your
              account.
            </p>
          )}
        </div>
      )}

      {/* Minimum order warning — blocks checkout */}
      {belowMinOrder && (
        <p className="rounded-[10px] border border-[#f3c8c8] bg-[#fdf4f4] px-4 py-3 text-[13px] font-semibold text-[#e5484d]">
          Minimum order is £{MIN_ORDER_TOTAL.toFixed(2)} — add £{(MIN_ORDER_TOTAL - basketValue).toFixed(2)} more to check out.
        </p>
      )}

      {/* Free-delivery nudge — only when delivery is selected and close to threshold */}
      {orderType === "delivery" && !belowMinOrder && amountToFreeDelivery > 0 && amountToFreeDelivery <= 10 && (
        <p className="rounded-[10px] bg-[#fdecd8] px-4 py-3 text-[13px] text-[#15181a]">
          Add <span className="font-bold text-[#ff8500]">£{amountToFreeDelivery.toFixed(2)}</span> more for free delivery
          (currently £{STANDARD_DELIVERY_FEE.toFixed(2)}).
        </p>
      )}

      {/* Totals */}
      <dl className="flex flex-col gap-2 text-[13px] text-[#6b7075]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>£{subtotal.toFixed(2)}</dd>
        </div>

        {orderType === "delivery" && (
          <div className="flex justify-between">
            <dt>Standard delivery</dt>
            <dd className={deliveryFee > 0 ? "font-semibold text-[#15181a]" : ""}>
              {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Free"}
            </dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt>Service fee</dt>
          <dd>£{SERVICE_FEE.toFixed(2)}</dd>
        </div>

        <div className="flex justify-between">
          <dt>Bag charges</dt>
          <dd>£{BAG_CHARGE.toFixed(2)}</dd>
        </div>

        {/* Static tip row when the editor is hidden (payment step) */}
        {!showTipEditor && tip > 0 && (
          <div className="flex justify-between">
            <dt>Tip</dt>
            <dd>£{tip.toFixed(2)}</dd>
          </div>
        )}

        {/* Cutlery preference — static row (payment + confirmation) */}
        {cutlery !== undefined && (
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-[#9aa0a5]" />
              Cutlery
            </dt>
            <dd className={cutlery ? "font-semibold text-[#15181a]" : ""}>
              {cutlery ? "Yes please" : "No thanks"}
            </dd>
          </div>
        )}

        {/* Coupon discount */}
        {coupon && coupon.discount > 0 && (
          <div className="flex justify-between text-[#178A4B]">
            <dt>Coupon ({coupon.code})</dt>
            <dd className="font-semibold">−£{coupon.discount.toFixed(2)}</dd>
          </div>
        )}

        {/* Amount paid from wallet balance */}
        {walletApplied > 0 && (
          <div className="flex justify-between text-[#178A4B]">
            <dt>Paid with wallet</dt>
            <dd className="font-semibold">−£{walletApplied.toFixed(2)}</dd>
          </div>
        )}
      </dl>

      {/* Tip */}
      {showTipEditor && (
      <div>
        <p className="text-[14px] font-semibold text-[#15181a]">
          Add a tip{" "}
          <span className="font-normal text-[#9aa0a5]">
            (100% goes to staff)
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectNoTip}
            aria-pressed={tip === 0}
            className="btn-option h-[36px] rounded-full px-4 text-[13px]"
          >
            No tip
          </button>

          {TIP_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => selectPreset(amount)}
              aria-pressed={tip === amount}
              className="btn-option h-[36px] rounded-full px-4 text-[13px]"
            >
              £{amount.toFixed(2)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-[13px] text-[#15181a]">Other</span>
          <span className="text-[13px] text-[#9aa0a5]">£</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={customTip}
            onChange={(event) => selectCustom(event.target.value)}
            className="h-[34px] w-[90px] rounded-[8px] border border-[#e2e2e2] bg-white px-2 text-[13px] outline-none focus:border-[#ff8500]"
          />
        </div>
      </div>
      )}

      {/* Total */}
      <div className="flex items-end justify-between border-t border-[#f0f0f0] pt-4">
        <span className="text-[17px] font-bold text-[#15181a]">Total</span>

        <span className="text-right">
          <span className="block text-[24px] font-bold leading-tight text-[#ff8500]">
            £{total.toFixed(2)}
          </span>
          <span className="block text-[12px] text-[#9aa0a5]">
            incl. fees and tax
          </span>
        </span>
      </div>
    </div>
  );
}
