"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { lineUnitPrice, type LineSelections } from "@/lib/cart";
import { RadioDot, CheckBox } from "@/components/ui/OptionControls";
import type { MenuItem, MenuItemOptionGroup } from "@/types/menu";

interface CustomiseItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (quantity: number, selections: LineSelections) => void;
}

/* =========================================================
   OPTION ROW
========================================================= */

function OptionRow({
  name,
  price,
  kind,
  groupName,
  checked,
  onToggle,
}: {
  name: string;
  price: number;
  kind: "choice" | "addon";
  groupName: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const priceLabel =
    price === 0 ? "Free" : price > 0 ? `+£${price.toFixed(2)}` : `−£${Math.abs(price).toFixed(2)}`;

  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 border-b border-[#f0f0f0] py-[14px] last:border-b-0 ${
        checked ? "opacity-100" : ""
      }`}
    >
      <span className="min-w-0 truncate text-[14px] font-medium text-[#15181a]">
        {name}
      </span>

      <span className="flex shrink-0 items-center gap-4">
        <span className="text-[13px] text-[#6b7075]">{priceLabel}</span>

        {kind === "choice" ? (
          <>
            <input
              type="radio"
              name={`opt-group-${groupName}`}
              checked={checked}
              onChange={onToggle}
              aria-label={`Select ${name}`}
              className="sr-only"
            />
            <RadioDot checked={checked} />
          </>
        ) : (
          <>
            <input
              type="checkbox"
              checked={checked}
              onChange={onToggle}
              aria-label={`Select ${name}`}
              className="sr-only"
            />
            <CheckBox checked={checked} />
          </>
        )}
      </span>
    </label>
  );
}

/* =========================================================
   GROUP BLOCK
========================================================= */

function GroupBlock({
  group,
  selected,
  onToggleOption,
}: {
  group: MenuItemOptionGroup;
  selected: string[];
  onToggleOption: (optionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleOptions = expanded
    ? group.options
    : group.options.slice(0, group.collapsedVisible ?? group.options.length);

  const hiddenCount = group.options.length - visibleOptions.length;

  const badge =
    group.required ? (
      <span className="rounded-full bg-[#15181a] px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-white">
        Required
      </span>
    ) : (
      <span className="rounded-full bg-[#fdecd8] px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-[#ff8500]">
        Optional
      </span>
    );

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-bold text-[#15181a]">{group.title}</h3>
        {badge}
      </div>

      <div className="mt-1">
        {visibleOptions.map((option) => (
          <OptionRow
            key={option.id}
            name={option.name}
            price={option.price}
            kind={group.kind}
            groupName={group.id}
            checked={selected.includes(option.id)}
            onToggle={() => onToggleOption(option.id)}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#ff8500] hover:underline"
          >
            Show More
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   MODAL
========================================================= */

export default function CustomiseItemModal({
  item,
  onClose,
  onAdd,
}: CustomiseItemModalProps) {
  const groups = useMemo(() => item.optionGroups ?? [], [item.optionGroups]);

  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");

  /* Lock scroll + Escape */
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const toggleOption = (group: MenuItemOptionGroup, optionId: string) => {
    setError("");

    setSelections((current) => {
      const picked = current[group.id] ?? [];

      if (group.kind === "choice") {
        const isSame = picked.length === 1 && picked[0] === optionId;
        return { ...current, [group.id]: isSame ? [] : [optionId] };
      }

      return {
        ...current,
        [group.id]: picked.includes(optionId)
          ? picked.filter((id) => id !== optionId)
          : [...picked, optionId],
      };
    });
  };

  const missingRequired = groups.filter(
    (group) => group.required && (selections[group.id] ?? []).length === 0
  );

  const unitPrice = lineUnitPrice(item, selections);
  const total = unitPrice * quantity;

  const handleAdd = () => {
    if (missingRequired.length > 0) {
      setError(
        `Please choose an option for ${missingRequired
          .map((group) => group.title)
          .join(", ")}.`
      );
      return;
    }

    onAdd(
      quantity,
      Object.keys(selections).length > 0 ? selections : null
    );
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Customise ${item.name}`}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:rounded-[16px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#f5f5f5] text-[#666] transition hover:bg-[#eaeaea]"
        >
          <X className="h-[14px] w-[14px]" />
        </button>

        {/* Scrollable body */}
        <div className="modal-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#ff8500]">
            {groups.length > 0 ? "Customise" : "Add to order"}
          </p>

          <h2 className="mt-1.5 text-[22px] font-bold leading-tight text-[#15181a]">
            {item.name}
          </h2>

          <p className="mt-1 text-[15px] font-bold text-[#ff8500]">
            {groups.some((group) => group.kind === "choice") ? "from " : ""}£
            {item.price.toFixed(2)}
          </p>

          {item.description && (
            <p className="mt-2 text-[13px] leading-[20px] text-[#4a5157]">
              {item.description}
            </p>
          )}

          {groups.map((group) => (
            <GroupBlock
              key={group.id}
              group={group}
              selected={selections[group.id] ?? []}
              onToggleOption={(optionId) => toggleOption(group, optionId)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-5 pt-4">
          {error && (
            <p className="mb-3 text-[12px] font-semibold text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#e0e0e0] text-[#15181a] transition hover:bg-[#fafafa]"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="min-w-5 text-center text-[15px] font-bold text-[#15181a]">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                aria-label="Increase quantity"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#e0e0e0] text-[#15181a] transition hover:bg-[#fafafa]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[15px] text-[#15181a]">
              Total:{" "}
              <span className="text-[18px] font-bold">£{total.toFixed(2)}</span>
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[51px] flex-1 rounded-full border border-[#e0e0e0] bg-white text-[14px] font-semibold text-[#15181a] transition hover:bg-[#fafafa]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className="h-[51px] flex-[1.6] rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-[#f58200]"
            >
              Add to Cart — £{total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
