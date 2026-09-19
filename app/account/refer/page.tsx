import type { Metadata } from "next";
import ReferPageClient from "@/components/account/ReferPageClient";

export const metadata: Metadata = {
  title: "Refer & Earn | Porto Piri Piri",
  description: "Share your referral code and earn rewards",
};

export default function ReferPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <ReferPageClient />
    </div>
  );
}
