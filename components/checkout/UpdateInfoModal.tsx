"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateStoredUser } from "@/lib/auth";
import { normaliseUKPhoneInput, isValidUKPhone } from "@/lib/checkout-session";

interface UpdateInfoModalProps {
  initialFirstName: string;
  initialLastName: string;
  initialPhone: string;
  onClose: () => void;
}

/**
 * "Update Information" dialog on the checkout page — edits the signed-in
 * user's first/last name and phone in the auth store. Changes propagate
 * to the checkout card, header, and account pages instantly.
 */
export default function UpdateInfoModal({
  initialFirstName,
  initialLastName,
  initialPhone,
  onClose,
}: UpdateInfoModalProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);

  /* Lock scroll + Escape */
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const firstNameInvalid = attempted && !firstName.trim();
  const lastNameInvalid = attempted && !lastName.trim();
  const phoneInvalid = attempted && (!phone.trim() || !isValidUKPhone(phone));

  const handleUpdate = () => {
    setAttempted(true);

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;
    if (!isValidUKPhone(phone)) return;

    updateStoredUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    });

    setSaved(true);
    onClose();
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    invalid: boolean,
    type = "text",
    placeholder?: string
  ) => (
    <div
      className={`relative rounded-[10px] bg-[#f5f5f5] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ff8500]/60 ${
        invalid ? "ring-1 ring-[#c0392b]" : ""
      }`}
    >
      <label
        htmlFor={id}
        className="absolute left-[16px] top-[9px] z-10 text-[11px] font-medium text-[#9aa0a5]"
      >
        {label} <span className="text-[#3d4348]">*</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[56px] w-full rounded-[10px] border-0 bg-transparent px-[16px] pb-[6px] pt-[20px] text-[14px] font-medium text-[#15181a] outline-none placeholder:text-[#c9c9c9]"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Update Information"
    >
      <div
        className="relative w-full max-w-[440px] rounded-t-[20px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:rounded-[16px] sm:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#ececec] bg-white text-[#666] transition hover:bg-[#f5f5f5]"
        >
          <X className="h-[13px] w-[13px]" />
        </button>

        <h2 className="text-[24px] font-bold text-[#15181a]">
          Update Information
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("info-first-name", "First name", firstName, setFirstName, firstNameInvalid)}
          {field("info-last-name", "Last name", lastName, setLastName, lastNameInvalid)}
        </div>

        <div className="mt-3">
          {field(
            "info-phone",
            "Phone number (UK)",
            phone,
            (value) => setPhone(normaliseUKPhoneInput(value)),
            phoneInvalid,
            "tel",
            "+447911123456"
          )}
        </div>

        {attempted && (firstNameInvalid || lastNameInvalid || phoneInvalid) && (
          <p className="mt-3 text-[12px] font-semibold text-[#c0392b]">
            {!isValidUKPhone(phone) && phone.trim()
              ? "Enter a valid UK phone number starting with +44 (e.g. +447911123456)."
              : "Please fill in all required fields."}
          </p>
        )}

        <button
          type="button"
          onClick={handleUpdate}
          className="mt-6 flex h-[54px] w-full items-center justify-center rounded-full bg-[#ff8500] text-[15px] font-bold text-white transition hover:bg-[#f58200]"
        >
          {saved ? "Updated ✓" : "Update"}
        </button>
      </div>
    </div>
  );
}
