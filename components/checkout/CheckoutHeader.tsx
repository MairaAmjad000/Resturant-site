"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ShoppingBag } from "lucide-react";
import SafeImage from "@/components/restaurant/SafeImage";
import type { NavLink } from "@/types/menu";
import BranchSelector from "@/components/restaurant/BranchSelector";
import CartDrawer from "@/components/restaurant/CartDrawer";
import UserAvatar from "@/components/account/UserAvatar";
import {
  CART_STORAGE_KEY,
  buildCartCatalog,
  parseStoredCart,
  serializeCart,
  setLineQuantity,
  type CartLine,
} from "@/lib/cart";
import { useStoredCart } from "@/lib/use-stored-cart";
import {
  clearStoredUser,
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
  userDisplayName,
} from "@/lib/auth";
import { unreadNotificationCount } from "@/lib/account";

export type CheckoutStep = "checkout" | "payment" | "confirmation";

interface CheckoutHeaderProps {
  logoUrl: string;
  logoAlt: string;
  currentStep: CheckoutStep;
  navLinks?: NavLink[];
  /** Menu catalog for the cart drawer (items + deals). */
  categories?: import("@/types/menu").MenuCategory[];
  deals?: import("@/types/menu").DealItem[];
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "checkout", label: "Checkout" },
  { key: "payment", label: "Payment" },
  { key: "confirmation", label: "Confirmation" },
];

export default function CheckoutHeader({
  logoUrl,
  logoAlt,
  currentStep,
  navLinks = [],
  categories = [],
  deals = [],
}: CheckoutHeaderProps) {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  /* Account dropdown — same options as the site header */
  const router = useRouter();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(() => {
    try { return unreadNotificationCount(); } catch { return 0; }
  });

  /* Live notification badge */
  useEffect(() => {
    const refresh = () => { try { setNotifCount(unreadNotificationCount()); } catch { /* ignore */ } };
    window.addEventListener("storage", refresh);
    const id = window.setInterval(refresh, 5000);
    return () => { window.removeEventListener("storage", refresh); window.clearInterval(id); };
  }, []);

  /* ---------------------------------------------------------
     Cart drawer — the same drawer as the home page, mounted
     here so the header cart icon opens the real basket on
     every checkout step.
  --------------------------------------------------------- */
  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );
  const cartLines = useStoredCart(catalog) ?? [];
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  /** localStorage is the single source of truth: mutate → persist →
   *  broadcast so every useStoredCart consumer (this badge, the checkout
   *  summary, the payment page) re-reads and stays in sync. */
  const mutateCart = useCallback(
    (fn: (lines: CartLine[]) => CartLine[]) => {
      const current = parseStoredCart(
        window.localStorage.getItem(CART_STORAGE_KEY),
        catalog
      );
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(fn(current)));
      window.dispatchEvent(new Event("porto:cart-changed"));
    },
    [catalog]
  );

  const increaseLine = useCallback(
    (lineId: string) =>
      mutateCart((lines) => {
        const line = lines.find((entry) => entry.lineId === lineId);
        return line ? setLineQuantity(lines, lineId, line.quantity + 1) : lines;
      }),
    [mutateCart]
  );

  const decreaseLine = useCallback(
    (lineId: string) =>
      mutateCart((lines) => {
        const line = lines.find((entry) => entry.lineId === lineId);
        return line ? setLineQuantity(lines, lineId, line.quantity - 1) : lines;
      }),
    [mutateCart]
  );

  const removeLine = useCallback(
    (lineId: string) =>
      mutateCart((lines) => lines.filter((line) => line.lineId !== lineId)),
    [mutateCart]
  );

  /* Close the dropdown on outside click / Escape */
  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest("[data-account-menu]")) {
        setAccountMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  const handleSignOut = () => {
    clearStoredUser();
    setAccountMenuOpen(false);
    router.push("/");
  };

  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-[#e9e3db] bg-[#fbf9f6]/90 backdrop-blur-md">
      {/* Top bar — identical layout & styling to the site header */}
      <div className="mx-auto flex h-[69px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="relative flex h-10 w-[132px] shrink-0 items-center">
            <SafeImage
              src={logoUrl}
              alt={logoAlt}
              fill
              className="object-contain object-left"
              priority
              fallback={
                <span className="text-[15px] font-bold text-[#0e3b2e]">
                  Porto Piri Piri
                </span>
              }
            />
          </Link>

        {/* Site navigation — identical classes & states to the site header; anchors point home */}
        <nav
          aria-label="Site navigation"
          className="hidden items-center gap-1 rounded-full md:flex"
        >
          {navLinks.map((link) => {
            const isActive = link.href === "#top"; // Home — mirrors the site header's top-of-page state

            return (
              <Link
                key={link.href}
                href={`/${link.href}`}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-[#0e3b2e] text-white transition-colors duration-150"
                    : "text-[#4a5157] hover:bg-[#f5f1eb] hover:text-[#15181a]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Branch — static pill showing the selected branch (change it on the menu page) */}
          <BranchSelector readOnly className="hidden sm:block" />

          {/* User pill / Sign In — identical styling to the site header, with the full dropdown */}
          {user ? (
            <div className="relative z-[110]" data-account-menu>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="group flex h-11 items-center gap-2.5 rounded-full bg-[#0e3b2e] pl-1 pr-4 transition-colors hover:bg-[#17614a]"
              >
                <UserAvatar user={user} size={36} />
                <ChevronDown
                  className={`h-4 w-4 text-white/80 transition-all duration-200 group-hover:text-white ${
                    accountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[52px] z-[120] w-56 rounded-2xl bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                >
                  {/* Identity */}
                  <div className="px-1 pb-2 pt-1">
                    <UserAvatar user={user} size={40} />

                    <p className="mt-2 truncate text-[15px] font-bold text-[#15181a]">
                      {userDisplayName(user)}
                    </p>
                  </div>

                  {/* Navigation — same options as the site header dropdown */}
                  <div className="flex flex-col">
                    {[
                      {
                        href: "/account/profile",
                        label: "My Profile",
                      },
                      {
                        href: "/account/orders",
                        label: "My Orders",
                      },
                      {
                        href: "/account/notifications",
                        label: "Notifications",
                        badge: notifCount,
                      },
                      {
                        href: "/account",
                        label: "Account settings",
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-1 py-2.5 text-[14px] font-medium text-[#3d4348] transition-colors hover:text-[#ff8500]"
                      >
                        {item.label}
                        {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff8500] px-1 text-[10px] font-bold leading-none text-white">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="mt-1 rounded-lg px-1 py-2.5 text-left text-[14px] font-semibold text-[#ff8500] transition-colors hover:text-[#e07700]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/"
              aria-label="Sign in"
              className="inline-flex rounded-full border border-[#d8d0c5] bg-white px-5 py-2.5 text-sm font-semibold text-[#15181a] transition-colors hover:border-[#0e3b2e]"
            >
              Sign In
            </Link>
          )}

          {/* Cart — same button as the site header; opens the real basket drawer */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : "Open cart"}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d0c5] bg-white transition hover:bg-orange"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff8500] px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Step tabs */}
      <nav
        aria-label="Checkout progress"
        className="border-t border-white/10 bg-white"
      >
        <div className="mx-auto grid max-w-[1160px] grid-cols-3 px-4 sm:px-6">
          {STEPS.map((step, index) => {
            const isActive = index === currentIndex;
            const isDone = index < currentIndex;

            return (
              <div
                key={step.key}
                aria-current={isActive ? "step" : undefined}
                className={`relative flex h-[52px] items-center justify-center gap-2 border-b-2 text-[14px] font-semibold transition-colors ${
                  isActive
                    ? "border-[#ff8500] text-[#ff8500]"
                    : isDone
                      ? "border-[#ff8500] text-[#15181a]"
                      : "border-[#e5e5e5] text-[#9aa0a5]"
                }`}
              >
                {isDone && (
                  <span
                    aria-hidden="true"
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#ff8500]"
                  >
                    <Check
                      className="h-[11px] w-[11px] text-white"
                      strokeWidth={3.5}
                    />
                  </span>
                )}
                {step.label}
              </div>
            );
          })}
        </div>
      </nav>
    </header>

    {/* Cart drawer — shared with the home page. Mounted OUTSIDE the <header>:
        the header's backdrop-blur makes it a containing block for fixed
        descendants, which trapped the drawer's grey overlay inside the
        header strip instead of covering the whole screen. */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartLines}
        onIncrease={increaseLine}
        onDecrease={decreaseLine}
        onRemove={removeLine}
        onCheckout={() => {
          setCartOpen(false);
          router.push("/checkout");
        }}
      />
    </>
  );
}
