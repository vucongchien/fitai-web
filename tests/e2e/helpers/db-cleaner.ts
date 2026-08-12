import { execSync } from "node:child_process";

/**
 * Truncates all transactional/user tables in the local PostgreSQL database
 * while preserving seed catalogs (exercise.exercises, exercise.motion_specifications,
 * exercise.body_parts, nutrition.food_items).
 */
export function cleanUserDatabase(): void {
  const truncateSql = `
    TRUNCATE TABLE
      auth.sessions,
      auth.users,
      profile.users,
      profile.body_metrics,
      profile.injuries,
      workout_execution.workout_sessions,
      workout_execution.workout_set_logs,
      workout_execution.rep_logs,
      workout_execution.session_errors,
      workout_execution.personal_records,
      workout_execution.outbox,
      workout_execution.outbox_log,
      coaching.roadmaps,
      coaching.week_plans,
      coaching.day_plans,
      coaching.session_plans,
      coaching.outbox,
      coaching.outbox_log,
      notification.user_devices,
      notification.user_settings,
      notification.in_app_notifications,
      notification.outbox,
      notification.outbox_log
    CASCADE;
  `;

  const seedRoadmapSql = `
    INSERT INTO coaching.roadmaps (roadmap_id, user_id, status, start_date, end_date, created_at, updated_at)
    VALUES ('rm_e2e_dev_user_new', 'dev_user_new', 'ACTIVE', CURRENT_DATE, CURRENT_DATE + INTERVAL '28 days', NOW(), NOW())
    ON CONFLICT (roadmap_id) DO NOTHING;

    INSERT INTO coaching.week_plans (week_plan_id, roadmap_id, user_id, week_number, phase, target_rpe, start_date, end_date, muscle_split_type, created_at)
    VALUES ('wp_e2e_dev_user_new', 'rm_e2e_dev_user_new', 'dev_user_new', 1, 'ACCUMULATION', 7.0, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'FULL_BODY', NOW())
    ON CONFLICT (week_plan_id) DO NOTHING;

    INSERT INTO coaching.day_plans (day_plan_id, week_plan_id, roadmap_id, user_id, scheduled_date, created_at)
    VALUES ('dp_e2e_dev_user_new', 'wp_e2e_dev_user_new', 'rm_e2e_dev_user_new', 'dev_user_new', CURRENT_DATE, NOW())
    ON CONFLICT (day_plan_id) DO NOTHING;

    INSERT INTO coaching.session_plans (session_plan_id, day_plan_id, week_plan_id, roadmap_id, user_id, scheduled_date, slot_time, estimated_duration_minutes, status, source, target_muscle_groups, prescription, reasoning)
    VALUES (
      'sp_e2e_dev_user_new',
      'dp_e2e_dev_user_new',
      'wp_e2e_dev_user_new',
      'rm_e2e_dev_user_new',
      'dev_user_new',
      CURRENT_DATE,
      '08:00',
      45,
      'PENDING',
      'COACH_SCHEDULED',
      '["chest", "triceps"]'::jsonb,
      '{"warm_ups": [], "main_exercises": [{"exercise_id": "fe1ef684-3071-4522-b0fb-338aeeb26879", "exercise_name": "Bench Press", "target_sets": 3, "target_reps": 10, "target_weight": 50, "duration_seconds": 0, "notes": "Main strength movement", "rest_set_sec": 60, "rest_exercise_sec": 90, "target_rpe": 7}], "cool_downs": []}'::jsonb,
      'Scheduled full body strength session'
    )
    ON CONFLICT (session_plan_id) DO NOTHING;
  `;

  try {
    execSync("docker exec -i fitai-postgres-test psql -U postgres -d fitai", {
      input: truncateSql + "\n" + seedRoadmapSql,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("🧹 [DB Cleaner] Successfully truncated user tables & seeded active roadmap for E2E tests.");
  } catch (error) {
    console.warn("⚠️ [DB Cleaner] Warning while cleaning DB:", error);
  }
}
