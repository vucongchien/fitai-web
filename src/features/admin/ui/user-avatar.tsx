"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * User avatar with a monogram fallback.
 *
 * `next/image` refuses any host missing from `images.remotePatterns` in
 * next.config.ts and answers 400. Identity providers can change, and the admin
 * user service is still on mock fixtures, so the host list is not guaranteed to
 * be complete — `onError` catches that case and falls back to the initial rather
 * than leaving a broken image in the table.
 *
 * `unoptimized` is deliberately NOT used: it would bypass remotePatterns but
 * also every benefit of next/image, leaving an <img> with extra steps.
 */
export function UserAvatar({
  alt,
  size,
  src,
}: {
  src: string | undefined;
  alt: string;
  /** Rendered size in CSS pixels; also the width/height handed to the optimizer. */
  size: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <>{alt.charAt(0).toUpperCase()}</>;
  }

  return (
    <Image
      alt={alt}
      className="size-full object-cover"
      height={size}
      onError={() => setFailed(true)}
      src={src}
      width={size}
    />
  );
}
