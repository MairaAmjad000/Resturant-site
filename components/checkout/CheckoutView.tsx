"use client";

import CheckoutHeader, { type CheckoutStep } from "./CheckoutHeader";
import CheckoutClient from "./CheckoutClient";
import type { SiteContent } from "@/lib/menu-data";
import type { DealItem, MenuCategory } from "@/types/menu";

interface CheckoutViewProps {
  site: SiteContent;
  categories: MenuCategory[];
  deals: DealItem[];
  step?: CheckoutStep;
}

export default function CheckoutView({
  site,
  categories,
  deals,
  step = "checkout",
}: CheckoutViewProps) {
  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <CheckoutHeader
        logoUrl={site.logoUrl}
        logoAlt={site.name}
        currentStep={step}
        navLinks={site.navLinks}
        categories={categories}
        deals={deals}
      />

      <CheckoutClient
        site={site}
        categories={categories}
        deals={deals}
      />
    </div>
  );
}
