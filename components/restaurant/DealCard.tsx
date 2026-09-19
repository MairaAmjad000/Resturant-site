"use client";

import type { DealItem } from "@/types/menu";

interface DealCardProps {
  deal: DealItem;
  onAdd?: (dealId: string) => void;
}

export default function DealCard({ deal, onAdd }: DealCardProps) {
  const ctaLabel = deal.ctaLabel ?? `Add deal — £${deal.price.toFixed(2)}`;

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

          <button
            type="button"
            onClick={() => onAdd?.(deal.id)}
            className="w-full whitespace-nowrap rounded-full border border-orange/40 bg-white px-4 py-2 text-sm font-semibold text-[#15181a] transition-colors duration-150 hover:bg-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 active:scale-95 active:bg-orange-deep sm:w-auto"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}