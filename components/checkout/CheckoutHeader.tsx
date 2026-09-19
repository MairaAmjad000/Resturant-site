"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import SafeImage from "@/components/restaurant/SafeImage";
import BranchSelector from "@/components/restaurant/BranchSelector";
import UserAvatar from "@/components/account/UserAvatar";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";

export type CheckoutStep = "checkout" | "payment" | "confirmation";

interface CheckoutHeaderProps {
  logoUrl: string;
  logoAlt: string;
  currentStep: CheckoutStep;
  cartCount?: number;
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "checkout", label: "Checkout" },
  { key: "payment", label: "Payment" },
  { key: "confirmation", label: "Confirmation" },
];

export default function CheckoutHeader({
  logoUrl,
  logoAlt,
  currentStep,
  cartCount = 0,
}: CheckoutHeaderProps) {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <header className="sticky top-0 z-[100] border-b border-[#e9e3db] bg-[#fbf9f6]/90 backdrop-blur-md">
      {/* Top bar */}
      <div className="mx-auto flex h-[62px] max-w-[1160px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="relative flex h-9 w-[120px] shrink-0 items-center">
          <SafeImage
            src={logoUrl}
            alt={logoAlt}
            fill
            className="object-contain object-left"
            priority
            fallback={
              <span className="text-[15px] font-bold text-[#0e3b2e]">
                Porto Piri Piri
              </span>
            }
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* Branch — static pill showing the selected branch (change it on the menu page) */}
          <BranchSelector readOnly className="hidden sm:block" />

          {/* Account */}
          <Link
            href="/account"
            aria-label="My Account — open account settings"
            className="flex h-[38px] items-center gap-2 rounded-full border border-[#d8d0c5] bg-white px-1.5 pr-4 transition-colors hover:bg-orange"
          >
            <UserAvatar user={user ?? { firstName: "", lastName: "", email: "guest" }} size={30} />
            <span className="text-[13px] font-semibold text-[#15181a]">
              My Account
            </span>
          </Link>

          {/* Cart — back to checkout to review the basket */}
          <Link
            href="/checkout"
            aria-label={
              cartCount > 0
                ? `Basket, ${cartCount} items — review your order`
                : "Basket — review your order"
            }
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#d8d0c5] bg-white text-[#15181a] transition hover:bg-orange"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff8500] px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Step tabs */}
      <nav
        aria-label="Checkout progress"
        className="border-t border-white/10 bg-white"
      >
        <div className="mx-auto grid max-w-[1160px] grid-cols-3 px-4 sm:px-6">
          {STEPS.map((step, index) => {
            const isActive = index === currentIndex;
            const isDone = index < currentIndex;

            return (
              <div
                key={step.key}
                aria-current={isActive ? "step" : undefined}
                className={`relative flex h-[52px] items-center justify-center gap-2 border-b-2 text-[14px] font-semibold transition-colors ${
                  isActive
                    ? "border-[#ff8500] text-[#ff8500]"
                    : isDone
                      ? "border-[#ff8500] text-[#15181a]"
                      : "border-[#e5e5e5] text-[#9aa0a5]"
                }`}
              >
                {isDone && (
                  <span
                    aria-hidden="true"
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#ff8500]"
                  >
                    <Check
                      className="h-[11px] w-[11px] text-white"
                      strokeWidth={3.5}
                    />
                  </span>
                )}
                {step.label}
              </div>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
