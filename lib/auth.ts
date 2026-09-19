export const AUTH_STORAGE_KEY = "porto-piri-user-v1";

export interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** Profile photo as a small (160px) JPEG data URL. */
  photo?: string;
  /** SHA-256 of the password set from My Profile (backend will replace this). */
  passwordHash?: string;
  /** Optional reference / referral code entered during registration. */
  referenceCode?: string;
}

/* =========================================================
   TINY STORE (useSyncExternalStore-compatible)
   - Caches the parsed user so getSnapshot is referentially
     stable between renders.
   - Notifies subscribers whenever the stored user changes
     (same tab or another tab via the `storage` event).
========================================================= */

const listeners = new Set<() => void>();

let cachedUser: AuthUser | null | undefined;

function invalidateCache() {
  cachedUser = undefined;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToUser(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      invalidateCache();
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

export function getUserSnapshot(): AuthUser | null {
  if (cachedUser === undefined) {
    cachedUser = parseStoredUser(
      window.localStorage.getItem(AUTH_STORAGE_KEY)
    );
  }

  return cachedUser;
}

export function getServerUserSnapshot(): AuthUser | null {
  return null;
}

/* =========================================================
   READ / WRITE
========================================================= */

export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const record = parsed as {
      firstName?: unknown;
      lastName?: unknown;
      email?: unknown;
      phone?: unknown;
      photo?: unknown;
      passwordHash?: unknown;
      referenceCode?: unknown;
    };

    if (typeof record.email !== "string" || !record.email.includes("@")) {
      return null;
    }

    return {
      firstName:
        typeof record.firstName === "string" ? record.firstName : "",
      lastName: typeof record.lastName === "string" ? record.lastName : "",
      email: record.email,
      phone: typeof record.phone === "string" ? record.phone : undefined,
      photo:
        typeof record.photo === "string" && record.photo.startsWith("data:image/")
          ? record.photo
          : undefined,
      passwordHash:
        typeof record.passwordHash === "string"
          ? record.passwordHash
          : undefined,
      referenceCode:
        typeof record.referenceCode === "string"
          ? record.referenceCode
          : undefined,
    };
  } catch {
    return null;
  }
}

export function writeStoredUser(user: AuthUser): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

  cachedUser = user;
  emitChange();
}

/**
 * Patches the stored user with partial updates and notifies subscribers.
 * No-op when nobody is signed in.
 */
/**
 * Requests the site's login modal (SiteHeader listens for this event).
 * Used when a signed-out visitor tries an action that requires an account.
 */
export function requestLogin(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("porto:open-login"));
}

export function updateStoredUser(patch: Partial<Omit<AuthUser, "email">>): AuthUser | null {
  const current = getUserSnapshot();
  if (!current) return null;

  const next: AuthUser = { ...current, ...patch };
  writeStoredUser(next);

  return next;
}

export function clearStoredUser(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);

  cachedUser = null;
  emitChange();
}

/* =========================================================
   DISPLAY HELPERS
========================================================= */

export function userDisplayName(user: AuthUser): string {
  const name = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (name) return name;

  return user.email.split("@")[0] || "Account";
}

export function userInitial(user: AuthUser): string {
  const name = userDisplayName(user);
  return name.charAt(0).toUpperCase() || "U";
}

/**
 * Hashes a password for local storage. Frontend-only stand-in:
 * the real backend will own credentials.
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`porto-piri:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
