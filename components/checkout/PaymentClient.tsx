"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import OrderSummary from "./OrderSummary";
import {
  readCheckoutSession,
  saveSelectedPaymentMethod,
  BAG_CHARGE,
  SERVICE_FEE,
  deliveryFeeFor,
  type CheckoutSession,
  type OrderType,
  type PaymentMethod,
  type Timing,
} from "@/lib/checkout-session";
import { useStoredCart } from "@/lib/use-stored-cart";
import { buildCartCatalog, lineTotal } from "@/lib/cart";
import { readWallet } from "@/lib/account";
import { RadioDot, CheckBox } from "@/components/ui/OptionControls";
import type { SiteContent } from "@/lib/menu-data";
import type { DealItem, MenuCategory } from "@/types/menu";

interface PaymentClientProps {
  site: SiteContent;
  categories: MenuCategory[];
  deals: DealItem[];
}

/* =========================================================
   CARD INPUT HELPERS
========================================================= */

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function isValidExpiry(value: string): boolean {
  const match = value.match(/^(\d{2}) \/ (\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;

  const year = 2000 + Number(match[2]);
  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59);

  return expiry >= now;
}

export default function PaymentClient({
  site,
  categories,
  deals,
}: PaymentClientProps) {
  const router = useRouter();

  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );
  const cart = useStoredCart(catalog);

  const [session] = useState<CheckoutSession | null>(() =>
    readCheckoutSession()
  );

  const orderType: OrderType = session?.orderType ?? "collection";
  const timing: Timing = session?.timing ?? "asap";

  /** Wallet covers the entire order — nothing left to pay, so the payment
   *  page is skipped entirely (redirect rendered below, after the guards). */
  const walletCoversAll =
    !!session &&
    !!cart &&
    cart.length > 0 &&
    (session.walletAmountUsed ?? 0) >=
      Math.round(
        (cart.reduce((sum, line) => sum + lineTotal(line), 0) +
          deliveryFeeFor(
            orderType,
            Math.max(0, cart.reduce((sum, line) => sum + lineTotal(line), 0) - (session.coupon?.discount ?? 0))
          ) +
          SERVICE_FEE +
          BAG_CHARGE +
          (session.tip ?? 0) -
          (session.coupon?.discount ?? 0)) *
          100
        ) / 100;

  const [method, setMethod] = useState<PaymentMethod>("cash");

  /* Wallet-covers-all redirect — must run in an effect, not during render
     (React forbids router updates while rendering another component). */
  useEffect(() => {
    if (!walletCoversAll) return;
    saveSelectedPaymentMethod("wallet");
    router.replace("/checkout/confirmation");
  }, [walletCoversAll, router]);

  /* Card fields */
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (cart === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff8500] border-t-transparent"
          role="status"
          aria-label="Loading payment"
        />
      </div>
    );
  }

  const hasItems = cart.length > 0;

  const timingLabel =
    !session || timing === "asap"
      ? "17:00"
      : session.scheduledTime
        ? `${session.scheduledDate} · ${session.scheduledTime}`
        : session.scheduledDate;

  /* ---------------------------------------------------------
     Empty-cart / no-session guard
  --------------------------------------------------------- */
  if (!hasItems) {
    return (
      <main className="mx-auto max-w-[1160px] px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-bold text-[#15181a]">
          Your basket is empty
        </h1>
        <p className="mt-3 text-[15px] text-[#666]">
          Add some delicious items from the menu before checking out.
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
     Validation
  --------------------------------------------------------- */
  const cardNumberDigits = cardNumber.replace(/\D/g, "");
  const cardNumberInvalid = attempted && cardNumberDigits.length !== 16;
  const cardNameInvalid = attempted && !cardName.trim();
  const expiryInvalid = attempted && !isValidExpiry(expiry);
  const cvvInvalid = attempted && !/^\d{3,4}$/.test(cvv);

  const handleContinue = () => {
    // Cash on delivery — review then complete the order.
    reviewOrder();
  };

  const handleConfirmAndPay = () => {
    setAttempted(true);

    const cardValid =
      cardNumberDigits.length === 16 &&
      cardName.trim().length > 0 &&
      isValidExpiry(expiry) &&
      /^\d{3,4}$/.test(cvv);

    if (!cardValid) return;

    reviewOrder();
  };

  const reviewOrder = () => {
    setProcessing(true);

    // Remember the chosen method for the confirmation step.
    // The order itself is placed when the user confirms there.
    saveSelectedPaymentMethod(method);

    // Navigation first so the empty-cart guard below never
    // re-renders this page mid-transition.
    router.push("/checkout/confirmation");
  };

  const methodCard = (
    key: PaymentMethod,
    title: string,
    description: string
  ) => (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-[14px] border bg-white p-5 transition ${
        method === key
          ? "border-[#ff8500] bg-[#fdf1e3]"
          : "border-[#e5e5e5] hover:border-[#c9c9c9]"
      }`}
    >
      <input
        type="radio"
        name="payment-method"
        value={key}
        checked={method === key}
        onChange={() => setMethod(key)}
        aria-label={title}
        className="sr-only mt-1 shrink-0"
      />

      <RadioDot checked={method === key} />

      <span>
        <span className="block text-[15px] font-bold text-[#15181a]">
          {title}
        </span>
        <span className="mt-1 block text-[13px] text-[#6b7075]">
          {description}
        </span>
      </span>
    </label>
  );

  const cardField = (
    id: string,
    label: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    invalid: boolean,
    extra?: {
      type?: string;
      inputMode?: React.HTMLAttributes<HTMLElement>["inputMode"];
      autoComplete?: string;
      maxLength?: number;
    }
  ) => (
    <div
      className={`relative rounded-[10px] bg-[#f5f5f5] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ff8500]/60 ${
        invalid ? "ring-1 ring-[#c0392b]" : ""
      }`}
    >
      <label
        htmlFor={id}
        className="absolute left-[16px] top-[9px] z-10 text-[11px] font-medium text-[#9aa0a5]"
      >
        {label} <span className="text-[#3d4348]">*</span>
      </label>
      <input
        id={id}
        type={extra?.type ?? "text"}
        inputMode={extra?.inputMode}
        autoComplete={extra?.autoComplete}
        maxLength={extra?.maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[56px] w-full rounded-[10px] border-0 bg-transparent px-[16px] pb-[6px] pt-[20px] text-[14px] text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
      />
    </div>
  );

  return (
    <main className="mx-auto max-w-[1160px] px-4 pb-16 pt-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        {/* ============================================================
            LEFT COLUMN
        ============================================================ */}
        <div>
          <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)] sm:p-8">
            <h1 className="text-[22px] font-bold text-[#15181a]">
              Choose payment method
            </h1>

            <div className="mt-6 flex flex-col gap-3">
              {methodCard(
                "cash",
                orderType === "delivery" ? "Cash on Delivery" : "Cash on Collection",
                orderType === "delivery"
                  ? "Pay with cash when your order arrives."
                  : "Pay with cash when you collect your order."
              )}

              {methodCard(
                "card",
                "Card Payment",
                "Pay securely using your card."
              )}
            </div>

            {/* ---------- Card form ---------- */}
            {method === "card" && (
              <div className="mt-6">
                <p className="flex items-center gap-2 text-[14px] font-bold text-[#15181a]">
                  <Lock className="h-[15px] w-[15px]" />
                  Secure card payment
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  {cardField(
                    "card-number",
                    "Card Number",
                    "1234 5678 9012 3456",
                    cardNumber,
                    (value) => setCardNumber(formatCardNumber(value)),
                    cardNumberInvalid,
                    {
                      inputMode: "numeric",
                      autoComplete: "cc-number",
                      maxLength: 19,
                    }
                  )}

                  {cardField(
                    "card-name",
                    "Name on Card",
                    "Full name as it appears on the card",
                    cardName,
                    setCardName,
                    cardNameInvalid,
                    { autoComplete: "cc-name" }
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cardField(
                      "card-expiry",
                      "Expiry Date",
                      "MM / YY",
                      expiry,
                      (value) => setExpiry(formatExpiry(value)),
                      expiryInvalid,
                      {
                        inputMode: "numeric",
                        autoComplete: "cc-exp",
                        maxLength: 7,
                      }
                    )}

                    {cardField(
                      "card-cvv",
                      "CVV",
                      "123",
                      cvv,
                      (value) => setCvv(value.replace(/\D/g, "").slice(0, 4)),
                      cvvInvalid,
                      {
                        inputMode: "numeric",
                        autoComplete: "cc-csc",
                        maxLength: 4,
                      }
                    )}
                  </div>
                </div>

                {/* Save card */}
                <label className="mt-4 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(event) => setSaveCard(event.target.checked)}
                    className="sr-only"
                  />
                  <CheckBox checked={saveCard} />
                  <span className="text-[13px] text-[#3d4348]">
                    Save card for future payments
                  </span>
                </label>
              </div>
            )}

            {/* ---------- CTA ---------- */}
            <button
              type="button"
              onClick={method === "cash" ? handleContinue : handleConfirmAndPay}
              disabled={processing}
              className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#ff8500] text-[15px] font-bold text-white transition hover:bg-[#f58200] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  Processing…
                </>
              ) : method === "cash" ? (
                "Continue"
              ) : (
                "Confirm and Pay"
              )}
            </button>

            <p className="mt-4 text-center text-[12px] text-[#6b7075]">
              By placing this order you agree to our{" "}
              <a href="#" className="font-semibold underline">
                terms and conditions
              </a>
              .
            </p>
          </section>
        </div>

        {/* ============================================================
            RIGHT COLUMN — Order Summary
        ============================================================ */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <OrderSummary
            site={site}
            cart={cart}
            catalog={catalog}
            orderType={orderType}
            timingLabel={timingLabel}
            tip={session?.tip ?? 0}
            showCoupon={false}
            showTipEditor={false}
            cutlery={session?.cutlery ?? false}
            coupon={session?.coupon ?? null}
            walletBalance={readWallet().balance}
            walletAmountUsed={session?.walletAmountUsed ?? 0}
            onTipChange={() => {
              // Tip is fixed after checkout — intentionally read-only here.
            }}
          />
        </aside>
      </div>
    </main>
  );
}
