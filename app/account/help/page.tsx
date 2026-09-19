import type { Metadata } from "next";
import HelpPageClient from "@/components/account/HelpPageClient";
import { getSiteContent } from "@/lib/menu-data";

export const metadata: Metadata = {
  title: "Help & Support | Porto Piri Piri",
  description: "Contact us — call, email, or visit the restaurant",
};

export default async function HelpPage() {
  const site = await getSiteContent();

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <HelpPageClient storeInfo={site.storeInfo} />
    </div>
  );
}
