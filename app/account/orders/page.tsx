import type { Metadata } from "next";
import OrdersPageClient from "@/components/account/OrdersPageClient";

export const metadata: Metadata = {
  title: "My Orders | Porto Piri Piri",
  description: "Track and manage all your previous orders",
};

export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <OrdersPageClient />
    </div>
  );
}
