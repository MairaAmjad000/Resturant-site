"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import {
  readLoyaltyPoints,
  convertPointsToWallet,
  LOYALTY_RATE,
  type LoyaltyState,
} from "@/lib/account";

/* =========================================================
   TRANSACTION ROW
========================================================= */

function HistoryRow({ entry }: { entry: LoyaltyState["history"][number] }) {
  const isEarn = entry.kind === "earn";
  const Icon = isEarn ? ArrowDownLeft : ArrowUpRight;

  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <span
        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${
          isEarn ? "bg-[#e6f4ec] text-[#178A4B]" : "bg-[#fdf1e3] text-[#ff8500]"
        }`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#15181a]">
          {isEarn ? "Points earned" : "Points redeemed"}
          {entry.note ? (
            <span className="font-normal text-[#9aa0a5]"> · {entry.note}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[12px] text-[#9aa0a5]">
          {new Date(entry.at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <span
        className={`shrink-0 text-[14px] font-bold ${
          isEarn ? "text-[#178A4B]" : "text-[#ff8500]"
        }`}
      >
        {isEarn ? "+" : "−"}{entry.amount}
      </span>
    </li>
  );
}

/* =========================================================
   LOYALTY PAGE
========================================================= */

export default function LoyaltyPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [loyalty, setLoyalty] = useState<LoyaltyState | null>(null);
  const [convertAmount, setConvertAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (loyalty === null && typeof window !== "undefined") {
    setLoyalty(readLoyaltyPoints());
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>
          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to view your loyalty points.
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

  const points = loyalty?.points ?? 0;
  const history = loyalty?.history ?? [];

  const handleConvert = () => {
    const num = parseInt(convertAmount, 10);
    if (!num || num <= 0) {
      setError("Enter a valid number of points.");
      return;
    }
    if (num > points) {
      setError("You don't have enough points.");
      return;
    }
    setError("");
    setSuccess("");
    const result = convertPointsToWallet(num);
    if (result) {
      setLoyalty(result.loyalty);
      setSuccess(`${num} points converted to £${(num / LOYALTY_RATE).toFixed(2)} wallet balance.`);
      setConvertAmount("");
    }
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* Close */}
      <Link
        href="/"
        aria-label="Close loyalty page"
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
      <h1 className="mt-5 text-[28px] font-bold text-[#15181a]">
        Loyalty Points
      </h1>

      {/* Points card */}
      <section className="mt-5 rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-7">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-[#ff8500]">
          Your points
        </p>
        <p className="mt-2 text-[34px] font-bold leading-none text-[#15181a]">
          {points}
        </p>
        <p className="mt-3 text-[13px] text-[#9aa0a5]">
          Earn 1 point per £1 spent. {LOYALTY_RATE} points = £1.00.
        </p>
      </section>

      {/* Convert card */}
      <section className="mt-4 rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-7">
        <p className="text-[14px] font-semibold text-[#15181a]">
          Convert points to wallet
        </p>

        <div className="mt-3 relative">
          <input
            type="number"
            min="1"
            max={points}
            value={convertAmount}
            onChange={(event) => {
              setConvertAmount(event.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="Points"
            className="h-[52px] w-full rounded-[10px] border-0 bg-[#f5f5f5] px-[14px] text-[14px] text-[#15181a] outline-none transition focus:bg-[#efefef] focus:ring-1 focus:ring-[#ff8500] placeholder:text-[#c9c9c9]"
          />
        </div>

        {error && (
          <p className="mt-2 text-[12px] font-semibold text-[#c0392b]">{error}</p>
        )}

        {success && (
          <p className="mt-2 text-[12px] font-semibold text-[#178A4B]">{success}</p>
        )}

        <button
          type="button"
          onClick={handleConvert}
          className="mt-4 flex h-[54px] w-full items-center justify-center rounded-full bg-[#ff8500] text-[15px] font-bold text-white transition hover:bg-[#f58200]"
        >
          Convert
        </button>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section className="mt-6">
          <h2 className="px-1 text-[15px] font-bold text-[#15181a]">
            History
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-[#f0f0f0] rounded-[14px] bg-white">
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
