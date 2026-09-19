import type { Metadata } from "next";
import ProfilePageClient from "@/components/account/ProfilePageClient";

export const metadata: Metadata = {
  title: "My Profile | Porto Piri Piri",
  description: "Update your personal details",
};

export default function MyProfilePage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <ProfilePageClient />
    </div>
  );
}
