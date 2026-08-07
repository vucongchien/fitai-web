"use client";

import { usePushRegistration } from "@/shared/push/use-push-registration";

/**
 * The user gesture that push permission requires. Never auto-prompt: an unasked
 * permission dialog is the fastest way to a permanent "denied", which cannot be
 * undone from the page.
 */
export function EnablePushButton() {
  const { enable, status } = usePushRegistration();

  if (status === "granted") return null;
  if (status === "unsupported") {
    return (
      <p className="push-optin__note">Add FITAI to your home screen to get session reminders.</p>
    );
  }
  if (status === "denied") {
    return (
      <p className="push-optin__note">
        Notifications are blocked. Enable them for this site in your browser settings.
      </p>
    );
  }

  return (
    <button
      className="secondary-button push-optin__button"
      disabled={status === "asking"}
      onClick={() => void enable()}
      type="button"
    >
      {status === "asking" ? "Enabling…" : "Turn on reminders"}
    </button>
  );
}
