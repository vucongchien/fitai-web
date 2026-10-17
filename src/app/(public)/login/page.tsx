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
        </section>

        <section aria-labelledby="sign-in-title" className="login-form-panel">
          <div>
            <h2 id="sign-in-title">Bắt đầu cùng FITAI</h2>
            <p>Dữ liệu và lộ trình bài tập được đồng bộ liền mạch trên mọi thiết bị.</p>
          </div>
          <Suspense fallback={null}>
            <LoginErrorAlert />
          </Suspense>
          <AuthPanel />
          <p className="login-terms">
            Bằng việc tiếp tục, bạn đồng ý sử dụng FITAI như một ứng dụng hỗ trợ luyện tập cá nhân.
          </p>
        </section>
      </main>
    </PageTransition>
  );
}
