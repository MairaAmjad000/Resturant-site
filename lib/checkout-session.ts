export const SERVICE_FEE = 0.5;
export const BAG_CHARGE = 0.35;
/** Minimum order value (subtotal after discounts) to check out at all. */
export const MIN_ORDER_TOTAL = 10;
/** Free delivery threshold; below this, standard delivery costs £3.99. */
export const FREE_DELIVERY_THRESHOLD = 20;
export const STANDARD_DELIVERY_FEE = 3.99;
export const NOTE_MAX_LENGTH = 500;
export const TIP_PRESETS = [1, 2, 5];

/**
 * Delivery fee for an order: free at/above the £20 threshold,
 * £3.99 standard below it. Collection orders carry no delivery fee.
 */
export function deliveryFeeFor(orderType: OrderType, orderValue: number): number {
  if (orderType !== "delivery") return 0;
  return orderValue >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

/**
 * Validates a UK phone number in international format.
 * Requires +44 followed by 9–10 digits (UK mobiles/landlines
 * drop the leading 0 in +44 form, e.g. +447911123456).
 */
export function isValidUKPhone(raw: string): boolean {
  const normalized = raw.replace(/[\s\-()]/g, "");
  // +44 followed by 9–10 digits. The first digit after +44 is never 0
  // (e.g. +44 7911 123456 — the trunk 0 is dropped).
  return /^\+44[1-9]\d{8,9}$/.test(normalized);
}

/**
 * Live-normalises a UK phone input as the user types: forces a leading
 * +44 and digits/spaces only. Keeps the caret-friendly formatting light.
 */
export function normaliseUKPhoneInput(raw: string): string {
  let value = raw.replace(/[^\d+]/g, "");
  // Collapse any stray plus signs to just the leading one
  const plusCount = (value.match(/\+/g) || []).length;
  if (plusCount > 1 || (plusCount === 1 && !value.startsWith("+"))) {
    value = "+" + value.replace(/\+/g, "");
  }
  return value.slice(0, 16); // +44 + up to 10 digits + slack
}

export type OrderType = "delivery" | "collection";
export type Timing = "asap" | "scheduled";
export type PaymentMethod = "cash" | "card" | "wallet";

export interface AppliedCoupon {
  code: string;
  /** Absolute discount in £, computed when the coupon was applied. */
  discount: number;
}

export interface CheckoutSession {
  orderType: OrderType;
  timing: Timing;
  scheduledDate: string;
  scheduledTime: string;
  tip: number;
  cutlery: boolean;
  /** Coupon applied at checkout — carried to payment + confirmation. */
  coupon?: AppliedCoupon;
  /** How much wallet money the user chose to spend on this order —
   *  deducted from their balance and from the total at payment time. */
  walletAmountUsed?: number;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  delivery: {
    street: string;
    floor: string;
    postcode: string;
    company: string;
    orderInstructions: string;
    deliveryNotes: string;
  };
}

export const CHECKOUT_SESSION_KEY = "porto-piri-checkout-v1";
export const ORDER_KEY = "porto-piri-last-order-v1";
export const PAYMENT_METHOD_KEY = "porto-piri-payment-method-v1";

export interface PlacedOrder extends CheckoutSession {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  itemsTotal: number;
  subtotal: number;
  total: number;
  placedAt: string;
}

/* =========================================================
   Session persistence (checkout → payment → confirmation)
========================================================= */

export function saveCheckoutSession(session: CheckoutSession): void {
  window.sessionStorage.setItem(
    CHECKOUT_SESSION_KEY,
    JSON.stringify(session)
  );
}

export function readCheckoutSession(): CheckoutSession | null {
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CheckoutSession>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.orderType || !parsed.timing) return null;

    return {
      orderType: parsed.orderType,
      timing: parsed.timing,
      scheduledDate:
        typeof parsed.scheduledDate === "string"
          ? parsed.scheduledDate
          : "",
      scheduledTime:
        typeof parsed.scheduledTime === "string" ? parsed.scheduledTime : "",
      tip: typeof parsed.tip === "number" ? parsed.tip : 0,
      cutlery: parsed.cutlery === true,
      coupon:
        parsed.coupon &&
        typeof parsed.coupon === "object" &&
        typeof (parsed.coupon as AppliedCoupon).code === "string" &&
        typeof (parsed.coupon as AppliedCoupon).discount === "number"
          ? {
              code: (parsed.coupon as AppliedCoupon).code,
              discount: (parsed.coupon as AppliedCoupon).discount,
            }
          : undefined,
      walletAmountUsed:
        typeof parsed.walletAmountUsed === "number" && parsed.walletAmountUsed > 0
          ? parsed.walletAmountUsed
          : undefined,
      customer: {
        firstName: parsed.customer?.firstName ?? "",
        lastName: parsed.customer?.lastName ?? "",
        phone: parsed.customer?.phone ?? "",
      },
      delivery: {
        street: parsed.delivery?.street ?? "",
        floor: parsed.delivery?.floor ?? "",
        postcode: parsed.delivery?.postcode ?? "",
        company: parsed.delivery?.company ?? "",
        orderInstructions: parsed.delivery?.orderInstructions ?? "",
        deliveryNotes: parsed.delivery?.deliveryNotes ?? "",
      },
    };
  } catch {
    return null;
  }
}

export function placeOrder(
  session: CheckoutSession,
  paymentMethod: PaymentMethod,
  subtotal: number,
  total: number
): PlacedOrder {
  const order: PlacedOrder = {
    ...session,
    orderNumber: `PPP-${Date.now().toString(36).toUpperCase()}`,
    paymentMethod,
    itemsTotal: subtotal,
    subtotal,
    total,
    placedAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));

  return order;
}

export function readPlacedOrder(): PlacedOrder | null {
  try {
    const raw = window.sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PlacedOrder>;
    if (!parsed || typeof parsed !== "object" || !parsed.placedAt) {
      return null;
    }

    return parsed as PlacedOrder;
  } catch {
    return null;
  }
}

/* =========================================================
   Payment method chosen on the payment step
========================================================= */

export function saveSelectedPaymentMethod(method: PaymentMethod): void {
  window.sessionStorage.setItem(PAYMENT_METHOD_KEY, method);
}

export function readSelectedPaymentMethod(): PaymentMethod | null {
  const raw = window.sessionStorage.getItem(PAYMENT_METHOD_KEY);

  return raw === "cash" || raw === "card" || raw === "wallet" ? raw : null;
}
