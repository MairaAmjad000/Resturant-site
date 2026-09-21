import type { Metadata } from "next";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import PaymentClient from "@/components/checkout/PaymentClient";
import { getDeals, getMenuCategories, getSiteContent } from "@/lib/menu-data";

export const metadata: Metadata = {
  title: "Payment",
};

export default async function PaymentPage() {
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
        currentStep="payment"
        navLinks={site.navLinks}
        categories={categories}
        deals={deals}
      />

      <PaymentClient
        site={site}
        categories={categories}
        deals={deals}
      />
    </div>
  );
}
