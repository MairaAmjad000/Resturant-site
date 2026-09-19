export const DELIVERY_STORAGE_KEY = "porto-piri-delivery-v1";

/**
 * Postcode districts (outward codes) the Shawlands kitchen delivers to.
 * inference: exact coverage is a business decision — these cover the
 * southside + west end + city centre around 49 Kilmarnock Road.
 */
const SERVED_DISTRICTS = new Set([
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G11",
  "G12",
  "G13",
  "G14",
  "G20",
  "G40",
  "G41",
  "G42",
  "G43",
  "G44",
  "G51",
  "G52",
]);

export interface DeliveryCheck {
  postcode: string;
  /** true = delivers, false = outside the delivery area. */
  deliverable: boolean;
  checkedAt: number;
}

/* =========================================================
   UK POSTCODE VALIDATION
   Full UK format (incl. special cases) — the standard regex
   used across government/retail, simplified for display.
========================================================= */

const UK_POSTCODE_REGEX =
  /^([A-Z]{1,2}\d[A-Z\d]?\s?\d?[A-Z]{0,2})$/i;

/** Normalises a postcode: trims, uppercases, single-spaces the outward/inward gap. */
export function normalisePostcode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Validates a UK postcode shape and returns its outward district,
 * or null when the input is not a plausible UK postcode.
 */
export function validateUKPostcode(
  raw: string
): { valid: true; district: string } | { valid: false } {
  const normalised = normalisePostcode(raw);

  if (!normalised || normalised.length < 5 || normalised.length > 8) {
    return { valid: false };
  }

  if (!UK_POSTCODE_REGEX.test(normalised)) {
    return { valid: false };
  }

  // Outward code: letters+digits before the space (e.g. "G41", "EH12")
  const district = normalised.split(" ")[0];

  return { valid: true, district };
}

/** True when the postcode district is inside the delivery area. */
export function isDistrictServed(district: string): boolean {
  return SERVED_DISTRICTS.has(district.toUpperCase());
}

/** Full check: valid UK postcode AND within a served district. */
export function checkDelivery(raw: string): DeliveryCheck {
  const result = validateUKPostcode(raw);

  if (!result.valid) {
    return { postcode: normalisePostcode(raw), deliverable: false, checkedAt: Date.now() };
  }

  return {
    postcode: normalisePostcode(raw),
    deliverable: isDistrictServed(result.district),
    checkedAt: Date.now(),
  };
}

/* =========================================================
   PERSISTENCE — remembers the last check across visits
========================================================= */

export function parseStoredDelivery(raw: string | null): DeliveryCheck | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DeliveryCheck>;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.postcode !== "string" ||
      typeof parsed.deliverable !== "boolean"
    ) {
      return null;
    }

    return {
      postcode: parsed.postcode,
      deliverable: parsed.deliverable,
      checkedAt: typeof parsed.checkedAt === "number" ? parsed.checkedAt : 0,
    };
  } catch {
    return null;
  }
}

export function readDeliveryCheck(): DeliveryCheck | null {
  if (typeof window === "undefined") return null;
  return parseStoredDelivery(window.localStorage.getItem(DELIVERY_STORAGE_KEY));
}

export function writeDeliveryCheck(check: DeliveryCheck): void {
  window.localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(check));
}
