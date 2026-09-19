"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, X, Trash2 } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import {
  readActiveCoupons,
  markCouponUsed,
  type Coupon,
} from "@/lib/account";

/* =========================================================
   COUPON CARD — ticket style with punched notches
========================================================= */

function CouponCard({
  coupon,
  onRemove,
}: {
  coupon: Coupon;
  onRemove: () => void;
}) {
  return (
    <article className="relative flex min-w-0 items-stretch overflow-visible">
      {/* Ticket shadow layer */}
      <div className="absolute inset-0 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]" />

      {/* Left stub — discount */}
      <div className="relative z-10 flex w-[96px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-2xl bg-gradient-to-br from-[#ff9d2e] to-[#f58200] p-3 text-center text-white sm:w-[120px]">
        {coupon.type === "percent" ? (
          <p className="text-[24px] font-extrabold leading-none sm:text-[28px]">
            {coupon.value}%
          </p>
        ) : (
          <p className="text-[24px] font-extrabold leading-none sm:text-[28px]">
            £{coupon.value.toFixed(2)}
          </p>
        )}
        <p className="text-[11px] font-bold uppercase tracking-[2px] opacity-90">
          off
        </p>
        {coupon.expiresAt && (
          <p className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
            till {new Date(coupon.expiresAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </p>
        )}
      </div>

      {/* Perforation — punched notches + dashed line */}
      <div className="relative z-10 w-0 shrink-0 border-l-2 border-dashed border-[#f0e4d7]">
        <span className="absolute -left-[11px] -top-[11px] h-[22px] w-[22px] rounded-full bg-[#f7f7f7]" />
        <span className="absolute -bottom-[11px] -left-[11px] h-[22px] w-[22px] rounded-full bg-[#f7f7f7]" />
      </div>

      {/* Right body — code + description + actions */}
      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3 rounded-r-2xl bg-white p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-extrabold tracking-[2px] text-[#15181a]">
            {coupon.code}
          </p>
          {coupon.description && (
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-[17px] text-[#9aa0a5]">
              {coupon.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove coupon ${coupon.code}`}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[#c9c9c9] transition hover:bg-[#fdeeec] hover:text-[#c0392b]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   COUPONS PAGE
========================================================= */

export default function CouponsPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  if (coupons === null && typeof window !== "undefined") {
    setCoupons(readActiveCoupons());
  }

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to manage your coupons.
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

  const handleRemove = (id: string) => {
    markCouponUsed(id); // soft-delete via ledger
    setCoupons(readActiveCoupons());
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* Close */}
      <Link
        href="/"
        aria-label="Close coupons page"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#15181a] hover:text-[#ff8500]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Heading */}
      <h1 className="mt-5 text-[28px] font-bold text-[#15181a]">Coupons</h1>

      <p className="mt-2 max-w-[560px] text-[13px] leading-[20px] text-[#9aa0a5]">
        Coupons are issued by the restaurant — keep an eye on your
        notifications for new offers. Codes arrive already attached to your
        account.
      </p>

      {/* Coupon list / empty state */}
      {coupons && coupons.length > 0 ? (
        <section className="mt-6 flex flex-col gap-5">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onRemove={() => handleRemove(coupon.id)}
            />
          ))}
        </section>
      ) : (
        <p className="mt-6 text-[14px] text-[#9aa0a5]">
          No coupons available.
        </p>
      )}
    </main>
  );
}
