"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, X, Plus, ArrowDownLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import {
  addWalletFunds,
  readWallet,
  type WalletState,
  type WalletTransaction,
} from "@/lib/account";

/* =========================================================
   TRANSACTION ROW HELPERS
========================================================= */

const KIND_META: Record<
  WalletTransaction["kind"],
  { label: string; incoming: boolean }
> = {
  topup: { label: "Top-up", incoming: true },
  refund: { label: "Refund", incoming: true },
  payment: { label: "Payment", incoming: false },
};

function TransactionRow({ txn }: { txn: WalletTransaction }) {
  const meta = KIND_META[txn.kind] ?? KIND_META.payment;
  const Icon = meta.incoming
    ? txn.kind === "refund"
      ? RotateCcw
      : ArrowDownLeft
    : ArrowUpRight;

  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <span
        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${
          meta.incoming
            ? "bg-[#e6f4ec] text-[#178A4B]"
            : "bg-[#fdeeec] text-[#c0392b]"
        }`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#15181a]">
          {meta.label}
          {txn.note ? (
            <span className="font-normal text-[#9aa0a5]"> · {txn.note}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[12px] text-[#9aa0a5]">
          {new Date(txn.at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <span
        className={`shrink-0 text-[14px] font-bold ${
          meta.incoming ? "text-[#178A4B]" : "text-[#c0392b]"
        }`}
      >
        {meta.incoming ? "+" : "−"}£{txn.amount.toFixed(2)}
      </span>
    </li>
  );
}

/* =========================================================
   WALLET PAGE
========================================================= */

const TOPUP_AMOUNTS = [10, 20, 50];

export default function WalletPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  /* Hydrate after mount (SSR-safe localStorage read). */
  if (wallet === null && typeof window !== "undefined") {
    setWallet(readWallet());
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
            Sign in from the menu page to use your wallet.
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

  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.transactions ?? [];

  const handleTopUp = (amount: number) => {
    setWallet(addWalletFunds(amount, "topup", "Wallet top-up"));
    setJustAdded(amount);
    window.setTimeout(() => setJustAdded(null), 2500);
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* ---------- Close ---------- */}
      <Link
        href="/"
        aria-label="Close wallet page"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* ---------- Back ---------- */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#15181a] hover:text-[#ff8500]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* ---------- Heading ---------- */}
      <h1 className="mt-5 text-[28px] font-bold text-[#15181a]">Wallet</h1>

      {/* ---------- Balance card ---------- */}
      <section className="mt-5 rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-7">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-[#ff8500]">
          Available balance
        </p>

        <p className="mt-2 text-[34px] font-bold leading-none text-[#15181a]">
          £{balance.toFixed(2)}
        </p>

        <p className="mt-3 text-[13px] text-[#9aa0a5]">
          Spend your balance at checkout — top up to get started.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {TOPUP_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleTopUp(amount)}
              className="inline-flex h-[44px] items-center gap-1.5 rounded-full bg-[#ff8500] px-6 text-[14px] font-bold text-white transition hover:bg-[#f58200]"
            >
              <Plus className="h-4 w-4" />£{amount}
            </button>
          ))}
        </div>

        {justAdded !== null && (
          <p className="mt-3 text-[13px] font-semibold text-[#178A4B]">
            £{justAdded.toFixed(2)} added to your wallet.
          </p>
        )}
      </section>

      {/* ---------- Transactions ---------- */}
      {transactions.length === 0 ? (
        <p className="mt-6 text-[14px] text-[#9aa0a5]">
          No wallet transactions yet.
        </p>
      ) : (
        <section className="mt-6">
          <h2 className="px-1 text-[15px] font-bold text-[#15181a]">
            Transactions
          </h2>

          <ul className="mt-3 flex flex-col divide-y divide-[#f0f0f0] rounded-[14px] bg-white">
            {transactions.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
