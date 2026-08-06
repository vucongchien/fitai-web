import { NextResponse } from "next/server";

export function popupResponse(
  message: { type: "OAUTH_COMPLETE"; dest?: string } | { type: "OAUTH_ERROR"; message?: string },
  fallbackUrl: string,
  _origin: string,
): NextResponse {
  const safeFallback = fallbackUrl.startsWith("/") ? fallbackUrl : "/home";
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
(function(){try{if(window.opener&&!window.opener.closed){window.opener.postMessage(${JSON.stringify(message)}, "*");return;}}catch(e){}window.location.assign(${JSON.stringify(safeFallback)});})();
</script><noscript><meta http-equiv="refresh" content="0;url=${safeFallback}"></noscript></body></html>`;

  const res = new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (message.type === "OAUTH_ERROR") {
    res.cookies.delete("fitai_oauth_popup");
    res.cookies.delete("fitai_oauth_state");
  }
  return res;
}

export const buildPopupHtml = (dest: string, origin: string) =>
  popupResponse({ type: "OAUTH_COMPLETE", dest }, dest, origin);

export const buildErrorPopupHtml = (code: string, origin: string) =>
  popupResponse(
    { type: "OAUTH_ERROR", message: code },
    `/login?error=${encodeURIComponent(code)}`,
    origin,
  );
