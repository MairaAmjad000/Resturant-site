// components/restaurant/SiteFooter.tsx

import SafeImage from "./SafeImage";
import Link from "next/link";
import type { SVGProps, ReactNode } from "react";
import type { NavLink as NavLinkType, StoreInfo, SocialLink } from "@/types/menu";

interface SiteFooterProps {
  logoUrl: string;
  logoAlt: string;
  tagline: string;
  quickLinks: NavLinkType[];
  info: StoreInfo;
  socialLinks: SocialLink[];
  bottomNote?: string;
}

// lucide-react doesn't ship brand/logo icons (trademark reasons), so these
// social marks are self-contained SVGs — swap in your own asset if preferred.
function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.87.24-1.46 1.5-1.46H16.5V4.34C16.25 4.3 15.4 4.24 14.4 4.24c-2.1 0-3.5 1.28-3.5 3.63V10.5H8.4v3H10.9V21h2.6z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20 6.6c-.6.27-1.24.45-1.9.53a3.3 3.3 0 0 0 1.46-1.83 6.6 6.6 0 0 1-2.1.8 3.3 3.3 0 0 0-5.63 3 9.35 9.35 0 0 1-6.8-3.45 3.3 3.3 0 0 0 1.02 4.4 3.28 3.28 0 0 1-1.5-.4v.04a3.3 3.3 0 0 0 2.65 3.24 3.3 3.3 0 0 1-1.49.06 3.3 3.3 0 0 0 3.08 2.3A6.63 6.63 0 0 1 3 17.5a9.32 9.32 0 0 0 5.05 1.48c6.06 0 9.38-5.02 9.38-9.38l-.01-.43A6.7 6.7 0 0 0 20 6.6z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<
  SocialLink["platform"],
  (props: SVGProps<SVGSVGElement>) => ReactNode
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
};

export default function SiteFooter({
  logoUrl,
  logoAlt,
  tagline,
  quickLinks,
  info,
  socialLinks,
  bottomNote,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-[#e9e3db] bg-[#f5f1eb]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="relative flex h-10 w-[132px] items-center">
            <SafeImage
              src={logoUrl}
              alt={logoAlt}
              fill
              className="object-contain object-left"
              sizes="132px"
              fallback={
                <span className="text-[15px] font-bold text-[#0e3b2e]">
                  Porto Piri Piri
                </span>
              }
            />
          </div>
          <p className="mt-5 text-[13px] leading-relaxed text-[#4a5157]">{tagline}</p>
        </div>

        <nav aria-label="Quick links">
          <h3 className="text-[11.5px] font-semibold uppercase tracking-[1.4px] text-[#0e3b2e]">
            Quick Links
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-[#4a5157] hover:text-[#15181a]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-[11.5px] font-semibold uppercase tracking-[1.4px] text-[#0e3b2e]">
            Contact
          </h3>
          <div className="mt-5 flex flex-col gap-3 text-[13px] text-[#4a5157]">
            <a href={`tel:${info.phone}`} className="hover:text-[#15181a]">
              {info.phone}
            </a>
            <a href={`mailto:${info.email}`} className="hover:text-[#15181a]">
              {info.email}
            </a>
            <p>{info.address}</p>
          </div>
        </div>

        <div>
          <h3 className="text-[11.5px] font-semibold uppercase tracking-[1.4px] text-[#0e3b2e]">
            Follow us on
          </h3>
          <div className="mt-5 flex gap-2">
            {socialLinks.map((social) => {
              const Icon = SOCIAL_ICONS[social.platform];
              return (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${social.platform}`}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#0e3b2e]/20 bg-white text-[#0e3b2e] transition-colors hover:bg-[#0e3b2e] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e3b2e]/40"
                >
                  <Icon className="h-[15px] w-[15px]" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {bottomNote && (
        <div className="border-t border-[#e9e3db]">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-[#7c848b] sm:px-6 lg:px-8">
            {bottomNote}
          </p>
        </div>
      )}
    </footer>
  );
}