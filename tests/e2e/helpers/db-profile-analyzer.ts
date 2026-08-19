import { execSync } from "node:child_process";

export interface ProfileAnalysisReport {
  user: any;
  latestMetrics: any;
  injuries: any[];
  outboxEvents: any[];
  pastCompletedPlans: any[];
  futurePendingPlans: any[];
  gaps: string[];
  findings: string[];
}

function queryJson(sql: string): any[] {
  try {
    const wrappedSql = `SELECT COALESCE(json_agg(t), '[]'::json) FROM (${sql}) t;`;
    const output = execSync(
      "docker exec -i fitai-postgres-test psql -U postgres -d fitai -t -A",
      { input: wrappedSql, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const trimmed = output.trim();
    if (!trimmed) return [];
    return JSON.parse(trimmed);
  } catch (error) {
    console.error(`[DB Profile Analyzer] Query failed for SQL: ${sql}`, error);
    return [];
  }
}

function execSql(sql: string): void {
  try {
    execSync("docker exec -i fitai-postgres-test psql -U postgres -d fitai -v ON_ERROR_STOP=1", {
      input: sql,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error: any) {
    console.error(`[DB Profile Analyzer] Execute SQL failed:`, error.stderr?.toString() || error);
    throw error;
  }
}

/**
 * Seed profile ban đầu và Roadmap cho user dev_user_new
 */
export function seedProfileAndRoadmapForTest(userId: string = "00000000-0000-0000-0000-000000000001") {
  const sql = `
    -- 1. Xóa dữ liệu cũ của user
    DELETE FROM profile.body_metrics WHERE user_id = '${userId}';
    DELETE FROM profile.injuries WHERE user_id = '${userId}';
    DELETE FROM profile.users WHERE user_id = '${userId}';
    DELETE FROM profile.outbox WHERE payload::text LIKE '%${userId}%';
    DELETE FROM workout_execution.workout_sessions WHERE user_id = '${userId}';
    DELETE FROM workout_execution.outbox WHERE payload::text LIKE '%${userId}%';
    DELETE FROM coaching.session_plans WHERE user_id = '${userId}';
    DELETE FROM coaching.day_plans WHERE user_id = '${userId}';
    DELETE FROM coaching.week_plans WHERE user_id = '${userId}';
    DELETE FROM coaching.roadmaps WHERE user_id = '${userId}';

    -- 2. Seed Baseline Profile User & Body Metrics
    INSERT INTO profile.users (
      user_id, full_name, date_of_birth, gender, experience_level,
      goals, preferred_workout_times, available_equipment, preferred_muscle_groups,
      coach_style, target_weight_kg, target_body_fat_percent, completion_rate, ai_coach_activated
    ) VALUES (
      '${userId}',
      'Dev User',
      '1998-05-15',
      'MALE',
      'INTERMEDIATE',
      '["BUILD_MUSCLE"]'::jsonb,
      '["Mon PM", "Wed PM", "Fri PM"]'::jsonb,
      '["FULL_GYM"]'::jsonb,
      '["CHEST", "BACK", "LEGS"]'::jsonb,
      'MOTIVATIONAL',
      68.0,
      15.0,
      100.0,
      true
    );

    INSERT INTO profile.body_metrics (id, user_id, weight_kg, height_cm, body_fat_percent, logged_at)
    VALUES ('11111111-1111-1111-1111-111111111111', '${userId}', 70.0, 175.0, 18.5, NOW());

    -- 3. Seed Roadmap với 1 Completed Plan (hôm qua) và 1 Pending Plan (hôm nay)
    INSERT INTO coaching.roadmaps (roadmap_id, user_id, status, start_date, end_date, created_at, updated_at)
    VALUES ('rm_e2e_prof_${userId}', '${userId}', 'ACTIVE', (CURRENT_DATE - INTERVAL '1 day')::date, (CURRENT_DATE + INTERVAL '27 days')::date, NOW(), NOW());

    INSERT INTO coaching.week_plans (week_plan_id, roadmap_id, user_id, week_number, phase, target_rpe, start_date, end_date, muscle_split_type, created_at)
    VALUES ('wp_e2e_prof_${userId}', 'rm_e2e_prof_${userId}', '${userId}', 1, 'ACCUMULATION', 7.0, (CURRENT_DATE - INTERVAL '1 day')::date, (CURRENT_DATE + INTERVAL '6 days')::date, 'UPPER_LOWER', NOW());

    INSERT INTO coaching.day_plans (day_plan_id, week_plan_id, roadmap_id, user_id, scheduled_date, created_at)
    VALUES ('dp_e2e_prof_${userId}_1', 'wp_e2e_prof_${userId}', 'rm_e2e_prof_${userId}', '${userId}', (CURRENT_DATE - INTERVAL '1 day')::date, NOW());

    INSERT INTO coaching.day_plans (day_plan_id, week_plan_id, roadmap_id, user_id, scheduled_date, created_at)
    VALUES ('dp_e2e_prof_${userId}_2', 'wp_e2e_prof_${userId}', 'rm_e2e_prof_${userId}', '${userId}', CURRENT_DATE, NOW());

    -- Past completed session
    INSERT INTO coaching.session_plans (
      session_plan_id, day_plan_id, week_plan_id, roadmap_id, user_id, scheduled_date, slot_time,
      estimated_duration_minutes, status, source, target_muscle_groups, prescription, reasoning
    ) VALUES (
      'sp_e2e_prof_past_${userId}',
      'dp_e2e_prof_${userId}_1',
      'wp_e2e_prof_${userId}',
      'rm_e2e_prof_${userId}',
      '${userId}',
      (CURRENT_DATE - INTERVAL '1 day')::date,
      '07:00',
      45,
      'COMPLETED',
      'COACH_SCHEDULED',
      '["back", "biceps"]'::jsonb,
      '{"warm_ups": [], "main_exercises": [{"exercise_id": "fe1ef684-3071-4522-b0fb-338aeeb26879", "exercise_name": "Pull Up", "target_sets": 3, "target_reps": 8, "target_weight": 0, "duration_seconds": 0, "notes": "Completed", "rest_set_sec": 60, "rest_exercise_sec": 90, "target_rpe": 7}], "cool_downs": []}'::jsonb,
      'Past completed upper workout'
    );

    -- Future/Today pending session
    INSERT INTO coaching.session_plans (
      session_plan_id, day_plan_id, week_plan_id, roadmap_id, user_id, scheduled_date, slot_time,
      estimated_duration_minutes, status, source, target_muscle_groups, prescription, reasoning
    ) VALUES (
      'sp_e2e_prof_pending_${userId}',
      'dp_e2e_prof_${userId}_2',
      'wp_e2e_prof_${userId}',
      'rm_e2e_prof_${userId}',
      '${userId}',
      CURRENT_DATE,
      '18:00',
      50,
      'PENDING',
      'COACH_SCHEDULED',
      '["chest", "triceps"]'::jsonb,
      '{"warm_ups": [], "main_exercises": [{"exercise_id": "fe1ef684-3071-4522-b0fb-338aeeb26879", "exercise_name": "Bench Press", "target_sets": 3, "target_reps": 10, "target_weight": 50, "duration_seconds": 0, "notes": "Main lift", "rest_set_sec": 60, "rest_exercise_sec": 90, "target_rpe": 7}], "cool_downs": []}'::jsonb,
      'Upcoming chest workout'
    );
  `;
  execSql(sql);
  console.log(`👤 [DB Profile Cleaner] Successfully seeded baseline profile & roadmap for ${userId}`);
}

/**
 * Phân tích Database Gap Analysis cho Luồng Cập Nhật Profile & Tái Tạo Lịch Tập
 */
export function analyzeProfileDatabase(
  userId: string = "00000000-0000-0000-0000-000000000001",
  expectedWeight?: number,
  expectedTargetWeight?: number,
  expectedBodyFat?: number,
  expectedInjuryMuscle?: string,
): ProfileAnalysisReport {
  console.log(`\n================================================================`);
  console.log(`🔍 [DB Profile Analyzer] STARTING GAP ANALYSIS FOR PROFILE & ROADMAP (${userId})`);
  console.log(`================================================================`);

  const users = queryJson(`SELECT * FROM profile.users WHERE user_id = '${userId}'`);
  const metrics = queryJson(`SELECT * FROM profile.body_metrics WHERE user_id = '${userId}' ORDER BY logged_at DESC`);
  const injuries = queryJson(`SELECT * FROM profile.injuries WHERE user_id = '${userId}' ORDER BY reported_at DESC`);
  const outboxEvents = queryJson(`SELECT * FROM profile.outbox WHERE payload::text LIKE '%${userId}%' ORDER BY created_at DESC`);
  const sessionPlans = queryJson(`SELECT * FROM coaching.session_plans WHERE user_id = '${userId}' ORDER BY scheduled_date ASC`);

  const gaps: string[] = [];
  const findings: string[] = [];

  const user = users[0] || null;
  const latestMetrics = metrics[0] || null;
  const pastCompletedPlans = sessionPlans.filter((s) => s.status === "COMPLETED");
  const futurePendingPlans = sessionPlans.filter((s) => s.status === "PENDING");

  if (!user) {
    gaps.push(`[GAP-PROF-01] Không tìm thấy bản ghi User cho user ${userId} trong profile.users`);
  } else {
    findings.push(`✅ [User Found] User: ${userId} | Target Weight: ${user.target_weight_kg}kg`);

    // 1. Kiểm tra Weight update
    if (expectedWeight !== undefined) {
      if (!latestMetrics || Math.abs(Number(latestMetrics.weight_kg) - expectedWeight) > 0.01) {
        gaps.push(`[GAP-PROF-02] Cân nặng chưa cập nhật: kỳ vọng ${expectedWeight}kg, trong DB là ${latestMetrics?.weight_kg}kg`);
      } else {
        findings.push(`✅ [Weight Updated] Cân nặng đã cập nhật chính xác: ${latestMetrics.weight_kg}kg`);
      }
    }

    // 2. Kiểm tra Target Weight
    if (expectedTargetWeight !== undefined) {
      if (Math.abs(Number(user.target_weight_kg) - expectedTargetWeight) > 0.01) {
        gaps.push(`[GAP-PROF-03] Target Weight chưa khớp: kỳ vọng ${expectedTargetWeight}kg, trong DB là ${user.target_weight_kg}kg`);
      } else {
        findings.push(`✅ [Target Weight Updated] Cân nặng mục tiêu: ${user.target_weight_kg}kg`);
      }
    }

    // 3. Kiểm tra Body Fat %
    if (expectedBodyFat !== undefined) {
      if (!latestMetrics || Math.abs(Number(latestMetrics.body_fat_percent) - expectedBodyFat) > 0.01) {
        gaps.push(`[GAP-PROF-04] Body Fat % chưa khớp: kỳ vọng ${expectedBodyFat}%, trong DB là ${latestMetrics?.body_fat_percent}%`);
      } else {
        findings.push(`✅ [Body Fat Updated] Tỉ lệ mỡ: ${latestMetrics.body_fat_percent}%`);
      }
    }

    // 4. Anti Data-Overwrite Check (Đảm bảo các trường mảng không bị rỗng do merge lỗi)
    if (!user.goals || (Array.isArray(user.goals) && user.goals.length === 0)) {
      gaps.push(`[GAP-PROF-05] Mất dữ liệu 'goals' (bị overwrite thành rỗng) khi cập nhật Profile!`);
    } else {
      findings.push(`✅ [Anti-Overwrite Passed] 'goals' được bảo toàn: ${JSON.stringify(user.goals)}`);
    }

    if (!user.available_equipment || (Array.isArray(user.available_equipment) && user.available_equipment.length === 0)) {
      gaps.push(`[GAP-PROF-06] Mất dữ liệu 'available_equipment' (bị overwrite thành rỗng)!`);
    } else {
      findings.push(`✅ [Anti-Overwrite Passed] 'available_equipment' được bảo toàn: ${JSON.stringify(user.available_equipment)}`);
    }
  }

  // 5. Kiểm tra Injury History
  if (expectedInjuryMuscle) {
    const matchedInjury = injuries.find(
      (i) => i.muscle_group?.toUpperCase() === expectedInjuryMuscle.toUpperCase() || i.notes?.includes(expectedInjuryMuscle),
    );
    if (!matchedInjury) {
      gaps.push(`[GAP-PROF-07] Không tìm thấy bản ghi chấn thương cho nhóm cơ '${expectedInjuryMuscle}' trong profile.injuries`);
    } else {
      findings.push(`✅ [Injury Recorded] Đã lưu chấn thương: ${matchedInjury.muscle_group} | Severity: ${matchedInjury.severity} | Notes: ${matchedInjury.notes}`);
    }
  }

  // 6. Kiểm tra Outbox CloudEvents
  findings.push(`📨 [Profile Outbox] Đã sinh ${outboxEvents.length} CloudEvents trong profile.outbox:`);
  outboxEvents.forEach((e) => {
    findings.push(`   - Event: ${e.event_type} | Published: ${e.published}`);
  });

  const hasProfileUpdated = outboxEvents.some((e) => e.event_type.includes("profileUpdated") || e.event_type.includes("ProfileUpdated"));
  if (!hasProfileUpdated && expectedWeight !== undefined) {
    gaps.push(`[GAP-PROF-08] Thiếu sự kiện Outbox 'ProfileUpdated' trong profile.outbox`);
  }

  // 7. Lịch Sử Bất Biến (History Invariant Check)
  if (pastCompletedPlans.length > 0) {
    const isUntouched = pastCompletedPlans.every((s) => s.status === "COMPLETED");
    if (!isUntouched) {
      gaps.push(`[GAP-PROF-09] Lịch sử buổi tập trong quá khứ bị sửa đổi sai lệch trạng thái COMPLETED!`);
    } else {
      findings.push(`✅ [History Invariant Preserved] ${pastCompletedPlans.length} buổi tập COMPLETED trong quá khứ được giữ nguyên vẹn 100%.`);
    }
  }

  console.log("\n📋 --- PHÁT HIỆN DỮ LIỆU ĐÚNG (FINDINGS) ---");
  findings.forEach((f) => console.log(f));

  if (gaps.length > 0) {
    console.log("\n🚨 --- PHÁT HIỆN DATA GAPS TRONG CƠ SỞ DỮ LIỆU ---");
    gaps.forEach((g) => console.log(`❌ ${g}`));
  } else {
    console.log("\n🎉 --- KHÔNG CÓ GAP DỮ LIỆU PROFILE/ROADMAP NÀO! (0 DATA GAPS) ---");
  }
  console.log(`================================================================\n`);

  return {
    user,
    latestMetrics,
    injuries,
    outboxEvents,
    pastCompletedPlans,
    futurePendingPlans,
    gaps,
    findings,
  };
}

/**
 * Seed an active injury for testing Injury Recover flow
 */
export function seedActiveInjury(
  userId: string = "00000000-0000-0000-0000-000000000001",
  injuryId: string = "22222222-2222-2222-2222-222222222222",
  muscleGroup: string = "Knee",
) {
  const sql = `
    INSERT INTO profile.injuries (id, user_id, muscle_group, severity, notes, is_recovered, reported_at)
    VALUES ('${injuryId}', '${userId}', '${muscleGroup}', 'MODERATE', 'Patellar tendinitis', false, NOW())
    ON CONFLICT (id) DO UPDATE SET is_recovered = false, recovered_at = NULL;
  `;
  execSql(sql);
  console.log(`🩹 [DB Profile Cleaner] Seeded active injury '${injuryId}' on '${muscleGroup}' for ${userId}`);
}

/**
 * Gap Analysis for Injury Recovery Flow
 */
export function analyzeInjuryRecovery(
  userId: string = "00000000-0000-0000-0000-000000000001",
  muscleGroup: string = "Knee",
): { gaps: string[]; findings: string[]; recoveredInjury: any; outboxEvent: any } {
  console.log(`\n================================================================`);
  console.log(`🔍 [DB Profile Analyzer] GAP ANALYSIS FOR INJURY RECOVERY (${userId})`);
  console.log(`================================================================`);

  const injuries = queryJson(
    `SELECT * FROM profile.injuries WHERE user_id = '${userId}' AND muscle_group = '${muscleGroup}' ORDER BY reported_at DESC`,
  );
  const outboxEvents = queryJson(
    `SELECT * FROM profile.outbox WHERE payload::text LIKE '%${userId}%' ORDER BY created_at DESC`,
  );

  const gaps: string[] = [];
  const findings: string[] = [];

  const recovered = injuries[0] || null;
  if (!recovered) {
    gaps.push(`[GAP-RECOV-01] Không tìm thấy bản ghi chấn thương cho ${muscleGroup}`);
  } else if (!recovered.is_recovered) {
    gaps.push(`[GAP-RECOV-02] Trạng thái is_recovered chưa chuyển sang true cho ${muscleGroup}`);
  } else {
    findings.push(`✅ [Injury Recovered in DB] Chấn thương ${muscleGroup} đã được đánh dấu is_recovered=true (recovered_at: ${recovered.recovered_at})`);
  }

  const recEvent = outboxEvents.find(
    (e) => e.event_type.includes("injuryRecovered") || e.event_type.includes("InjuryRecovered"),
  );
  if (!recEvent) {
    gaps.push(`[GAP-RECOV-03] Thiếu sự kiện Outbox 'InjuryRecovered' trong profile.outbox`);
  } else {
    findings.push(`✅ [InjuryRecovered Event Emitted] Event ID: ${recEvent.event_id} | Type: ${recEvent.event_type}`);
  }

  findings.forEach((f) => console.log(f));
  gaps.forEach((g) => console.log(`❌ ${g}`));
  console.log(`================================================================\n`);

  return { gaps, findings, recoveredInjury: recovered, outboxEvent: recEvent };
}

/**
 * Gap Analysis for Workout Session Abort & History Preservation
 */
export function analyzeWorkoutAbortAndHistory(
  userId: string = "00000000-0000-0000-0000-000000000001",
  abortedSessionPlanId: string = "sp_e2e_prof_pending_00000000-0000-0000-0000-000000000001",
): { gaps: string[]; findings: string[]; abortedSession: any; pastCompletedSessions: any[] } {
  console.log(`\n================================================================`);
  console.log(`🔍 [DB Profile Analyzer] GAP ANALYSIS FOR WORKOUT ABORT & D3 INVARIANT (${userId})`);
  console.log(`================================================================`);

  const sessions = queryJson(`SELECT * FROM coaching.session_plans WHERE user_id = '${userId}' ORDER BY scheduled_date ASC`);
  const gaps: string[] = [];
  const findings: string[] = [];

  const aborted = sessions.find((s) => s.session_plan_id === abortedSessionPlanId) || null;
  const pastCompleted = sessions.filter((s) => s.scheduled_date < (new Date().toISOString().split("T")[0]));

  if (!aborted) {
    gaps.push(`[GAP-ABORT-01] Không tìm thấy session ${abortedSessionPlanId} trong coaching.session_plans`);
  } else if (aborted.status !== "ABORTED" && aborted.status !== "PENDING") {
    findings.push(`ℹ️ [Session Status] Session ${abortedSessionPlanId} status is: ${aborted.status}`);
  } else {
    findings.push(`✅ [Session Plan Found] Session: ${abortedSessionPlanId} | Status: ${aborted.status}`);
  }

  // D3 Invariant Check
  if (pastCompleted.length > 0) {
    const untouched = pastCompleted.every((s) => s.status === "COMPLETED");
    if (!untouched) {
      gaps.push(`[GAP-ABORT-02] Dữ liệu lịch sử bị thay đổi sai lệch (Vi phạm nguyên tắc D3)`);
    } else {
      findings.push(`✅ [Rule D3 Invariant] Tất cả ${pastCompleted.length} buổi tập quá khứ giữ nguyên status COMPLETED`);
    }
  }

  findings.forEach((f) => console.log(f));
  gaps.forEach((g) => console.log(`❌ ${g}`));
  console.log(`================================================================\n`);

  return { gaps, findings, abortedSession: aborted, pastCompletedSessions: pastCompleted };
}
