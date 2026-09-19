"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, ShoppingBag } from "lucide-react";
import { checkDelivery, writeDeliveryCheck, type DeliveryCheck } from "@/lib/delivery";

interface PostcodeModalProps {
  onClose: () => void;
  /** Fired when the user confirms — delivers the check result to the caller. */
  onConfirmed: (check: DeliveryCheck) => void;
}

/**
 * "Where should we deliver?" postcode modal.
 * Reference design: serif title, helper copy, label + input with orange
 * Check pill, red validation error, dashed divider, Collection only button.
 */
export default function PostcodeModal({ onClose, onConfirmed }: PostcodeModalProps) {
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Escape to close + autofocus */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    inputRef.current?.focus();

    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  /* Lock background scroll */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleCheck = () => {
    const result = checkDelivery(postcode);

    if (!result.deliverable && postcode.trim()) {
      // Distinguish "not a postcode" from "outside the area"
      const shaped = postcode.trim().toUpperCase().replace(/\s+/g, "");
      const looksLikePostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(shaped);

      setError(
        looksLikePostcode
          ? "Sorry — we don't deliver to your area yet. Collection is always available."
          : "Please enter a valid UK postcode (e.g. G41 3YN)"
      );
      return;
    }

    if (!postcode.trim()) {
      setError("Please enter a postcode first.");
      return;
    }

    writeDeliveryCheck(result);
    onConfirmed(result);
  };

  const handleCollectionOnly = () => {
    const result: DeliveryCheck = {
      postcode: "",
      deliverable: false,
      checkedAt: Date.now(),
    };
    writeDeliveryCheck(result);
    onConfirmed(result);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="postcode-modal-title"
    >
      <div
        className="w-full max-w-[520px] rounded-[18px] bg-white px-7 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:px-9 sm:py-10"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Title */}
        <h2
          id="postcode-modal-title"
          className="text-center font-display text-[28px] font-bold leading-tight text-[#15181a] sm:text-[32px]"
        >
          Where should we deliver?
        </h2>

        <p className="mt-3 text-center text-[14px] leading-[21px] text-[#6b7075]">
          Enter your UK postcode to check delivery, or continue for collection
          only.
        </p>

        {/* Input row */}
        <label
          htmlFor="delivery-postcode"
          className="mt-7 block text-[14px] font-bold text-[#15181a]"
        >
          Delivery postcode
        </label>

        <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3.5">
          <input
            ref={inputRef}
            id="delivery-postcode"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="postal-code"
            spellCheck={false}
            value={postcode}
            maxLength={8}
            onChange={(event) => {
              setPostcode(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCheck();
            }}
            placeholder="e.g. G41 3YN"
            aria-invalid={!!error}
            className={`h-[52px] w-full flex-1 rounded-[12px] border bg-white px-4 text-[16px] font-semibold uppercase text-[#15181a] outline-none transition placeholder:font-normal placeholder:normal-case placeholder:text-[#a5a8ab] focus:ring-2 ${
              error
                ? "border-[#e5484d] focus:ring-[#e5484d]/30"
                : "border-[#dcd6cd] focus:border-[#ff8500] focus:ring-[#ff8500]/25"
            }`}
          />

          <button
            type="button"
            onClick={handleCheck}
            className="inline-flex h-[52px] shrink-0 items-center justify-center rounded-full bg-[#ff8500] px-8 text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(255,133,0,0.35)] transition hover:bg-[#f07d00] active:scale-[0.98]"
          >
            Check
          </button>
        </div>

        {/* Validation / result error */}
        {error && (
          <p className="mt-5 border-t border-dashed border-[#e9e3db] pt-4 text-[14px] font-bold text-[#e5484d]">
            {error}
          </p>
        )}

        {/* Divider + collection escape hatch */}
        <div className="mt-6 border-t border-dashed border-[#e9e3db] pt-6">
          <button
            type="button"
            onClick={handleCollectionOnly}
            className="inline-flex h-[46px] items-center gap-2 rounded-full border border-[#ff8500] bg-white px-6 text-[14px] font-bold text-[#ff8500] transition hover:bg-orange/10 active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" />
            Collection only
          </button>
        </div>

        {/* Delivery perk nudge */}
        <p className="mt-6 flex items-center gap-2 text-[13px] text-[#8a8f94]">
          <Bike className="h-4 w-4 shrink-0 text-[#ff8500]" />
          Free delivery on orders above £20.00 — standard delivery is always
          free.
        </p>
      </div>
    </div>
  );
}
