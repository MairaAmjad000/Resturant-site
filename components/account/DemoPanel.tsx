"use client";

import { useState, useSyncExternalStore } from "react";
import { Gift, Ticket, X } from "lucide-react";
import { addLoyaltyPoints, addCoupon, readLoyaltyPoints } from "@/lib/account";
import { emitToast } from "@/components/ui/ToastProvider";

/**
 * DemoPanel — floating helper for the manager's live check.
 * Lets the reviewer grant loyalty points and issue coupons without
 * placing a real order, so every account surface can be verified
 * on a deployed (Vercel) build.
 *
 * Shown only when ?demo=1 is in the URL — never in normal browsing.
 */

const DEMO_COUPONS = [
  { code: "WELCOME10", type: "percent" as const, value: 10, description: "10% off your order" },
  { code: "FIVER", type: "fixed" as const, value: 5, description: "£5.00 off your order" },
];

const subscribeToNothing = () => () => {};
const getDemoSnapshot = () =>
  new URLSearchParams(window.location.search).get("demo") === "1";

export default function DemoPanel() {
  const [open, setOpen] = useState(false);

  // Read ?demo=1 client-side, hydration-safe (layout is a server component).
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    getDemoSnapshot,
    () => false
  );

  if (!mounted) return null;

  const grantPoints = () => {
    const before = readLoyaltyPoints().points;
    addLoyaltyPoints(10, "Demo — manager review");
    const after = readLoyaltyPoints().points;
    emitToast({
      kind: "success",
      title: "+10 loyalty points added",
      body: `Balance: ${before} → ${after} points. Check the Loyalty page.`,
      duration: 5000,
    });
  };

  const issueCoupon = (coupon: (typeof DEMO_COUPONS)[number]) => {
    const result = addCoupon(coupon);
    if (result) {
      emitToast({
        kind: "promo",
        title: `Coupon ${coupon.code} issued`,
        body: `${coupon.description} — see the Coupons page.`,
        duration: 5000,
      });
    } else {
      emitToast({
        kind: "info",
        title: `${coupon.code} already active`,
        body: "This coupon is already in the account and unused.",
        duration: 5000,
      });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[550] print:hidden">
      {open ? (
        <div className="w-[280px] rounded-[14px] border border-[#e9e3db] bg-white p-4 shadow-[0_12px_36px_rgba(14,59,46,0.18)]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#15181a]">
              Demo tools
              <span className="ml-2 rounded-full bg-[#fdf1e3] px-2 py-0.5 text-[10px] font-bold text-[#ff8500]">
                MANAGER
              </span>
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close demo panel"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#b3aca2] transition hover:bg-[#f5f1eb] hover:text-[#15181a]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="mt-1 text-[11.5px] leading-snug text-[#9aa0a5]">
            Simulate backend events to review the live site.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={grantPoints}
              className="flex h-[42px] items-center justify-center gap-2 rounded-full bg-[#ff8500] text-[13px] font-bold text-white transition hover:bg-[#f07d00]"
            >
              <Gift className="h-4 w-4" />
              Add 10 loyalty points
            </button>

            {DEMO_COUPONS.map((coupon) => (
              <button
                key={coupon.code}
                type="button"
                onClick={() => issueCoupon(coupon)}
                className="flex h-[42px] items-center justify-center gap-2 rounded-full border border-[#d8d0c5] bg-white text-[13px] font-semibold text-[#15181a] transition hover:border-[#ff8500] hover:bg-[#fff5eb] hover:text-[#ff8500]"
              >
                <Ticket className="h-4 w-4 text-[#ff8500]" />
                Issue coupon {coupon.code}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open demo tools"
          className="flex h-11 items-center gap-2 rounded-full bg-[#0e3b2e] px-4 text-[12px] font-bold text-white shadow-[0_8px_24px_rgba(14,59,46,0.3)] transition hover:bg-[#0a2d23]"
        >
          <Gift className="h-4 w-4 text-[#ff8500]" />
          Demo
        </button>
      )}
    </div>
  );
}
