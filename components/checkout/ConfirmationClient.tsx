"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, Star, Wallet } from "lucide-react";
import SafeImage from "@/components/restaurant/SafeImage";
import {
  BAG_CHARGE,
  SERVICE_FEE,
  deliveryFeeFor,
  placeOrder,
  readCheckoutSession,
  readSelectedPaymentMethod,
  type CheckoutSession,
  type OrderType,
  type PlacedOrder,
} from "@/lib/checkout-session";
import { useStoredCart } from "@/lib/use-stored-cart";
import { buildCartCatalog, clearStoredCart, lineTotal, selectionsSummary } from "@/lib/cart";
import { appendOrderToHistory, pushNotification, readWallet, addWalletFunds, addLoyaltyPoints, type OrderStatus } from "@/lib/account";
import type { SiteContent } from "@/lib/menu-data";
import type { DealItem, MenuCategory } from "@/types/menu";

interface ConfirmationClientProps {
  site: SiteContent;
  categories: MenuCategory[];
  deals: DealItem[];
}

export default function ConfirmationClient({
  categories,
  deals,
}: ConfirmationClientProps) {
  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );
  const cart = useStoredCart(catalog);

  const [session] = useState<CheckoutSession | null>(() =>
    readCheckoutSession()
  );
  const [method] = useState(() => readSelectedPaymentMethod());

  const [confirmed, setConfirmed] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [agreeError, setAgreeError] = useState(false);
  /** Points earned from this order (set when the order is placed). */
  const [loyaltyEarned, setLoyaltyEarned] = useState(0);

  const orderType: OrderType = session?.orderType ?? "collection";

  const subtotal = (cart ?? []).reduce(
    (sum, line) => sum + lineTotal(line),
    0
  );

  const bagCharges = BAG_CHARGE;
  const couponDiscount = session?.coupon?.discount ?? 0;
  const deliveryFee = deliveryFeeFor(orderType, Math.max(0, subtotal - couponDiscount));
  /** Order value before wallet deduction (rounded to pennies — float adds drift). */
  const orderTotal = Math.round(
    (subtotal + deliveryFee + SERVICE_FEE + bagCharges + (session?.tip ?? 0) - couponDiscount) * 100
  ) / 100;
  /** Wallet spend clamped to the order total and the user's balance. */
  const walletApplied = Math.min(
    session?.walletAmountUsed ?? 0,
    orderTotal,
    readWallet().balance
  );
  const total = Math.round((orderTotal - walletApplied) * 100) / 100;

  /* ---------------------------------------------------------
     Review guard — nothing to review
  --------------------------------------------------------- */
  if (cart !== null && cart.length === 0 && !placedOrder) {
    return (
      <main className="mx-auto max-w-[1160px] px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-bold text-[#15181a]">
          Nothing to confirm
        </h1>
        <p className="mt-3 text-[15px] text-[#666]">
          Your basket is empty, so there is no order to review.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-[51px] items-center rounded-full bg-[#ff8500] px-8 text-[14px] font-bold text-white transition hover:bg-[#f58200]"
        >
          Back to menu
        </Link>
      </main>
    );
  }

  /* ---------------------------------------------------------
     Success view after Complete Order
  --------------------------------------------------------- */
  if (confirmed && placedOrder) {
    return (
      <main className="mx-auto max-w-[560px] px-4 py-14 text-center sm:px-6">
        <div className="rounded-[14px] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.05)] sm:p-10">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#178A4B]" />

          <h1 className="mt-4 text-[24px] font-bold text-[#15181a]">
            Order placed!
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Order number{" "}
            <span className="font-bold text-[#15181a]">
              {placedOrder.orderNumber}
            </span>
          </p>

          <p className="mt-4 text-[14px] leading-[21px] text-[#6b7075]">
            Thanks{placedOrder.customer.firstName
              ? `, ${placedOrder.customer.firstName}`
              : ""}! Your {placedOrder.orderType === "delivery"
              ? "delivery"
              : "collection"}{" "}
            order of £{placedOrder.total.toFixed(2)} has been received. We
            will confirm it with the kitchen shortly.
          </p>

          {/* Wallet amount paid */}
          {walletApplied > 0 && (
            <p className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-[#eefaf2] px-4 py-2 text-[13px] font-bold text-[#178A4B]">
              <Wallet className="h-4 w-4" />
              £{walletApplied.toFixed(2)} paid from wallet
            </p>
          )}

          {/* Loyalty reward — orders above £50 earn 10 points */}
          {(placedOrder.walletAmountUsed ?? 0) >= 0 &&
            loyaltyEarned > 0 && (
              <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-[#eefaf2] px-4 py-2 text-[13px] font-bold text-[#178A4B]">
                <Star className="h-4 w-4" />
                You earned {loyaltyEarned} loyalty points
              </p>
            )}

          <Link
            href="/"
            className="mt-8 inline-flex h-[51px] items-center rounded-full bg-[#ff8500] px-8 text-[14px] font-bold text-white transition hover:bg-[#f58200]"
          >
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  const paymentLabel =
    method === "card"
      ? "Card Payment"
      : method === "wallet"
        ? `Paid via Wallet (£${walletApplied.toFixed(2)})`
        : orderType === "delivery"
          ? "Cash on Delivery"
          : "Cash on Collection";

  const fulfilmentLabel =
    orderType === "delivery"
      ? `Delivery to ${session?.delivery.street ?? "your address"}${
          session?.delivery.postcode ? `, ${session.delivery.postcode}` : ""
        }`
      : "Collection from restaurant";

  const handleCompleteOrder = () => {
    if (!cart || cart.length === 0) return;

    if (!confirmed) {
      setAgreeError(true);
      return;
    }

    const fallbackSession: CheckoutSession = {
      orderType,
      timing: "asap",
      scheduledDate: "",
      scheduledTime: "",
      tip: 0,
      cutlery: false,
      customer: { firstName: "", lastName: "", phone: "" },
      delivery: {
        street: "",
        floor: "",
        postcode: "",
        company: "",
        orderInstructions: "",
        deliveryNotes: "",
      },
    };

    const placed = placeOrder(
      session ?? fallbackSession,
      method ?? "cash",
      subtotal,
      total
    );

    // Debit the wallet for the amount the user chose to spend —
    // only once, at the moment the order is actually placed.
    const walletSpend = session?.walletAmountUsed ?? 0;
    if (walletSpend > 0 && readWallet().balance > 0) {
      addWalletFunds(
        Math.min(walletSpend, readWallet().balance),
        "payment",
        `Order ${placed.orderNumber}`
      );
    }

    // Persist to the account's order history (My Orders page).
    appendOrderToHistory({
      orderNumber: placed.orderNumber,
      placedAt: placed.placedAt,
      total: placed.total,
      itemCount: (cart ?? []).reduce((sum, l) => sum + l.quantity, 0),
      items: (cart ?? []).map((line) => ({
        name:
          selectionsSummary(line.item, line.selections).length > 0
            ? `${line.item.name} (${selectionsSummary(line.item, line.selections).join(" · ")})`
            : line.item.name,
        quantity: line.quantity,
        lineTotal: lineTotal(line),
      })),
      orderType: placed.orderType,
      paymentMethod:
        placed.paymentMethod === "card"
          ? "Card Payment"
          : placed.paymentMethod === "wallet"
            ? "Paid via Wallet"
            : placed.orderType === "delivery"
              ? "Cash on Delivery"
              : "Cash on Collection",
      status: "active" as OrderStatus,
      address:
        placed.orderType === "delivery"
          ? `${placed.delivery.street}, ${placed.delivery.postcode}`.replace(
              /^,\s*|,\s*$/g,
              ""
            )
          : undefined,
    });

    setPlacedOrder(placed);
    setConfirmed(true);

    // Reward: orders above £50 (pre-wallet, post-coupon value) earn 10 points.
    const earnedPoints = orderTotal > 50 ? 10 : 0;
    if (earnedPoints > 0) {
      addLoyaltyPoints(earnedPoints, `Order ${placed.orderNumber}`);
      setLoyaltyEarned(earnedPoints);
    }

    // Notify the account feed.
    pushNotification({
      kind: "order",
      title: "Order placed",
      body:
        `Order ${placed.orderNumber} received — we're getting it ready.` +
        (earnedPoints > 0 ? ` You earned ${earnedPoints} loyalty points.` : ""),
    });

    // The order is complete — the cart can go.
    clearStoredCart();
  };

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-16 pt-8 sm:px-6">
      <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)] sm:p-8">
        <h1 className="text-[22px] font-bold text-[#15181a]">
          Confirm your order
        </h1>

        {/* ---------- Meta rows ---------- */}
        <dl className="mt-6 flex flex-col divide-y divide-[#f0f0f0] text-[13px]">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="font-semibold uppercase tracking-[1.2px] text-[#9aa0a5]">
              Payment method
            </dt>
            <dd className="text-right font-bold text-[#15181a]">
              {paymentLabel}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="font-semibold uppercase tracking-[1.2px] text-[#9aa0a5]">
              {orderType === "delivery" ? "Delivery" : "Collection"}
            </dt>
            <dd className="max-w-[60%] text-right font-bold text-[#15181a]">
              {fulfilmentLabel}
            </dd>
          </div>
        </dl>

        {/* ---------- Items ---------- */}
        <ul className="flex flex-col divide-y divide-[#f0f0f0]">
          {(cart ?? []).map((line) => {
            const entry = catalog.get(line.item.id);
            const description = entry?.description ?? line.item.description;

            return (
              <li
                key={line.lineId}
                className="flex items-center gap-4 py-4"
              >
                <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#fdecd8]">
                  <SafeImage
                    src="/images/logo.png"
                    alt=""
                    width={30}
                    height={30}
                    className="object-contain opacity-80"
                    fallback={
                      <ShoppingBag className="h-4 w-4 text-[#c9a882]" />
                    }
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-[#15181a]">
                    {line.item.name}
                  </span>
                  {selectionsSummary(line.item, line.selections).length > 0 ? (
                    <span className="mt-0.5 block truncate text-[12px] text-[#9aa0a5]">
                      {selectionsSummary(line.item, line.selections).join(" · ")}
                    </span>
                  ) : (
                    description && (
                      <span className="mt-0.5 block truncate text-[12px] text-[#9aa0a5]">
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

        {/* ---------- Totals ---------- */}
        <dl className="mt-2 flex flex-col gap-2 border-t border-[#f0f0f0] pt-4 text-[13px] text-[#6b7075]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>£{subtotal.toFixed(2)}</dd>
          </div>

          <div className="flex justify-between">
            <dt>Service fee</dt>
            <dd>£{SERVICE_FEE.toFixed(2)}</dd>
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
            <dt>Bag charges</dt>
            <dd>£{bagCharges.toFixed(2)}</dd>
          </div>

          {(session?.tip ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt>Tip</dt>
              <dd>£{(session?.tip ?? 0).toFixed(2)}</dd>
            </div>
          )}

          {/* Cutlery preference */}
          <div className="flex justify-between">
            <dt>Cutlery</dt>
            <dd className={session?.cutlery ? "font-semibold text-[#15181a]" : ""}>
              {session?.cutlery ? "Yes please" : "No thanks"}
            </dd>
          </div>

          {/* Coupon discount */}
          {couponDiscount > 0 && session?.coupon && (
            <div className="flex justify-between text-[#178A4B]">
              <dt>Coupon ({session.coupon.code})</dt>
              <dd className="font-semibold">−£{couponDiscount.toFixed(2)}</dd>
            </div>
          )}

          {/* Wallet deduction */}
          {walletApplied > 0 && (
            <div className="flex justify-between text-[#178A4B]">
              <dt className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Paid with wallet
              </dt>
              <dd className="font-semibold">−£{walletApplied.toFixed(2)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex items-end justify-between border-t border-[#f0f0f0] pt-4">
          <span className="text-[17px] font-bold text-[#15181a]">Total</span>
          <span className="text-[24px] font-bold text-[#ff8500]">
            £{total.toFixed(2)}
          </span>
        </div>

        {/* ---------- Agreement ---------- */}
        <label
          className={`mt-6 flex cursor-pointer items-start gap-3 rounded-[12px] border bg-[#fdf1e3] p-4 transition ${
            agreeError ? "border-[#c0392b]" : "border-[#ffd9ac]"
          }`}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
              if (event.target.checked) setAgreeError(false);
            }}
            className="mt-[2px] h-[16px] w-[16px] shrink-0 cursor-pointer accent-[#ff8500]"
          />

          <span className="text-[13px] leading-[20px] text-[#3d4348]">
            I confirm that my order is correct and I agree to the{" "}
            <a href="#" className="font-bold text-[#ff8500] hover:underline">
              terms and conditions
            </a>
            .
          </span>
        </label>

        {/* ---------- Complete ---------- */}
        <button
          type="button"
          onClick={handleCompleteOrder}
          disabled={!cart || cart.length === 0}
          className="mt-4 h-[56px] w-full rounded-full bg-[#ff8500] text-[15px] font-bold text-white transition hover:bg-[#f58200] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Complete Order
        </button>
      </section>
    </main>
  );
}
