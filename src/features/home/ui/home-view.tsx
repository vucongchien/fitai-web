"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { HomePageData } from "@/features/home/model/home-page.types";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayTimeline } from "@/features/home/ui/today-timeline";
import { NAV_FORWARD } from "@/shared/ui/transition-types";
import { FeedbackState } from "@/shared/ui/feedback-state";
import { initiateRoadmapServerAction } from "@/features/planning/server/planning-actions";

interface HomeViewProps {
  data: HomePageData;
}

export function HomeView({ data }: HomeViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCreateRoadmap = () => {
    startTransition(async () => {
      const res = await initiateRoadmapServerAction();
      if (res.success) {
        router.refresh();
      }
    });
  };

  const handleRetry = () => {
    router.refresh();
  };

  if (data.error) {
    const isNoRoadmap = data.error.type === "NO_ROADMAP";
    return (
      <div className="home-grid mt-4">
        <section className="content-section">
          <FeedbackState
            title={isNoRoadmap ? "Lộ trình tập luyện chưa được thiết lập" : "Lỗi kết nối máy chủ"}
            description={
              isNoRoadmap
                ? "Vui lòng cập nhật Onboarding Profile của bạn để AI Coach phân tích thể trạng và tự động thiết kế lộ trình tập luyện cá nhân hóa."
                : "Đã xảy ra sự cố kết nối tới máy chủ gRPC. Vui lòng kiểm tra lại cấu hình hoặc kết nối mạng và thử lại."
            }
            tone={isNoRoadmap ? "empty" : "error"}
            actionLabel={
              isPending
                ? "Đang tạo lộ trình..."
                : isNoRoadmap
                ? "Nhấn để tạo lộ trình"
                : "Nhấn để thử lại"
            }
            onActionClick={isNoRoadmap ? handleCreateRoadmap : handleRetry}
          />
        </section>
      </div>
    );
  }

  return (
    <>
      <CoachNote message={data.coachNote} />

      <div className="home-grid">
        <section className="content-section home-week">
          <div className="content-section__header">
            <h2>Today&rsquo;s plan</h2>
            <p>Meals and sessions in order</p>
          </div>

          <TodayTimeline items={data.todayTimeline} />

          <Link className="text-action" href="/roadmap" transitionTypes={NAV_FORWARD}>
            Open the four-week roadmap
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>

        <aside className="home-side">
          <EvidenceSection items={data.evidenceItems} />
        </aside>
      </div>

      <QuickActionsFab actions={data.quickActions} />
    </>
  );
}
