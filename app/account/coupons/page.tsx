import type { Metadata } from "next";
import CouponsPageClient from "@/components/account/CouponsPageClient";

export const metadata: Metadata = {
  title: "Coupons | Porto Piri Piri",
  description: "Your available coupons and discount codes",
};

export default function CouponsPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <CouponsPageClient />
    </div>
  );
}
