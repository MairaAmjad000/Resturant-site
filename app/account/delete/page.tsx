import type { Metadata } from "next";
import DeleteAccountPageClient from "@/components/account/DeleteAccountPageClient";

export const metadata: Metadata = {
  title: "Delete Account | Porto Piri Piri",
  description: "Permanently delete your Porto Piri Piri account",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <DeleteAccountPageClient />
    </div>
  );
}
