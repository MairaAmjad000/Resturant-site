"use client";

import Link from "next/link";
import { ArrowLeft, X, Phone, Mail, MapPin, ChevronRight } from "lucide-react";
import type { StoreInfo } from "@/types/menu";

interface HelpPageClientProps {
  storeInfo: StoreInfo;
}

export default function HelpPageClient({ storeInfo }: HelpPageClientProps) {
  const contactRows = [
    {
      icon: Phone,
      label: "Call us",
      value: storeInfo.phone,
      href: `tel:${storeInfo.phone}`,
    },
    {
      icon: Mail,
      label: "Email",
      value: storeInfo.email,
      href: `mailto:${storeInfo.email}`,
    },
    {
      icon: MapPin,
      label: "Visit",
      value: storeInfo.address,
      href: storeInfo.mapEmbedUrl
        ? undefined
        : `https://maps.google.com/?q=${encodeURIComponent(storeInfo.address)}`,
    },
  ];

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* Close */}
      <Link
        href="/"
        aria-label="Close help page"
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
        Help &amp; Support
      </h1>

      {/* Contact cards */}
      <div className="mt-5 flex flex-col gap-4">
        {contactRows.map(({ icon: Icon, label, value, href }) => {
          const inner = (
            <>
              <span className="flex items-center gap-3">
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#fdf1e3] text-[#ff8500]">
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="text-[15px] font-bold text-[#15181a]">
                  {label}
                </span>
              </span>

              <span className="flex min-w-0 items-center gap-1 text-[13px] text-[#9aa0a5]">
                <span className="truncate">{value}</span>
                {href && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </span>
            </>
          );

          const rowClass =
            "flex items-center justify-between gap-4 rounded-[14px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]";

          return href ? (
            <a key={label} href={href} className={`${rowClass} transition hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]`}>
              {inner}
            </a>
          ) : (
            <div key={label} className={rowClass}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Opening note */}
      <p className="mt-6 text-[13px] leading-[20px] text-[#9aa0a5]">
        We open at 17:00. For order issues, have your order number ready — it
        starts with PPP and is shown on your confirmation and in My Orders.
      </p>
    </main>
  );
}
