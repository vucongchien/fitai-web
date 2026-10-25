"use client";

import Image from "next/image";
import { useState } from "react";

// User avatar with monogram fallback on unconfigured remote image hosts.
export function UserAvatar({
  alt,
  size,
  src,
}: {
  src: string | undefined;
  alt: string;
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
