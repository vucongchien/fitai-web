# Leaderboard (Bảng Xếp Hạng) Front-End — Technical Design

## 1. System Architecture & Component Hierarchy

Hệ thống Bảng Xếp Hạng tuân theo mô hình **Server Component + Client Island Interactive** trong Next.js App Router:

- **Server Component (`LeaderboardPage`):** Tải dữ liệu bất đồng bộ từ ConnectRPC Backend thông qua Server Transport gắn HttpOnly cookie, truyền ViewModel đã chuẩn hóa vào Client View.
- **Client Component (`LeaderboardView`):** Quản lý trạng thái tab lọc (Global / Weekly), tương tác danh sách, hiển thị Podium và thanh My Standing.

```
src/app/(main)/leaderboard/
  └── page.tsx                         [Server Component: Data Fetching & SEO]
src/features/leaderboard/
  ├── model/
  │   ├── leaderboard.types.ts         [ViewModels & TypeScript Contracts]
  │   └── leaderboard.mapper.ts        [Protobuf DTO to ViewModel Mapper]
  ├── server/
  │   └── get-leaderboard.ts           [BFF ConnectRPC Server Fetcher]
  └── ui/
      ├── leaderboard-view.tsx         [Main Client Island: Header, Tabs, State]
      ├── leaderboard-podium.tsx       [Top 3 Podium Component (Gold, Silver, Bronze)]
      ├── leaderboard-list.tsx         [Scrollable List for Ranks 4-50]
      ├── leaderboard-row.tsx          [Individual Rank Entry Row Component]
      ├── leaderboard-my-standing.tsx  [Sticky Floating Personal Standing Bar]
      └── leaderboard-skeleton.tsx     [Zero-CLS Loading Fallback Skeleton]
```

---

## 2. Wireframe & Visual Composition (Triple Lane Design)

### Mobile Layout (360px - 430px)

```
+-------------------------------------------------------+
|  <- Leaderboard                         [Search] [Bell]|  <-- AppHeader
+-------------------------------------------------------+
|  [🏆 All-time Global]       [⚡ Weekly League]        |  <-- Filter Tabs (Pill style)
+-------------------------------------------------------+
|                                                       |
|                     [👑 #1]                           |
|                 (Avatar Gold)                         |
|                   Minh Quang                          |
|                   15,400 XP                           |
|        [🥈 #2]    +---------+    [🥉 #3]              |
|     (Avatar Silv) |         |  (Avatar Bronz)         |
|      Hai Dang     |  PODIUM |     Thu Ha              |
|      12,850 XP    |   #1    |    10,200 XP            |
|     +---------+   |         |   +---------+           |
|     |   #2    |   |         |   |   #3    |           |
+-----+---------+---+---------+---+---------+-----------+
|                                                       |
|  #4   (Avatar)   Alex Tran           Lv.8    8,450 XP |
|  #5   (Avatar)   Bao Nguyen  [You]   Lv.7    7,900 XP |  <-- Highlighted if Current User
|  #6   (Avatar)   Elena Rostova       Lv.6    6,800 XP |
|  ...                                                  |
+-------------------------------------------------------+
|  [⚡ #12  (Avatar)  Your Name       Lv.5    5,200 XP] |  <-- Sticky My Standing
+-------------------------------------------------------+
|  [Home]   [Nutrition]   [Workout]   [Arena]   [Profile]| <-- BottomNavigation
+-------------------------------------------------------+
```

### Triple Lane Color Palette & Typography Tokens:

- **Relay Blue (`#4B57F2`):** Tab kích hoạt, viền avatar người dùng hiện tại, điểm nhấn vị trí.
- **Sprint Coral (`#FF5A47`):** Điểm XP (`Atkinson Hyperlegible Mono`), ngọn lửa thi đua.
- **Field Green (`#25C77A`):** Huy hiệu cấp độ an toàn, tăng hạng.
- **Athletic Gold (`#EAB308` / `#F59E0B`):** Vương miện Top 1, bục vinh quang cao nhất.
- **Silver (`#94A3B8`) & Bronze (`#B45309`):** Bục thứ hạng #2 và #3.
- **Nền:** `clear-white` (#FFFFFF) và `soft-paper` (#F7F8F6), bo góc thẻ `rounded-2xl` chuẩn DESIGN.md.

---

## 3. Data Flow & Contracts

### 3.1. Protobuf Wire Contracts (Backend Go: `GamificationService`)

- RPC Method: `GamificationService.GetGlobalLeaderboard(GetGlobalLeaderboardRequest)`
  - Request: `{ limit: 50 }`
  - Response:
    ```protobuf
    message GetGlobalLeaderboardResponse {
      repeated LeaderboardEntry top_entries = 1;
      LeaderboardEntry my_standing = 2;
    }
    ```
  - `LeaderboardEntry`:
    ```protobuf
    message LeaderboardEntry {
      int32 rank = 1;
      string user_id = 2;
      string display_name = 3;
      string avatar_url = 4;
      int64 xp = 5;
      int32 level = 6;
      google.protobuf.Timestamp updated_at = 7;
    }
    ```

### 3.2. ViewModels (`src/features/leaderboard/model/leaderboard.types.ts`)

```typescript
export interface LeaderboardEntryVM {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  level: number;
  isCurrentUser: boolean;
}

export interface LeaderboardDataVM {
  topEntries: LeaderboardEntryVM[];
  podium: LeaderboardEntryVM[]; // Top 3: [Rank 2, Rank 1, Rank 3] for visual rendering
  rankedList: LeaderboardEntryVM[]; // Ranks 4..50
  myStanding: LeaderboardEntryVM | null;
  totalParticipants: number;
}
```

### 3.3. Mapper Logic (`src/features/leaderboard/model/leaderboard.mapper.ts`)

- Chuyển `BigInt(xp)` sang `number` bằng `safeBigIntToNumber`.
- Điền fallback `displayName = "Athlete"` nếu trường rỗng.
- So sánh `userId === currentUserId` để đánh dấu `isCurrentUser: true`.
- Tách Top 3 thành mảng Podium `[second, first, third]` phục vụ layout thị giác.

---

## 4. Key Components Design

### 4.1. `LeaderboardPodium`

- Hiển thị 3 cột:
  - Cột 1 (Thứ 2): Chiều cao 110px, huy hiệu bạc `#2`, avatar 52px.
  - Cột 2 (Thứ 1): Chiều cao 140px, vương miện vàng hoàng kim `👑`, huy hiệu vàng `#1`, avatar 64px nổi bật với vòng glow nhẹ.
  - Cột 3 (Thứ 3): Chiều cao 95px, huy hiệu đồng `#3`, avatar 48px.
- Hiển thị tên (rút gọn nếu quá dài) và tổng điểm XP màu đậm nét thể thao.

### 4.2. `LeaderboardRow`

- Cột số thứ tự hạng: Phông số đậm mono, màu xám graphite trung tính.
- Cột Avatar: Bo tròn, viền tinh tế.
- Cột Tên & Level: Hiển thị tên kèm tag `Lv.X`.
- Cột XP: Căn phải, số XP rõ ràng + nhãn `XP`.
- Nếu là hàng của `isCurrentUser`, áp dụng background `bg-indigo-50/70 border border-indigo-200/80` và tag `YOU`.

### 4.3. `LeaderboardMyStanding`

- Hiển thị thanh nổi (Floating Card) phía đáy danh sách.
- Luôn hiển thị vị trí hiện tại của user, giúp user biết mình cách Top bao xa.
- Hỗ trợ trạng thái user chưa có điểm (Unranked).

---

## 5. Accessibility & Performance

- **Touch Targets:** Các nút tab và hàng danh sách đạt tối thiểu 48px.
- **Aria Roles:** `role="list"`, `role="listitem"`, `aria-label="Leaderboard ranking"`.
- **Contrast:** Đạt tỷ lệ tương phản tối thiểu 4.5:1 (WCAG 2.2 AA).
- **Reduced Motion:** Tôn trọng cài đặt `prefers-reduced-motion` của hệ điều hành.
