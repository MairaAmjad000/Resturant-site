"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  ShoppingBag,
  Megaphone,
  Info,
  CheckCheck,
  Trash2,
} from "lucide-react";
import {
  getServerUserSnapshot,
  getUserSnapshot,
  subscribeToUser,
} from "@/lib/auth";
import {
  readNotifications,
  markAllNotificationsRead,
  clearNotifications,
  type AppNotification,
} from "@/lib/account";

/* =========================================================
   ROW
========================================================= */

const KIND_ICON = {
  order: ShoppingBag,
  promo: Megaphone,
  system: Info,
} as const;

const KIND_TINT = {
  order: "bg-[#fdf1e3] text-[#ff8500]",
  promo: "bg-[#e9f1f8] text-[#2f6fab]",
  system: "bg-[#f0f0f0] text-[#6b7075]",
} as const;

function NotificationRow({ notification }: { notification: AppNotification }) {
  const Icon = KIND_ICON[notification.kind] ?? Info;
  const tint = KIND_TINT[notification.kind] ?? KIND_TINT.system;

  return (
    <li
      className={`flex items-start gap-4 px-6 py-4 ${
        notification.read ? "" : "bg-[#fffaf3]"
      }`}
    >
      <span
        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${tint}`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-[#15181a]">
          {notification.title}
          {!notification.read && (
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#ff8500]" />
          )}
        </p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-[#6b7075]">
          {notification.body}
        </p>
        <p className="mt-1 text-[12px] text-[#9aa0a5]">
          {new Date(notification.at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
    </li>
  );
}

/* =========================================================
   NOTIFICATIONS PAGE
========================================================= */

export default function NotificationsPageClient() {
  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [feed, setFeed] = useState<AppNotification[] | null>(null);

  if (feed === null && typeof window !== "undefined") {
    setFeed(readNotifications());
  }

  /* ---------- Signed-out guard ---------- */
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[730px] flex-col justify-center px-4 py-16">
        <div className="rounded-[14px] bg-white p-10 text-center">
          <h1 className="text-[24px] font-bold text-[#15181a]">
            You&apos;re not signed in
          </h1>

          <p className="mt-2 text-[14px] text-[#6b7075]">
            Sign in from the menu page to see your notifications.
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

  const notifications = feed ?? [];
  const unread = notifications.filter((entry) => !entry.read).length;

  const handleMarkAll = () => {
    markAllNotificationsRead();
    setFeed(readNotifications());
  };

  const handleClear = () => {
    clearNotifications();
    setFeed([]);
  };

  return (
    <main className="mx-auto max-w-[730px] px-4 pb-20 pt-10 sm:px-6">
      {/* Close */}
      <Link
        href="/"
        aria-label="Close notifications page"
        className="fixed right-5 top-5 z-20 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-[#15181a] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition hover:bg-[#f7f7f7]"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#15181a] hover:text-[#ff8500]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Heading */}
      <h1 className="mt-5 text-[28px] font-bold text-[#15181a]">
        Notifications
      </h1>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="mt-4 flex gap-3">
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex h-[40px] items-center gap-2 rounded-full border border-[#e0e0e0] bg-white px-5 text-[13px] font-semibold text-[#15181a] transition hover:bg-[#fafafa]"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-[40px] items-center gap-2 rounded-full border border-[#f2c4bd] bg-white px-5 text-[13px] font-semibold text-[#c0392b] transition hover:bg-[#fdeeec]"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </button>
        </div>
      )}

      {/* Feed / empty state */}
      {notifications.length === 0 ? (
        <p className="mt-6 text-[14px] text-[#9aa0a5]">
          No notifications yet.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col divide-y divide-[#f0f0f0] rounded-[14px] bg-white">
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </ul>
      )}
    </main>
  );
}
