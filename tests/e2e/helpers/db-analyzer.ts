import { execSync } from "node:child_process";

export interface DatabaseAnalysisReport {
  sessions: any[];
  setLogs: any[];
  repLogs: any[];
  sessionErrors: any[];
  personalRecords: any[];
  sessionPlans: any[];
  outboxEvents: any[];
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
    console.error(`[DB Analyzer] Query failed for SQL: ${sql}`, error);
    return [];
  }
}

export function analyzeWorkoutDatabase(flowName: string): DatabaseAnalysisReport {
  console.log(`\n================================================================`);
  console.log(`🔍 [DB Analyzer] STARTING DATABASE GAP ANALYSIS FOR: ${flowName.toUpperCase()}`);
  console.log(`================================================================`);

  const sessions = queryJson(`SELECT * FROM workout_execution.workout_sessions ORDER BY created_at DESC`);
  const setLogs = queryJson(`SELECT * FROM workout_execution.workout_set_logs ORDER BY created_at ASC`);
  const repLogs = queryJson(`SELECT * FROM workout_execution.rep_logs ORDER BY created_at ASC`);
  const sessionErrors = queryJson(`SELECT * FROM workout_execution.session_errors ORDER BY timestamp ASC`);
  const personalRecords = queryJson(`SELECT * FROM workout_execution.personal_records ORDER BY achieved_at DESC`);
  const sessionPlans = queryJson(`SELECT * FROM coaching.session_plans ORDER BY scheduled_date DESC`);
  const outboxEvents = queryJson(`SELECT event_id, event_type, partition_key, status, published, created_at FROM workout_execution.outbox ORDER BY created_at DESC`);

  const gaps: string[] = [];
  const findings: string[] = [];

  // 1. Session Level Verification
  if (sessions.length === 0) {
    gaps.push("🔴 [GAP] Không tìm thấy bản ghi nào trong bảng `workout_execution.workout_sessions`!");
  } else {
    const latestSession = sessions[0];
    findings.push(`✅ [Session Found] ID: ${latestSession.id}, Status: ${latestSession.status}, User: ${latestSession.user_id}`);

    if (latestSession.status !== "COMPLETED") {
      gaps.push(`⚠️ [GAP] Trạng thái session là '${latestSession.status}', mong đợi 'COMPLETED'.`);
    } else {
      findings.push(`✅ [Session Status] Đã hoàn thành (COMPLETED).`);
    }

    if (!latestSession.started_at) {
      gaps.push("⚠️ [GAP] `started_at` của session bị NULL.");
    }
    if (!latestSession.ended_at) {
      gaps.push("⚠️ [GAP] `ended_at` của session bị NULL sau khi kết thúc buổi tập.");
    }
    if (latestSession.started_at && latestSession.ended_at) {
      findings.push(`✅ [Timestamps] started_at: ${latestSession.started_at} -> ended_at: ${latestSession.ended_at}`);
    }

    if (Number(latestSession.total_sets) <= 0) {
      gaps.push(`⚠️ [GAP] ` + "`total_sets` = " + latestSession.total_sets + " (Mong đợi > 0).");
    } else {
      findings.push(`✅ [Total Sets] Ghi nhận: ${latestSession.total_sets} sets.`);
    }

    if (Number(latestSession.total_volume) < 0) {
      gaps.push(`⚠️ [GAP] ` + "`total_volume` bị âm: " + latestSession.total_volume);
    } else {
      findings.push(`✅ [Total Volume] Ghi nhận: ${latestSession.total_volume} kg.`);
    }

    if (flowName.includes("Plan") && !latestSession.plan_id) {
      gaps.push("⚠️ [GAP] Luồng tập theo plan nhưng trường `plan_id` trong `workout_sessions` bị rỗng.");
    }
  }

  // 2. Set Logs Verification
  if (setLogs.length === 0) {
    gaps.push("🔴 [GAP] Không có set log nào được ghi vào `workout_execution.workout_set_logs`!");
  } else {
    findings.push(`✅ [Set Logs] Đã lưu ${setLogs.length} set log vào cơ sở dữ liệu:`);
    setLogs.forEach((s: any) => {
      findings.push(`   - Set #${s.set_number} | Ex: ${s.exercise_id} | Reps: ${s.actual_reps}/${s.target_reps} | W: ${s.weight}kg | RPE: ${s.rpe} | Form: ${s.form_score ?? "N/A"}`);
    });
  }

  // 3. PR Verification
  if (personalRecords.length > 0) {
    findings.push(`🏆 [Personal Records] Đã xác lập và ghi nhận ${personalRecords.length} PR mới:`);
    personalRecords.forEach((pr: any) => {
      findings.push(`   - User: ${pr.user_id} | Ex: ${pr.exercise_id} | 1RM: ${pr.one_rep_max}kg (Weight: ${pr.weight}kg x ${pr.reps} reps)`);
    });
  } else {
    findings.push(`ℹ️ [Personal Records] Chưa phát sinh PR mới (hoặc mức tạ bằng 0).`);
  }

  // 4. Outbox Verification
  if (outboxEvents.length > 0) {
    findings.push(`📨 [Transactional Outbox] Đã sinh ${outboxEvents.length} CloudEvents trong outbox:`);
    outboxEvents.forEach((ev: any) => {
      findings.push(`   - Event: ${ev.event_type} | Published: ${ev.published} | Status: ${ev.status}`);
    });
  } else {
    gaps.push("⚠️ [GAP] Không có event nào được lưu vào Transactional Outbox (`workout_execution.outbox`)!");
  }

  console.log("\n📋 --- PHÁT HIỆN DỮ LIỆU ĐÚNG (FINDINGS) ---");
  findings.forEach((f) => console.log(f));

  if (gaps.length > 0) {
    console.log("\n🚨 --- CÁC ĐIỂM THIẾU SÓT / GAP CẦN LƯU Ý (GAPS) ---");
    gaps.forEach((g) => console.log(g));
  } else {
    console.log("\n🎉 --- KHÔNG CÓ GAP DỮ LIỆU CỐT LÕI NÀO ĐƯỢC TÌM THẤY! ---");
  }
  console.log("================================================================\n");

  return {
    sessions,
    setLogs,
    repLogs,
    sessionErrors,
    personalRecords,
    sessionPlans,
    outboxEvents,
    gaps,
    findings,
  };
}
