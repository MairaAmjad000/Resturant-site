"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, LogOut, Heart, Phone, Mail, Truck, ChevronDown } from "lucide-react";
import SafeImage from "./SafeImage";
import OpeningWelcomeModal from "./OpeningWelcomeModal";
import PostcodeModal from "./PostcodeModal";
import UserAvatar from "@/components/account/UserAvatar";
import BranchSelector from "./BranchSelector";
import { emitToast } from "@/components/ui/ToastProvider";
import { normaliseUKPhoneInput, isValidUKPhone } from "@/lib/checkout-session";
import type { NavLink as NavLinkType } from "@/types/menu";
import {
  AUTH_STORAGE_KEY,
  clearStoredUser,
  getServerUserSnapshot,
  getUserSnapshot,
  parseStoredUser,
  subscribeToUser,
  userDisplayName,
  writeStoredUser,
  type AuthUser,
} from "@/lib/auth";
import { unreadNotificationCount } from "@/lib/account";

interface SiteHeaderProps {
  logoUrl: string;
  logoAlt: string;
  navLinks: NavLinkType[];
  activeHref?: string;
  cartCount?: number;
  onCartClick?: () => void;
  storeInfo?: { phone: string; email: string };
}

const HEADER_OFFSET = 80;

/* =========================================================
   APPLE ICON
========================================================= */

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.14-2.55-1.7-2.51-3-7.1-1.25-10.22.87-1.55 2.43-2.53 4.12-2.56 1.28-.02 2.5.87 3.27.87.77 0 2.21-1.08 3.72-.92.63.03 2.4.26 3.54 1.99-.09.06-2.12 1.23-2.1 3.68.03 2.92 2.56 3.9 2.59 3.91-.02.07-.4 1.36-1.31 2.7-.79 1.16-1.61 2.31-2.83 2.34ZM15.53 4.48c.69-.83 1.15-1.99 1.02-3.14-1 .04-2.21.67-2.93 1.5-.64.73-1.2 1.9-1.05 3.03 1.11.08 2.25-.56 2.96-1.39Z" />
    </svg>
  );
}

/* =========================================================
   GOOGLE ICON
========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.42Z"
      />

      <path
        fill="#34A853"
        d="M12 21.99c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.99Z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 14.07A5.85 5.85 0 0 1 6.23 12c0-.72.12-1.42.31-2.07V7.4H3.3A9.96 9.96 0 0 0 2.25 12c0 1.66.4 3.22 1.05 4.6l3.24-2.53Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.9c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 2.99 14.63 2 12 2a9.74 9.74 0 0 0-8.7 5.4l3.24 2.53C7.31 7.62 9.46 5.9 12 5.9Z"
      />
    </svg>
  );
}

/* =========================================================
   INPUT COMPONENT
========================================================= */

function FormInput({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  invalid = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <label className="absolute left-[14px] top-[9px] z-10 text-[11px] font-medium text-[#999]">
          {label}
        </label>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={
            onChange
              ? (event) => onChange(event.target.value)
              : undefined
          }
          className={`h-[59px] w-full rounded-[13px] bg-[#f1f1f1] px-[14px] pb-[4px] pt-[25px] text-[14px] text-[#333] placeholder:text-[#aaa] outline-none transition ${
            invalid
              ? "bg-[#fdf2f2] ring-1 ring-[#c0392b]"
              : "focus:bg-[#ebebeb] focus:ring-1 focus:ring-[#ff8500]"
          }`}
        />
      </div>

      {invalid && error && (
        <p className="mt-1 px-1 text-[12px] font-semibold text-[#c0392b]">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   LOGIN / REGISTER MODAL
========================================================= */

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRefCode, setRegisterRefCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);

  /* ---------- Validation ----------
     Errors appear only after the user attempts a submit, and
     clear live once the offending field becomes valid. */
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [registerAttempted, setRegisterAttempted] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const loginEmailInvalid =
    loginAttempted && (!loginEmail.trim() || !EMAIL_RE.test(loginEmail.trim()));
  const loginPasswordInvalid =
    loginAttempted && loginPassword.length < 6;

  const registerFirstNameInvalid = registerAttempted && !registerFirstName.trim();
  const registerLastNameInvalid = registerAttempted && !registerLastName.trim();
  const registerPhoneInvalid =
    registerAttempted && !isValidUKPhone(registerPhone);
  const registerEmailInvalid =
    registerAttempted &&
    (!registerEmail.trim() || !EMAIL_RE.test(registerEmail.trim()));
  const registerPasswordInvalid = registerAttempted && registerPassword.length < 6;

  /* Escape */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  /* Prevent background scroll */
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const isLogin = mode === "login";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-3 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      {/* =====================================================
          MODAL

          IMPORTANT:
          max-h keeps the modal inside the viewport.
          overflow-y-auto allows scrolling on smaller screens.
      ===================================================== */}

      <div
        className={`relative w-full max-w-[440px] overflow-y-auto rounded-[16px] bg-white px-[30px] py-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] modal-scroll ${
          isLogin
            ? "max-h-[calc(100vh-24px)]"
            : "max-h-[calc(100vh-24px)]"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#f3f3f3] text-[#666] transition hover:bg-[#e8e8e8]"
        >
          <X className="h-[14px] w-[14px]" />
        </button>

        {/* =================================================
            LOGIN
        ================================================= */}

        {isLogin ? (
          <>
            <h2 className="mb-[26px] text-[25px] font-bold leading-none text-[#222]">
              Login
            </h2>

            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                setLoginAttempted(true);

                const emailOk =
                  loginEmail.trim() && EMAIL_RE.test(loginEmail.trim());
                const passwordOk = loginPassword.length >= 6;
                if (!emailOk || !passwordOk) return;

                // Login API will go here —
                // for now we sign the user in locally.
                const existing = parseStoredUser(
                  window.localStorage.getItem(AUTH_STORAGE_KEY)
                );
                const sameUser =
                  existing &&
                  existing.email.toLowerCase() ===
                    loginEmail.toLowerCase();

                onSuccess(
                  sameUser
                    ? existing
                    : userFromEmail(loginEmail) ?? {
                        firstName: "",
                        lastName: "",
                        email: loginEmail,
                      }
                );

                emitToast({
                  kind: "success",
                  title: "Signed in",
                  body: `Welcome back${existing?.firstName ? `, ${existing.firstName}` : ""}! You can now place orders.`,
                });
              }}
              className="space-y-3"
            >
              {/* Email */}
              <FormInput
                label="E-mail *"
                placeholder="johndoe@example.com"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                invalid={loginEmailInvalid}
                error={
                  loginEmail.trim()
                    ? "Enter a valid email address (e.g. johndoe@example.com)."
                    : "Email is required."
                }
              />

              {/* Password */}
              <FormInput
                label="Password *"
                placeholder="Enter your password"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                invalid={loginPasswordInvalid}
                error={
                  loginPassword
                    ? "Password must be at least 6 characters."
                    : "Password is required."
                }
              />

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between py-[2px]">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#666]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    className="h-[16px] w-[16px] cursor-pointer accent-[#ff8500]"
                  />

                  Remember me
                </label>

                <button
                  type="button"
                  className="text-[13px] font-semibold text-[#ff8500] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login */}
              <button
                type="submit"
                className="mt-[10px] h-[51px] w-full rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-orange-hover"
              >
                Login
              </button>

              {/* Create Account */}
              <div className="flex items-center justify-center gap-2 pt-[6px] text-[13px]">
                <span className="text-[#777]">
                  Don’t have an account?
                </span>

                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-[#ff8500] hover:underline"
                >
                  Create account
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-[12px]">
                <div className="h-px flex-1 bg-[#e2e2e2]" />

                <span className="text-[13px] text-[#999]">
                  or
                </span>

                <div className="h-px flex-1 bg-[#e2e2e2]" />
              </div>

              {/* Social */}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex h-[61px] flex-1 items-center justify-center gap-2 rounded-full bg-[#181818] px-3 text-[13px] font-semibold text-white transition hover:bg-black"
                >
                  <AppleIcon />

                  <span className="whitespace-nowrap">
                    Continue with Apple
                  </span>
                </button>

                <button
                  type="button"
                  className="flex h-[61px] flex-1 items-center justify-center gap-2 rounded-full border border-[#dedede] bg-white px-3 text-[13px] font-medium text-[#333] transition hover:bg-[#fafafa]"
                >
                  <GoogleIcon />

                  <span className="whitespace-nowrap">
                    Continue with Google
                  </span>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* =================================================
             REGISTER
          ================================================= */

          <>
            <h2 className="mb-[26px] text-[25px] font-bold leading-none text-[#222]">
              Register
            </h2>

            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                setRegisterAttempted(true);

                const allValid =
                  registerFirstName.trim() &&
                  registerLastName.trim() &&
                  isValidUKPhone(registerPhone) &&
                  registerEmail.trim() &&
                  EMAIL_RE.test(registerEmail.trim()) &&
                  registerPassword.length >= 6;

                if (!allValid) return;

                // Create account API will go here —
                // for now we sign the user in locally.
                onSuccess({
                  firstName: registerFirstName,
                  lastName: registerLastName,
                  email: registerEmail,
                  phone: registerPhone || undefined,
                  referenceCode: registerRefCode || undefined,
                });

                emitToast({
                  kind: "success",
                  title: "Account created",
                  body: `Welcome to Porto Piri Piri, ${registerFirstName}! Your account is ready.`,
                });
              }}
              className="space-y-3"
            >
              {/* First name */}
              <FormInput
                label="Firstname *"
                placeholder="John"
                value={registerFirstName}
                onChange={setRegisterFirstName}
                invalid={registerFirstNameInvalid}
                error="First name is required."
              />

              {/* Last name */}
              <FormInput
                label="Lastname *"
                placeholder="Doe"
                value={registerLastName}
                onChange={setRegisterLastName}
                invalid={registerLastNameInvalid}
                error="Last name is required."
              />

              {/* Phone */}
              <FormInput
                label="Phone (UK) *"
                placeholder="+44 7911 123456"
                type="tel"
                value={registerPhone}
                onChange={(value) => setRegisterPhone(normaliseUKPhoneInput(value))}
                invalid={registerPhoneInvalid}
                error="Enter a valid UK phone number starting with +44."
              />

              {/* Email */}
              <FormInput
                label="E-mail *"
                placeholder="johndoe@example.com"
                type="email"
                value={registerEmail}
                onChange={setRegisterEmail}
                invalid={registerEmailInvalid}
                error={
                  registerEmail.trim()
                    ? "Enter a valid email address (e.g. johndoe@example.com)."
                    : "Email is required."
                }
              />

              {/* Password */}
              <FormInput
                label="Password *"
                placeholder="At least 6 characters"
                type="password"
                value={registerPassword}
                onChange={setRegisterPassword}
                invalid={registerPasswordInvalid}
                error={
                  registerPassword
                    ? "Password must be at least 6 characters."
                    : "Password is required."
                }
              />

              {/* Reference code (optional) */}
              <FormInput
                label="Reference code"
                placeholder="Enter if you have one"
                value={registerRefCode}
                onChange={setRegisterRefCode}
              />

              {/* Terms */}
              <p className="pt-[4px] text-[12px] leading-[19px] text-[#666]">
                You agree to our{" "}
                <button
                  type="button"
                  className="font-semibold text-[#ff8500] hover:underline"
                >
                  Terms of Use
                </button>{" "}
                and confirm that you have read our{" "}
                <button
                  type="button"
                  className="font-semibold text-[#ff8500] hover:underline"
                >
                  Privacy Promise
                </button>{" "}
                by creating an account, placing an order or making
                a reservation.
              </p>

              {/* Marketing consent */}
              <label className="flex cursor-pointer items-start gap-3 pt-[2px]">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) =>
                    setMarketingConsent(event.target.checked)
                  }
                  className="mt-[2px] h-[16px] w-[16px] shrink-0 cursor-pointer accent-[#ff8500]"
                />

                <span className="text-[12px] leading-[19px] text-[#666]">
                  I would like to receive news and offers regarding
                  the restaurant&apos;s products, campaigns etc. via
                  email, SMS and push messages. I am aware that I
                  may withdraw my consent at any time by
                  deactivating the channels in the messages I
                  receive or in my user profile.
                </span>
              </label>

              {/* Create account */}
              <button
                type="submit"
                className="mt-[10px] h-[51px] w-full rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-[#f58200] hover:bg-orange-hover"
              >
                Create account
              </button>

              {/* Back to login */}
              <div className="flex justify-center pt-[3px]">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[13px] font-semibold text-[#ff8500] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}/* =========================================================
   EMAIL → DISPLAY NAME HELPER
========================================================= */

function userFromEmail(email: string): AuthUser | null {
  if (!email.includes("@")) return null;

  const rawLocal = email.split("@")[0] || "";
  const parts = rawLocal
    .split(/[._-]+/)
    .filter(Boolean)
    .filter((part) => part.length > 1);

  if (parts.length >= 2) {
    const cap = (value: string) =>
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

    return {
      firstName: cap(parts[0]),
      lastName: cap(parts[parts.length - 1]),
      email: email,
    } satisfies AuthUser;
  }
  return null;
}

/* =========================================================
   SITE HEADER
========================================================= */

export default function SiteHeader({
  logoUrl,
  logoAlt,
  navLinks,
  activeHref,
  cartCount = 0,
  onCartClick,
  storeInfo,
}: SiteHeaderProps) {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [postcodeOpen, setPostcodeOpen] = useState(false);

  /** Post-login "Opens at 17:00 / Pre Order" welcome dialog. */
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  /* Notification badge — live count of unread notifications */
  const [notifCount, setNotifCount] = useState(() => {
    try { return unreadNotificationCount(); } catch { return 0; }
  });
  useEffect(() => {
    const refresh = () => { try { setNotifCount(unreadNotificationCount()); } catch { /* ignore */ } };
    window.addEventListener("storage", refresh);
    const id = setInterval(refresh, 5000);
    return () => { window.removeEventListener("storage", refresh); clearInterval(id); };
  }, []);

  const [activeSection, setActiveSection] = useState(
    activeHref || "#top"
  );

  const [isScrollingToSection, setIsScrollingToSection] =
    useState(false);

  /* =========================================================
     AUTH ACTIONS
  ========================================================= */

  /* Any component can request the login modal (e.g. add-to-cart when
     signed out) by dispatching this window event. */
  useEffect(() => {
    const openLogin = () => setLoginOpen(true);
    window.addEventListener("porto:open-login", openLogin);
    return () => window.removeEventListener("porto:open-login", openLogin);
  }, []);

  const handleAuthSuccess = (nextUser: AuthUser) => {
    writeStoredUser(nextUser);
    setAccountMenuOpen(false);
    setLoginOpen(false);

    // Greet every fresh login with the opening-hours welcome.
    setWelcomeOpen(true);
  };

  const handleSignOut = () => {
    clearStoredUser();
    setAccountMenuOpen(false);
  };

  /* Close the account dropdown on outside click / Escape */
  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (target instanceof Element && !target.closest("[data-account-menu]")) {
        setAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  /* =========================================================
     ACTIVE SECTION
  ========================================================= */

  useEffect(() => {
    const sections = navLinks
      .filter((link) => link.href.startsWith("#"))
      .map((link) =>
        document.getElementById(link.href.substring(1))
      )
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const handleScroll = () => {
      if (isScrollingToSection) return;

      let currentSection = "#top";

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= HEADER_OFFSET + 100) {
          currentSection = `#${section.id}`;
        }
      }

      setActiveSection(currentSection);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [navLinks, isScrollingToSection]);

  /* =========================================================
     NAV CLICK
  ========================================================= */

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.startsWith("#")) {
      setMobileOpen(false);
      return;
    }

    e.preventDefault();

    setMobileOpen(false);

    const targetId = href.substring(1);
    const target = document.getElementById(targetId);

    if (!target) return;

    setActiveSection(href);
    setIsScrollingToSection(true);

    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      HEADER_OFFSET;

    window.scrollTo({
      top,
      behavior: "smooth",
    });

    window.history.pushState(null, "", href);

    setTimeout(() => {
      setIsScrollingToSection(false);
      setActiveSection(href);
    }, 700);
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <>
      {/* =========================================================
          TOP BAR — thin utility strip above the main header.
          Scrolls away naturally; the header below stays sticky.
      ========================================================= */}
      <div className="border-b border-[#e9e3db] bg-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Contact — left */}
          <div className="hidden min-w-0 items-center gap-5 sm:flex">
            {storeInfo?.phone ? (
              <a
                href={`tel:${storeInfo.phone.replace(/\s/g, "")}`}
                className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#4a5157] transition-colors hover:text-[#ff8500]"
              >
                <Phone className="h-3.5 w-3.5 text-[#ff8500]" strokeWidth={2.2} />
                {storeInfo.phone}
              </a>
            ) : null}
            {storeInfo?.email ? (
              <a
                href={`mailto:${storeInfo.email}`}
                className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#4a5157] transition-colors hover:text-[#ff8500]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#ff8500]" strokeWidth={2.2} />
                <span className="truncate">{storeInfo.email}</span>
              </a>
            ) : null}
          </div>

          {/* Free delivery pill — centre */}
          <div className="flex flex-1 justify-center sm:flex-none">
            <div className="flex items-center overflow-hidden rounded-full bg-[#ff8500] shadow-sm">
              <span className="flex items-center gap-1.5 py-1 pl-3 pr-2.5 text-[10px] font-bold uppercase tracking-wider text-white sm:text-[11px]">
                <Truck className="h-3.5 w-3.5" strokeWidth={2.4} />
                Free delivery on order above
              </span>
              <span className="bg-[#0e3b2e] py-1 pl-2.5 pr-3 text-[10px] font-bold text-white sm:text-[11px]">
                £20.00
              </span>
            </div>
          </div>

          {/* Postcode check — right */}
          <button
            type="button"
            onClick={() => setPostcodeOpen(true)}
            className="hidden shrink-0 text-[12px] font-medium text-[#4a5157] transition-colors hover:text-[#ff8500] sm:block"
          >
            Check delivery postcode
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-[100] border-b border-[#e9e3db] bg-[#fbf9f6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[69px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <a
            href="#top"
            onClick={(e) =>
              handleNavClick(e, "#top")
            }
            className="relative flex h-10 w-[132px] shrink-0 items-center"
          >
            <SafeImage
              src={logoUrl}
              alt={logoAlt}
              fill
              className="object-contain object-left"
              priority
              fallback={
                <span className="text-[15px] font-bold leading-tight text-[#0e3b2e]">
                  Porto Piri Piri
                </span>
              }
            />
          </a>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 rounded-full md:flex"
          >
            {navLinks.map((link) => {
              const isActive =
                activeSection === link.href;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) =>
                    handleNavClick(e, link.href)
                  }
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#0e3b2e] text-white"
                      : "text-[#4a5157] hover:bg-[#f5f1eb] hover:text-[#15181a]"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            {/* Branch — pretty dropdown, selection shared app-wide */}
            <BranchSelector className="hidden sm:block" />

            {/* Sign In / User pill */}
            {user ? (
              <div className="relative hidden sm:block" data-account-menu>
                <button
                  type="button"
                  onClick={() =>
                    setAccountMenuOpen((open) => !open)
                  }
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  className="group flex h-11 bg-[#0e3b2e] items-center gap-2.5 rounded-full pl-1 pr-4 transition-colors hover:bg-[#17614a] "
                >
                  <UserAvatar user={user} size={36} />
                  {/* <span className="max-w-[120px] truncate text-sm font-semibold text-white">
                    {userDisplayName(user)}
                  </span> */}
                  <ChevronDown
                    className={`h-4 w-4 text-white/80 transition-all duration-200 group-hover:text-white ${
                      accountMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {accountMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[52px] w-56 rounded-2xl bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                  >
                    {/* Identity */}
                    <div className="px-1 pb-2 pt-1">
                      <UserAvatar user={user} size={40} />

                      <p className="mt-2 truncate text-[15px] font-bold text-[#15181a]">
                        {userDisplayName(user)}
                      </p>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col">
                      {[
                        {
                          href: "/account/profile",
                          label: "My Profile",
                        },
                        {
                          href: "/account/orders",
                          label: "My Orders",
                        },
                        {
                          href: "/account/notifications",
                          label: "Notifications",
                          badge: notifCount,
                        },
                        {
                          href: "/account",
                          label: "Account settings",
                        },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-1 py-2.5 text-[14px] font-medium text-[#3d4348] transition-colors hover:text-[#ff8500]"
                        >
                          {item.label}
                          {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff8500] px-1 text-[10px] font-bold leading-none text-white">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                        </Link>
                      ))}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="mt-1 rounded-lg px-1 py-2.5 text-left text-[14px] font-semibold text-[#ff8500] transition-colors hover:text-[#e07700]"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="hidden rounded-full border border-[#d8d0c5] bg-white px-5 py-2.5 text-sm font-semibold text-[#15181a] transition-colors hover:border-[#0e3b2e] sm:inline-flex"
                >
                Sign In
              </button>
            )}

          

            {/* Cart — signed-in users only */}
            {user && (
              <button
                type="button"
                onClick={onCartClick}
                aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : "Open cart"}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d0c5] bg-white transition hover:bg-orange"
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff8500] px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Menu */}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() =>
                setMobileOpen((value) => !value)
              }
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d8d0c5] bg-white md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-1 border-t border-[#e9e3db] bg-[#fbf9f6] px-4 py-3 md:hidden"
          >
            {/* Branch Selector — mobile */}
            <div className="mb-1">
              <BranchSelector className="w-full" />
            </div>

            {navLinks.map((link) => {
              const isActive =
                activeSection === link.href;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) =>
                    handleNavClick(e, link.href)
                  }
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#0e3b2e] text-white"
                      : "text-[#4a5157] hover:bg-[#f5f1eb]"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            {/* Mobile Favourites — signed-in users only */}
            {user && (
              <Link
                href="/account/favourites"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-lg border border-[#d8d0c5] bg-white px-3 py-2.5 text-sm font-semibold text-[#15181a]"
              >
                <Heart className="h-4 w-4 text-[#ff8500]" />
                Favourites
              </Link>
            )}

            {/* Mobile Sign In / Account */}
            {user ? (
              <>
                {/* Account links — same as desktop dropdown */}
                <div className="mt-1 rounded-lg border border-[#d8d0c5] bg-white">
                  {[
                    { label: "My Profile", href: "/account/profile" },
                    { label: "My Orders", href: "/account/orders" },
                    { label: "Notifications", href: "/account/notifications", badge: notifCount },
                    { label: "Account Settings", href: "/account" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-2.5 text-[13px] font-medium text-[#15181a] last:border-b-0 hover:bg-[#fff5eb]"
                    >
                      <span>{item.label}</span>
                      {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff8500] px-1 text-[10px] font-bold leading-none text-white">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                
                {/* User pill */}
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#d8d0c5] bg-white px-3 py-2.5">
                  <Link
                    href="/account/profile"
                    onClick={() => setMobileOpen(false)}
                    aria-label="My profile"
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <UserAvatar user={user} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#15181a]">
                        {userDisplayName(user)}
                      </p>
                      <p className="truncate text-[12px] text-[#8a8f94]">
                        {user.email}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#c0392b] transition-colors hover:bg-[#f7f3ee]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

                
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setLoginOpen(true);
                }}
                className="mt-2 rounded-lg border border-[#d8d0c5] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#15181a]"
              >
                Sign In
              </button>
            )}
          </nav>
        )}
      </header>

      {/* =====================================================
          AUTH MODAL
      ===================================================== */}

      {loginOpen && (
        <AuthModal
          onClose={() => setLoginOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {postcodeOpen && (
        <PostcodeModal
          onClose={() => setPostcodeOpen(false)}
          onConfirmed={(check) => {
            setPostcodeOpen(false);

            // Usable outcome: preselect Delivery when the user's address is
            // served (or they explicitly chose collection-only), so checkout
            // and the cart drawer agree with what the user just confirmed.
            window.dispatchEvent(
              new CustomEvent("porto:delivery-check", { detail: check })
            );
          }}
        />
      )}

      {welcomeOpen && (
        <OpeningWelcomeModal
          restaurantName={logoAlt || "Porto Piri Piri"}
          opensAt="17:00"
          onClose={() => setWelcomeOpen(false)}
          onPreOrder={() => {
            setWelcomeOpen(false);
            document
              .getElementById("menu")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </>
  );
}