"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Info,
  Megaphone,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react";

/* =========================================================
   TOAST SYSTEM — themed to the site's orange / dark-green
   palette. Toasts stack bottom-right and auto-dismiss.

   Usage from React:
     const toast = useToast();
     toast.success("Welcome back!");
     toast.error("Something went wrong.");
     toast.promo("New coupon: WELCOME10");
     toast.info("Preparing your order…");

   Usage from non-React code (lib/*):
     emitToast({ kind: "success", title: "Signed in", body: "..." })
   (ToastProvider listens for the window event.)
========================================================= */

export type ToastKind = "success" | "info" | "promo" | "order" | "wallet";

interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** ms before auto-dismiss. Default 4000. */
  duration?: number;
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
  promo: (title: string, body?: string) => void;
  order: (title: string, body?: string) => void;
  wallet: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Event bridge so lib/* code (which cannot use hooks) can raise toasts. */
const TOAST_EVENT = "porto:toast";

export function emitToast(toast: {
  kind: ToastKind;
  title: string;
  body?: string;
  duration?: number;
}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
}

const KIND_STYLES: Record<
  ToastKind,
  { icon: typeof Info; bar: string; iconWrap: string }
> = {
  success: {
    icon: CheckCircle2,
    bar: "bg-[#178A4B]",
    iconWrap: "bg-[#e6f4ec] text-[#178A4B]",
  },
  info: {
    icon: Info,
    bar: "bg-[#0e3b2e]",
    iconWrap: "bg-[#e8efec] text-[#0e3b2e]",
  },
  promo: {
    icon: Megaphone,
    bar: "bg-[#ff8500]",
    iconWrap: "bg-[#fdf1e3] text-[#ff8500]",
  },
  order: {
    icon: ShoppingBag,
    bar: "bg-[#0e3b2e]",
    iconWrap: "bg-[#e8efec] text-[#0e3b2e]",
  },
  wallet: {
    icon: Wallet,
    bar: "bg-[#178A4B]",
    iconWrap: "bg-[#e6f4ec] text-[#178A4B]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
  }, []);

  /* Listen for toasts raised from non-React code (lib/account.ts etc.) */
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as Omit<ToastItem, "id">;
      if (detail?.title) push(detail);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [push]);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, body) => push({ kind: "success", title, body }),
      error: (title, body) => push({ kind: "info", title, body }),
      info: (title, body) => push({ kind: "info", title, body }),
      promo: (title, body) => push({ kind: "promo", title, body }),
      order: (title, body) => push({ kind: "order", title, body }),
      wallet: (title, body) => push({ kind: "wallet", title, body }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className="pointer-events-none fixed bottom-4 right-4 z-[600] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2.5"
          >
            {toasts.map((toast) => (
              <ToastCard
                key={toast.id}
                toast={toast}
                onClose={() => remove(toast.id)}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

/* =========================================================
   SINGLE TOAST CARD
========================================================= */

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 4000;
  const style = KIND_STYLES[toast.kind];
  const Icon = style.icon;

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setLeaving(true), duration);
    const removeTimer = window.setTimeout(onClose, duration + 350);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      role="status"
      className={`pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-[14px] bg-white p-3.5 pr-10 shadow-[0_12px_36px_rgba(14,59,46,0.18)] transition-all duration-300 ${
        leaving ? "translate-x-6 opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      {/* Left accent bar */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[5px] ${style.bar}`}
      />

      {/* Icon */}
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold leading-snug text-[#15181a]">
          {toast.title}
        </p>
        {toast.body && (
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#6b7075]">
            {toast.body}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[#b3aca2] transition hover:bg-[#f5f1eb] hover:text-[#15181a]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Fail soft — non-React callers should use emitToast instead.
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
