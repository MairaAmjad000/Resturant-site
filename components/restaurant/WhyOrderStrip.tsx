import { Truck, Flame, ShieldCheck } from "lucide-react";
import type { Perk } from "@/types/menu";

interface WhyOrderStripProps {
  perks: Perk[];
}

const ICONS = { truck: Truck, flame: Flame, shield: ShieldCheck } as const;
const TINTS = {
  green: "bg-[#eef3f0] text-[#0e3b2e]",
  pink: "bg-[#fbeef2] text-[#a13a63]",
  blue: "bg-[#e9f1f8] text-[#1f5f8b]",
} as const;

export default function WhyOrderStrip({ perks }: WhyOrderStripProps) {
  return (
    <section className="border-y border-[#e9e3db] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
        {perks.map((perk) => {
          const Icon = ICONS[perk.icon];
          return (
            <div key={perk.id} className="flex items-center gap-3">
              <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] ${TINTS[perk.tint]}`}>
                <Icon className="h-[17px] w-[17px]" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#1a1a1a]">{perk.title}</p>
                <p className="text-xs text-[#7c848b]">{perk.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}