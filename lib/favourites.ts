/**
 * Favourites — a set of menu-item ids the user has hearted.
 * Kept as a plain id array in localStorage; menu pages resolve ids to items
 * via the catalog, so stale ids (menu changed) are simply ignored.
 */

import type { MenuItem } from "@/types/menu";

export const FAVOURITES_STORAGE_KEY = "porto-piri-favourites-v1";

export function readFavourites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeFavourites(ids: string[]): void {
  window.localStorage.setItem(
    FAVOURITES_STORAGE_KEY,
    JSON.stringify([...new Set(ids)])
  );
}

export function isFavourite(itemId: string): boolean {
  return readFavourites().includes(itemId);
}

/** Toggles an item; returns the new favourite state. */
export function toggleFavourite(itemId: string): boolean {
  const ids = readFavourites();
  const exists = ids.includes(itemId);

  writeFavourites(
    exists ? ids.filter((id) => id !== itemId) : [...ids, itemId]
  );

  return !exists;
}

/** Resolves favourite ids to menu items, skipping unknown/stale ids. */
export function resolveFavouriteItems(
  catalog: Map<string, MenuItem>
): MenuItem[] {
  return readFavourites()
    .map((id) => catalog.get(id))
    .filter((item): item is MenuItem => item !== undefined);
}
