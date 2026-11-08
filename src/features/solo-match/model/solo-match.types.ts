export type SoloChallengeType = "REPS" | "DURATION";

export type SoloMatchStatus =
  | "PENDING_READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FORFEITED"
  | "CANCELLED";

export type SoloParticipantResult = "PENDING" | "WIN" | "LOSE" | "DRAW" | "FORFEITED";

export interface SoloParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string;
  scoreValue: number;
  formScore?: number;
  isCompleted: boolean;
  result: SoloParticipantResult;
}

export interface SoloMatchSummary {
  matchId: string;
  exerciseId: string;
  exerciseName: string;
  challengeType: SoloChallengeType;
  ceilingSeconds?: number;
  status: SoloMatchStatus;
  participants: SoloParticipant[];
  winnerId: string;
  isDraw: boolean;
  startedAtIso: string | null;
  timeoutAtIso: string | null;
  endedAtIso: string | null;
  readyDeadlineIso: string | null;
}

export type SoloMatchLobbyPhase = "idle" | "queued" | "matched" | "expired" | "error";

export interface SoloMatchmakingState {
  phase: SoloMatchLobbyPhase;
  elapsedSeconds: number;
  statusMessage: string;
  activeMatch: SoloMatchSummary | null;
  remainingReadySeconds: number;
  errorMessage: string | null;
}

export interface ChallengePageData {
  currentUserId: string;
  activeMatch: SoloMatchSummary | null;
  history: SoloMatchSummary[];
  isPreview?: boolean;
}
