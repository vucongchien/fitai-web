import type { SessionStatus } from "@/features/roadmap/model/roadmap-page.types";
import { SessionPlanStatus } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";

export function mapSessionPlanStatus(
  status: SessionPlanStatus,
  options: { isNext: boolean },
): SessionStatus {
  switch (status) {
    case SessionPlanStatus.COMPLETED:
      return "complete";
    case SessionPlanStatus.SKIPPED:
      return "skipped";
    case SessionPlanStatus.PENDING:
      return options.isNext ? "next" : "planned";
    case SessionPlanStatus.UNSPECIFIED:
    default:
      return "planned";
  }
}
