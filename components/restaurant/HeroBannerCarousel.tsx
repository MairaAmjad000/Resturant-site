"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { BannerSlide } from "@/types/menu";

interface HeroBannerCarouselProps {
  slides: BannerSlide[];
  autoPlayMs?: number;
}

export default function HeroBannerCarousel({ slides, autoPlayMs = 6000 }: HeroBannerCarouselProps) {
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    setActive((index + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlayMs || slides.length <= 1) return;
    const id = setInterval(() => goTo(active + 1), autoPlayMs);
    return () => clearInterval(id);
  }, [active, autoPlayMs, goTo, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="relative h-[200px] w-full overflow-hidden sm:h-[300px] lg:h-[400px]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== active}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {slides.length > 1 && (
        <div
          role="tablist"
          aria-label="Slide selector"
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                i === active ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}