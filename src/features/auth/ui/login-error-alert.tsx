"use client";

import { useSearchParams } from "next/navigation";

const loginErrors: Record<string, string> = {
  callback_failed: "We could not finish signing you in. Check your connection and try again.",
  invalid_provider: "That sign-in provider is not available. Choose Google or Facebook.",
  invalid_state: "Your sign-in session expired. Start again to keep your account secure.",
  missing_code: "The provider did not return a sign-in code. Start again to continue.",
};

export function LoginErrorAlert() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) {return null;}

  const errorMessage = loginErrors[error] ?? "Sign-in did not complete. Start again to continue.";

  return (
    <p className="login-error" role="alert">
      {errorMessage}
    </p>
  );
}
