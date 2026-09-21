"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, X } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
  userDisplayName,
} from "@/lib/auth";
import { signOutAndWipe } from "@/lib/account";
import UserAvatar from "./UserAvatar";

/* =========================================================
   SMALL PIECES
========================================================= */

function SectionRow({
  label,
  danger,
  open,
  onToggle,
}: {
  label: string;
  danger?: boolean;
  open?: boolean;
  onToggle: () => void;
}) {
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`group flex w-full items-center justify-between px-6 py-[18px] text-left text-[14px] font-semibold transition-colors hover:bg-[#fde9dc] ${
        danger ? "text-[#ff8500]" : "text-[#15181a] hover:text-[#ff8500]"
      }`}
    >
      {label}

      <Chevron
        className={`h-3.5 w-3.5 transition-colors ${
          danger ? "text-[#ff8500]" : "text-[#b9b9b9] group-hover:text-[#ff8500]"
        }`}
      />
    </button>
  );
}

/* =========================================================
   ACCOUNT CLIENT
========================================================= */

export default function AccountClient() {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [moreOpen, setMoreOpen] = useState(false);

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to manage your profile, orders and
            addresses.
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

  const handleLogout = () => {
    signOutAndWipe();
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* ---------- Back — same pill as the checkout page ---------- */}
      {/* <Link
        href="/"
        aria-label="Back to home — continue browsing the menu"
        className="mb-5 inline-flex h-[38px] items-center gap-1.5 rounded-full border border-[#d8d0c5] bg-white px-3.5 text-[13px] font-semibold text-[#15181a] transition hover:bg-orange hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link> */}

      {/* ---------- Close ---------- */}
      <Link
        href="/"
        aria-label="Close account page"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* ---------- Heading ---------- */}
      <p className="text-[12px] font-bold uppercase tracking-[2px] text-[#8a8f94]">
        Account
      </p>

      <h1 className="mt-2 text-[34px] font-bold leading-tight text-[#15181a]">
        My Account
      </h1>

      <p className="mt-1.5 text-[14px] text-[#6b7075]">
        Manage your profile, orders, and addresses
      </p>

      {/* ---------- Profile card ---------- */}
      <Link
        href="/account/profile"
        className="group mt-8 flex items-center gap-4 rounded-[14px] bg-white p-6 transition-colors hover:bg-[#fde9dc]"
      >
        <UserAvatar user={user} size={56} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-bold text-[#15181a]">
            {userDisplayName(user)}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#9aa0a5]">
            {user.email}
            {user.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-[#b9b9b9]" />
      </Link>

      {/* ---------- Menu card ---------- */}
      <section className="mt-5 flex flex-col divide-y divide-[#f0f0f0] overflow-hidden rounded-[14px] bg-white">
        <SectionRow
          label="My Profile"
          onToggle={() => router.push("/account/profile")}
        />

        <SectionRow
          label="My Orders"
          onToggle={() => router.push("/account/orders")}
        />

        <SectionRow
          label="Saved Addresses"
          onToggle={() => router.push("/account/addresses")}
        />

        <SectionRow label="Logout" danger onToggle={handleLogout} />
      </section>

      {/* ---------- More ---------- */}
      <section className="mt-5 rounded-[14px] bg-white">
        <SectionRow
          label="More"
          open={moreOpen}
          onToggle={() => setMoreOpen((open) => !open)}
        />

        {moreOpen && (
          <div className="flex flex-col divide-y divide-[#f0f0f0] border-t border-[#f0f0f0]">
            {[
              { label: "Wallet", href: "/account/wallet" },
              { label: "Loyalty Points", href: "/account/loyalty" },
              { label: "Coupons", href: "/account/coupons" },
              { label: "Refer & Earn", href: "/account/refer" },
              { label: "Favourites", href: "/account/favourites" },
              { label: "Notifications", href: "/account/notifications" },
              { label: "Help & Support", href: "/account/help" },
            ].map(({ label, href }) =>
              href ? (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center justify-between px-6 py-[15px] text-[13px] font-medium text-black transition-colors hover:bg-[#fde9dc] hover:text-[#ff8500]"
                >
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 text-[#b9b9b9] transition-colors group-hover:text-[#ff8500]" />
                </Link>
              ) : (
                <a
                  key={label}
                  href="#"
                  className="group flex items-center justify-between px-6 py-[15px] text-[13px] font-medium text-black transition-colors hover:bg-[#fde9dc] hover:text-[#ff8500]"
                >
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 text-[#b9b9b9] transition-colors group-hover:text-[#ff8500]" />
                </a>
              )
            )}

            <Link
              href="/account/delete"
              className="flex items-center justify-between px-6 py-[15px] text-[13px] font-semibold text-[#ff8500] transition-colors hover:bg-[#fde9dc]"
            >
              Delete account
              <ChevronRight className="h-3.5 w-3.5 text-[#ff8500]" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
