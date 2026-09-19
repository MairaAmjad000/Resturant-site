// app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import LoadingSplash from "@/components/restaurant/LoadingSplash";
import { ToastProvider } from "@/components/ui/ToastProvider";
import DemoPanel from "@/components/account/DemoPanel";
import "./globals.css";

// Design uses Poppins for all UI/body text (Regular/Medium/SemiBold/Bold weights
// all appear in the Figma file) and falls back to Tailwind's default serif
// stack (which starts with Georgia) for category/section headings — no need
// to load a second font for that.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Porto Piri Piri | Flame-Grilled Piri Piri Chicken, Glasgow",
    template: "%s | Porto Piri Piri",
  },
  description:
    "Order direct from Porto Piri Piri — flame-grilled piri piri chicken, burgers, wraps and more. Same kitchen, no aggregator mark-up, freshly cooked to order.",
  keywords: [
    "piri piri chicken",
    "Glasgow takeaway",
    "Shawlands restaurant",
    "halal chicken Glasgow",
    "Porto Piri Piri",
  ],
  metadataBase: new URL("https://www.portopiripiri.co.uk"),
  openGraph: {
    title: "Porto Piri Piri | Flame-Grilled Piri Piri Chicken, Glasgow",
    description:
      "Order direct — same kitchen, no aggregator mark-up. Freshly prepared, cooked to order.",
    url: "https://www.portopiripiri.co.uk",
    siteName: "Porto Piri Piri",
    locale: "en_GB",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e3b2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-[#fbf9f6] font-sans text-[#15181a] antialiased">
        <ToastProvider>
          <LoadingSplash />
          {children}
          <DemoPanel />
        </ToastProvider>
      </body>
    </html>
  );
}
