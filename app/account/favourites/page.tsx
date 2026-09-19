import type { Metadata } from "next";
import FavouritesPageClient from "@/components/account/FavouritesPageClient";
import { getDeals, getMenuCategories } from "@/lib/menu-data";

export const metadata: Metadata = {
  title: "Favourites | Porto Piri Piri",
  description: "Your favourite menu items",
};

export default async function FavouritesPage() {
  const [categories, deals] = await Promise.all([
    getMenuCategories(),
    getDeals(),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <FavouritesPageClient categories={categories} deals={deals} />
    </div>
  );
}
