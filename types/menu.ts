// types/menu.ts

export interface NavLink {
  label: string;
  href: string;
}

export interface Perk {
  id: string;
  icon: "truck" | "flame" | "shield";
  tint: "green" | "pink" | "blue";
  title: string;
  description: string;
}

export interface DealItem {
  id: string;
  badge?: string; // e.g. "POPULAR", "BEST SELLER"
  badgeHint?: string; // e.g. "One tap" — shown top-right of the card
  name: string;
  description?: string;
  mainLabel?: string; // e.g. "Main"
  mainValue?: string; // e.g. "Porto Chicken Deluxe Burger"
  sideLabel?: string; // e.g. "Side"
  sideValue?: string; // e.g. "Halal Fries"
  price: number;
  originalPrice?: number;
  ctaLabel?: string; // defaults to "Add deal — £{price}" if omitted
}

export interface SidebarNavItem {
  id: string;
  slug: string;
  name: string;
  icon: MenuCategory["icon"] | "star";
  tint: MenuCategory["tint"] | "orange";
  count: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  /**
   * For "choice" groups this is the option's full price (e.g. Regular £10.45).
   * For "addon" groups this is the amount added (e.g. Halloumi £2.25).
   * Zero renders as "Free".
   */
  price: number;
}

export interface MenuItemOptionGroup {
  id: string;
  title: string;
  /**
   * "choice" — single-select, the chosen option's price replaces the base price
   *   (e.g. Regular vs Meal Deal).
   * "addon" — multi-select, each option's price is added on top
   *   (e.g. Add Halloumi).
   */
  kind: "choice" | "addon";
  required?: boolean;
  /** Show only the first N options until "Show More" is expanded. */
  collapsedVisible?: number;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceLabel?: string; // e.g. "from"
  imageUrl?: string;
  optionGroups?: MenuItemOptionGroup[];
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  icon: "beef" | "sandwich" | "drumstick" | "flame" | "salad" | "cupsoda" | "icecream" | "cookie" | "soup" | "pizza";
  tint: "green" | "neutral" | "pink" | "blue";
  items: MenuItem[];
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  alt: string;
}

export interface StoreInfo {
  address: string;
  phone: string;
  email: string;
  mapEmbedUrl?: string;
}

export interface SocialLink {
  platform: "facebook" | "instagram" | "twitter";
  href: string;
}

