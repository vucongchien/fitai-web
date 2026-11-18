const STATIC_EXT_REGEX =
  /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|css|m?js|map|wasm|onnx|webmanifest|mp4)$/i;

const SHARED_PASSTHROUGH_PREFIXES = [
  "/_next",
  "/api",
  "/rpc",
  "/login",
  "/auth",
  "/ort",
  "/models",
];

const SHARED_PASSTHROUGH_EXACT = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

export type SubdomainKind = "admin" | "partner" | "main";

export function detectSubdomain(host: string | null | undefined): SubdomainKind {
  if (!host) {
    return "main";
  }
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "admin.localhost" || hostname.startsWith("admin.")) {
    return "admin";
  }
  if (hostname === "partner.localhost" || hostname.startsWith("partner.")) {
    return "partner";
  }
  return "main";
}

function isSharedPassthrough(pathname: string): boolean {
  if (SHARED_PASSTHROUGH_EXACT.has(pathname) || STATIC_EXT_REGEX.test(pathname)) {
    return true;
  }
  return SHARED_PASSTHROUGH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveSubdomainRewrite(
  host: string | null | undefined,
  pathname: string,
): string | null {
  const subdomain = detectSubdomain(host);
  if (subdomain === "main" || isSharedPassthrough(pathname)) {
    return null;
  }

  const targetPrefix = subdomain === "admin" ? "/admin" : "/partner";
  if (pathname === "/") {
    return targetPrefix;
  }
  if (pathname === targetPrefix || pathname.startsWith(`${targetPrefix}/`)) {
    return null;
  }
  return `${targetPrefix}${pathname}`;
}
