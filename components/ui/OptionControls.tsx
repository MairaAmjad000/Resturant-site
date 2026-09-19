/**
 * Shared styled option controls — real inputs stay in the parent (sr-only);
 * these are the visual radio/checkbox synced to `checked`.
 * Used by the customise modal, payment method picker, and anywhere else
 * option picks appear, so styling stays consistent site-wide.
 */

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked ? "border-[#ff8500] bg-[#ff8500]" : "border-[#d5d5d5] bg-white"
      }`}
    >
      <span
        className={`h-[8px] w-[8px] rounded-full bg-white transition-opacity ${
          checked ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}

export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
        checked ? "border-[#ff8500] bg-[#ff8500]" : "border-[#d5d5d5] bg-white"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className={`h-3 w-3 text-white transition-opacity ${
          checked ? "opacity-100" : "opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 6.5 4.8 9 10 3.5" />
      </svg>
    </span>
  );
}
