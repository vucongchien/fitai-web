"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";
import { WeekRoute } from "@/features/roadmap/ui/week-route";
import { NAV_FORWARD } from "@/shared/ui/transition-types";
import { FeedbackState } from "@/shared/ui/feedback-state";
import { initiateRoadmapServerAction } from "@/features/roadmap/server/coaching-actions";

interface RoadmapViewProps {
  data: RoadmapPageData;
}

export function RoadmapView({ data }: RoadmapViewProps) {
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
      <div className="roadmap-layout mt-4">
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
      <div className="roadmap-layout">
        <section className="content-section">
          <div className="content-section__header">
            <h2>
              Week <span className="data-value">{data.activeWeek}</span>
            </h2>
            <p>{data.currentWeekDateRange}</p>
          </div>

          <WeekRoute sessions={data.currentWeekSessions} />

          <Link
            className="ui-button ui-button--secondary ui-button--medium roadmap-view__schedule"
            href="/schedule"
            transitionTypes={NAV_FORWARD}
          >
            <span className="ui-button__label">
              See all four weeks
              <ArrowRight aria-hidden="true" size={17} />
            </span>
          </Link>
        </section>

        <aside className="roadmap-context">
          {data.contextItems.map((item) => {
            const { Icon } = item;
            return (
              <div className="roadmap-context__item" key={item.id}>
                <Icon aria-hidden="true" size={20} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </>
  );
}
