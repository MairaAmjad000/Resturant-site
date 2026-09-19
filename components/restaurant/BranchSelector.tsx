"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import {
  BRANCHES,
  getBranchSnapshot,
  getServerBranchSnapshot,
  setSelectedBranch,
  subscribeToBranch,
} from "@/lib/branches";

interface BranchSelectorProps {
  /** Checkout shows the selected branch as a static pill (no dropdown). */
  readOnly?: boolean;
  className?: string;
}

/**
 * Pretty themed branch dropdown.
 * Button shows the currently-selected branch; opening reveals all
 * branches with their addresses, check mark on the active one.
 * Selection is shared app-wide via localStorage (lib/branches.ts),
 * so picking a branch on the home page carries to the checkout navbar.
 */
export default function BranchSelector({
  readOnly = false,
  className = "",
}: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useSyncExternalStore(
    subscribeToBranch,
    getBranchSnapshot,
    getServerBranchSnapshot
  );

  /* Close on outside click + Escape */
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup={readOnly ? undefined : "listbox"}
        aria-expanded={readOnly ? undefined : open}
        disabled={readOnly}
        onClick={() => {
          if (!readOnly) setOpen((v) => !v);
        }}
        className={`group flex h-[40px] items-center gap-2 rounded-full border border-[#d8d0c5] bg-white px-4 text-[13px] font-semibold text-[#15181a] ${
          readOnly
            ? "cursor-default"
            : "cursor-pointer transition hover:bg-orange"
        }`}
      >
        <MapPin
          className={`h-3.5 w-3.5 text-[#ff8500] ${
            readOnly ? "" : "transition-colors group-hover:text-white"
          }`}
          strokeWidth={2.2}
        />
        <span className="max-w-[110px] truncate">{selected.name}</span>
        {!readOnly && (
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#4a5157] transition-all duration-200 group-hover:text-white ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {open && !readOnly && (
        <div
          role="listbox"
          aria-label="Choose a branch"
          className="absolute right-0 top-[calc(100%+8px)] z-[110] w-[280px] overflow-hidden rounded-2xl border border-[#e9e3db] bg-white shadow-[0_18px_48px_rgba(14,59,46,0.16)]"
        >
          <p className="border-b border-[#f0eae2] px-4 pb-2.5 pt-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8f94]">
            Choose a branch
          </p>
          <div className="max-h-[280px] overflow-y-auto p-1.5">
            {BRANCHES.map((branch) => {
              const isActive = branch.id === selected.id;

              return (
                <button
                  key={branch.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setSelectedBranch(branch.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-orange/10" : "hover:bg-[#f5f1eb]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      isActive ? "bg-[#ff8500] text-white" : "bg-[#f5f1eb] text-[#8a8f94]"
                    }`}
                  >
                    {isActive ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" strokeWidth={2.2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[13px] font-bold ${
                        isActive ? "text-[#ff8500]" : "text-[#15181a]"
                      }`}
                    >
                      {branch.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[#8a8f94]">
                      {branch.address}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
