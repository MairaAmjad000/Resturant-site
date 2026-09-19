import type { DealItem, MenuCategory, MenuItem } from "@/types/menu";

export const CART_STORAGE_KEY = "porto-piri-cart-v1";
export const MAX_ITEM_QUANTITY = 99;

/**
 * Options picked in the customise modal, keyed by group id.
 * `null` = plain line (no customisation) — kept distinct from `{}` so
 * plain adds of the same item merge together.
 */
export type LineSelections = Record<string, string[]> | null;

export interface CartLine {
  /** Stable identity: itemId + selections signature. */
  lineId: string;
  item: MenuItem;
  quantity: number;
  selections: LineSelections;
}

export function flattenMenuItems(categories: MenuCategory[]): Map<string, MenuItem> {
  const map = new Map<string, MenuItem>();
  for (const category of categories) {
    for (const item of category.items) {
      map.set(item.id, item);
    }
  }
  return map;
}

/**
 * One catalog containing every purchasable thing: menu items plus deals.
 * Deals are exposed as MenuItem-shaped entries so the rest of the cart
 * logic does not need to know the difference.
 */
export function buildCartCatalog(
  categories: MenuCategory[],
  deals: DealItem[]
): Map<string, MenuItem> {
  const catalog = flattenMenuItems(categories);

  for (const deal of deals) {
    catalog.set(deal.id, {
      id: deal.id,
      name: deal.name,
      description: [deal.mainValue, deal.sideValue]
        .filter(Boolean)
        .join(" + "),
      price: deal.price,
    });
  }

  return catalog;
}

export function cartQuantity(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/* =========================================================
   CUSTOMISATION PRICING
========================================================= */

/**
 * Unit price of a line, including its selected options.
 *
 * Rule: if the item has any "choice" group, the base price is replaced
 * by the chosen option's price (so an unchosen required option renders
 * as £0.00 in the modal, exactly like the reference design). "addon"
 * options always add on top. Items without choice groups start from
 * their base price.
 */
export function lineUnitPrice(
  item: MenuItem,
  selections: LineSelections
): number {
  const groups = item.optionGroups ?? [];
  const hasChoice = groups.some((group) => group.kind === "choice");

  let price = hasChoice ? 0 : item.price;

  if (selections) {
    for (const group of groups) {
      const picked = selections[group.id];
      if (!picked) continue;

      for (const optionId of picked) {
        const option = group.options.find((entry) => entry.id === optionId);
        if (option) price += option.price;
      }
    }
  }

  return price;
}

export function lineTotal(line: CartLine): number {
  return lineUnitPrice(line.item, line.selections) * line.quantity;
}

/** Stable per-line identity from the item and its selections. */
export function lineKey(itemId: string, selections: LineSelections): string {
  if (!selections) return itemId;

  const parts = Object.keys(selections)
    .sort()
    .map((groupId) => `${groupId}=${[...selections[groupId]].sort().join("+")}`)
    .join(";");

  return parts ? `${itemId}#${parts}` : itemId;
}

/** Short human-readable summary of the picks, for cart/checkout rows. */
export function selectionsSummary(
  item: MenuItem,
  selections: LineSelections
): string[] {
  if (!selections) return [];

  const summary: string[] = [];

  for (const group of item.optionGroups ?? []) {
    const picked = selections[group.id];
    if (!picked || picked.length === 0) continue;

    const names = picked
      .map(
        (optionId) =>
          group.options.find((option) => option.id === optionId)?.name
      )
      .filter(Boolean);

    if (names.length > 0) summary.push(names.join(", "));
  }

  return summary;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

/* =========================================================
   PERSISTENCE
========================================================= */

interface StoredLine {
  itemId?: unknown;
  quantity?: unknown;
  selections?: unknown;
}

function sanitizeSelections(
  item: MenuItem,
  raw: unknown
): LineSelections {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const cleaned: Record<string, string[]> = {};
  let any = false;

  for (const group of item.optionGroups ?? []) {
    const picked = record[group.id];
    if (!Array.isArray(picked)) continue;

    const valid = picked.filter(
      (optionId): optionId is string =>
        typeof optionId === "string" &&
        group.options.some((option) => option.id === optionId)
    );

    if (valid.length > 0) {
      cleaned[group.id] = valid;
      any = true;
    }
  }

  return any ? cleaned : null;
}

export function parseStoredCart(raw: string | null, catalog: Map<string, MenuItem>): CartLine[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const lines: CartLine[] = [];

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as StoredLine;
      if (typeof record.itemId !== "string") continue;

      const item = catalog.get(record.itemId);
      const quantity = Number(record.quantity);
      if (!item || !Number.isInteger(quantity) || quantity < 1) continue;

      const selections = sanitizeSelections(item, record.selections);

      lines.push({
        lineId: lineKey(item.id, selections),
        item,
        quantity: Math.min(quantity, MAX_ITEM_QUANTITY),
        selections,
      });
    }

    return lines;
  } catch {
    return [];
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(
    lines.map((line) => ({
      itemId: line.item.id,
      quantity: line.quantity,
      ...(line.selections ? { selections: line.selections } : {}),
    }))
  );
}

export function clearStoredCart(): void {
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

/* =========================================================
   MUTATIONS
========================================================= */

function replaceLine(lines: CartLine[], lineId: string, map: (line: CartLine) => CartLine): CartLine[] {
  return lines.map((line) => (line.lineId === lineId ? map(line) : line));
}

/** Plain add (no customisation) — merges into the existing plain line. */
export function addOrIncrement(lines: CartLine[], item: MenuItem): CartLine[] {
  const lineId = lineKey(item.id, null);
  const existing = lines.find((line) => line.lineId === lineId);

  if (!existing) {
    return [
      ...lines,
      { lineId, item, quantity: 1, selections: null },
    ];
  }

  return replaceLine(lines, lineId, (line) => ({
    ...line,
    quantity: Math.min(line.quantity + 1, MAX_ITEM_QUANTITY),
  }));
}

/** Add a configured line from the customise modal. */
export function addConfiguredLine(
  lines: CartLine[],
  item: MenuItem,
  quantity: number,
  selections: LineSelections
): CartLine[] {
  const lineId = lineKey(item.id, selections);
  const existing = lines.find((line) => line.lineId === lineId);

  if (!existing) {
    return [
      ...lines,
      { lineId, item, quantity, selections },
    ];
  }

  return replaceLine(lines, lineId, (line) => ({
    ...line,
    quantity: Math.min(line.quantity + quantity, MAX_ITEM_QUANTITY),
  }));
}

export function setLineQuantity(lines: CartLine[], lineId: string, quantity: number): CartLine[] {
  if (quantity < 1) {
    return lines.filter((line) => line.lineId !== lineId);
  }

  return replaceLine(lines, lineId, (line) => ({
    ...line,
    quantity: Math.min(quantity, MAX_ITEM_QUANTITY),
  }));
}

/**
 * Adds a line (optionally customised) to the *persisted* cart — outside
 * the shell's React state — used by pages rendered without
 * RestaurantShell (e.g. the favourites page). The shell re-reads
 * localStorage on next mount; the caller renders from the returned lines.
 */
export function addConfiguredLineToStoredCart(
  catalog: Map<string, MenuItem>,
  itemId: string,
  quantity: number,
  selections: LineSelections
): CartLine[] | null {
  const item = catalog.get(itemId);
  if (!item) return null;

  const lines = parseStoredCart(
    window.localStorage.getItem(CART_STORAGE_KEY),
    catalog
  );

  const next = addConfiguredLine(lines, item, quantity, selections);

  window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(next));
  return next;
}
