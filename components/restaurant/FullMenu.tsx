// components/restaurant/FullMenu.tsx

import { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import CategorySidebar from "./CategorySidebar";
import MenuCategorySection from "./MenuCategorySection";
import DealsSection from "./DealsSection";
import type { MenuCategory, DealItem, SidebarNavItem } from "@/types/menu";

interface FullMenuProps {
  categories: MenuCategory[];
  deals?: DealItem[];
  totalDishes?: number;
  quantities?: Record<string, number>;
  favouriteIds?: Set<string>;
  showFavourite?: boolean;
  onToggleFavourite?: (itemId: string) => void;
  onAddItem?: (itemId: string) => void;
  onAddDeal?: (dealId: string) => void;
  onIncrease?: (itemId: string) => void;
  onDecrease?: (itemId: string) => void;
}

export default function FullMenu({
  categories,
  deals = [],
  totalDishes,
  quantities = {},
  favouriteIds,
  showFavourite,
  onToggleFavourite,
  onAddItem,
  onAddDeal,
  onIncrease,
  onDecrease,
}: FullMenuProps) {
  const [query, setQuery] = useState("");

  const dishCount = totalDishes ?? categories.reduce((sum, c) => sum + c.items.length, 0);

  /* Filter menu items by name + description (case-insensitive).
     An empty/whitespace query passes everything through untouched. */
  const filteredCategories: MenuCategory[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.description ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, query]);

  const matchCount = filteredCategories.reduce(
    (sum, c) => sum + c.items.length,
    0
  );
  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && matchCount === 0;

  const sidebarItems: SidebarNavItem[] = [
    ...(deals.length > 0
      ? [
          {
            id: "deals",
            slug: "deals",
            name: "Deals",
            icon: "star" as const,
            tint: "orange" as const,
            count: deals.length,
          },
        ]
      : []),
    ...categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      tint: c.tint,
      count: c.items.length,
    })),
  ];

  return (
    <main id="menu" className="mx-auto max-w-7xl scroll-mt-header px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange">Full menu</p>
      <h1 className="mt-2 max-w-xl font-serif text-3xl font-bold text-[#15181a] sm:text-4xl">
        {dishCount} dishes, cooked to order
      </h1>

      {/* Menu search — filters items live as you type */}
      <div className="mt-8 max-w-xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          resultLabel={noResults ? "No matches" : `${matchCount} item${matchCount === 1 ? "" : "s"}`}
          noResults={noResults}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[232px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <CategorySidebar items={sidebarItems} />
        </aside>

        <div className="flex flex-col gap-12">
          {hasQuery ? (
            noResults ? (
              <div className="rounded-2xl border border-dashed border-[#d8d0c5] bg-white px-6 py-14 text-center">
                <p className="font-serif text-2xl font-bold text-[#15181a]">
                  Nothing matches “{query.trim()}”
                </p>
                <p className="mt-2 text-[14px] text-[#6b7075]">
                  Try a different word — or ask us, the kitchen loves a
                  challenge.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-6 inline-flex h-[46px] items-center rounded-full bg-[#ff8500] px-6 text-[14px] font-bold text-white transition hover:bg-[#f07d00]"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <MenuCategorySection
                  key={category.id}
                  category={category}
                  quantities={quantities}
                  favouriteIds={favouriteIds}
                  showFavourite={showFavourite}
                  onToggleFavourite={onToggleFavourite}
                  onAddItem={onAddItem}
                  onIncrease={onIncrease}
                  onDecrease={onDecrease}
                />
              ))
            )
          ) : (
            <>
              {deals.length > 0 && (
                <DealsSection id="deals" deals={deals} onAddDeal={onAddDeal} />
              )}
              {categories.map((category) => (
                <MenuCategorySection
                  key={category.id}
                  category={category}
                  quantities={quantities}
                  favouriteIds={favouriteIds}
                  showFavourite={showFavourite}
                  onToggleFavourite={onToggleFavourite}
                  onAddItem={onAddItem}
                  onIncrease={onIncrease}
                  onDecrease={onDecrease}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}