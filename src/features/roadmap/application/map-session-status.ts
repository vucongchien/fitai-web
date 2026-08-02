import { SessionPlanStatus } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { SessionStatus } from "@/shared/lib/demo-data";

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
