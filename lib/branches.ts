export const BRANCH_STORAGE_KEY = "porto-piri-branch-v1";

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export const BRANCHES: Branch[] = [
  {
    id: "shawlands",
    name: "Shawlands",
    address: "49 Kilmarnock Road, Shawlands, Glasgow G41 3YN",
  },
  {
    id: "city-centre",
    name: "City Centre",
    address: "12 Gordon Street, Glasgow G1 3PL",
  },
  {
    id: "east-end",
    name: "East End",
    address: "88 Duke Street, Glasgow G31 1PZ",
  },
];

export const DEFAULT_BRANCH_ID = BRANCHES[0].id;

/* =========================================================
   OPENING HOURS
   Single source of truth — used by the welcome modal, cart
   drawer, checkout/payment summaries and the schedule pickers.
========================================================= */

/** "17:00" — the takeaway's daily opening time. */
export const OPENING_TIME = "17:00";
/** "22:30" — the takeaway's daily closing time. */
export const CLOSING_TIME = "22:30";

/* =========================================================
   TINY STORE (useSyncExternalStore-compatible)
   Same pattern as lib/auth.ts — cached snapshot, storage
   event keeps other tabs in sync.
========================================================= */

const listeners = new Set<() => void>();

let cachedBranchId: string | undefined;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToBranch(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === BRANCH_STORAGE_KEY) {
      cachedBranchId = undefined;
      onChange();
    }
  };

  listeners.add(onChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getBranchSnapshot(): Branch {
  if (cachedBranchId === undefined) {
    const raw = window.localStorage.getItem(BRANCH_STORAGE_KEY);
    cachedBranchId = BRANCHES.some((b) => b.id === raw)
      ? (raw as string)
      : DEFAULT_BRANCH_ID;
  }

  return BRANCHES.find((b) => b.id === cachedBranchId) ?? BRANCHES[0];
}

export function getServerBranchSnapshot(): Branch {
  return BRANCHES[0];
}

export function setSelectedBranch(branchId: string) {
  window.localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
  cachedBranchId = branchId;
  emitChange();
}
