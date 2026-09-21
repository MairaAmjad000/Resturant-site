"use client";

import { Minus, Plus } from "lucide-react";
import type { DealItem } from "@/types/menu";
import { MAX_ITEM_QUANTITY } from "@/lib/cart";

interface DealCardProps {
  deal: DealItem;
  quantity?: number;
  onAdd?: (dealId: string) => void;
  onIncrease?: (dealId: string) => void;
  onDecrease?: (dealId: string) => void;
}

export default function DealCard({
  deal,
  quantity = 0,
  onAdd,
  onIncrease,
  onDecrease,
}: DealCardProps) {
  return (
    <article className="rounded-2xl border border-orange/25 bg-[#fdf5ec] p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-dashed border-orange/30 pb-3">
        {deal.badge && (
          <span className="rounded-full bg-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {deal.badge}
          </span>
        )}
        {deal.badgeHint && (
          <span className="text-xs font-semibold text-orange">{deal.badgeHint}</span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold text-[#15181a]">{deal.name}</h3>
          {deal.description && (
            <p className="mt-1 text-sm text-[#4a5157]">{deal.description}</p>
          )}

          {(deal.mainValue || deal.sideValue) && (
            <dl className="mt-3 flex flex-col gap-1 text-sm text-[#4a5157]">
              {deal.mainValue && (
                <div className="flex gap-1">
                  <dt className="font-semibold text-[#15181a]">{deal.mainLabel ?? "Main"}:</dt>
                  <dd>{deal.mainValue}</dd>
                </div>
              )}
              {deal.sideValue && (
                <div className="flex gap-1">
                  <dt className="font-semibold text-[#15181a]">{deal.sideLabel ?? "Side"}:</dt>
                  <dd>{deal.sideValue}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3 sm:min-w-[170px]">
          <div className="text-right">
            {deal.originalPrice && (
              <span className="block text-sm text-[#7c848b] line-through">
                £{deal.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-bold text-[#15181a]">£{deal.price.toFixed(2)}</span>
          </div>

          {/* Same + / stepper control as the menu item cards. */}
          {quantity > 0 ? (
            <div className="flex h-[38px] shrink-0 items-center rounded-full border border-[#d8d0c5] bg-white">
              <button
                type="button"
                onClick={() => onDecrease?.(deal.id)}
                aria-label={`Remove one ${deal.name}`}
                className="flex h-[38px] w-[34px] items-center justify-center text-[#15181a]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-5 text-center text-[13px] font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onIncrease?.(deal.id)}
                disabled={quantity >= MAX_ITEM_QUANTITY}
                aria-label={`Add another ${deal.name}`}
                className="flex h-[38px] w-[34px] items-center justify-center text-[#15181a] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd?.(deal.id)}
              aria-label={`Add ${deal.name} to order`}
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#d8d0c5] bg-white text-[#15181a] transition-colors hover:bg-[#f5f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e3b2e]/40 active:scale-95"
            >
              <Plus className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}