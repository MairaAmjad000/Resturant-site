"use client";

import { useMemo } from "react";
import CheckoutHeader, { type CheckoutStep } from "./CheckoutHeader";
import CheckoutClient from "./CheckoutClient";
import { cartQuantity, buildCartCatalog } from "@/lib/cart";
import { useStoredCart } from "@/lib/use-stored-cart";
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
  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );
  const cart = useStoredCart(catalog);
  const cartCount = cart ? cartQuantity(cart) : 0;

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <CheckoutHeader
        logoUrl={site.logoUrl}
        logoAlt={site.name}
        currentStep={step}
        cartCount={cartCount}
      />

      <CheckoutClient
        site={site}
        categories={categories}
        deals={deals}
      />
    </div>
  );
}
