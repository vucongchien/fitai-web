import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { AdminWorkoutExecutionService } from "../src/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { AuthService } from "../src/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { ExerciseService } from "../src/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { GamificationService } from "../src/shared/api/gen/contracts/supporting/gamification/v1/service/gamification_service_pb";

const BASE_URL = process.env.FITAI_RPC_URL || "http://localhost:8080";

interface CheckResult {
  step: string;
  module: string;
  status: "PASS" | "FAIL";
  details: string;
  durationMs: number;
}

const results: CheckResult[] = [];

async function recordCheck(module: string, step: string, fn: () => Promise<string>) {
  const start = Date.now();
  try {
    const details = await fn();
    results.push({
      module,
      step,
      status: "PASS",
      details,
      durationMs: Date.now() - start,
    });
    console.log(`[PASS] [${module}] ${step}: ${details} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      module,
      step,
      status: "FAIL",
      details: err?.message || String(err),
      durationMs: Date.now() - start,
    });
    console.error(`[FAIL] [${module}] ${step}:`, err?.message || err);
  }
}

async function runE2E() {
  console.log("=== STARTING FULL END-TO-END VERIFICATION ===");
  console.log(`Target Backend: ${BASE_URL}\n`);

  // Unauthenticated transport
  const publicTransport = createConnectTransport({
    baseUrl: BASE_URL,
  });
  const publicAuthClient = createClient(AuthService, publicTransport);

  let accessToken = "";
  let adminUserId = "";

  // 1. AUTH: Login as Admin
  await recordCheck("Auth", "Admin Login via ConnectRPC", async () => {
    let res;
    try {
      res = await publicAuthClient.login({
        identifier: "admin@fitai.vn",
        password: "FitAIBot@2026!",
      });
    } catch {
      res = await publicAuthClient.login({
        identifier: "bot.hung@fitai.bot",
        password: "FitAIBot@2026!",
      });
    }
    accessToken = res.accessToken;
    adminUserId = res.userId;
    if (!accessToken) throw new Error("No access token returned");
    return `Logged in successfully. UserID: ${adminUserId}, Token length: ${accessToken.length}`;
  });

  if (!accessToken) {
    console.error("Fatal: Cannot proceed without access token");
    process.exit(1);
  }

  // Authenticated transport
  const authTransport = createConnectTransport({
    baseUrl: BASE_URL,
    interceptors: [
      (next) => async (req) => {
        req.header.set("authorization", `Bearer ${accessToken}`);
        return next(req);
      },
    ],
  });

  const authClient = createClient(AuthService, authTransport);
  const exerciseClient = createClient(ExerciseService, authTransport);
  const motionClient = createClient(AdminWorkoutExecutionService, authTransport);

  // 2. AUTH: List Users (Admin Only)
  let targetTestUserId = "";
  await recordCheck("Auth", "List Users with Pagination & Search", async () => {
    const res = await authClient.listUsers({
      page: 1,
      pageSize: 10,
      search: "",
      role: "",
      status: "",
    });
    if (!res.items || res.items.length === 0) {
      throw new Error("No users returned");
    }
    const nonAdmin = res.items.find((u) => u.id !== adminUserId);
    if (nonAdmin) targetTestUserId = nonAdmin.id;
    return `Found ${res.total} users in database (Page 1 has ${res.items.length} items). Sample: ${res.items[0].fullName} (${res.items[0].role})`;
  });

  // 3. AUTH: Lock and Unlock User (Admin Only)
  if (targetTestUserId) {
    await recordCheck("Auth", `Lock Account (User ID: ${targetTestUserId})`, async () => {
      const lockRes = await authClient.lockUser({
        userId: targetTestUserId,
        reason: "E2E automated compliance verification",
      });
      if (!lockRes.success) throw new Error("Lock failed: " + lockRes.message);
      return `Account locked successfully: ${lockRes.message}`;
    });

    await recordCheck("Auth", `Unlock Account (User ID: ${targetTestUserId})`, async () => {
      const unlockRes = await authClient.unlockUser({
        userId: targetTestUserId,
      });
      if (!unlockRes.success) throw new Error("Unlock failed: " + unlockRes.message);
      return `Account unlocked successfully: ${unlockRes.message}`;
    });
  }

  // 4. EXERCISE: Catalog Metadata
  let sampleBodyPartId = "";
  let sampleEquipmentId = "";
  let sampleTargetMuscleId = "";
  await recordCheck(
    "Exercise",
    "Get Catalog Metadata (BodyParts, Equipments, Muscles, Tags)",
    async () => {
      const meta = await exerciseClient.getCatalogMetadata({});
      sampleBodyPartId = meta.bodyParts[0]?.id || "";
      sampleEquipmentId = meta.equipments[0]?.id || "";
      sampleTargetMuscleId = meta.muscles[0]?.id || "";
      return `Metadata loaded: ${meta.bodyParts.length} body parts, ${meta.equipments.length} equipments, ${meta.muscles.length} muscles, ${meta.tags.length} tags`;
    },
  );

  // 5. EXERCISE: Search active exercises
  await recordCheck("Exercise", "Search Exercises (Active Catalog)", async () => {
    const res = await exerciseClient.searchExercises({
      limit: 10,
    });
    return `Found ${res.exercises.length} active exercises in catalog`;
  });

  // 6. EXERCISE: Lifecycle (Create Draft -> Submit Approval -> Approve -> Delete)
  let createdExerciseId = "";
  await recordCheck("Exercise", "Create Exercise Draft", async () => {
    const res = await exerciseClient.createExercise({
      name: "E2E Automated Kettlebell Snatch " + Date.now(),
      bodyPartId: sampleBodyPartId,
      equipmentId: sampleEquipmentId,
      targetMuscleId: sampleTargetMuscleId,
      instructions: "1. Swing kettlebell back.\n2. Drive hips forward.\n3. Punch through at top.",
      difficulty: "Intermediate",
      defaultRestSeconds: 60,
      secondaryMuscleIds: [],
      tagIds: [],
    });
    if (!res.exercise?.id) throw new Error("Failed to create exercise");
    createdExerciseId = res.exercise.id;
    return `Created exercise ID: ${createdExerciseId}, Status: ${res.exercise.status}`;
  });

  if (createdExerciseId) {
    await recordCheck(
      "Exercise",
      "Submit Exercise For Approval (DRAFT -> PENDING_APPROVAL)",
      async () => {
        const res = await exerciseClient.submitExerciseForApproval({
          id: createdExerciseId,
        });
        return `Status updated to: ${res.exercise?.status}`;
      },
    );

    await recordCheck("Exercise", "Approve Exercise (PENDING_APPROVAL -> ACTIVE)", async () => {
      const res = await exerciseClient.approveExercise({
        id: createdExerciseId,
      });
      return `Status updated to: ${res.exercise?.status}`;
    });

    await recordCheck("Exercise", "Delete Exercise Clean-up", async () => {
      await exerciseClient.deleteExercise({
        id: createdExerciseId,
      });
      return `Deleted exercise ID: ${createdExerciseId}`;
    });
  }

  // 7. MOTION SPECS: List, Stats, and Presigned URL
  await recordCheck("MotionSpecs", "List Motion Specifications", async () => {
    const res = await motionClient.listMotionSpecifications({
      pageSize: 5,
      pageToken: "1",
    });
    return `Found ${res.totalCount} motion specs (returned ${res.motionSpecifications.length} items)`;
  });

  await recordCheck("MotionSpecs", "Get Motion Specification Stats", async () => {
    const res = await motionClient.getMotionSpecificationStats({});
    return `Stats: Total: ${res.totalExercises}, Active Rules: ${res.activePoseRules}, Active Voice: ${res.activeVoiceFiles}, Ready AI: ${res.readyAiSpecs}`;
  });

  await recordCheck("MotionSpecs", "Get Presigned Upload URL for AI Asset", async () => {
    const res = await motionClient.getPresignedUploadURL({
      fileName: "squat_local_rules.json",
      contentType: "application/json",
    });
    if (!res.uploadUrl) throw new Error("No uploadUrl returned");
    return `Generated presigned URL (File: ${res.fileName}): ${res.uploadUrl.substring(0, 50)}...`;
  });

  // 8. GAMIFICATION: Target User Wallet Inspection & Balance Adjustment
  const gamificationClient = createClient(GamificationService, authTransport);
  const targetGymerId = "8635574b-d170-4333-ac80-885d7f7cc41f"; // Gymer bot in DB

  let balanceBefore = 0n;
  await recordCheck("Gamification", "Admin Query Target User Wallet Balance", async () => {
    const res = await gamificationClient.getWallet({
      userId: targetGymerId,
    });
    balanceBefore = res.balance;
    return `Target User ID: ${res.userId}, Balance: ${res.balance} FitCoins`;
  });

  const bonusAmount = 50n;
  let adjustTxId = "";
  await recordCheck("Gamification", "Admin Adjust Target User Coins (+50 FitCoins)", async () => {
    const res = await gamificationClient.adminAdjustCoins({
      targetUserId: targetGymerId,
      amount: bonusAmount,
      reason: "ADMIN_ADJUST",
      note: "E2E Live Verification",
      idempotencyKey: `e2e-adjust-${Date.now()}`,
    });
    adjustTxId = res.transactionId;
    if (res.balanceAfter !== balanceBefore + bonusAmount) {
      throw new Error(
        `Balance after mismatch: expected ${balanceBefore + bonusAmount}, got ${res.balanceAfter}`,
      );
    }
    return `Balance updated to: ${res.balanceAfter} FitCoins, TxID: ${res.transactionId}`;
  });

  await recordCheck("Gamification", "Admin Query Target User Transactions Ledger", async () => {
    const res = await gamificationClient.listTransactions({
      userId: targetGymerId,
      limit: 10,
    });
    const found = res.entries.some((e) => e.id === adjustTxId || e.amount === bonusAmount);
    if (!found) {
      throw new Error(`Adjustment transaction not found in ledger`);
    }
    return `Verified ledger entry in user's coin_ledger. Total returned: ${res.entries.length} entries`;
  });

  console.log("\n=== FINAL VERIFICATION SUMMARY ===");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total Checks: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
}

runE2E().catch((err) => {
  console.error("E2E script crashed:", err);
  process.exit(1);
});
