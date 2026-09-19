"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Share2, X } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import { getReferralCode } from "@/lib/account";

export default function ReferPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState("");

  if (code === null && typeof window !== "undefined") {
    setCode(getReferralCode());
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
            Sign in from the menu page to get your referral code.
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

  const handleCopy = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShared("Couldn't access the clipboard — copy the code manually.");
    }
  };

  const handleShare = async () => {
    if (!code) return;

    const shareData = {
      title: "Porto Piri Piri — Refer & Earn",
      text: `Use my referral code ${code} when you sign up!`,
      url: typeof window !== "undefined" ? window.location.origin : "",
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user dismissed the share sheet — nothing to do */
        return;
      }
    }

    /* Fallback: copy a shareable message */
    try {
      await navigator.clipboard.writeText(
        `${shareData.text} ${shareData.url}`
      );
      setShared("Sharing isn't supported here — the invite was copied instead.");
      window.setTimeout(() => setShared(""), 3500);
    } catch {
      setShared("Sharing isn't supported in this browser.");
    }
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* Close */}
      <Link
        href="/"
        aria-label="Close refer page"
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
        Refer &amp; Earn
      </h1>

      {/* Referral code card */}
      <section className="mt-5 rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-7">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-[#ff8500]">
          Your referral code
        </p>

        <p className="mt-3 break-all text-[26px] font-bold leading-tight text-[#15181a] sm:text-[30px]">
          {code ?? "…"}
        </p>

        <p className="mt-2 text-[13px] text-[#9aa0a5]">
          Share this code with friends. When they sign up and order, you can
          earn rewards.
        </p>
      </section>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-[54px] items-center justify-center gap-2 rounded-full bg-[#ff8500] text-[15px] font-bold text-white transition hover:bg-[#f58200]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy code
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex h-[54px] items-center justify-center gap-2 rounded-full border border-[#e0e0e0] bg-white text-[15px] font-bold text-[#15181a] transition hover:bg-[#fafafa]"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {shared && (
        <p className="mt-3 text-[13px] font-medium text-[#6b7075]">{shared}</p>
      )}
    </main>
  );
}
