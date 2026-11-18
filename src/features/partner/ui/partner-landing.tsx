import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Cpu,
  Search,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BrandRegisterForm } from "@/features/partner/ui/brand-register-form";
import { BrandMark } from "@/shared/ui/brand-mark";

export interface PartnerLandingProps {
  isAuthenticated: boolean;
  isBrandAccount: boolean;
  userName?: string;
}

const ECOSYSTEM_PILLARS = [
  {
    icon: Cpu,
    title: "AI Coach Real-Time trên Trình Duyệt",
    description:
      "Người dùng tập luyện với hệ thống nhận diện tư thế ONNX Runtime Web và đếm rep tự động ngay trên thiết bị, giữ trải nghiệm mượt mà và riêng tư.",
    badge: "Đang hoạt động",
    isAvailable: true,
  },
  {
    icon: Users,
    title: "Cộng Đồng Social & Tìm Kiếm Brand",
    description:
      "Tài khoản Brand Partner sau khi xác thực được phân loại riêng trên hệ thống tìm kiếm cộng đồng, giúp người tập dễ dàng kết nối với thương hiệu.",
    badge: "Đang hoạt động",
    isAvailable: true,
  },
  {
    icon: Swords,
    title: "Gamification, FitCoins & Solo-Match",
    description:
      "Hệ sinh thái tích điểm FitCoins, bảng xếp hạng Leaderboard và thi đấu 1v1 tạo động lực quay lại tập luyện mỗi ngày.",
    badge: "Nền tảng sẵn sàng",
    isAvailable: true,
  },
];

const PARTNER_ROADMAP = [
  {
    icon: Sparkles,
    title: "Bài viết tài trợ (Sponsored Feed)",
    description:
      "Phân phối nội dung quảng bá sản phẩm/phòng tập trực tiếp trên bảng tin Community.",
    status: "Sắp ra mắt",
  },
  {
    icon: Award,
    title: "Đổi Voucher bằng FitCoins",
    description: "Cho phép người tập dùng FitCoins tích lũy để đổi mã giảm giá từ Brand Partner.",
    status: "Sắp ra mắt",
  },
  {
    icon: Activity,
    title: "Tài trợ Giải đấu & Solo-Match",
    description: "Gắn thương hiệu vào các thử thách cộng đồng và sự kiện thi đấu hàng tuần.",
    status: "Sắp ra mắt",
  },
];

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Gửi hồ sơ thương hiệu",
    detail: "Điền tên thương hiệu, mô tả, số điện thoại liên hệ và địa chỉ qua biểu mẫu bên dưới.",
  },
  {
    step: "02",
    title: "Quản trị viên xét duyệt",
    detail:
      "Đội ngũ FITAI kiểm tra thông tin đối tác và phê duyệt trực tiếp trên Admin Backoffice.",
  },
  {
    step: "03",
    title: "Kích hoạt Brand Partner",
    detail:
      "Tài khoản được nâng cấp vai trò Brand, mở khóa Partner Dashboard và hiện diện trên hệ thống.",
  },
];

export function PartnerLanding({ isAuthenticated, isBrandAccount, userName }: PartnerLandingProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark href="/partner" />
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-bold">
              Partner Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isBrandAccount ? (
              <Link
                href="/partner/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Partner Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <a
                href="#register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Đăng ký đối tác
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-20">
        {/* Hero */}
        <section className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-muted)]">
            <Search className="size-3.5 text-[var(--color-action)]" />
            FITAI Partner Ecosystem
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-display leading-tight">
            Đồng hành cùng cộng đồng tập luyện AI{" "}
            <span className="text-[var(--color-action)]">FITAI</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
            Kết nối thương hiệu phòng tập, thực phẩm bổ sung và thiết bị thể thao với người dùng
            đang tập luyện mỗi ngày qua hệ thống AI Coach, Community và Gamification.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {isBrandAccount ? "Xem trạng thái đối tác" : "Đăng ký Brand Partner"}
              <ArrowRight className="size-4" />
            </a>
            {isBrandAccount ? (
              <Link
                href="/partner/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold hover:bg-[var(--color-surface-subtle)] transition-colors"
              >
                Mở Dashboard
              </Link>
            ) : null}
          </div>
        </section>

        {/* Ecosystem Pillars (Live) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display">Nền tảng hệ sinh thái FITAI</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Các hạ tầng cốt lõi đang vận hành thực tế trên ứng dụng FITAI.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ECOSYSTEM_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)] flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-recovery)]/15 text-[var(--color-recovery)] text-[11px] font-semibold">
                      <CheckCircle2 className="size-3" />
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roadmap (Coming Soon) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display">Lộ trình mở rộng cho Brand Partner</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Các tính năng thương mại đang được phát triển cho giai đoạn tiếp theo.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PARTNER_ROADMAP.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)]/50 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-semibold">
                      <Clock className="size-3" />
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3-Step Onboarding */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display">Quy trình trở thành đối tác</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Kết nối trực tiếp với quy trình xét duyệt Brand Partner trên hệ thống FITAI.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ONBOARDING_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-2"
              >
                <span className="text-xs font-bold tracking-wider text-[var(--color-action)]">
                  BƯỚC {item.step}
                </span>
                <h3 className="text-base font-bold font-display">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Registration Section */}
        <section id="register" className="scroll-mt-24 space-y-4 max-w-2xl">
          <BrandRegisterForm
            isAuthenticated={isAuthenticated}
            isBrandAccount={isBrandAccount}
            userName={userName}
          />
        </section>
      </main>
    </div>
  );
}
