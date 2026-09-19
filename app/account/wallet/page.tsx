import type { Metadata } from "next";
import WalletPageClient from "@/components/account/WalletPageClient";

export const metadata: Metadata = {
  title: "Wallet | Porto Piri Piri",
  description: "Your wallet balance and transactions",
};

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <WalletPageClient />
    </div>
  );
}
