import { Code, ConnectError, createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";

import { mapProtoMatchToSummary } from "@/features/solo-match/domain/match-state";
import type {
  ChallengePageData,
  SoloMatchSummary,
} from "@/features/solo-match/model/solo-match.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { SoloMatchService } from "@/shared/api/gen/contracts/core/solo_match/v1/service/solo_match_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

export async function getChallengePageData(): Promise<ChallengePageData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  const currentUserId = cookieStore.get("fitai_user_id")?.value ?? "";

  if (!process.env.FITAI_RPC_URL || !accessToken) {
    return {
      activeMatch: null,
      currentUserId,
      history: [],
      isPreview: true,
    };
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(SoloMatchService, transport);

    const [activeRes, historyRes] = await Promise.allSettled([
      client.getActiveMatch({}),
      client.getMatchHistory({ pageSize: 15, pageToken: "" }),
    ]);

    const activeMatch =
      activeRes.status === "fulfilled" && activeRes.value.match
        ? mapProtoMatchToSummary(activeRes.value.match)
        : null;

    const history =
      historyRes.status === "fulfilled"
        ? (historyRes.value.matches ?? []).map((m) => mapProtoMatchToSummary(m))
        : [];

    return {
      activeMatch,
      currentUserId,
      history,
      isPreview: false,
    };
  } catch {
    return {
      activeMatch: null,
      currentUserId,
      history: [],
      isPreview: true,
    };
  }
}

export interface SoloMatchSessionPageData {
  /** Why the coach refused this exercise (e.g. an active injury); the duel must not start. */
  blockedReason?: string;
  currentUserId: string;
  match: SoloMatchSummary | null;
  onnxSkeletonUrl: string;
  planId: string;
  recommendedCameraAngle: string;
}

export interface SoloMatchResultPageData {
  currentUserId: string;
  match: SoloMatchSummary | null;
}

// Read-only: the result page only shows the match, so it must not create a
// session plan the way the arena does.
export async function getSoloMatchResultData(matchId: string): Promise<SoloMatchResultPageData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  const currentUserId = cookieStore.get("fitai_user_id")?.value ?? "";

  if (!matchId || !process.env.FITAI_RPC_URL || !accessToken) {
    return { currentUserId, match: null };
  }

  try {
    const soloClient = createClient(SoloMatchService, createServerTransport(accessToken));
    const matchRes = await soloClient.getMatch({ matchId });
    return {
      currentUserId,
      match: matchRes.match ? mapProtoMatchToSummary(matchRes.match) : null,
    };
  } catch {
    return { currentUserId, match: null };
  }
}

export async function getSoloMatchSessionData(matchId: string): Promise<SoloMatchSessionPageData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  const currentUserId = cookieStore.get("fitai_user_id")?.value ?? "";

  const defaultResult: SoloMatchSessionPageData = {
    currentUserId,
    match: null,
    onnxSkeletonUrl: "/models/yolo11n-pose.onnx",
    planId: `solo-${matchId || "default"}`,
    recommendedCameraAngle: "side",
  };

  if (!matchId || !process.env.FITAI_RPC_URL || !accessToken) {
    return defaultResult;
  }

  try {
    const transport = createServerTransport(accessToken);
    const soloClient = createClient(SoloMatchService, transport);
    const matchRes = await soloClient.getMatch({ matchId });

    if (!matchRes.match) {
      return defaultResult;
    }

    const match = mapProtoMatchToSummary(matchRes.match);
    let onnxSkeletonUrl = "/models/yolo11n-pose.onnx";
    let recommendedCameraAngle = "side";
    let planId = `solo-${matchId}-${currentUserId}`;
    let blockedReason: string | undefined;

    if (match.exerciseId) {
      try {
        const execClient = createClient(WorkoutExecutionService, transport);
        const specRes = await execClient.getMotionSpecification({
          coachPersonality: "default",
          exerciseId: match.exerciseId,
        });
        if (
          specRes.onnxSkeletonUrl &&
          !specRes.onnxSkeletonUrl.includes("your-project-ref") &&
          !specRes.onnxSkeletonUrl.includes(
            "storage.supabase.co/storage/v1/object/public/skeletons/rtmpose_s.onnx",
          )
        ) {
          onnxSkeletonUrl = specRes.onnxSkeletonUrl;
        }
        if (specRes.recommendedCameraAngle) {
          recommendedCameraAngle = specRes.recommendedCameraAngle;
        }
      } catch {
        // Keep safe defaults if motion specification RPC is unavailable
      }

      if (currentUserId) {
        try {
          const coachingClient = createClient(CoachingService, transport);
          const planRes = await coachingClient.createAdhocSessionPlan({
            exerciseIds: [match.exerciseId],
          });
          if (planRes.sessionPlan?.sessionPlanId) {
            planId = planRes.sessionPlan.sessionPlanId;
          }
        } catch (error) {
          const connectError = ConnectError.from(error);
          // The coach refused the exercise, e.g. an active injury excludes it:
          // that is the answer, not something to train around.
          if (connectError.code === Code.FailedPrecondition) {
            blockedReason = connectError.rawMessage || "This exercise cannot be trained right now.";
          }
          // Otherwise (e.g. no active roadmap) fall back to a match-session ID.
        }
      }
    }

    return {
      blockedReason,
      currentUserId,
      match,
      onnxSkeletonUrl,
      planId,
      recommendedCameraAngle,
    };
  } catch {
    return defaultResult;
  }
}
