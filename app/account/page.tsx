import type { Metadata } from "next";
import AccountClient from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "My Account | Porto Piri Piri",
  description: "Manage your profile, orders, and addresses",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AccountClient />
    </div>
  );
}
