import type { Metadata } from "next";
import AddressesPageClient from "@/components/account/AddressesPageClient";

export const metadata: Metadata = {
  title: "Saved Addresses | Porto Piri Piri",
  description: "Manage delivery and collection addresses",
};

export default function SavedAddressesPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AddressesPageClient />
    </div>
  );
}
