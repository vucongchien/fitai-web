import { ArrowDown } from "lucide-react";

import { LoginActions } from "@/features/auth/ui/login-actions";
import { BrandMark } from "@/shared/ui/brand-mark";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Sign in" };

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const loginErrors: Record<string, string> = {
  callback_failed: "We could not finish signing you in. Check your connection and try again.",
  invalid_provider: "That sign-in provider is not available. Choose Google or Facebook.",
  invalid_state: "Your sign-in session expired. Start again to keep your account secure.",
  missing_code: "The provider did not return a sign-in code. Start again to continue.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error
    ? (loginErrors[error] ?? "Sign-in did not complete. Start again to continue.")
    : null;

  return (
    <PageTransition className="login-page">
      <header className="login-header">
        <BrandMark href="/login" />
        <span>Training, made clear</span>
      </header>

      <main className="login-main">
        <section className="login-thesis">
          <div>
            <h1>Know what to train next.</h1>
            <p>
              A four-week route that fits your time, your equipment, and how your body responds.
            </p>
          </div>
          <TripleLane labelled />
          <span aria-hidden="true" className="login-scroll-cue">
            <ArrowDown size={17} />
          </span>
        </section>

        <section aria-labelledby="sign-in-title" className="login-form-panel">
          <div>
            <h2 id="sign-in-title">Start with your account</h2>
            <p>Your training details stay connected when you switch devices.</p>
          </div>
          {errorMessage ? (
            <p className="login-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <LoginActions />
          <p className="login-terms">
            By continuing, you agree to use FITAI as fitness guidance, not medical advice.
          </p>
        </section>
      </main>
    </PageTransition>
  );
}
