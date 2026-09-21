"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  Home,
  MapPin,
} from "lucide-react";
import OrderSummary from "./OrderSummary";
import UpdateInfoModal from "./UpdateInfoModal";
import { ThemedDatePicker, ThemedTimePicker } from "./SchedulePickers";
import {
  BAG_CHARGE,
  MIN_ORDER_TOTAL,
  NOTE_MAX_LENGTH,
  SERVICE_FEE,
  deliveryFeeFor,
  isValidUKPhone,
  readCheckoutSession,
  saveCheckoutSession,
  type AppliedCoupon,
  type CheckoutSession,
  type OrderType,
  type Timing,
} from "@/lib/checkout-session";
import { useStoredCart } from "@/lib/use-stored-cart";
import { validateUKPostcode } from "@/lib/delivery";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
  userDisplayName,
} from "@/lib/auth";
import {
  readSavedAddresses,
  readWallet,
  type SavedAddress,
  type WalletState,
} from "@/lib/account";
import { buildCartCatalog, lineTotal } from "@/lib/cart";
import type { SiteContent } from "@/lib/menu-data";
import type { DealItem, MenuCategory } from "@/types/menu";

interface CheckoutClientProps {
  site: SiteContent;
  categories: MenuCategory[];
  deals: DealItem[];
}

/** Local (not UTC) today as yyyy-mm-dd for the date input. */
function getTodayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
}

export default function CheckoutClient({
  site,
  categories,
  deals,
}: CheckoutClientProps) {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );
  const cart = useStoredCart(catalog);

  /* ---------------------------------------------------------
     Your information — display-only, edits happen on My Profile
  --------------------------------------------------------- */
  const userFirstName = user ? userDisplayName(user).split(" ")[0] : "";
  const userLastName = user?.lastName ?? "";
  const userEmail = user?.email ?? "";
  const userPhone = user?.phone ?? "";

  /* ---------------------------------------------------------
     Order placement
  --------------------------------------------------------- */
  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      const session = readCheckoutSession();
      return session?.orderType ?? "collection";
    } catch { return "collection"; }
  });
  const [timing, setTiming] = useState<Timing>("asap");
  const [scheduledDate, setScheduledDate] = useState(getTodayIso);
  const [scheduledTime, setScheduledTime] = useState("");

  /* Delivery address — kept when switching order type back and forth */
  const [street, setStreet] = useState("");
  const [floor, setFloor] = useState("");
  const [postcode, setPostcode] = useState("");
  const [company, setCompany] = useState("");
  const [orderInstructions, setOrderInstructions] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryAttempted, setDeliveryAttempted] = useState(false);

  const [tip, setTip] = useState(0);
  const [cutlery, setCutlery] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null
  );
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [walletAmountUsed, setWalletAmountUsed] = useState(0);
  const [phoneError, setPhoneError] = useState(false);
  const [scheduleError, setScheduleError] = useState(false);
  const [postcodeFormatError, setPostcodeFormatError] = useState(false);

  /* ---------------------------------------------------------
     Saved delivery addresses (hydrated from the account page)
  --------------------------------------------------------- */
  const [savedAddresses, setSavedAddresses] = useState<
    SavedAddress[] | null
  >(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    const addresses = readSavedAddresses();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration
    setSavedAddresses(addresses);
    if (addresses.length === 0) setManualEntry(true);
  }, []);

  /* Wallet balance hydration (one-time) */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration
    setWallet(readWallet());
  }, []);

  /* Listen for postcode check from the site header bar and pre-fill delivery postcode. */
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { postcode?: string } | undefined;
      if (detail?.postcode) {
        setPostcode(detail.postcode);
      }
    };
    window.addEventListener("porto:delivery-check", handler);
    return () => window.removeEventListener("porto:delivery-check", handler);
  }, []);

  if (cart === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff8500] border-t-transparent"
          role="status"
          aria-label="Loading checkout"
        />
      </div>
    );
  }

  const subtotal = cart.reduce(
    (sum, line) => sum + lineTotal(line),
    0
  );

  const bagCharges = BAG_CHARGE;
  /** Mirror of OrderSummary's math (pennies-rounded): delivery + coupon + wallet included. */
  const deliveryFee = deliveryFeeFor(orderType, Math.max(0, subtotal - (appliedCoupon?.discount ?? 0)));
  const orderTotal = Math.round(
    (subtotal + deliveryFee + SERVICE_FEE + bagCharges + tip - (appliedCoupon?.discount ?? 0)) * 100
  ) / 100;
  const walletApplied = Math.min(walletAmountUsed, orderTotal, wallet?.balance ?? 0);
  const total = Math.round((orderTotal - walletApplied) * 100) / 100;

  const hasItems = cart.length > 0;

  const streetInvalid = deliveryAttempted && !street.trim();
  const floorInvalid = deliveryAttempted && !floor.trim();
  const postcodeInvalid = deliveryAttempted && !postcode.trim();

  /** Fills the delivery form from a saved address card selection. */
  const applySavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setManualEntry(false);
    setDeliveryAttempted(false);
    setStreet(address.address || address.road);
    setFloor(address.floor);
    setPostcode(address.postcode ?? "");
  };

  /** Switches to the free-typing form, clearing any applied saved address. */
  const startManualEntry = () => {
    setSelectedAddressId(null);
    setManualEntry(true);
    setDeliveryAttempted(false);

    // Clear fields only when they hold a previously applied saved address —
    // text the user typed manually is never wiped.
    if (selectedAddressId) {
      setStreet("");
      setFloor("");
      setPostcode("");
      setCompany("");
    }
  };

  const buildSession = (): CheckoutSession => ({
    orderType,
    timing,
    scheduledDate,
    scheduledTime,
    tip,
    cutlery,
    coupon: appliedCoupon ?? undefined,
    walletAmountUsed: walletAmountUsed > 0 ? walletAmountUsed : undefined,
    customer: {
      firstName: userFirstName,
      lastName: userLastName,
      phone: userPhone,
    },
    delivery: {
      street,
      floor,
      postcode,
      company,
      orderInstructions,
      deliveryNotes,
    },
  });

  /* ---------- Checkout gates ----------
     - Phone must be a valid UK number in +44 format.
     - Discounted basket must reach the £10 minimum. */
  const phoneInvalid = !isValidUKPhone(userPhone);
  const couponDiscountLocal = appliedCoupon?.discount ?? 0;
  const basketValue = Math.max(0, subtotal - couponDiscountLocal);
  const belowMinOrder = basketValue < MIN_ORDER_TOTAL;

  const proceedToPayment = () => {
    if (!hasItems) return;

    if (phoneInvalid) {
      setPhoneError(true);
      return;
    }

    if (
      orderType === "delivery" &&
      (!street.trim() || !floor.trim() || !postcode.trim())
    ) {
      setDeliveryAttempted(true);
      return;
    }

    // UK postcode shape check for delivery orders.
    if (orderType === "delivery" && postcode.trim() && !validateUKPostcode(postcode).valid) {
      setDeliveryAttempted(true);
      setPostcodeFormatError(true);
      return;
    }

    // Schedule-for-later: both date and time must be picked.
    if (timing === "scheduled" && (!scheduledDate.trim() || !scheduledTime.trim())) {
      setScheduleError(true);
      return;
    }

    setScheduleError(false);
    saveCheckoutSession(buildSession());

    // Payment step comes next.
    router.push("/checkout/payment");
  };

  /* ---------------------------------------------------------
     Empty-cart guard
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

  const renderReadOnlyField = (label: string, value: string) => (
    <div className="relative">
      <span className="absolute left-[14px] top-[8px] text-[11px] font-medium text-[#9aa0a5]">
        {label}
      </span>
      <div className="h-[52px] w-full rounded-[10px] bg-[#f5f5f5] px-[14px] pt-[26px] pb-[5px] text-[14px] font-medium text-[#15181a]">
        {value || "—"}
      </div>
    </div>
  );

  const timingLabel =
    timing === "asap"
      ? "17:00"
      : scheduledTime
        ? `${scheduledDate} · ${scheduledTime}`
        : scheduledDate;

  return (
    <main className="mx-auto max-w-[1160px] px-4 pb-16 pt-8 sm:px-6">
      {/* Back to the menu — top-left of the content */}
      <Link
        href="/"
        aria-label="Back to home — continue browsing the menu"
        className="mb-5 inline-flex h-[38px] items-center gap-1.5 rounded-full border border-[#d8d0c5] bg-white px-3.5 text-[13px] font-semibold text-[#15181a] transition hover:bg-orange hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        {/* ============================================================
            LEFT COLUMN
        ============================================================ */}
        <div className="flex flex-col gap-6">
          {/* ---------- Items card ---------- */}
          <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <ul className="divide-y divide-[#f0f0f0]">
              {cart.map((line) => {
                const entry = catalog.get(line.item.id);
                const description = entry?.description ?? line.item.description;

                return (
                  <li
                    key={line.lineId}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <p className="text-[14px] text-[#3d4348]">
                      <span className="font-medium">{line.item.name}</span>
                      {description && (
                        <span className="text-[#9aa0a5]">
                          {" "}
                          - {description}
                        </span>
                      )}{" "}
                      <span className="text-[#6b7075]">
                        × {line.quantity}
                      </span>
                    </p>
                    <span className="shrink-0 text-[14px] font-semibold text-[#15181a]">
                      £{lineTotal(line).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-[#ececec] pt-4">
              <span className="text-[17px] font-bold text-[#15181a]">
                Total
              </span>
              <span className="text-[19px] font-bold text-[#15181a]">
                £{subtotal.toFixed(2)}
              </span>
            </div>
          </section>

          {/* ---------- Your Information (read-only; edit via the modal) ---------- */}
          <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#15181a]">
                Your Information
              </h2>

              <button
                type="button"
                onClick={() => setInfoModalOpen(true)}
                className="flex h-[38px] items-center rounded-full border border-[#ff8500] px-5 text-[13px] font-semibold text-[#ff8500] transition hover:bg-[#fff4e8]"
              >
                Update
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {renderReadOnlyField("First Name", userFirstName)}
              {renderReadOnlyField("Last Name", userLastName)}
            </div>

            <div className="mt-3">
              <div className={phoneError && phoneInvalid ? "rounded-[10px] ring-2 ring-[#e5484d]/50" : ""}>
                {renderReadOnlyField("Phone Number", userPhone)}
              </div>

              {phoneError && phoneInvalid && (
                <p className="mt-2 text-[12px] font-semibold text-[#e5484d]">
                  Enter a valid UK mobile number starting with +447 (e.g. +447911123456) — update it via the button above.
                </p>
              )}
            </div>

            {userEmail && (
              <p className="mt-3 text-[13px] text-[#9aa0a5]">{userEmail}</p>
            )}

            {!user && (
              <p className="mt-4 text-[13px] text-[#9aa0a5]">
                Not signed in —{" "}
                <Link
                  href="/account"
                  className="font-semibold text-[#ff8500] hover:underline"
                >
                  sign in
                </Link>{" "}
                to autofill your details.
              </p>
            )}
          </section>

          {/* ---------- Order type ---------- */}
          <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <h2 className="text-[20px] font-bold text-[#15181a]">Order type</h2>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { key: "delivery", label: "Delivery", icon: Bike },
                  { key: "collection", label: "Collection", icon: Home },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOrderType(key)}
                  aria-pressed={orderType === key}
                  className="btn-option h-[54px] w-full text-[14px]"
                >
                  <Icon className="h-[17px] w-[17px]" />
                  {label}
                </button>
              ))}
            </div>

            {/* Collection address block */}
            {orderType === "collection" && (
              <div className="mt-5 rounded-[10px] bg-[#f5f5f5] p-5">
                <p className="text-[15px] font-bold text-[#15181a]">
                  Collection address
                </p>
                <p className="mt-2 text-[14px] text-[#3d4348]">
                  {site.storeInfo.address}
                </p>
                <p className="mt-2 text-[13px] text-[#9aa0a5]">
                  Please bring your order confirmation when collecting.
                </p>
              </div>
            )}

            {/* Delivery: saved addresses + manual entry */}
            {orderType === "delivery" && (
              <div className="mt-5 flex flex-col gap-3">
                {deliveryAttempted && (streetInvalid || floorInvalid || postcodeInvalid) && (
                  <p className="rounded-[10px] border border-[#f3c8c8] bg-[#fdf4f4] px-4 py-3 text-[13px] font-semibold text-[#e5484d]">
                    Please fill in the highlighted address fields — street,
                    floor and postcode are all required for delivery.
                  </p>
                )}

                {postcodeFormatError && postcode.trim() && !validateUKPostcode(postcode).valid && (
                  <p className="rounded-[10px] border border-[#f3c8c8] bg-[#fdf4f4] px-4 py-3 text-[13px] font-semibold text-[#e5484d]">
                    Enter a valid UK postcode (e.g. G41 3YN).
                  </p>
                )}

                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[14px] font-bold text-[#15181a]">
                      Saved addresses
                    </p>

                    {savedAddresses.map((address) => {
                      const active = selectedAddressId === address.id && !manualEntry;
                      const detailLines = [
                        address.house,
                        address.floor,
                        address.address || address.road,
                        address.postcode,
                      ].filter(Boolean);

                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          aria-pressed={active}
                          className={`flex items-start gap-3 rounded-[10px] p-4 text-left transition ${
                            active
                              ? "bg-[#fff4e8] ring-1 ring-[#ff8500]"
                              : "bg-[#f5f5f5] hover:bg-[#efefef]"
                          }`}
                        >
                          <MapPin
                            className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                              active ? "text-[#ff8500]" : "text-[#6b7075]"
                            }`}
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-bold capitalize text-[#15181a]">
                              {address.type}
                              {address.contactName
                                ? ` · ${address.contactName}`
                                : ""}
                            </span>
                            <span className="mt-0.5 block text-[13px] leading-[18px] text-[#3d4348]">
                              {detailLines.join(", ")}
                            </span>
                          </span>

                          <span
                            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "border-[#ff8500] bg-[#ff8500]"
                                : "border-[#c9c9c9] bg-white"
                            }`}
                          >
                            {active && (
                              <span className="h-[7px] w-[7px] rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={startManualEntry}
                      aria-pressed={manualEntry}
                      className={`h-[44px] rounded-[10px] text-[13px] font-semibold transition ${
                        manualEntry
                          ? "bg-[#15181a] text-white"
                          : "bg-[#f5f5f5] text-[#15181a] hover:bg-[#efefef]"
                      }`}
                    >
                      + Enter address manually
                    </button>
                  </div>
                )}
                {/* Street */}
                <div
                  className={`rounded-[10px] bg-[#f5f5f5] px-[14px] pb-[10px] pt-[8px] ${
                    streetInvalid ? "ring-1 ring-[#c0392b]" : ""
                  }`}
                >
                  <label
                    htmlFor="street-address"
                    className="block text-[11px] font-medium text-[#9aa0a5]"
                  >
                    Street name and number <span className="text-[#3d4348]">*</span>
                  </label>
                  <input
                    id="street-address"
                    type="text"
                    value={street}
                    onChange={(event) => setStreet(event.target.value)}
                    placeholder="261 Kilmarnock Road"
                    className="h-[30px] w-full border-0 bg-transparent text-[14px] text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
                  />
                </div>

                {/* Floor + Postcode */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-[10px] bg-[#f5f5f5] px-[14px] pb-[10px] pt-[8px] ${
                      floorInvalid ? "ring-1 ring-[#c0392b]" : ""
                    }`}
                  >
                    <label
                      htmlFor="floor-apartment"
                      className="block text-[11px] font-medium text-[#9aa0a5]"
                    >
                      Floor / apartment number{" "}
                      <span className="text-[#3d4348]">*</span>
                    </label>
                    <input
                      id="floor-apartment"
                      type="text"
                      value={floor}
                      onChange={(event) => setFloor(event.target.value)}
                      placeholder="Floor 2, Flat 4B"
                      className="h-[30px] w-full border-0 bg-transparent text-[14px] text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
                    />
                  </div>

                  <div
                    className={`rounded-[10px] bg-[#f5f5f5] px-[14px] pb-[10px] pt-[8px] ${
                      postcodeInvalid ? "ring-1 ring-[#c0392b]" : ""
                    }`}
                  >
                    <label
                      htmlFor="postcode"
                      className="block text-[11px] font-medium text-[#9aa0a5]"
                    >
                      Postcode <span className="text-[#3d4348]">*</span>
                    </label>
                    <input
                      id="postcode"
                      type="text"
                      value={postcode}
                      onChange={(event) => {
                        setPostcode(event.target.value);
                        setPostcodeFormatError(false);
                      }}
                      placeholder="G41 3YN"
                      className="h-[30px] w-full border-0 bg-transparent text-[14px] font-semibold uppercase text-[#15181a] outline-none placeholder:font-normal placeholder:text-[#c9c9c9]"
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="rounded-[10px] bg-[#f5f5f5] px-[14px] pb-[10px] pt-[8px]">
                  <label
                    htmlFor="company-name"
                    className="block text-[11px] font-medium text-[#9aa0a5]"
                  >
                    Company name
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Company Ltd"
                    className="h-[30px] w-full border-0 bg-transparent text-[14px] text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
                  />
                </div>

                {/* Order instructions */}
                <div className="rounded-[10px] bg-[#f5f5f5] px-[14px] pb-[8px] pt-[8px]">
                  <label
                    htmlFor="order-instructions"
                    className="block text-[11px] font-medium text-[#9aa0a5]"
                  >
                    Order instructions
                  </label>
                  <textarea
                    id="order-instructions"
                    value={orderInstructions}
                    maxLength={NOTE_MAX_LENGTH}
                    onChange={(event) =>
                      setOrderInstructions(event.target.value)
                    }
                    placeholder="eg. Entrance through large dark gate..."
                    rows={3}
                    className="w-full resize-none border-0 bg-transparent pt-1 text-[14px] text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
                  />
                  <p className="text-right text-[11px] text-[#c9c9c9]">
                    {orderInstructions.length} / {NOTE_MAX_LENGTH}
                  </p>
                </div>

                {/* Delivery notes */}
                <div className="rounded-[10px] bg-[#f5f5f5] px-[14px] pb-[8px] pt-[8px]">
                  <label
                    htmlFor="delivery-notes"
                    className="block text-[11px] font-medium text-[#9aa0a5]"
                  >
                    Delivery notes
                  </label>
                  <textarea
                    id="delivery-notes"
                    value={deliveryNotes}
                    maxLength={NOTE_MAX_LENGTH}
                    onChange={(event) =>
                      setDeliveryNotes(event.target.value)
                    }
                    placeholder="Any additional notes for the delivery driver..."
                    rows={3}
                    className="w-full resize-none border-0 bg-transparent pt-1 text-[14px] text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
                  />
                  <p className="text-right text-[11px] text-[#c9c9c9]">
                    {deliveryNotes.length} / {NOTE_MAX_LENGTH}
                  </p>
                </div>
              </div>
            )}

          </section>

          {/* ---------- When ---------- */}
          <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <h2 className="text-[20px] font-bold text-[#15181a]">When</h2>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setTiming("asap"); setScheduleError(false); }}
                aria-pressed={timing === "asap"}
                className="btn-option h-[54px] rounded-[10px] text-[14px] font-bold uppercase tracking-[1px]"
              >
                ASAP
              </button>

              <button
                type="button"
                onClick={() => setTiming("scheduled")}
                aria-pressed={timing === "scheduled"}
                className="btn-option h-[54px] rounded-[10px] text-[14px]"
              >
                Schedule for later
              </button>
            </div>

            {timing === "asap" ? (
              <p className="mt-4 text-[13px] text-[#9aa0a5]">
                Opens at 17:00. You can still schedule a future order.
              </p>
            ) : (
              <>
                <p className="mt-4 text-[13px] text-[#9aa0a5]">
                  Opens at 17:00. You can still schedule a future order.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Date — themed calendar */}
                  <ThemedDatePicker
                    label="Date"
                    value={scheduledDate}
                    min={getTodayIso()}
                    error={scheduleError && !scheduledDate.trim()}
                    onChange={setScheduledDate}
                  />

                  {/* Time — themed slot picker */}
                  <ThemedTimePicker
                    label="Time"
                    value={scheduledTime}
                    min="17:00"
                    error={scheduleError && !scheduledTime.trim()}
                    onChange={setScheduledTime}
                  />
                </div>

                {scheduleError && (!scheduledDate.trim() || !scheduledTime.trim()) && (
                  <p className="mt-3 rounded-[10px] bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-[#c0392b]">
                    Please select both a date and time to schedule your order.
                  </p>
                )}
              </>
            )}
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
            tip={tip}
            onTipChange={setTip}
            cutlery={cutlery}
            coupon={appliedCoupon}
            onCouponApplied={setAppliedCoupon}
            showWallet={!!user}
            walletBalance={wallet?.balance ?? 0}
            walletAmountUsed={walletAmountUsed}
            onWalletAmountChange={setWalletAmountUsed}
            onCouponRemoved={() => setAppliedCoupon(null)}
          />

          {/* Cutlery */}
          <div className="mt-4 flex items-center justify-between rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div>
              <p className="text-[14px] font-semibold text-[#15181a]">
                Cutlery
              </p>
              <p className="mt-0.5 text-[12px] text-[#9aa0a5]">
                Would you like cutlery with your order?
              </p>
            </div>

            <div className="flex rounded-full bg-[#f0f0f0] p-[3px]">
              <button
                type="button"
                onClick={() => setCutlery(false)}
                aria-pressed={!cutlery}
                className={`h-[30px] rounded-full px-4 text-[12px] font-semibold transition ${
                  !cutlery ? "bg-[#ff8500] text-white" : "text-[#6b7075]"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setCutlery(true)}
                aria-pressed={cutlery}
                className={`h-[30px] rounded-full px-4 text-[12px] font-semibold transition ${
                  cutlery ? "bg-[#ff8500] text-white" : "text-[#6b7075]"
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* CTA — blocked while below the minimum order */}
          {belowMinOrder ? (
            <button
              type="button"
              disabled
              className="mt-4 flex h-[56px] w-full cursor-not-allowed items-center justify-between rounded-full bg-[#c9c9c9] px-7 text-[15px] font-bold text-white"
            >
              Minimum order £{MIN_ORDER_TOTAL.toFixed(2)}
              <span>£{(MIN_ORDER_TOTAL - basketValue).toFixed(2)} to go</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={proceedToPayment}
              className="mt-4 flex h-[56px] w-full items-center justify-between rounded-full bg-[#131313] px-7 text-[15px] font-bold text-white transition hover:bg-black"
            >
              Proceed to payment
              {/* Fully wallet-paid (or zero) — no amount left to show */}
              {total > 0 && <span>£{total.toFixed(2)}</span>}
            </button>
          )}
        </aside>
      </div>

      {infoModalOpen && (
        <UpdateInfoModal
          initialFirstName={userFirstName}
          initialLastName={userLastName}
          initialPhone={userPhone}
          onClose={() => setInfoModalOpen(false)}
        />
      )}
    </main>
  );
}
