"use client";

import SafeImage from "@/components/restaurant/SafeImage";
import { userInitial, type AuthUser } from "@/lib/auth";

interface UserAvatarProps {
  user: AuthUser;
  /** Pixel size of the circle. */
  size: number;
  className?: string;
}

/**
 * Shows the user's profile photo when they've uploaded one,
 * otherwise the orange initial circle used across the site.
 */
export default function UserAvatar({ user, size, className = "" }: UserAvatarProps) {
  const circleClass = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ff8500] font-bold text-white ${className}`;

  if (user.photo) {
    return (
      <span
        className={circleClass}
        style={{ width: size, height: size }}
      >
        <SafeImage
          src={user.photo}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          fallback={
            <span style={{ fontSize: Math.round(size * 0.4) }}>
              {userInitial(user)}
            </span>
          }
        />
      </span>
    );
  }

  return (
    <span className={circleClass} style={{ width: size, height: size }}>
      <span style={{ fontSize: Math.round(size * 0.4) }}>
        {userInitial(user)}
      </span>
    </span>
  );
}
