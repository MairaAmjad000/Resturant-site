"use client";

import { useState } from "react";
import {
  Star,
  Beef,
  Sandwich,
  Drumstick,
  Flame,
  Salad,
  CupSoda,
  IceCream2,
  Cookie,
  Soup,
  Pizza,
} from "lucide-react";
import type { SidebarNavItem } from "@/types/menu";

interface CategorySidebarProps {
  items: SidebarNavItem[];
}

const ICONS = {
  star: Star,
  beef: Beef,
  sandwich: Sandwich,
  drumstick: Drumstick,
  flame: Flame,
  salad: Salad,
  cupsoda: CupSoda,
  icecream: IceCream2,
  cookie: Cookie,
  soup: Soup,
  pizza: Pizza,
} as const;

const TINTS = {
  green: "bg-[#eef3f0]",
  neutral: "bg-[#f5f1eb]",
  pink: "bg-[#fbeef2]",
  blue: "bg-[#e9f1f8]",
  orange: "bg-[#fdecd8]",
} as const;

export default function CategorySidebar({ items }: CategorySidebarProps) {
  const [active, setActive] = useState(items[0]?.slug);

  const handleClick = (slug: string) => {
    setActive(slug);
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav aria-label="Menu categories" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = active === item.slug;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item.slug)}
            aria-current={isActive ? "true" : undefined}
            className={`flex h-11 items-center gap-3 rounded-[10px] px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e3b2e]/40 ${
              isActive ? "bg-[#0e3b2e]" : "hover:bg-[#f5f1eb]"
            }`}
          >
            <span
              className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] ${
                isActive ? "bg-white/20" : TINTS[item.tint]
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? "text-white" : item.icon === "star" ? "text-orange" : "text-[#15181a]"}`}
                fill={item.icon === "star" && !isActive ? "currentColor" : "none"}
                aria-hidden
              />
            </span>
            <span className={`flex-1 truncate text-[13px] font-medium ${isActive ? "text-white" : "text-[#4a5157]"}`}>
              {item.name}
            </span>
            <span className={`text-xs font-medium ${isActive ? "text-white/70" : "text-[#7c848b]"}`}>
              {item.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}