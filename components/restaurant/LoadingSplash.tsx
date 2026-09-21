"use client";

import { useEffect, useState } from "react";
import SafeImage from "@/components/restaurant/SafeImage";

/**
 * Loading splash — shown on every full page load (refresh, new tab, direct
 * link). Cream screen with the restaurant logo and a clean ring spinner,
 * fading out once the app has mounted.
 */

export default function LoadingSplash() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Every refresh starts at the top of the page — the browser would
    // otherwise restore the previous scroll position mid-page while the
    // splash is still covering it. Deep links (/#menu, /#story, …) are
    // exempt: they scroll to their section once the splash lifts.
    window.history.scrollRestoration = "manual";

    const hash = window.location.hash;
    if (!hash || hash === "#top") {
      window.scrollTo(0, 0);
    }

    const timer = window.setTimeout(() => {
      setDone(true);

      /* Cross-page deep link (e.g. the checkout navbar's Contact): the
         native hash jump happened while the splash was still up and the
         splash skipped its scroll-to-top, so take the user to the section
         as the splash fades. scroll-behavior:smooth in globals.css turns
         scrollTo into an animation — force auto so the landing is exact
         (and works where programmatic smooth scrolls are dropped). */
      if (hash && hash !== "#top") {
        const target = document.getElementById(hash.substring(1));
        if (target) {
          const html = document.documentElement;
          const previous = html.style.scrollBehavior;
          html.style.scrollBehavior = "auto";
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - 80,
          });
          html.style.scrollBehavior = previous;
        }
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#fbf9f6] transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo with a gentle breathing scale */}
      <div className="animate-[splash-breathe_1.6s_ease-in-out_infinite]">
        <SafeImage
          src="/images/logo.png"
          alt=""
          width={180}
          height={60}
          priority
          className="h-auto w-[170px] object-contain"
          fallback={
            <span className="text-[22px] font-bold text-[#0e3b2e]">
              Porto Piri Piri
            </span>
          }
        />
      </div>

      {/* Standard ring spinner */}
      <div
        className="mt-9 h-8 w-8 animate-spin rounded-full border-[3px] border-[#ff8500]/20 border-t-[#ff8500]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
