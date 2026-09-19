"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import UserAvatar from "./UserAvatar";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  hashPassword,
  subscribeToUser,
  updateStoredUser,
} from "@/lib/auth";
import { processProfilePhoto } from "@/lib/photo";
import { normaliseUKPhoneInput, isValidUKPhone } from "@/lib/checkout-session";

/* =========================================================
   FLOATING-LABEL FIELD
========================================================= */

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <label
        htmlFor={`field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
        className="pointer-events-none absolute left-[14px] top-[9px] z-10 text-[11px] font-medium text-[#999]"
      >
        {label}
      </label>

      <input
        id={`field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        className="h-[59px] w-full rounded-[13px] bg-[#f1f1f1] px-[14px] pb-[4px] pt-[25px] text-[14px] text-[#333] placeholder:text-[#aaa] outline-none transition focus:bg-[#ebebeb] focus:ring-1 focus:ring-[#ff8500] disabled:cursor-not-allowed disabled:text-[#555]"
      />
    </div>
  );
}

/* =========================================================
   MY PROFILE PAGE
========================================================= */

export default function ProfilePageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to update your personal details.
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

  /* ---------- Photo ---------- */
  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setPhotoError("");
    setPhotoBusy(true);

    try {
      const { dataUrl } = await processProfilePhoto(file);
      updateStoredUser({ photo: dataUrl });
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "Could not load that photo."
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  /* ---------- Save ---------- */
  const handleUpdateProfile = async () => {
    setStatus("saving");
    setErrorMessage("");

    if (!firstName.trim() || !lastName.trim()) {
      setStatus("error");
      setErrorMessage("Please fill in your first and last name.");
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setStatus("error");
        setErrorMessage("New password must be at least 6 characters.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setStatus("error");
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    if (phone.trim() && !isValidUKPhone(phone)) {
      setStatus("error");
      setErrorMessage("Enter a valid UK phone number starting with +44 (e.g. +44 7911 123456).");
      return;
    }

    try {
      const patch: Parameters<typeof updateStoredUser>[0] = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      };

      if (newPassword) {
        patch.passwordHash = await hashPassword(newPassword);
      }

      updateStoredUser(patch);

      setNewPassword("");
      setConfirmPassword("");
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* ---------- Close ---------- */}
      <Link
        href="/account"
        aria-label="Close my profile"
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
        My Profile
      </h1>

      <p className="mt-1.5 text-[14px] text-[#6b7075]">
        Update your personal details
      </p>

      {/* ---------- Form card ---------- */}
      <section className="mt-8 rounded-[14px] bg-white p-6 sm:p-8">
        {/* PHOTO */}
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-[#ff8500]">
          Photo
        </p>

        <div className="mt-4">
          <UserAvatar user={user} size={88} />
        </div>

        <div className="mt-3 flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block w-auto text-[13px] text-[#6b7075] file:mr-3 file:h-[36px] file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#f1f1f1] file:px-4 file:text-[13px] file:font-semibold file:text-[#15181a] hover:file:bg-[#e7e7e7]"
          />

          {user.photo && (
            <button
              type="button"
              onClick={() => updateStoredUser({ photo: undefined })}
              className="text-[13px] font-semibold text-[#c0392b] hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>

        {photoBusy && (
          <p className="mt-2 text-[12px] text-[#9aa0a5]">Processing photo…</p>
        )}

        {photoError && (
          <p className="mt-2 text-[12px] font-semibold text-[#c0392b]">
            {photoError}
          </p>
        )}

        {/* FIELDS */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileField
              label="First name"
              value={firstName}
              onChange={(value) => setFirstName(value)}
              placeholder="John"
              autoComplete="given-name"
            />
            <ProfileField
              label="Last name"
              value={lastName}
              onChange={setLastName}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </div>

          <ProfileField label="Email" value={user.email} disabled placeholder="johndoe@example.com" />

          <ProfileField
            label="Phone (UK)"
            value={phone}
            onChange={(value) => setPhone(normaliseUKPhoneInput(value))}
            type="tel"
            placeholder="+44 7911 123456"
            autoComplete="tel"
          />

          <ProfileField
            label="New password (optional)"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />

          {newPassword.length > 0 && (
            <ProfileField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              autoComplete="new-password"
            />
          )}
        </div>

        {/* STATUS */}
        {status === "error" && errorMessage && (
          <p className="mt-4 text-[13px] font-semibold text-[#c0392b]">
            {errorMessage}
          </p>
        )}

        {status === "saved" && (
          <p className="mt-4 text-[13px] font-semibold text-[#178A4B]">
            Profile updated
          </p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleUpdateProfile}
          disabled={status === "saving"}
          className="mt-6 h-[51px] w-full rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-[#f58200] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Updating…" : "Update profile"}
        </button>
      </section>
    </main>
  );
}
