"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import {
  readFavourites,
  toggleFavourite,
} from "@/lib/favourites";
import {
  CART_STORAGE_KEY,
  buildCartCatalog,
  addConfiguredLineToStoredCart,
  cartQuantity,
  parseStoredCart,
  serializeCart,
  setLineQuantity,
  type CartLine,
} from "@/lib/cart";
import CustomiseItemModal from "@/components/restaurant/CustomiseItemModal";
import MenuItemCard from "@/components/restaurant/MenuItemCard";
import type { DealItem, MenuCategory, MenuItem } from "@/types/menu";

interface FavouritesPageClientProps {
  categories: MenuCategory[];
  deals: DealItem[];
}

export default function FavouritesPageClient({
  categories,
  deals,
}: FavouritesPageClientProps) {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );

  const [favouriteIds, setFavouriteIds] = useState<string[] | null>(null);
  const [cartLines, setCartLines] = useState<CartLine[] | null>(null);
  const [cartCount, setCartCount] = useState(0);

  /** Item currently open in the customise modal. */
  const [customiseItemId, setCustomiseItemId] = useState<string | null>(null);

  if (favouriteIds === null && typeof window !== "undefined") {
    setFavouriteIds(readFavourites());
  }

  /** Mirror the persisted cart so steppers show real quantities. */
  useEffect(() => {
    const stored = parseStoredCart(
      window.localStorage.getItem(CART_STORAGE_KEY),
      catalog
    );
    // Pre-existing hydration from localStorage; intentionally synchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartLines(stored);
  }, [catalog]);

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cartLines ?? []) {
      map[line.item.id] = (map[line.item.id] ?? 0) + line.quantity;
    }
    return map;
  }, [cartLines]);

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to save your favourites.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex h-[51px] items-center rounded-full bg-[#ff8500] px-8 text-[14px] font-bold text-white transition hover:bg-[#f58200]"
          >
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  const items: MenuItem[] = (favouriteIds ?? [])
    .map((id) => catalog.get(id))
    .filter((item): item is MenuItem => item !== undefined);

  const handleUnfavourite = (itemId: string) => {
    toggleFavourite(itemId);
    setFavouriteIds(readFavourites());
  };

  const handleAddToCart = (itemId: string) => {
    // Every add goes through the customise modal, mirroring the menu page.
    setCustomiseItemId(itemId);
  };

  /** Stepper minus — decrement in the persisted cart, like the menu page. */
  const handleDecrease = (itemId: string) => {
    const base = cartLines ?? [];
    const lines = base.filter((line) => line.item.id === itemId);
    if (lines.length === 0) return;

    const target =
      lines.find((line) => line.selections === null) ?? lines[0];
    const next = setLineQuantity(base, target.lineId, target.quantity - 1);

    setCartLines(next);
    window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(next));
    setCartCount(cartQuantity(next));
  };

  const handleModalAdd = (
    quantity: number,
    selections: Record<string, string[]> | null
  ) => {
    if (!customiseItemId) return;

    const lines = addConfiguredLineToStoredCart(
      catalog,
      customiseItemId,
      quantity,
      selections
    );

    if (lines) {
      setCartLines(lines);
      setCartCount(cartQuantity(lines));
    }
    setCustomiseItemId(null);
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* Close */}
      <Link
        href="/"
        aria-label="Close favourites page"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#15181a] hover:text-[#ff8500]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Heading */}
      <h1 className="mt-5 text-[28px] font-bold text-[#15181a]">Favourites</h1>

      {/* List / empty state */}
      {items.length === 0 ? (
        <p className="mt-6 text-[14px] text-[#9aa0a5]">
          No favourites yet.
        </p>
      ) : (
        <section className="mt-5 rounded-2xl border border-[#e9e3db] bg-white px-4 sm:px-6">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              quantity={quantities[item.id] ?? 0}
              showFavourite
              isFavourite
              onToggleFavourite={handleUnfavourite}
              onAdd={handleAddToCart}
              onIncrease={handleAddToCart}
              onDecrease={handleDecrease}
            />
          ))}
        </section>
      )}

      {/* Cart hint */}
      {cartCount > 0 && (
        <p className="mt-4 text-[13px] text-[#178A4B]">
          {cartCount} item{cartCount > 1 ? "s" : ""} added to your basket from
          favourites.
        </p>
      )}

      {/* Customise modal */}
      {customiseItemId && catalog.get(customiseItemId) && (
        <CustomiseItemModal
          item={catalog.get(customiseItemId)!}
          onClose={() => setCustomiseItemId(null)}
          onAdd={handleModalAdd}
        />
      )}
    </main>
  );
}
