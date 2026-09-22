"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Trash2, X } from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
  userDisplayName,
} from "@/lib/auth";
import {
  readSavedAddresses,
  writeSavedAddresses,
  type AddressType,
  type SavedAddress,
} from "@/lib/account";
import { normaliseUKPhoneInput, isValidUKPhone } from "@/lib/checkout-session";
import { normalisePostcode, validateUKPostcode } from "@/lib/delivery";

/* =========================================================
   FLOATING-LABEL FIELD
========================================================= */

function AddressField({
  label,
  value,
  onChange,
  type = "text",
  textarea,
  rows = 3,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const id = `addr-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  const controlClass =
    "w-full rounded-[13px] bg-[#f1f1f1] px-[14px] text-[14px] text-[#333] placeholder:text-transparent outline-none transition focus:bg-[#ebebeb] focus:ring-1 focus:ring-[#ff8500]";

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-[14px] top-[9px] z-10 text-[11px] font-medium text-[#999]"
      >
        {label}{required && <span className="ml-0.5 text-[#c0392b]">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} resize-none pb-[10px] pt-[25px]`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} h-[59px] pb-[4px] pt-[25px]`}
        />
      )}
    </div>
  );
}

/* =========================================================
   ADD / EDIT FORM
========================================================= */

interface AddressForm {
  contactName: string;
  contactPhone: string;
  address: string;
  type: AddressType;
  house: string;
  floor: string;
  road: string;
  postcode: string;
}

const EMPTY_FORM: AddressForm = {
  contactName: "",
  contactPhone: "",
  address: "",
  type: "home",
  house: "",
  floor: "",
  road: "",
  postcode: "",
};

const TYPE_OPTIONS: { value: AddressType; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

function AddressFormCard({
  defaults,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaults?: { contactName: string; contactPhone: string };
  onSubmit: (form: AddressForm) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<AddressForm>({
    ...EMPTY_FORM,
    ...defaults,
  });
  const [error, setError] = useState("");

  const set = <K extends keyof AddressForm>(
    key: K,
    value: AddressForm[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = () => {
    const missing: string[] = [];
    if (!form.contactName.trim()) missing.push("Contact name");
    if (!form.contactPhone.trim()) missing.push("Contact phone");
    if (!form.address.trim()) missing.push("Address");
    if (!form.house.trim()) missing.push("House");
    if (!form.road.trim()) missing.push("Road");
    if (!form.postcode.trim()) missing.push("Postcode");

    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    if (!isValidUKPhone(form.contactPhone)) {
      setError("Enter a valid UK mobile number starting with +447 (e.g. +447911123456).");
      return;
    }

    if (!validateUKPostcode(form.postcode).valid) {
      setError("Enter a valid UK postcode (e.g. G41 3YN).");
      return;
    }

    setError("");
    onSubmit(form);
  };

  return (
    <section className="rounded-[14px] bg-white p-6 sm:p-8">
      <h2 className="text-[20px] font-bold text-[#15181a]">Add address</h2>

      <div className="mt-5 flex flex-col gap-3">
        <AddressField
          label="Contact name"
          value={form.contactName}
          onChange={(value) => set("contactName", value)}
          placeholder="John Doe"
          required
        />

        <AddressField
          label="Contact phone (UK)"
          value={form.contactPhone}
          onChange={(value) => set("contactPhone", normaliseUKPhoneInput(value))}
          type="tel"
          placeholder="+447911123456"
          required
        />

        <AddressField
          label="Address"
          value={form.address}
          onChange={(value) => set("address", value)}
          textarea
          rows={3}
          placeholder="261 Kilmarnock Road, Shawlands"
          required
        />

        {/* Type select */}
        <div className="relative">
          <label
            htmlFor="addr-type"
            className="pointer-events-none absolute left-[14px] top-[9px] z-10 text-[11px] font-medium text-[#999]"
          >
            Type
          </label>

          <select
            id="addr-type"
            value={form.type}
            onChange={(event) =>
              set("type", event.target.value as AddressType)
            }
            className="h-[59px] w-full appearance-none rounded-[13px] bg-[#f1f1f1] px-[14px] pb-[4px] pt-[25px] text-[14px] text-[#333] outline-none transition focus:bg-[#ebebeb] focus:ring-1 focus:ring-[#ff8500]"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom chevron */}
          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff8500]"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AddressField
            label="House"
            value={form.house}
            onChange={(value) => set("house", value)}
            placeholder="261"
            required
          />
          <AddressField
            label="Floor (optional)"
            value={form.floor}
            onChange={(value) => set("floor", value)}
            placeholder="Floor 2, Flat 4B"
          />
        </div>

        <AddressField
          label="Road"
          value={form.road}
          onChange={(value) => set("road", value)}
          placeholder="Kilmarnock Road"
          required
        />

        <AddressField
          label="Postcode"
          value={form.postcode}
          onChange={(value) => set("postcode", normalisePostcode(value))}
          placeholder="G41 3YN"
          required
        />
      </div>

      {error && (
        <p className="mt-4 text-[13px] font-semibold text-[#c0392b]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-6 h-[51px] w-full rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-[#f58200]"
      >
        {submitLabel}
      </button>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-semibold text-[#6b7075] transition-colors hover:text-[#15181a]"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   ADDRESS CARD
========================================================= */

const TYPE_LABELS: Record<AddressType, string> = {
  home: "Home",
  work: "Work",
  other: "Other",
};

function AddressCard({
  address,
  onDelete,
}: {
  address: SavedAddress;
  onDelete: () => void;
}) {
  return (
    <article className="flex items-start gap-4 rounded-[14px] bg-white p-6">
      <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#fdf1e3]">
        <MapPin className="h-5 w-5 text-[#ff8500]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold text-[#15181a]">
            {TYPE_LABELS[address.type]}
          </p>

          {address.contactName && (
            <span className="rounded-full bg-[#f1f1f1] px-2 py-0.5 text-[11px] font-semibold text-[#6b7075]">
              {address.contactName}
            </span>
          )}
        </div>

        <p className="mt-1 text-[13px] leading-[20px] text-[#6b7075]">
          {[
            address.address,
            address.house,
            address.floor,
            address.road,
            address.postcode,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>

        {address.contactPhone && (
          <p className="mt-1 text-[12px] text-[#9aa0a5]">
            {address.contactPhone}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete address"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#c0392b] transition-colors hover:bg-[#fdeeec]"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}

/* =========================================================
   SAVED ADDRESSES PAGE
========================================================= */

export default function AddressesPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [addresses, setAddresses] = useState<SavedAddress[]>(() =>
    readSavedAddresses()
  );
  const [showForm, setShowForm] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to manage your addresses.
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

  const handleSave = (form: AddressForm) => {
    const address: SavedAddress = {
      id: `addr-${Date.now().toString(36)}`,
      type: form.type,
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      address: form.address.trim(),
      house: form.house.trim(),
      floor: form.floor.trim(),
      road: form.road.trim(),
      postcode: form.postcode.trim(),
    };

    const next = [address, ...addresses];
    setAddresses(next);
    writeSavedAddresses(next);

    setShowForm(false);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2500);
  };

  const handleDelete = (id: string) => {
    const next = addresses.filter((address) => address.id !== id);
    setAddresses(next);
    writeSavedAddresses(next);
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* ---------- Close ---------- */}
      <Link
        href="/account"
        aria-label="Close saved addresses"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* ---------- Back ---------- */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#15181a] transition-colors hover:text-[#ff8500]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* ---------- Heading ---------- */}
      <p className="mt-6 text-[12px] font-bold uppercase tracking-[2px] text-[#8a8f94]">
        Account
      </p>

      <h1 className="mt-2 text-[34px] font-bold leading-tight text-[#15181a]">
        Saved Addresses
      </h1>

      <p className="mt-1.5 text-[14px] text-[#6b7075]">
        Manage delivery and collection addresses
      </p>

      <div ref={scrollAnchorRef} />

      {/* ---------- List ---------- */}
      {addresses.length === 0 && !showForm && (
        <p className="mt-8 text-[14px] text-[#9aa0a5]">
          No saved addresses yet.
        </p>
      )}

      {addresses.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onDelete={() => handleDelete(address.id)}
            />
          ))}
        </div>
      )}

      {savedFlash && (
        <p className="mt-4 text-[13px] font-semibold text-[#178A4B]">
          Address saved
        </p>
      )}

      {/* ---------- Add / Form ---------- */}
      <div className="mt-6">
        {showForm ? (
          <AddressFormCard
            defaults={{
              contactName: userDisplayName(user),
              contactPhone: user.phone ?? "",
            }}
            onSubmit={handleSave}
            onCancel={() => setShowForm(false)}
            submitLabel="Save address"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="h-[51px] w-full rounded-full border border-[#e0e0e0] bg-white text-[14px] font-bold text-[#15181a] transition hover:border-[#ff8500] hover:text-[#ff8500]"
          >
            + Add address
          </button>
        )}
      </div>
    </main>
  );
}
