import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";
import { getDeals, getMenuCategories, getSiteContent } from "@/lib/menu-data";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const [site, categories, deals] = await Promise.all([
    getSiteContent(),
    getMenuCategories(),
    getDeals(),
  ]);

  return (
    <CheckoutView
      site={site}
      categories={categories}
      deals={deals}
      step="checkout"
    />
  );
}
