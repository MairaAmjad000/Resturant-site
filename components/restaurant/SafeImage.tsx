"use client";

import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";

type SafeImageProps = ImageProps & {
  fallback?: ReactNode;
};

export default function SafeImage({ fallback, alt, onError, src, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const missing = typeof src !== "string" || src.length === 0;

  if (failed || missing) {
    return <>{fallback ?? null}</>;
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
