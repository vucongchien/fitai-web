import { execSync } from "node:child_process";

export interface NotificationAnalysisReport {
  notifications: any[];
  unreadCount: number;
  readCount: number;
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
    console.error(`[DB Notification Analyzer] Query failed for SQL: ${sql}`, error);
    return [];
  }
}

function execSql(sql: string): void {
  try {
    execSync("docker exec -i fitai-postgres-test psql -U postgres -d fitai", {
      input: sql,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    console.error(`[DB Notification Analyzer] Execute SQL failed:`, error);
    throw error;
  }
}

/**
 * Seed 3 in-app notifications cho user dev để test E2E.
 */
export function seedNotificationsForTest(userId: string = "00000000-0000-0000-0000-000000000001") {
  const sql = `
    DELETE FROM notification.in_app_notifications WHERE user_id = '${userId}';

    INSERT INTO notification.in_app_notifications (id, user_id, title, body, data, is_read, created_at)
    VALUES 
    (
      'a0000000-0000-0000-0000-000000000001',
      '${userId}',
      'AI Coach: Kế hoạch tuần mới đã sẵn sàng',
      'Huấn luyện viên AI đã tối ưu lịch tập tuần này dựa trên tiến độ hồi phục của bạn.',
      '{"type": "coach", "actionUrl": "/roadmap"}'::jsonb,
      false,
      NOW() - INTERVAL '5 minutes'
    ),
    (
      'a0000000-0000-0000-0000-000000000002',
      '${userId}',
      'Kỷ lục cá nhân mới: Bench Press 100kg!',
      'Chúc mừng bạn đã đạt mức tạ 100kg cho bài đẩy ngực ngang (1RM ước tính mới).',
      '{"type": "pr", "exerciseId": "fe1ef684-3071-4522-b0fb-338aeeb26879"}'::jsonb,
      false,
      NOW() - INTERVAL '2 hours'
    ),
    (
      'a0000000-0000-0000-0000-000000000003',
      '${userId}',
      'Nhắc nhở: Buổi tập hôm qua đã hoàn thành',
      'Bạn đã ghi nhận đầy đủ các hiệp tập với tổng volume 500kg.',
      '{"type": "plan", "sessionId": "52cf6523-6dcd-4f79-95aa-a82e82151df4"}'::jsonb,
      true,
      NOW() - INTERVAL '1 day'
    );
  `;
  execSql(sql);
  console.log(`🔔 [DB Notification Cleaner] Successfully seeded 3 notifications for ${userId}`);
}

/**
 * Phân tích chuyên sâu bảng notification.in_app_notifications và phát hiện gaps.
 */
export function analyzeNotificationDatabase(
  userId: string = "00000000-0000-0000-0000-000000000001",
  expectedReadId?: string,
): NotificationAnalysisReport {
  console.log(`\n================================================================`);
  console.log(`🔍 [DB Notification Analyzer] STARTING GAP ANALYSIS FOR NOTIFICATIONS (${userId})`);
  console.log(`================================================================`);

  const notifications = queryJson(
    `SELECT * FROM notification.in_app_notifications WHERE user_id = '${userId}' ORDER BY created_at DESC`,
  );

  const gaps: string[] = [];
  const findings: string[] = [];

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  findings.push(`Tổng số thông báo trong DB: ${notifications.length} (Chưa đọc: ${unreadCount}, Đã đọc: ${readCount})`);

  if (notifications.length === 0) {
    gaps.push(`[GAP-NOTIF-01] Không tìm thấy bất kỳ thông báo nào cho user ${userId}`);
  }

  // Kiểm tra tính toàn vẹn của từng notification
  for (const item of notifications) {
    if (!item.id || item.id.length < 32) {
      gaps.push(`[GAP-NOTIF-02] Thông báo ${item.title} có ID không hợp lệ: ${item.id}`);
    }
    if (!item.title || item.title.trim() === "") {
      gaps.push(`[GAP-NOTIF-03] Thông báo ${item.id} có tiêu đề rỗng!`);
    }
    if (!item.body || item.body.trim() === "") {
      gaps.push(`[GAP-NOTIF-04] Thông báo ${item.id} có nội dung body rỗng!`);
    }
    if (!item.data || typeof item.data !== "object" || Object.keys(item.data).length === 0) {
      gaps.push(`[GAP-NOTIF-05] Thông báo ${item.id} thiếu cấu trúc JSONB metadata 'data'`);
    } else {
      findings.push(`✅ [Metadata Valid] ID: ${item.id} | Type: ${item.data.type || "N/A"} | IsRead: ${item.is_read}`);
    }
  }

  // Kiểm tra thông báo được kỳ vọng đã đánh dấu đọc
  if (expectedReadId) {
    const target = notifications.find((n) => n.id === expectedReadId);
    if (!target) {
      gaps.push(`[GAP-NOTIF-06] Không tìm thấy thông báo kỳ vọng ID: ${expectedReadId}`);
    } else if (!target.is_read) {
      gaps.push(`[GAP-NOTIF-07] Thông báo ${expectedReadId} chưa được cập nhật 'is_read = true' trong DB!`);
    } else {
      findings.push(`✅ [Mark As Read Verified] Thông báo ${expectedReadId} đã cập nhật 'is_read = true' thành công trong DB.`);
    }
  }

  console.log("\n📋 --- PHÁT HIỆN DỮ LIỆU ĐÚNG (FINDINGS) ---");
  findings.forEach((f) => console.log(f));

  if (gaps.length > 0) {
    console.log("\n🚨 --- PHÁT HIỆN DATA GAPS TRONG CƠ SỞ DỮ LIỆU ---");
    gaps.forEach((g) => console.log(`❌ ${g}`));
  } else {
    console.log("\n🎉 --- KHÔNG CÓ GAP DỮ LIỆU THÔNG BÁO NÀO! (0 DATA GAPS) ---");
  }
  console.log(`================================================================\n`);

  return {
    notifications,
    unreadCount,
    readCount,
    gaps,
    findings,
  };
}
