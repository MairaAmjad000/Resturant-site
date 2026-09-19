import RestaurantShell from "@/components/restaurant/RestaurantShell";
import { getMenuCategories, getSiteContent, getDeals } from "@/lib/menu-data";

export default async function HomePage() {
  const [categories, deals, site] = await Promise.all([
    getMenuCategories(),
    getDeals(),
    getSiteContent(),
  ]);

  return <RestaurantShell categories={categories} deals={deals} site={site} />;
}