"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shown on the right when there's a query — "5 items" or "No matches". */
  resultLabel?: string;
  /** True when the query matches nothing — turns the label red. */
  noResults?: boolean;
}

/**
 * Themed menu search bar.
 * Warm grey field with the theme's dark-green border at rest, orange focus
 * ring, orange search icon that turns dark when typing, clear button and
 * live result count.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search the menu",
  resultLabel,
  noResults = false,
}: SearchBarProps) {
  const hasQuery = value.trim().length > 0;

  return (
    <div
      className={`flex h-[54px] w-full items-center gap-3 rounded-[13px] border border-white/35 bg-[#f5f5f5] pr-4 pl-4 transition-all duration-150 focus-within:border-[#ff8500]/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-white/100 ${
        noResults ? "ring-1 ring-[#e5484d]/50" : ""
      }`}
      role="search"
    >
      <Search
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
          hasQuery ? "text-[#15181a]" : "text-[#ff8500]"
        }`}
        strokeWidth={2.2}
        aria-hidden
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search menu items"
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#15181a] outline-none placeholder:text-[#9aa0a5] [&::-webkit-search-cancel-button]:hidden"
      />

      {hasQuery && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8e8e8] text-[#666] transition-colors hover:bg-[#ff8500] hover:text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}

      {hasQuery && resultLabel && (
        <span
          className={`shrink-0 text-[12px] font-bold uppercase tracking-wide ${
            noResults ? "text-[#e5484d]" : "text-[#ff8500]"
          }`}
        >
          {resultLabel}
        </span>
      )}
    </div>
  );
}
