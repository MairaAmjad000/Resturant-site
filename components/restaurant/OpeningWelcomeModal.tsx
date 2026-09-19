"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface OpeningWelcomeModalProps {
  restaurantName: string;
  /** "17:00" — the takeaway's opening time. */
  opensAt: string;
  onClose: () => void;
  onPreOrder: () => void;
}

/**
 * Welcome dialog shown right after a successful login:
 * restaurant name, "Opens at 17:00" status pill, a browse note,
 * and a Pre Order CTA. Styled to the site theme (orange / cream).
 */
export default function OpeningWelcomeModal({
  restaurantName,
  opensAt,
  onClose,
  onPreOrder,
}: OpeningWelcomeModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${restaurantName} is currently closed`}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[20px] bg-white px-7 pb-7 pt-9 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#8a8f94] transition hover:bg-[#f5f5f5]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Restaurant name */}
        <h2 className="font-serif text-[28px] font-bold text-[#15181a]">
          {restaurantName}
        </h2>

        {/* Opens-at pill */}
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[#fdeeec] px-4 py-1.5 text-[13px] font-semibold text-[#c0392b]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c0392b] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c0392b]" />
          </span>
          Opens at {opensAt}
        </p>

        {/* Message */}
        <p className="mx-auto mt-4 max-w-[300px] text-[14px] leading-[22px] text-[#6b7075]">
          Feel free to browse the menu.
          <br />
          Ordering will be available when the takeaway opens.
        </p>

        {/* Pre Order CTA */}
        <button
          type="button"
          onClick={onPreOrder}
          className="mt-6 flex h-[54px] w-full items-center justify-center rounded-full bg-[#ff8500] text-[15px] font-bold text-white transition hover:bg-[#f58200]"
        >
          Pre Order
        </button>
      </div>
    </div>
  );
}
