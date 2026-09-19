import type { Metadata } from "next";
import LoyaltyPageClient from "@/components/account/LoyaltyPageClient";

export const metadata: Metadata = {
  title: "Loyalty Points | Porto Piri Piri",
  description: "Your loyalty points balance and conversion",
};

export default function LoyaltyPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <LoyaltyPageClient />
    </div>
  );
}
