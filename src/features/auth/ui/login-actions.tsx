"use client";

import { useCallback, useState } from "react";

import { Button } from "@/shared/ui/button";

import { FacebookMark, GoogleMark } from "./provider-marks";

export type OAuthProvider = "google" | "facebook";

export type OAuthMessage =
  | { type: "OAUTH_COMPLETE"; dest?: string }
  | { type: "OAUTH_ERROR"; message?: string };

export function openOAuthPopup(provider: OAuthProvider) {
  const url = `/api/auth/oauth/${provider}?popup=1`;
  const popup = window.open(url, "oauth_popup", "popup=yes,width=500,height=650");

  if (!popup) {
    window.location.assign(url);
    return null;
  }

  return popup;
}

export function LoginActions() {
  const [pending, setPending] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  const continueWith = useCallback(
    (provider: OAuthProvider) => {
      if (pending) return;
      setPending(true);

      const popup = openOAuthPopup(provider);
      if (!popup) return;

      let cleanedUp = false;

      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        clearInterval(pollClosed);
        setPending(false);
      };

      const onMessage = (event: MessageEvent<OAuthMessage>) => {
        if (event.origin && event.origin !== "null" && event.origin !== window.location.origin) return;
        if (event.data?.type === "OAUTH_COMPLETE") {
          window.removeEventListener("message", onMessage);
          try {
            popup.close();
          } catch {}
          cleanup();
          const dest =
            typeof event.data.dest === "string" && event.data.dest.startsWith("/")
              ? event.data.dest
              : "/home";
          window.location.assign(dest);
          return;
        }

        if (event.data?.type === "OAUTH_ERROR") {
          window.removeEventListener("message", onMessage);
          try {
            popup.close();
          } catch {}
          cleanup();
          console.error(`[LoginActions] OAuth error: ${event.data.message ?? "unknown"}`);
        }
      };

      window.addEventListener("message", onMessage);

      const pollClosed = window.setInterval(() => {
        if (popup.closed) {
          setPending(false);
        }
      }, 300);
    },
    [pending],
  );

  return (
    <div className="login-actions">
      <Button
        className="login-provider"
        disabled={pending}
        id="login-google"
        loading={pending}
        onClick={() => continueWith("google")}
        size="large"
        type="button"
      >
        <span aria-hidden="true" className="login-provider__mark login-provider__mark--google">
          <GoogleMark />
        </span>
        Continue with Google
      </Button>
      <Button
        className="login-provider"
        disabled={pending}
        id="login-facebook"
        onClick={() => continueWith("facebook")}
        size="large"
        type="button"
        variant="secondary"
      >
        <span aria-hidden="true" className="login-provider__mark login-provider__mark--facebook">
          <FacebookMark />
        </span>
        Continue with Facebook
      </Button>

      {isDev && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px dashed #ccc",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <small style={{ color: "#888", fontWeight: 600 }}>🛠️ DEV MODE SHORTCUTS</small>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={() => window.location.assign("/api/auth/dev-login?target=new")}
            >
              ⚡ Dev: New User
            </Button>
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={() => window.location.assign("/api/auth/dev-login?target=existing")}
            >
              ⚡ Dev: Existing User
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
