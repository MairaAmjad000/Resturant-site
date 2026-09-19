"use client";

import { Minus, Plus, Heart } from "lucide-react";
import SafeImage from "./SafeImage";
import type { MenuItem } from "@/types/menu";
import { MAX_ITEM_QUANTITY } from "@/lib/cart";

interface MenuItemCardProps {
  item: MenuItem;
  quantity?: number;
  /** Favourites UI is only rendered when the user is signed in. */
  showFavourite?: boolean;
  isFavourite?: boolean;
  onToggleFavourite?: (itemId: string) => void;
  onAdd?: (itemId: string) => void;
  onIncrease?: (itemId: string) => void;
  onDecrease?: (itemId: string) => void;
}

export default function MenuItemCard({
  item,
  quantity = 0,
  showFavourite = false,
  isFavourite = false,
  onToggleFavourite,
  onAdd,
  onIncrease,
  onDecrease,
}: MenuItemCardProps) {
  return (
    <article className="flex items-start justify-between gap-4 border-b border-[#e9e3db] py-5 last:border-b-0">
      {item.imageUrl && (
        <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f5f1eb] sm:block">
          <SafeImage
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 border-b border-dashed border-[#d8d0c5] pb-2">
          <h3 className="min-w-0 truncate text-[17px] font-semibold tracking-[-0.17px] text-[#15181a]">
            {item.name}
          </h3>

          {showFavourite && (
            <button
              type="button"
              onClick={() => onToggleFavourite?.(item.id)}
              aria-pressed={isFavourite}
              aria-label={
                isFavourite
                  ? `Remove ${item.name} from favourites`
                  : `Save ${item.name} to favourites`
              }
              title={isFavourite ? "Remove from favourites" : "Save to favourites"}
              className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-[#fdeeec]"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavourite
                    ? "fill-[#ff3b19] text-[#ff3b19]"
                    : "text-[#c9c2b8] hover:text-[#ff3b19]"
                }`}
              />
            </button>
          )}
        </div>
        {item.description && (
          <p className="mt-2 text-[13px] leading-[1.55] text-[#4a5157]">
            {item.description}
          </p>
        )}
      </div>

      <span className="shrink-0 text-[17px] font-bold text-[#15181a]">
        {item.priceLabel ? `${item.priceLabel} ` : ""}£{item.price.toFixed(2)}
      </span>

      {quantity > 0 ? (
        <div className="flex h-[38px] shrink-0 items-center rounded-full border border-[#d8d0c5] bg-white">
          <button
            type="button"
            onClick={() => onDecrease?.(item.id)}
            aria-label={`Remove one ${item.name}`}
            className="flex h-[38px] w-[34px] items-center justify-center text-[#15181a]"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-5 text-center text-[13px] font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onIncrease?.(item.id)}
            disabled={quantity >= MAX_ITEM_QUANTITY}
            aria-label={`Add another ${item.name}`}
            className="flex h-[38px] w-[34px] items-center justify-center text-[#15181a] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAdd?.(item.id)}
          aria-label={`Add ${item.name} to order`}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#d8d0c5] bg-white text-[#15181a] transition-colors hover:bg-[#f5f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e3b2e]/40 active:scale-95"
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>
      )}
    </article>
  );
}
