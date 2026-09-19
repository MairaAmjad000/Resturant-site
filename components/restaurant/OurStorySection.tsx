"use client";

import SafeImage from "./SafeImage";

interface OurStorySectionProps {
  id?: string;
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  imageUrl: string;
  badgeText?: string;
}

export default function OurStorySection({
  id,
  eyebrow,
  heading,
  paragraphs,
  imageUrl,
  badgeText,
}: OurStorySectionProps) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
      {/* Mobile: single column — heading, then paragraphs, then image below.
          Desktop (md+): text left, image right spanning both rows. */}
      <div className="grid grid-cols-1 items-start gap-y-6 md:grid-cols-2 md:gap-x-6 md:gap-y-6 lg:gap-x-10">
        {/* Eyebrow + heading — first on mobile, left column on desktop */}
        <div className="md:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#5C5C5C]">
            {eyebrow}
          </p>

          <h2 className="mt-2 mb-0 max-w-xl font-display text-3xl font-bold text-[#15181a] sm:text-4xl">
            {heading}
          </h2>
        </div>

        {/* Orange line + paragraphs — left column under the heading on desktop */}
        <div className="md:col-start-1 md:row-start-2">
          <span
            className="mb-6 block h-[3px] w-12 rounded-full bg-orange"
            aria-hidden
          />

          <div className="flex flex-col gap-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-[#4a5157]">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Image — below the text on mobile, right column on desktop */}
        <div className="relative aspect-[542/340] w-full overflow-hidden rounded-2xl bg-[#0e3b2e] shadow-lg md:col-start-2 md:row-start-1 md:row-span-2">
          <SafeImage
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="50vw"
            fallback={
              <div className="flex h-full w-full items-end bg-[linear-gradient(160deg,#0e3b2e,#178A4B)] p-8">
                <p className="font-serif text-2xl font-bold text-white">
                  Fresh from the charcoal grill
                </p>
              </div>
            }
          />
          {badgeText && (
            <span className="absolute bottom-5 left-5 rounded-full bg-orange px-4 py-2 text-xs font-semibold text-white shadow-sm">
              {badgeText}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
