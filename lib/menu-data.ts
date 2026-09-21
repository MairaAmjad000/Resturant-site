// lib/menu-data.ts

import type {
  MenuCategory,
  Perk,
  NavLink,
  StoreInfo,
  SocialLink,
  BannerSlide, // ← new
  DealItem, // ← moved up, single import block now
  MenuItemOptionGroup,
} from "@/types/menu";

/* =========================================================
   SHARED OPTION GROUPS (customise modal)
========================================================= */

/**
 * "Choose your option" — Regular vs Meal Deal. Option prices are the full
 * amounts (the modal total starts at £0.00), so they must match the item's
 * base price; Meal Deal adds the meal uplift on top.
 */
function burgerOptionGroups(basePrice: number): MenuItemOptionGroup[] {
  return [
    {
      id: "opt-choice",
      title: "Choose your option",
      kind: "choice",
      required: true,
      options: [
        { id: "choice-regular", name: "Regular", price: basePrice },
        {
          id: "choice-meal-deal",
          name: "Meal Deal",
          price: Math.round((basePrice + 3.5) * 100) / 100,
        },
      ],
    },
    {
      id: "opt-sauce",
      title: "Sauce Flavours",
      kind: "addon",
      required: true,
      collapsedVisible: 3,
      options: [
        { id: "sauce-naked", name: "Naked", price: 0 },
        { id: "sauce-mango-lime", name: "Mango & Lime", price: 0 },
        { id: "sauce-lemon-herb", name: "Lemon & Herb", price: 0 },
        { id: "sauce-mild", name: "Mild", price: 0 },
        { id: "sauce-hot", name: "Hot", price: 0 },
        { id: "sauce-extra-hot", name: "Extra Hot", price: 0 },
      ],
    },
    {
      id: "opt-halloumi",
      title: "Add Halloumi",
      kind: "addon",
      options: [
        { id: "addon-halloumi", name: "Add Halloumi", price: 2.25 },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Site-wide content (header, hero, perks, footer, story, location)
// ---------------------------------------------------------------------------

export interface SiteContent {
  name: string;
  logoUrl: string;
  tagline: string;
  navLinks: NavLink[];
  bannerSlides: BannerSlide[]; // ← new
  perks: Perk[];
  story: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
    imageUrl: string;
    badgeText?: string;
  };
  storeInfo: StoreInfo;
  socialLinks: SocialLink[];
  bottomNote: string;
}

export async function getSiteContent(): Promise<SiteContent> {
  return {
    name: "Porto Piri Piri",
    logoUrl: "/images/logo.png",
    tagline:
      "Bold flavour, freshly fired. Porto Piri Piri brings generous South Asian cooking and warm hospitality to Glasgow seven days a week.",
    navLinks: [
      { label: "Home", href: "#top" },
      { label: "Menu", href: "#menu" },
      { label: "Story", href: "#story" },
      { label: "Contact", href: "#contact" },
    ],
    bannerSlides: [
  { id: "slide-1", imageUrl: "/images/banners/slide-1.png", alt: "Flame-grilled piri piri chicken platter" },
  { id: "slide-2", imageUrl: "/images/banners/slide-2.png", alt: "Porto Gold Burger with crispy onions" },
  { id: "slide-3", imageUrl: "/images/banners/slide-3.png", alt: "Loaded messy fries with melted cheese" },
],
    perks: [
      {
        id: "perk-direct",
        icon: "truck",
        tint: "green",
        title: "Order direct",
        description: "Same kitchen — no aggregator mark-up",
      },
      {
        id: "perk-fresh",
        icon: "flame",
        tint: "pink",
        title: "Freshly prepared",
        description: "Cooked to order when you checkout",
      },
      {
        id: "perk-allergens",
        icon: "shield",
        tint: "blue",
        title: "Allergens on every dish",
        description: "Shown on the menu and as you customise",
      },
    ],
    story: {
      eyebrow: "Our Story",
      heading: "Tradition, fire and a modern point of view.",
      paragraphs: [
        "Porto Piri Piri was created to bring generous South Asian flavour into a more considered, contemporary setting. Our food is prepared fresh, cooked with care and served with the warmth of a local favourite.",
        "From slow-simmered curries to food straight from the charcoal grill, every dish is rooted in familiar flavour and finished with our own signature touch.",
      ],
      imageUrl: "/images/story/kitchen.jpg",
      badgeText: "Halal kitchen",
    },
    storeInfo: {
      address: "49 Kilmarnock Road, Shawlands, Glasgow G41 3YN",
      phone: "01412373590",
      email: "info@portopiripiri.co.uk",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=49%20Kilmarnock%20Road%20Shawlands%20Glasgow%20G41%203YN&output=embed",
    },
    socialLinks: [
      { platform: "facebook", href: "https://facebook.com" },
      { platform: "instagram", href: "https://instagram.com" },
    ],
    bottomNote: "Made fresh in Glasgow.",
  };
}

// ---------------------------------------------------------------------------
// Menu categories + items
// ---------------------------------------------------------------------------

export async function getMenuCategories(): Promise<MenuCategory[]> {
  return [
    {
      id: "cat-burger",
      slug: "burger",
      name: "Burger",
      icon: "beef",
      tint: "green",
      items: [
        {
          id: "item-porto-gold-burger",
          name: "Porto Gold Burger",
          description:
            "Flame-grilled chicken thigh glazed in Porto Gold, topped with fresh corn salsa, pickled red onion and crispy onions, served in a toasted potato bun finished with citrus oil.",
          price: 9.45,
          priceLabel: "from",
          optionGroups: burgerOptionGroups(9.45),
        },
        {
          id: "item-mountain-burger",
          name: "Mountain Burger",
          description:
            "Flame-grilled chicken fillet burger marinated with your choice of Piri Piri sauce, topped with hash browns, lettuce, tomato, red onion and mayo.",
          price: 8.95,
          priceLabel: "from",
          optionGroups: burgerOptionGroups(8.95),
        },
        {
          id: "item-nacho-chicken-burger",
          name: "Nacho Chicken Burger",
          description:
            "Flame-grilled chicken fillet burger marinated with your choice of Piri Piri sauce, topped with lettuce, red onion, spicy mayo, jalapeños, salsa, nacho cheese and crushed nacho chips.",
          price: 8.95,
          priceLabel: "from",
          optionGroups: burgerOptionGroups(8.95),
        },
        {
          id: "item-double-cheese-burger",
          name: "Double Cheese Burger",
          description:
            "Double flame-grilled beef burger topped with cheese, lettuce, tomato, onion, onion rings and mayo.",
          price: 10.45,
          priceLabel: "from",
          optionGroups: burgerOptionGroups(10.45),
        },
      ],
    },
    {
      id: "cat-wraps",
      slug: "wraps",
      name: "Wraps",
      icon: "sandwich",
      tint: "neutral",
      items: [
        {
          id: "item-mountain-wrap",
          name: "The Mountain Wrap",
          description: "Chicken with hash brown, lettuce, tomato, onion and mayo.",
          price: 8.95,
          priceLabel: "from",
        },
        {
          id: "item-cheesy-nacho-wrap",
          name: "Cheesy Nacho Wrap",
          description:
            "Chicken with lettuce, spicy mayo, jalapeños, nacho cheese, red onions, salsa and crushed nacho chips.",
          price: 8.95,
          priceLabel: "from",
        },
        {
          id: "item-doner-wrap",
          name: "Doner Wrap",
          description: "Doner meat with lettuce, onion, sweet chilli sauce, mayo and salsa.",
          price: 8.25,
          priceLabel: "from",
        },
      ],
    },
    {
      id: "cat-piri-piri-chicken",
      slug: "piri-piri-chicken",
      name: "Piri Piri Chicken",
      icon: "drumstick",
      tint: "pink",
      items: [
        { id: "item-10-chicken-strips", name: "10 Chicken Strips", price: 15.45, priceLabel: "from" },
        { id: "item-whole-chicken", name: "Whole Chicken", price: 20.95, priceLabel: "from" },
        { id: "item-quarter-chicken", name: "Quarter Chicken", price: 6.95, priceLabel: "from" },
        {
          id: "item-spicy-tot-box",
          name: "Spicy Tot Box",
          description:
            "Piri Piri chicken chunks with fried tater tots topped with melted mozzarella, spicy mayo and your choice of Piri Piri sauce.",
          price: 10.95,
          priceLabel: "from",
        },
      ],
    },
    {
      id: "cat-rice-box",
      slug: "rice-box",
      name: "Rice Box",
      icon: "soup",
      tint: "blue",
      items: [
        {
          id: "item-halloumi-rice-box",
          name: "Halloumi Rice Box",
          description: "Marinated chicken and grilled halloumi with your choice of Piri Piri sauce.",
          price: 8.95,
          priceLabel: "from",
        },
        {
          id: "item-porto-gold-rice-box",
          name: "Porto Gold Rice Box",
          description:
            "Flame-grilled chicken thigh glazed in our signature Porto Gold sauce, served over fragrant rice with roasted sweet potato, fresh corn salsa, pickled red onion and crispy onions.",
          price: 9.45,
          priceLabel: "from",
        },
        {
          id: "item-katsu-chicken-rice-box",
          name: "Katsu Chicken Rice Box",
          description: "Flame-grilled chicken served on fragrant rice.",
          price: 9.25,
          priceLabel: "from",
        },
      ],
    },
    {
      id: "cat-sides",
      slug: "sides",
      name: "Sides",
      icon: "salad",
      tint: "neutral",
      items: [
        {
          id: "item-house-salad-bowl",
          name: "House Salad Bowl",
          description: "Lettuce, onions, tomatoes & cucumber.",
          price: 3.45,
          priceLabel: "from",
        },
        {
          id: "item-cheesy-fries",
          name: "Cheesy Fries",
          description: "Super crunch straight cut chips with mozzarella cheese.",
          price: 3.95,
          priceLabel: "from",
        },
        {
          id: "item-piri-fries",
          name: "Piri Fries",
          description: "Super crunch straight cut chips with Piri seasoning.",
          price: 3.45,
          priceLabel: "from",
        },
      ],
    },
    {
      id: "cat-drinks",
      slug: "drinks",
      name: "Drinks",
      icon: "cupsoda",
      tint: "blue",
      items: [
        {
          id: "item-can",
          name: "Can",
          description: "Pepsi, Tango, Pepsi Max, Irn-Bru, Diet Irn-Bru, 7-Up, Rubicon Mango.",
          price: 1.85,
          priceLabel: "from",
        },
        { id: "item-bottle-water", name: "Bottle Water (500 ml)", price: 1.25 },
        { id: "item-monster-500ml", name: "Monster 500ml", price: 2.45, priceLabel: "from" },
      ],
    },
    {
      id: "cat-desserts",
      slug: "desserts",
      name: "Desserts",
      icon: "icecream",
      tint: "pink",
      items: [
        { id: "item-biscoff-churros", name: "Biscoff Churros", price: 4.95, priceLabel: "from" },
        {
          id: "item-chocolate-churros",
          name: "Chocolate Churros",
          description: "Fried churros tossed in sugar and cinnamon with whipped cream and chocolate dipping sauce.",
          price: 4.95,
          priceLabel: "from",
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function getDeals(): Promise<DealItem[]> {
  return [
    {
      id: "deal-lunch-meal",
      badge: "POPULAR",
      badgeHint: "One tap",
      name: "Lunch Meal Deal",
      description: "Porto Chicken Deluxe Burger — Without meal › Naked + Halal Fries",
      mainLabel: "Main",
      mainValue: "Porto Chicken Deluxe Burger",
      sideLabel: "Side",
      sideValue: "Halal Fries",
      price: 8.99,
      originalPrice: 11.5,
    },
    {
      id: "deal-family-feast",
      badge: "BEST SELLER",
      badgeHint: "One tap",
      name: "Family Feast",
      description:
        "Porto Chicken Deluxe Burger — Without meal › Naked + 5 Chicken Wings — On Its Own › Naked + Halal Fries",
      price: 16.99,
      originalPrice: 21.0,
    },
  ];
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export async function getTotalDishCount(): Promise<number> {
  const categories = await getMenuCategories();
  return categories.reduce((sum, category) => sum + category.items.length, 0);
}

export async function getMenuCategoryBySlug(slug: string): Promise<MenuCategory | undefined> {
  const categories = await getMenuCategories();
  return categories.find((category) => category.slug === slug);
}