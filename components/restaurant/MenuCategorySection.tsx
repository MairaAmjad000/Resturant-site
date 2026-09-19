import {
  Beef,
  Sandwich,
  Drumstick,
  Flame,
  Salad,
  CupSoda,
  IceCreamCone,
  Cookie,
  Soup,
  Pizza,
} from "lucide-react";

import MenuItemCard from "./MenuItemCard";

import type { MenuCategory } from "@/types/menu";

interface MenuCategorySectionProps {
  category: MenuCategory;
  quantities?: Record<string, number>;
  favouriteIds?: Set<string>;
  showFavourite?: boolean;
  onToggleFavourite?: (itemId: string) => void;
  onAddItem?: (itemId: string) => void;
  onIncrease?: (itemId: string) => void;
  onDecrease?: (itemId: string) => void;
}

const ICONS = {
  beef: Beef,
  sandwich: Sandwich,
  drumstick: Drumstick,
  flame: Flame,
  salad: Salad,
  cupsoda: CupSoda,
  icecream: IceCreamCone,
  cookie: Cookie,
  soup: Soup,
  pizza: Pizza,
} as const;

const TINTS = {
  green: "bg-[#eef3f0]",
  neutral: "bg-[#f5f1eb]",
  pink: "bg-[#fbeef2]",
  blue: "bg-[#e9f1f8]",
} as const;

export default function MenuCategorySection({
  category,
  quantities,
  favouriteIds,
  showFavourite,
  onToggleFavourite,
  onAddItem,
  onIncrease,
  onDecrease,
}: MenuCategorySectionProps) {
  const Icon = ICONS[category.icon];

  return (
    <section
      id={category.slug}
      aria-labelledby={`${category.slug}-heading`}
      className="scroll-mt-24"
    >
      <div className="flex items-center gap-4 border-b-2 border-[#15181a] pb-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${TINTS[category.tint]}`}
        >
          <Icon
            className="h-[18px] w-[18px] text-[#15181a]"
            aria-hidden
          />
        </span>

        <h2
          id={`${category.slug}-heading`}
          className="flex-1 font-serif text-2xl font-bold uppercase tracking-[0.6px] text-[#15181a] sm:text-[25px]"
        >
          {category.name}
        </h2>

        <span className="shrink-0 text-xs text-[#7c848b]">
          {category.items.length} items
        </span>
      </div>

      <div className="rounded-b-2xl border border-t-0 border-[#e9e3db] bg-white px-4 sm:px-6">
        {category.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={quantities?.[item.id] ?? 0}
            showFavourite={showFavourite}
            isFavourite={favouriteIds?.has(item.id) ?? false}
            onToggleFavourite={onToggleFavourite}
            onAdd={onAddItem}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
        ))}
      </div>
    </section>
  );
}