import { clearStoredUser } from "./auth";

export const ORDERS_STORAGE_KEY = "porto-piri-orders-v1";
export const ADDRESSES_STORAGE_KEY = "porto-piri-addresses-v1";
export const NOTIFICATIONS_STORAGE_KEY = "porto-piri-notifications-v1";
export const WALLET_STORAGE_KEY = "porto-piri-wallet-v1";
export const LOYALTY_STORAGE_KEY = "porto-piri-loyalty-v1";
export const COUPONS_STORAGE_KEY = "porto-piri-coupons-v1";
export const REFERRAL_STORAGE_KEY = "porto-piri-referral-v1";

/* =========================================================
   SAVED ADDRESSES
========================================================= */

export type AddressType = "home" | "work" | "other";

export interface SavedAddress {
  id: string;
  type: AddressType;
  contactName: string;
  contactPhone: string;
  /** Full address text (main line from the textarea). */
  address: string;
  house: string;
  floor: string;
  road: string;
  postcode?: string;
}

/**
 * Normalizes a stored entry, migrating the pre-2026-09 shape
 * ({ label, street, floor, postcode, company }) to the current one.
 */
function normalizeSavedAddress(entry: unknown): SavedAddress | null {
  if (!entry || typeof entry !== "object") return null;

  const record = entry as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id) return null;

  const legacyStreet =
    typeof record.street === "string" ? record.street : "";
  const road = typeof record.road === "string" ? record.road : legacyStreet;
  const company = typeof record.company === "string" ? record.company : "";
  const address = typeof record.address === "string" ? record.address : company;

  if (!address && !road) return null;

  const type: AddressType =
    record.type === "work" || record.type === "other"
      ? record.type
      : "home";

  return {
    id: record.id,
    type,
    contactName:
      typeof record.contactName === "string" ? record.contactName : "",
    contactPhone:
      typeof record.contactPhone === "string" ? record.contactPhone : "",
    address,
    house: typeof record.house === "string" ? record.house : "",
    floor: typeof record.floor === "string" ? record.floor : "",
    road,
    postcode:
      typeof record.postcode === "string" ? record.postcode : undefined,
  };
}

export function readSavedAddresses(): SavedAddress[] {
  try {
    const raw = window.localStorage.getItem(ADDRESSES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeSavedAddress)
      .filter((entry): entry is SavedAddress => entry !== null);
  } catch {
    return [];
  }
}

export function writeSavedAddresses(addresses: SavedAddress[]): void {
  window.localStorage.setItem(
    ADDRESSES_STORAGE_KEY,
    JSON.stringify(addresses)
  );
}

/* =========================================================
   ORDER HISTORY
========================================================= */

export type OrderStatus = "active" | "delivered" | "cancelled";

export interface OrderHistoryEntry {
  orderNumber: string;
  placedAt: string;
  total: number;
  itemCount: number;
  items: { name: string; quantity: number; lineTotal: number }[];
  orderType: string;
  paymentMethod: string;
  address?: string;
  /** New orders start "active"; entries saved before this field existed are treated as "active". */
  status?: OrderStatus;
  /** Tracking progress 0–3: 0 = confirmed, 1 = preparing, 2 = out for delivery / ready, 3 = delivered.
   *  Derived from `status` when absent (active → 0, delivered → 3). */
  trackingStep?: number;
}

export function readOrderHistory(): OrderHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is OrderHistoryEntry =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as OrderHistoryEntry).orderNumber === "string"
    );
  } catch {
    return [];
  }
}

function writeOrderHistory(orders: OrderHistoryEntry[]): void {
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

/** Prepends an order, keeping the history capped at 50 entries. */
export function appendOrderToHistory(entry: OrderHistoryEntry): void {
  const orders = [entry, ...readOrderHistory()].slice(0, 50);
  writeOrderHistory(orders);
}

/** Moves an order between active / delivered / cancelled. */
export function setOrderStatus(
  orderNumber: string,
  status: OrderStatus
): void {
  const orders = readOrderHistory().map((order) =>
    order.orderNumber === orderNumber
      ? {
          ...order,
          status,
          // Keep tracking in sync: cancelled rewinds, delivered completes.
          trackingStep:
            status === "delivered" ? 3 : status === "cancelled" ? 0 : (order.trackingStep ?? 0),
        }
      : order
  );

  writeOrderHistory(orders);

  // Push a matching notification so the feed reflects order events.
  if (status === "delivered") {
    pushNotification({
      kind: "order",
      title: "Order delivered",
      body: `Order ${orderNumber} has been delivered. Enjoy!`,
    });
  } else if (status === "cancelled") {
    pushNotification({
      kind: "order",
      title: "Order cancelled",
      body: `Order ${orderNumber} was cancelled. Any wallet payment will be refunded.`,
    });
  }
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export type NotificationKind = "order" | "promo" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export function readNotifications(): AppNotification[] {
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is AppNotification =>
        !!entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.title === "string"
    );
  } catch {
    return [];
  }
}

export function unreadNotificationCount(): number {
  return readNotifications().filter((entry) => !entry.read).length;
}

/** Prepends a notification; keeps the feed capped at 50. */
export function pushNotification(
  notification: Omit<AppNotification, "id" | "at" | "read">
): AppNotification {
  const full: AppNotification = {
    ...notification,
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    read: false,
  };

  const feed = [full, ...readNotifications()].slice(0, 50);
  window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(feed));

  // Raise a matching toast so the user sees the notification live.
  // Imported lazily as a module-level function call — the toast module
  // only touches the DOM through a window event, safe outside React.
  import("@/components/ui/ToastProvider").then(({ emitToast }) => {
    emitToast({
      kind: notification.kind === "promo" ? "promo" : notification.kind === "order" ? "order" : "info",
      title: notification.title,
      body: notification.body,
    });
  });

  return full;
}

export function markAllNotificationsRead(): void {
  window.localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(
      readNotifications().map((entry) => ({ ...entry, read: true }))
    )
  );
}

export function clearNotifications(): void {
  window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
}

/* =========================================================
   WALLET
========================================================= */

export type WalletTransactionKind = "topup" | "payment" | "refund";

export interface WalletTransaction {
  id: string;
  kind: WalletTransactionKind;
  /** Positive amount in pounds; direction comes from `kind`. */
  amount: number;
  /** ISO timestamp. */
  at: string;
  note?: string;
}

export interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
}

export function readWallet(): WalletState {
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return { balance: 0, transactions: [] };

    const parsed = JSON.parse(raw) as Partial<WalletState>;

    return {
      balance:
        typeof parsed.balance === "number" && parsed.balance >= 0
          ? parsed.balance
          : 0,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions.filter(
            (entry): entry is WalletTransaction =>
              !!entry &&
              typeof entry === "object" &&
              typeof entry.id === "string" &&
              typeof entry.amount === "number" &&
              typeof entry.at === "string"
          )
        : [],
    };
  } catch {
    return { balance: 0, transactions: [] };
  }
}

function writeWallet(state: WalletState): void {
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Adds funds to the wallet. `topUp` records a "topup" transaction;
 * other kinds (refund/payment) adjust the balance accordingly.
 */
export function addWalletFunds(
  amount: number,
  kind: WalletTransactionKind = "topup",
  note?: string
): WalletState {
  const wallet = readWallet();

  const delta =
    kind === "payment" ? -Math.abs(amount) : Math.abs(amount);

  const next: WalletState = {
    balance: Math.max(0, Math.round((wallet.balance + delta) * 100) / 100),
    transactions: [
      {
        id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind,
        amount: Math.abs(amount),
        at: new Date().toISOString(),
        note,
      },
      ...wallet.transactions,
    ].slice(0, 100),
  };

  writeWallet(next);

  // Notify the account feed about wallet movements.
  if (kind === "payment") {
    pushNotification({
      kind: "system",
      title: "Wallet payment",
      body: `£${Math.abs(amount).toFixed(2)} was paid from your wallet${note ? ` — ${note}` : ""}.`,
    });
  } else if (kind === "refund") {
    pushNotification({
      kind: "system",
      title: "Wallet refunded",
      body: `£${Math.abs(amount).toFixed(2)} has been added back to your wallet${note ? ` — ${note}` : ""}.`,
    });
  } else {
    pushNotification({
      kind: "system",
      title: "Wallet topped up",
      body: `£${Math.abs(amount).toFixed(2)} was added to your wallet${note ? ` — ${note}` : ""}. New balance: £${next.balance.toFixed(2)}.`,
    });
  }

  return next;
}

/* =========================================================
   LOYALTY POINTS
========================================================= */

export interface LoyaltyState {
  points: number;
  history: { id: string; kind: "earn" | "redeem"; amount: number; at: string; note?: string }[];
}

/** Conversion rate: 10 points = £1.00. */
export const LOYALTY_RATE = 10;

export function readLoyaltyPoints(): LoyaltyState {
  try {
    const raw = window.localStorage.getItem(LOYALTY_STORAGE_KEY);
    if (!raw) return { points: 0, history: [] };
    const parsed = JSON.parse(raw) as Partial<LoyaltyState>;
    return {
      points:
        typeof parsed.points === "number" && parsed.points >= 0
          ? parsed.points
          : 0,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter(
            (entry): entry is LoyaltyState["history"][number] =>
              !!entry && typeof entry.id === "string" && typeof entry.amount === "number"
          )
        : [],
    };
  } catch {
    return { points: 0, history: [] };
  }
}

function writeLoyalty(state: LoyaltyState): void {
  window.localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(state));
}

/** Award points (e.g. after placing an order). */
export function addLoyaltyPoints(amount: number, note?: string): LoyaltyState {
  const state = readLoyaltyPoints();
  const next: LoyaltyState = {
    points: state.points + amount,
    history: [
      { id: `lp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: "earn" as const, amount, at: new Date().toISOString(), note },
      ...state.history,
    ].slice(0, 100),
  };

  writeLoyalty(next);

  // Notify the account feed about earned points.
  pushNotification({
    kind: "system",
    title: "Loyalty points earned",
    body: `You earned ${amount} loyalty point${amount === 1 ? "" : "s"}${note ? ` — ${note}` : ""}. Total: ${next.points} points.`,
  });

  return next;
}

/** Convert points to wallet balance. Returns null if insufficient points. */
export function convertPointsToWallet(pointsToConvert: number): { wallet: WalletState; loyalty: LoyaltyState } | null {
  const loyalty = readLoyaltyPoints();
  if (pointsToConvert <= 0 || pointsToConvert > loyalty.points) return null;

  const walletAmount = Math.round((pointsToConvert / LOYALTY_RATE) * 100) / 100;
  const wallet = addWalletFunds(walletAmount, "topup", `${pointsToConvert} loyalty points`);

  const nextLoyalty: LoyaltyState = {
    points: loyalty.points - pointsToConvert,
    history: [
      { id: `lp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: "redeem" as const, amount: pointsToConvert, at: new Date().toISOString(), note: `Converted to £${walletAmount.toFixed(2)} wallet balance` },
      ...loyalty.history,
    ].slice(0, 100),
  };
  writeLoyalty(nextLoyalty);

  return { wallet, loyalty: nextLoyalty };
}

/* =========================================================
   COUPONS
========================================================= */

export interface Coupon {
  id: string;
  code: string;
  /** Discount value: percent when `type` is "percent", pounds otherwise. */
  type: "percent" | "fixed";
  value: number;
  /** ISO date after which the coupon no longer applies. */
  expiresAt?: string;
  description?: string;
  usedAt?: string;
}

export function readCoupons(): Coupon[] {
  try {
    const raw = window.localStorage.getItem(COUPONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is Coupon =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as Coupon).id === "string" &&
        typeof (entry as Coupon).code === "string" &&
        typeof (entry as Coupon).value === "number"
    );
  } catch {
    return [];
  }
}

/** Coupons that still apply (unused and not expired), newest first. */
export function readActiveCoupons(): Coupon[] {
  const now = Date.now();
  return readCoupons()
    .filter(
      (coupon) =>
        !coupon.usedAt &&
        (!coupon.expiresAt || new Date(coupon.expiresAt).getTime() >= now)
    )
    .reverse();
}

function writeCoupons(coupons: Coupon[]): void {
  window.localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
}

/**
 * Adds a coupon. An active duplicate code is rejected (null); a previously
 * used one is re-activated with the new details.
 */
export function addCoupon(coupon: Omit<Coupon, "id" | "usedAt">): Coupon | null {
  const coupons = readCoupons();
  const existing = coupons.find(
    (entry) => entry.code.toUpperCase() === coupon.code.toUpperCase()
  );

  if (existing) {
    if (!existing.usedAt) return null;

    const restored: Coupon = { ...existing, ...coupon, usedAt: undefined };
    writeCoupons(
      coupons.map((entry) => (entry.id === existing.id ? restored : entry))
    );

    // Notify the account feed about the re-issued coupon.
    pushNotification({
      kind: "promo",
      title: "Coupon re-issued",
      body: `Your coupon ${restored.code} is available again — ${describeCouponValue(restored)}.`,
    });

    return restored;
  }

  const full: Coupon = { ...coupon, id: `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  writeCoupons([...coupons, full]);

  // Notify the account feed about the new coupon.
  pushNotification({
    kind: "promo",
    title: "New coupon added",
    body: `${full.code} — ${describeCouponValue(full)}. Apply it at checkout to save.`,
  });

  return full;
}

/** Human-readable discount text, e.g. "10% off" or "£5.00 off". */
function describeCouponValue(coupon: Coupon): string {
  return coupon.type === "percent"
    ? `${coupon.value}% off`
    : `£${coupon.value.toFixed(2)} off`;
}

/** Marks a coupon used (e.g. applied at checkout). */
export function markCouponUsed(id: string): void {
  writeCoupons(
    readCoupons().map((coupon) =>
      coupon.id === id
        ? { ...coupon, usedAt: new Date().toISOString() }
        : coupon
    )
  );
}

/* =========================================================
   REFERRAL
========================================================= */

const REFERRAL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateReferralCode(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let code = "";
  for (let i = 0; i < length; i++) {
    code += REFERRAL_ALPHABET[bytes[i] % REFERRAL_ALPHABET.length];
  }
  return code;
}

/** Gets the user's referral code, creating a stable one on first call. */
export function getReferralCode(): string {
  try {
    const existing = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (existing) return existing;

    const code = generateReferralCode();
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    return code;
  } catch {
    return generateReferralCode();
  }
}

/* =========================================================
   ACCOUNT ACTIONS
========================================================= */

export function signOutAndWipe(): void {
  clearStoredUser();
}

/**
 * Permanently deletes the local account: profile, order history
 * and saved addresses are all removed.
 */
export function deleteAccountAndWipe(): void {
  clearStoredUser();
  window.localStorage.removeItem(ORDERS_STORAGE_KEY);
  window.localStorage.removeItem(ADDRESSES_STORAGE_KEY);
  window.localStorage.removeItem(WALLET_STORAGE_KEY);
  window.localStorage.removeItem(LOYALTY_STORAGE_KEY);
  window.localStorage.removeItem(COUPONS_STORAGE_KEY);
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  window.localStorage.removeItem("porto-piri-favourites-v1");
  window.localStorage.removeItem("porto-piri-cart-v1");
  window.localStorage.removeItem("porto-piri-delivery-v1");
}
