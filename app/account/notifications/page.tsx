import type { Metadata } from "next";
import NotificationsPageClient from "@/components/account/NotificationsPageClient";

export const metadata: Metadata = {
  title: "Notifications | Porto Piri Piri",
  description: "Your order updates and announcements",
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <NotificationsPageClient />
    </div>
  );
}
