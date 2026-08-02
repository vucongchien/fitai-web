type AuthCookieOptionsInput = {
  isProduction?: boolean;
  maxAge: number;
};

export function createAuthCookieOptions({
  isProduction = process.env.NODE_ENV === "production",
  maxAge,
}: AuthCookieOptionsInput) {
  return {
    httpOnly: true as const,
    maxAge,
    path: "/" as const,
    sameSite: "lax" as const,
    secure: isProduction,
  };
}
