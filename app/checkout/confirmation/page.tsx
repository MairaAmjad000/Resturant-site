import type { Metadata } from "next";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import ConfirmationClient from "@/components/checkout/ConfirmationClient";
import { getDeals, getMenuCategories, getSiteContent } from "@/lib/menu-data";

export const metadata: Metadata = {
  title: "Confirmation",
};

export default async function ConfirmationPage() {
  const [site, categories, deals] = await Promise.all([
    getSiteContent(),
    getMenuCategories(),
    getDeals(),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <CheckoutHeader
        logoUrl={site.logoUrl}
        logoAlt={site.name}
        currentStep="confirmation"
        navLinks={site.navLinks}
        categories={categories}
        deals={deals}
      />

      <ConfirmationClient
        site={site}
        categories={categories}
        deals={deals}
      />
    </div>
  );
}
