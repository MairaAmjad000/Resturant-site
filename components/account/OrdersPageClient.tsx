"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  ReceiptText,
  ShoppingBag,
  ChevronDown,
  Check,
  ClipboardCheck,
  ChefHat,
  Bike,
  PackageCheck,
} from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import {
  readOrderHistory,
  setOrderStatus,
  type OrderHistoryEntry,
  type OrderStatus,
} from "@/lib/account";

/* =========================================================
   STATUS BADGE
========================================================= */

const STATUS_STYLES: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-[#fdf1e3] text-[#ff8500]",
  },
  delivered: {
    label: "Delivered",
    className: "bg-[#e6f4ec] text-[#178A4B]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#fdeeec] text-[#c0392b]",
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-bold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

/* =========================================================
   ORDER TRACKING TIMELINE
   Four stages: Confirmed → Preparing → Out for delivery → Delivered
   (for collection orders the third stage reads "Ready for pickup")
========================================================= */

function OrderTrackingTimeline({
  order,
}: {
  order: OrderHistoryEntry;
}) {
  const status: OrderStatus = order.status ?? "active";
  const isDelivery = order.orderType === "delivery";

  const steps = [
    { label: "Order confirmed", icon: ClipboardCheck },
    { label: "Preparing", icon: ChefHat },
    {
      label: isDelivery ? "Out for delivery" : "Ready for pickup",
      icon: isDelivery ? Bike : ShoppingBag,
    },
    { label: "Delivered", icon: PackageCheck },
  ];

  // Cancelled orders get a plain note instead of the timeline.
  if (status === "cancelled") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-[#fdeeec] px-4 py-3 text-[13px] font-semibold text-[#c0392b]">
        <X className="h-4 w-4" />
        This order was cancelled.
      </div>
    );
  }

  const currentStep =
    status === "delivered"
      ? 3
      : Math.min(Math.max(order.trackingStep ?? 0, 0), 2);

  return (
    <ol className="mt-4 flex items-start">
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className="relative flex flex-1 flex-col items-center">
            {/* Connector line to the next step */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-[18px] h-[3px] w-full ${
                  done ? "bg-[#ff8500]" : "bg-[#eee7dd]"
                }`}
              />
            )}

            {/* Step dot */}
            <span
              className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                done
                  ? "border-[#ff8500] bg-[#ff8500] text-white"
                  : active
                    ? "border-[#ff8500] bg-white text-[#ff8500] shadow-[0_0_0_4px_rgba(255,133,0,0.15)]"
                    : "border-[#e3dcd2] bg-white text-[#c9c2b8]"
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
            </span>

            {/* Label */}
            <span
              className={`mt-2 max-w-[86px] text-center text-[11px] font-semibold leading-tight ${
                done || active ? "text-[#15181a]" : "text-[#b3aca2]"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
  onStatusChange,
}: {
  order: OrderHistoryEntry;
  onStatusChange: () => void;
}) {
  const status: OrderStatus = order.status ?? "active";
  const [showDetails, setShowDetails] = useState(false);

  return (
    <article className="rounded-[14px] bg-white p-6">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#15181a]">
            {order.orderNumber}
          </p>
          <p className="mt-0.5 text-[12px] text-[#9aa0a5]">
            {new Date(order.placedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Items */}
      <ul className="mt-4 flex flex-col gap-1.5 border-t border-[#f0f0f0] pt-4">
        {order.items.map((item, index) => (
          <li
            key={`${order.orderNumber}-${index}`}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="min-w-0 truncate text-[#3d4348]">
              {item.quantity}× {item.name}
            </span>
            <span className="shrink-0 font-semibold text-[#15181a]">
              £{item.lineTotal.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {/* Meta + total */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f0] pt-4">
        <p className="text-[12px] text-[#6b7075]">
          {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
          {order.address ? ` · ${order.address}` : ""} · {order.paymentMethod}
        </p>

        <p className="text-[17px] font-bold text-[#ff8500]">
          £{order.total.toFixed(2)}
        </p>
      </div>

      {/* Details toggle */}
      <button
        type="button"
        onClick={() => setShowDetails((value) => !value)}
        aria-expanded={showDetails}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#e9e3db] py-2 text-[12px] font-semibold text-[#3d4348] transition hover:border-[#ff8500] hover:bg-[#fff5eb] hover:text-[#ff8500]"
      >
        {showDetails ? "Hide details" : "View details"}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            showDetails ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded details: tracking + full summary */}
      {showDetails && (
        <div className="mt-3 rounded-[12px] border border-[#f0e9df] bg-[#fdfaf5] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#9aa0a5]">
            Order tracking
          </p>
          <OrderTrackingTimeline order={order} />
        </div>
      )}

      {/* Actions */}
      {status === "active" && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setOrderStatus(order.orderNumber, "delivered");
              onStatusChange();
            }}
            className="h-[40px] flex-1 rounded-full border border-[#e0e0e0] text-[13px] font-semibold text-[#15181a] transition hover:bg-[#fafafa]"
          >
            Mark delivered
          </button>

          <button
            type="button"
            onClick={() => {
              setOrderStatus(order.orderNumber, "cancelled");
              onStatusChange();
            }}
            className="h-[40px] flex-1 rounded-full border border-[#f2c4bd] text-[13px] font-semibold text-[#c0392b] transition hover:bg-[#fdeeec]"
          >
            Cancel order
          </button>
        </div>
      )}
    </article>
  );
}

/* =========================================================
   MY ORDERS PAGE
========================================================= */

type Tab = "all" | OrderStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [orders, setOrders] = useState<OrderHistoryEntry[]>(() =>
    readOrderHistory()
  );
  const [tab, setTab] = useState<Tab>("all");

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to see your orders.
          </p>

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

  const countFor = (key: Tab) =>
    key === "all"
      ? orders.length
      : orders.filter((order) => (order.status ?? "active") === key).length;

  const visible =
    tab === "all"
      ? orders
      : orders.filter((order) => (order.status ?? "active") === tab);

  const refresh = () => setOrders(readOrderHistory());
  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* ---------- Close ---------- */}
      <Link
        href="/account"
        aria-label="Close my orders"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* ---------- Back ---------- */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#15181a] transition-colors hover:text-[#ff8500]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* ---------- Heading ---------- */}
      <p className="mt-6 text-[12px] font-bold uppercase tracking-[2px] text-[#8a8f94]">
        Account
      </p>

      <h1 className="mt-2 text-[34px] font-bold leading-tight text-[#15181a]">
        My Orders
      </h1>

      <p className="mt-1.5 text-[14px] text-[#6b7075]">
        Track and manage all your previous orders
      </p>

      {/* ---------- Tabs ---------- */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => {
          const count = countFor(key);
          const isActive = tab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={isActive}
              className={`h-[34px] rounded-full px-4 text-[13px] font-semibold transition-colors ${
                isActive
                  ? "bg-[#ff8500] text-white"
                  : "bg-[#ececec] text-[#3d4348] hover:bg-[#e2e2e2]"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* ---------- List ---------- */}
      {visible.length === 0 ? (
        <p className="mt-8 text-[14px] text-[#9aa0a5]">
          No orders in this list.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {visible.map((order) => (
            <OrderCard
              key={order.orderNumber}
              order={order}
              onStatusChange={refresh}
            />
          ))}
        </div>
      )}

      {/* ---------- Empty-state helper icons (a11y anchors) ---------- */}
      <span className="sr-only">
        <ReceiptText />
        <ShoppingBag />
      </span>
    </main>
  );
}
