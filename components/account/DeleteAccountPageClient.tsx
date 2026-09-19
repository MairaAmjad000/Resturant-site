"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ShoppingBag,
  MapPin,
  Wallet,
  Star,
  Ticket,
  Heart,
  Bell,
  User,
} from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
  userDisplayName,
} from "@/lib/auth";
import { deleteAccountAndWipe } from "@/lib/account";

const CONFIRM_PHRASE = "DELETE";

/* =========================================================
   IMPACT ROW — what will be removed
========================================================= */

const IMPACT_ITEMS = [
  { icon: User, label: "Your profile and sign-in details" },
  { icon: ShoppingBag, label: "Your complete order history" },
  { icon: MapPin, label: "All saved delivery addresses" },
  { icon: Wallet, label: "Wallet balance and transactions" },
  { icon: Star, label: "Loyalty points you have earned" },
  { icon: Ticket, label: "Unused coupons" },
  { icon: Heart, label: "Your favourite items" },
  { icon: Bell, label: "Notifications" },
] as const;

function ImpactRow({
  icon: Icon,
  label,
}: {
  icon: typeof User;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fde9dc] text-[#ff8500]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[14px] text-[#3d4348]">{label}</span>
    </li>
  );
}

/* =========================================================
   DELETE ACCOUNT PAGE
   Two-step flow: review impact → type DELETE to confirm.
   Typed confirmation prevents accidental taps destroying
   the account; a browser confirm() is too weak for this.
========================================================= */

export default function DeleteAccountPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [confirmText, setConfirmText] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [deleted, setDeleted] = useState(false);

  /* Signed-out guard — nothing to delete */
  if (!user && !deleted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>
          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to manage your account.
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

  /* ---------- Goodbye screen after deletion ---------- */
  if (deleted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-4 py-16">
        <div className="rounded-[18px] bg-white p-10 text-center shadow-[0_2px_14px_rgba(0,0,0,0.05)]">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#178A4B]" />

          <h1 className="mt-4 font-serif text-[28px] font-bold text-[#15181a]">
            Account deleted
          </h1>

          <p className="mt-3 text-[14px] leading-[22px] text-[#6b7075]">
            Everything has been removed from this device. It&apos;s been a
            pleasure serving you — you&apos;re always welcome back.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex h-[51px] items-center rounded-full bg-[#ff8500] px-8 text-[14px] font-bold text-white transition hover:bg-[#f07d00]"
          >
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = () => {
    setAttempted(true);

    if (!canDelete) return;

    deleteAccountAndWipe();
    setDeleted(true);
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* ---------- Top bar ---------- */}
      <div className="flex items-center justify-between">
        <Link
          href="/account"
          aria-label="Back to account"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white transition hover:bg-[#fafafa]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>

        <Link
          href="/"
          aria-label="Close account pages"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white transition hover:bg-[#fafafa]"
        >
          <X className="h-[18px] w-[18px]" />
        </Link>
      </div>

      {/* ---------- Heading ---------- */}
      <p className="mt-8 text-[12px] font-bold uppercase tracking-[2px] text-[#e5484d]">
        Danger zone
      </p>

      <h1 className="mt-2 flex items-center gap-3 text-[32px] font-bold leading-tight text-[#15181a]">
        <Trash2 className="h-7 w-7 text-[#e5484d]" />
        Delete account
      </h1>

      <p className="mt-3 max-w-[560px] text-[14px] leading-[22px] text-[#6b7075]">
        This permanently removes{" "}
        <span className="font-semibold text-[#15181a]">
          {userDisplayName(user as NonNullable<typeof user>)}
        </span>{" "}
        and everything stored with it on this device. This action cannot be
        undone.
      </p>

      {/* ---------- What gets deleted ---------- */}
      <section className="mt-8 rounded-[14px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <h2 className="border-b border-[#f0f0f0] px-5 py-4 text-[14px] font-bold text-[#15181a]">
          What will be deleted
        </h2>
        <ul className="flex flex-col divide-y divide-[#f5f5f5]">
          {IMPACT_ITEMS.map(({ icon, label }) => (
            <ImpactRow key={label} icon={icon} label={label} />
          ))}
        </ul>
      </section>

      {/* ---------- Retention note ---------- */}
      <p className="mt-4 flex items-start gap-2 text-[13px] leading-[20px] text-[#8a8f94]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8500]" />
        Any order already placed with the kitchen stays in the kitchen&apos;s
        records for legal and food-safety reasons — deleting your account does
        not cancel or refund placed orders.
      </p>

      {/* ---------- Confirmation ---------- */}
      <section className="mt-8 rounded-[14px] border border-[#f3c8c8] bg-[#fdf4f4] p-6">
        <label
          htmlFor="delete-confirm"
          className="block text-[14px] font-bold text-[#15181a]"
        >
          Type{" "}
          <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] text-[#e5484d]">
            {CONFIRM_PHRASE}
          </span>{" "}
          to confirm
        </label>

        <input
          id="delete-confirm"
          type="text"
          value={confirmText}
          onChange={(event) => {
            setConfirmText(event.target.value);
            if (attempted) setAttempted(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleDelete();
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={CONFIRM_PHRASE}
          aria-invalid={attempted && !canDelete}
          className={`mt-3 h-[50px] w-full rounded-[10px] border bg-white px-4 text-[15px] font-semibold uppercase tracking-wide text-[#15181a] outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[#c9a3a3] focus:ring-2 ${
            attempted && !canDelete
              ? "border-[#e5484d] ring-2 ring-[#e5484d]/25"
              : "border-[#f3c8c8] focus:border-[#e5484d] focus:ring-[#e5484d]/25"
          }`}
        />

        {attempted && !canDelete && (
          <p className="mt-2 text-[13px] font-semibold text-[#e5484d]">
            Please type {CONFIRM_PHRASE} exactly to enable deletion.
          </p>
        )}

        {/* ---------- Actions ---------- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleDelete}
            className={`h-[50px] flex-1 rounded-full text-[14px] font-bold text-white transition-all duration-150 ${
              canDelete
                ? "bg-[#e5484d] shadow-[0_6px_18px_rgba(229,72,77,0.3)] hover:bg-[#d13438] active:scale-[0.98]"
                : "cursor-not-allowed bg-[#eebfc1]"
            }`}
          >
            Permanently delete my account
          </button>

          <Link
            href="/account"
            className="inline-flex h-[50px] flex-1 items-center justify-center rounded-full border border-[#d8d0c5] bg-white text-[14px] font-semibold text-[#15181a] transition hover:bg-[#fde9dc]"
          >
            Keep my account
          </Link>
        </div>
      </section>
    </main>
  );
}
