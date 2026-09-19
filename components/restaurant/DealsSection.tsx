import { Star } from "lucide-react";
import DealCard from "./DealCard";
import type { DealItem } from "@/types/menu";

interface DealsSectionProps {
  id?: string;
  deals: DealItem[];
  onAddDeal?: (dealId: string) => void;
}

export default function DealsSection({ id, deals, onAddDeal }: DealsSectionProps) {
  if (deals.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-header">
      <div className="flex items-center gap-4 border-b-2 border-[#15181a] pb-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#fdecd8]">
          <Star className="h-[18px] w-[18px] text-orange" fill="currentColor" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[1.4px] text-orange">Limited</p>
          <h2 id={`${id}-heading`} className="font-serif text-2xl font-bold text-[#15181a] sm:text-[25px]">
            Deals
          </h2>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onAdd={onAddDeal} />
        ))}
      </div>
    </section>
  );
}