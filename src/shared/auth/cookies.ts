interface AuthCookieOptionsInput {
  isProduction?: boolean;
  maxAge: number;
  domain?: string;
}

export function createAuthCookieOptions({
  isProduction = process.env.NODE_ENV === "production",
  maxAge,
  domain = process.env.AUTH_COOKIE_DOMAIN?.trim() || (isProduction ? ".chien.id.vn" : undefined),
}: AuthCookieOptionsInput) {
  return {
    httpOnly: true as const,
    maxAge,
    path: "/" as const,
    sameSite: "lax" as const,
    secure: isProduction,
    ...(domain ? { domain } : {}),
  };
}
