"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import SiteHeader from "./SiteHeader";
import WhyOrderStrip from "./WhyOrderStrip";
import FullMenu from "./FullMenu";
import OurStorySection from "./OurStorySection";
import LocationSection from "./LocationSection";
import SiteFooter from "./SiteFooter";
import CartDrawer from "./CartDrawer";
import CartBanner from "./CartBanner";
import CustomiseItemModal from "./CustomiseItemModal";
import type { MenuCategory, DealItem } from "@/types/menu";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/lib/menu-data";
import HeroBannerCarousel from "./HeroBannerCarousel";
import {
  CART_STORAGE_KEY,
  addConfiguredLine,
  buildCartCatalog,
  cartQuantity,
  parseStoredCart,
  serializeCart,
  setLineQuantity,
  type CartLine,
  type LineSelections,
} from "@/lib/cart";
import {
  readFavourites,
  toggleFavourite,
} from "@/lib/favourites";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  requestLogin,
  subscribeToUser,
} from "@/lib/auth";

interface RestaurantShellProps {
  categories: MenuCategory[];
  deals: DealItem[]; // ← new
  site: SiteContent;
}

export default function RestaurantShell({
  categories,
  deals, // ← new
  site,
}: RestaurantShellProps) {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const catalog = useMemo(
    () => buildCartCatalog(categories, deals),
    [categories, deals]
  );
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  /** Item currently open in the customise modal (items with option groups). */
  const [customiseItemId, setCustomiseItemId] = useState<string | null>(null);

  /** Hearted item ids; hydrated after mount (SSR-safe). */
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration
    setFavouriteIds(new Set(readFavourites()));
  }, []);

  const handleToggleFavourite = useCallback((itemId: string) => {
    const nowFavourite = toggleFavourite(itemId);
    setFavouriteIds((current) => {
      const next = new Set(current);
      if (nowFavourite) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }, []);

  useEffect(() => {
    const stored = parseStoredCart(
      window.localStorage.getItem(CART_STORAGE_KEY),
      catalog
    );
    // Pre-existing hydration from localStorage; intentionally synchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartItems(stored);
    setCartReady(true);
  }, [catalog]);

  useEffect(() => {
    if (!cartReady) return;
    window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(cartItems));
  }, [cartItems, cartReady]);

  const addItem = useCallback(
    (itemId: string) => {
      const item = catalog.get(itemId);
      if (!item) return;

      // Signed-out visitors must sign in before adding to the cart.
      if (!user) {
        requestLogin();
        return;
      }

      // Every add routes through the customise modal so the customer can
      // pick options; items without groups just show quantity + price.
      setCustomiseItemId(itemId);
    },
    [catalog, user]
  );

  const addConfigured = useCallback(
    (itemId: string, quantity: number, selections: LineSelections) => {
      const item = catalog.get(itemId);
      if (!item) return;

      setCartItems((current) =>
        addConfiguredLine(current, item, quantity, selections)
      );
      setCustomiseItemId(null);
    },
    [catalog]
  );

  /**
   * + on a menu card (stepper mode): also opens the modal, matching the
   * initial add — the customer can adjust options before adding another.
   */
  const increase = useCallback((itemId: string) => {
    const item = catalog.get(itemId);
    if (!item) return;

    if (!user) {
      requestLogin();
      return;
    }

    setCustomiseItemId(itemId);
  }, [catalog, user]);

  /**
   * − on a menu card: decrements the plain line when present, otherwise
   * the item's first customised line.
   */
  const decrease = useCallback((itemId: string) => {
    setCartItems((current) => {
      const lines = current.filter((line) => line.item.id === itemId);
      if (lines.length === 0) return current;

      const target =
        lines.find((line) => line.selections === null) ?? lines[0];

      return setLineQuantity(current, target.lineId, target.quantity - 1);
    });
  }, []);

  /** Removes one specific line (used by the cart drawer). */
  const remove = useCallback((lineId: string) => {
    setCartItems((current) =>
      current.filter((line) => line.lineId !== lineId)
    );
  }, []);

  /**
   * Cart-drawer steppers operate on an exact line (lineId), including
   * customised ones — no modal here, the picks were already made.
   */
  const increaseLine = useCallback((lineId: string) => {
    setCartItems((current) => {
      const line = current.find((entry) => entry.lineId === lineId);
      if (!line) return current;
      return setLineQuantity(current, lineId, line.quantity + 1);
    });
  }, []);

  const decreaseLine = useCallback((lineId: string) => {
    setCartItems((current) => {
      const line = current.find((entry) => entry.lineId === lineId);
      if (!line) return current;
      return setLineQuantity(current, lineId, line.quantity - 1);
    });
  }, []);

  const addDeal = useCallback(
    (dealId: string) => {
      addItem(dealId);
    },
    [addItem]
  );

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cartItems) {
      map[line.item.id] = (map[line.item.id] ?? 0) + line.quantity;
    }
    return map;
  }, [cartItems]);

  const customiseItem = customiseItemId
    ? catalog.get(customiseItemId) ?? null
    : null;

  return (
    <>
      <div id="top" />

      <SiteHeader
        logoUrl={site.logoUrl}
        logoAlt={site.name}
        navLinks={site.navLinks}
        cartCount={cartQuantity(cartItems)}
        onCartClick={() => setCartOpen((open) => !open)}
        storeInfo={site.storeInfo}
      />

      <HeroBannerCarousel slides={site.bannerSlides} />

      <WhyOrderStrip perks={site.perks} />

      <FullMenu
        categories={categories}
        deals={deals}
        quantities={quantities}
        favouriteIds={favouriteIds}
        showFavourite={!!user}
        onToggleFavourite={handleToggleFavourite}
        onAddItem={addItem}
        onAddDeal={addDeal}
        onIncrease={increase}
        onDecrease={decrease}
      />

      <OurStorySection id="story" {...site.story} />

      <LocationSection id="contact" info={site.storeInfo} />

      <SiteFooter
        logoUrl={site.logoUrl}
        logoAlt={site.name}
        tagline={site.tagline}
        quickLinks={site.navLinks}
        info={site.storeInfo}
        socialLinks={site.socialLinks}
        bottomNote={site.bottomNote}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onIncrease={increaseLine}
        onDecrease={decreaseLine}
        onRemove={remove}
        onCheckout={() => router.push("/checkout")}
      />

      {/* Basket banner — signed-in users only, matching the header icon */}
      {user && (
        <CartBanner
          cartItems={cartItems}
          onClick={() => setCartOpen(true)}
        />
      )}

      {customiseItem && (
        <CustomiseItemModal
          item={customiseItem}
          onClose={() => setCustomiseItemId(null)}
          onAdd={(quantity, selections) =>
            addConfigured(customiseItem.id, quantity, selections)
          }
        />
      )}
    </>
  );
}