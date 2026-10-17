import { ArrowDown } from "lucide-react";
import { Suspense } from "react";

import { AuthPanel } from "@/features/auth/ui/auth-panel";
import { LoginErrorAlert } from "@/features/auth/ui/login-error-alert";
import { BrandMark } from "@/shared/ui/brand-mark";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Sign in | FITAI" };

export default function LoginPage() {
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
          <div className="login-form-header">
            <h2 id="sign-in-title">Log in</h2>
          </div>
          <Suspense fallback={null}>
            <LoginErrorAlert />
          </Suspense>
          <AuthPanel />
          <p className="login-terms">
            By continuing, you agree to use FITAI as fitness guidance, not medical advice.
          </p>
        </section>
      </main>
    </PageTransition>
  );
}
