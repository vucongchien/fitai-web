# Plan: FITAI Mobile Native Full-Application Plan (from intent.md 2026-09-17)

## Files that change

### 0. Bóc tách Headless Logic & Design Tokens dùng chung (Web & Mobile)

- `src/shared/design-system/tokens.ts` (new) — Bóc tách Design Tokens (Triple Lane Colors, Dark Palette, Spacing, Radius) từ `tokens.css` thành hằng số TypeScript.
- `src/shared/ui/charts/use-circular-progress.ts` (new) — Bóc tách Headless hook & math cho Circular Progress (tính %, chu vi, stroke offset).
- `src/features/workout/domain/session-timer-math.ts` (new) — Bóc tách các hàm toán học timer (`formatClock`, `formatCountdown`, `secondsLeft`, `elapsedSeconds`) từ `use-session-timer.ts`.
- `src/shared/ui/charts/circular-progress.tsx` (modify) — Tái cấu trúc Web component tiêu thụ headless hook `use-circular-progress.ts`.
- `src/features/workout/model/use-session-timer.ts` (modify) — Tái cấu trúc tiêu thụ `session-timer-math.ts`.

### 1. Cấu hình & Hạ tầng phụ trợ

- `mobile/package.json` (modify) — Cập nhật cấu hình phụ thuộc nếu cần.
- `mobile/tsconfig.json` (modify) — Mở rộng `include` cho `app/**/*.tsx`, `app/**/*.ts`.

### 2. Tầng Lưu trữ & Thư viện dùng chung (Shared Infrastructure)

- `mobile/src/shared/constants/theme.ts` (new) — Bảng màu nhận diện Triple Lane Signature (`Relay Blue`, `Sprint Coral`, `Field Green`, Dark theme `#09090b`).
- `mobile/src/shared/lib/storage.ts` (new) — MMKV Key-Value Storage adapter với cơ chế đọc/ghi đồng bộ (0ms latency) và in-memory test double cho Vitest / Web fallback.
- `mobile/src/shared/lib/secure-storage.ts` (new) — Trình bao bọc `expo-secure-store` bảo mật Tokens qua iOS Keychain / Android Keystore.
- `mobile/src/shared/lib/offline-queue.ts` (new) — Hàng đợi ngoại tuyến (Offline Outbox Queue) lưu trữ và tự động đồng bộ hiệp tập/bữa ăn khi phòng gym có mạng lại.
- `mobile/src/shared/api/client-transport.ts` (new) — ConnectRPC Native Transport kết nối trực tiếp `gym-companion` backend, tự động gắn Bearer Token và xử lý làm mới phiên.

### 3. Bộ linh kiện giao diện cơ bản (Design System Primitives) & 3 Trạng thái bắt buộc

- `mobile/src/shared/components/ui/loading-state.tsx` (new) — Trạng thái đang tải dữ liệu (`LoadingState`) với ActivityIndicator và skeleton placeholder.
- `mobile/src/shared/components/ui/error-state.tsx` (new) — Trạng thái báo lỗi (`ErrorState`) kèm thông báo chi tiết và nút "Thử lại" (Retry).
- `mobile/src/shared/components/ui/empty-state.tsx` (new) — Trạng thái không có dữ liệu (`EmptyState`) kèm hình minh họa và nút hành động chuyển hướng.
- `mobile/src/shared/components/ui/card.tsx` (new) — Component thẻ hiển thị Dark UI với viền border tinh tế.
- `mobile/src/shared/components/ui/button.tsx` (new) — Component nút bấm cảm ứng hỗ trợ phản hồi rung haptic và trạng thái disabled/loading.
- `mobile/src/shared/components/ui/badge.tsx` (new) — Component nhãn trạng thái (Primary, Success, Warning, Danger).

### 4. Tầng Logic Nghiệp vụ & Trạng thái (Domain & State Stores)

- `mobile/src/features/auth/model/auth-store.ts` (new) — Quản lý phiên đăng nhập, Dev fast-login và token lifecycle qua SecureStore.
- `mobile/src/features/today/model/today-dashboard.ts` (new) — Quản lý dữ liệu tổng hợp Today Dashboard (Streak, Buổi tập hôm nay, Macro, Bữa ăn).
- `mobile/src/features/workout/model/active-workout-store.ts` (new) — Quản lý phiên tập trực tiếp, tự động lưu MMKV chống sập nguồn (Crash Recovery) và ghi log hiệp tập.
- `mobile/src/features/workout/model/rest-timer.ts` (new) — Đồng hồ đếm ngược thời gian nghỉ giữa hiệp kèm rung haptic phần cứng khi hoàn thành.
- `mobile/src/features/roadmap/model/roadmap-store.ts` (new) — Quản lý chu trình tập luyện 4 tuần và điều chỉnh lịch tập tuần.
- `mobile/src/features/nutrition/model/nutrition-store.ts` (new) — Quản lý macro mục tiêu, danh sách món ăn theo 4 bữa và ghi nhận dinh dưỡng.
- `mobile/src/features/profile/model/profile-store.ts` (new) — Quản lý thể số thể hình, hồ sơ đau/chấn thương và cài đặt người dùng.
- `mobile/src/features/exercise/model/exercise-catalog-store.ts` (new) — Bộ nhớ đệm danh mục 500+ bài tập cho phép tìm kiếm và lọc tức thì (0ms trễ).

### 5. Hệ thống Điều hướng & Màn hình Expo Router v4

- `mobile/app/_layout.tsx` (new) — Root Layout tích hợp SafeAreaProvider, Dark Theme, và StatusBar.
- `mobile/app/index.tsx` (new) — Điều hướng thông minh (Splash/Gatekeeper): chuyển đến `/(tabs)/today` nếu đã đăng nhập hoặc `/(auth)/login` nếu chưa.
- `mobile/app/(auth)/login.tsx` (new) — Màn hình Đăng nhập Email/Password & Nút bấm Fast-Login cho môi trường Dev.
- `mobile/app/(auth)/onboarding.tsx` (new) — Quy trình Onboarding 4 bước: Mục tiêu -> Thể số -> Thiết bị gym -> Lịch tập trong tuần.
- `mobile/app/(tabs)/_layout.tsx` (new) — Bottom Navigation Bar 5 tab: Today (`⚡`), Workout (`🏋️`), Nutrition (`🥗`), Roadmap (`📈`), Profile (`👤`).
- `mobile/app/(tabs)/today.tsx` (new) — Màn hình Today Dashboard: Streak, Buổi tập trong ngày, Daily Macro ring, Timeline bữa ăn.
- `mobile/app/(tabs)/workout.tsx` (new) — Màn hình Workout Hub: Nút 1 chạm vào bài tập, Khởi tạo buổi tập tự do (Ad-hoc), Lịch sử gần nhất.
- `mobile/app/(tabs)/nutrition.tsx` (new) — Màn hình Nutrition Dashboard: Chi tiết nạp calo/macro, tiến độ các bữa ăn trong ngày.
- `mobile/app/(tabs)/roadmap.tsx` (new) — Màn hình Chu trình tập 4 tuần: Chi tiết từng tuần và từng buổi tập.
- `mobile/app/(tabs)/profile.tsx` (new) — Màn hình Cá nhân: Thể số, Quản lý điểm đau/chấn thương, Cài đặt âm thanh/haptics, Đăng xuất.
- `mobile/app/workout/live.tsx` (new) — Màn hình Tập luyện trực tiếp: Chế độ Live HUD + Chế độ Nhập tay phòng gym, Rest Timer đếm ngược.
- `mobile/app/workout/summary.tsx` (new) — Màn hình Tổng kết buổi tập: Tổng khối lượng (Volume Tonnes), số set, Form Score, PR kỷ lục mới.
- `mobile/app/nutrition/log-meal.tsx` (new) — Màn hình Modal Ghi chép bữa ăn: Tra cứu món ăn nhanh, nhập định lượng gram.
- `mobile/app/search/index.tsx` (new) — Màn hình Tra cứu Thư viện Bài tập: Tìm kiếm 0ms, lọc theo nhóm cơ và thiết bị.

### 6. Bộ Kiểm thử Tự động (Automated Test Suites)

- `tests/unit/mobile-storage.test.ts` (new) — Kiểm thử MMKV adapter đọc/ghi đồng bộ và SecureStore wrapper bảo mật token.
- `tests/unit/mobile-offline-queue.test.ts` (new) — Kiểm thử hàng đợi ngoại tuyến: thêm action, lưu trữ persistence và drain queue khi online.
- `tests/unit/mobile-active-workout-recovery.test.ts` (new) — Kiểm thử khôi phục trạng thái buổi tập dở dang sau khi crash hoặc sập nguồn máy.
- `tests/unit/mobile-auth-transport.test.ts` (new) — Kiểm thử ConnectRPC Native Transport gắn Bearer token và xử lý auth lifecycle.
- `tests/unit/mobile-ui-states.test.tsx` (new) — Kiểm thử bắt buộc 3 trạng thái giao diện (`Loading`, `Error`, `Empty`) theo chuẩn SDLC.

---

## Solution

### 1. Kiến trúc Lưu trữ Hiện đại: `expo-secure-store` + `MMKV`

- **Bảo mật**: `expo-secure-store` chịu trách nhiệm lưu trữ `accessToken`, `refreshToken` và `userId` vào chip phần cứng bảo mật (iOS Keychain / Android Keystore).
- **Hiệu năng tức thì**: `MMKV` (hoặc Adapter abstraction đồng bộ chuẩn) chịu trách nhiệm lưu trữ:
  - `activeWorkoutSession`: Trạng thái hiệp tập hiện tại (bài tập số mấy, hiệp số mấy, mức tạ, số rep đã hoàn thành). Khi máy bị sập nguồn, mở lại app đọc trực tiếp từ bộ nhớ cục bộ trong < 1ms, phục hồi 100% trạng thái mà không bắt người dùng tập lại.
  - `pendingSyncQueue`: Hàng đợi ngoại tuyến khi tập ở tầng hầm không có 4G/Wifi. Khi người dùng xác nhận set hoặc log bữa ăn, action được ghi vào hàng đợi. Một background sync worker tự động gửi gRPC lên backend `gym-companion` khi có mạng.
  - `userPreferences`: Cài đặt âm lượng giọng nói AI coach, bật/tắt rung haptic, chế độ camera mặc định.
  - `exerciseCatalogCache`: Thư viện 500 bài tập để tìm kiếm tức thì không có độ trễ mạng.
- **Server State**: Lịch sử tập luyện nhiều tháng, biểu đồ dài hạn hay roadmap 4 tuần được quản lý như Server State, tải theo phân trang từ `gym-companion` gRPC service.

### 2. Chuẩn mực Giao diện: 3 Trạng thái Bắt buộc & Triple Lane Signature

- Mọi màn hình nghiệp vụ đều tuân thủ nguyên tắc xử lý đầy đủ 3 trạng thái:
  - **Loading**: Hiển thị indicator nhẹ nhàng, tránh layout shift.
  - **Error**: Hiển thị thông điệp lỗi rõ ràng kèm nút Retry để người dùng khắc phục ngay.
  - **Empty**: Hiển thị trạng thái chưa có dữ liệu (ví dụ: "Chưa có bữa ăn nào hôm nay") kèm nút hành động định hướng (ví dụ: "Ghi chép bữa ăn ngay").
- Giao diện xây dựng theo phong cách Dark Mode chuyên nghiệp của FITAI (`#09090b`), sử dụng các điểm nhấn màu sắc đặc trưng: `Relay Blue` (`#3b82f6`), `Sprint Coral` (`#f97316`), `Field Green` (`#22c55e`).

### 3. Tối ưu Hóa React 19 & Tuân thủ Zero-useEffect

- Tuyệt đối không lạm dụng `useEffect` cho các tính toán trạng thái phái sinh (derived state) hoặc hành vi người dùng.
- Mọi logic lưu trữ, đếm timer và gửi request đều được kích hoạt trực tiếp từ Event Handlers (ví dụ: `onPressCompleteSet`, `onPressStartWorkout`).
- Các subscription trạng thái lưu trữ sử dụng mẫu hình `useSyncExternalStore` tiêu chuẩn của React.

---

## Order of work

1. **Bóc tách Headless Logic & Design Tokens dùng chung**:
   - Viết `src/shared/design-system/tokens.ts` bóc tách bảng màu Triple Lane Signature, Dark Palette, Spacing, Radius từ `tokens.css` thành hằng số TypeScript.
   - Viết `src/shared/ui/charts/use-circular-progress.ts` bóc tách logic toán học vòng cung (toPercentage, circumference, stroke offset) từ `circular-progress.tsx`.
   - Viết `src/features/workout/domain/session-timer-math.ts` bóc tách các hàm tính toán và định dạng thời gian (`formatClock`, `formatCountdown`, `secondsLeft`, `elapsedSeconds`) từ `use-session-timer.ts`.
   - Cập nhật `circular-progress.tsx` và `use-session-timer.ts` tiêu thụ các module headless mới.
   - Chạy `pnpm test` và `pnpm typecheck` xác nhận Web pass 100% tests (Zero Regression Gate).
2. **Chuẩn bị cấu hình & Mở rộng TSConfig**:
   - Cập nhật `mobile/tsconfig.json` mở rộng trường `include` bao quát `app/**/*.tsx` và `app/**/*.ts`.
3. **Xây dựng Tầng Lưu trữ MMKV + SecureStore**:
   - Viết `mobile/src/shared/lib/storage.ts` với giao diện `KeyValueStorage` đồng bộ, hỗ trợ lưu trữ JSON và in-memory fallback cho môi trường test.
   - Viết `mobile/src/shared/lib/secure-storage.ts` bọc `expo-secure-store` để lưu/đọc/xóa `fitai_access_token`, `fitai_refresh_token`, `fitai_user_id`.
   - Viết `mobile/src/shared/lib/offline-queue.ts` quản lý hàng đợi ngoại tuyến với cơ chế enqueue, persist và sync-drain.
4. **Xây dựng Bộ Linh kiện UI Primitives & 3 Trạng thái Giao diện**:
   - Định nghĩa bảng màu `mobile/src/shared/constants/theme.ts` ánh xạ trực tiếp từ `src/shared/design-system/tokens.ts`.
   - Xây dựng các component: `LoadingState`, `ErrorState`, `EmptyState`, `Card`, `Button`, `Badge`.
5. **Xây dựng Tầng Truyền thông gRPC & Auth Store**:
   - Viết `mobile/src/shared/api/client-transport.ts` cấu hình ConnectRPC transport với Bearer Token interceptor.
   - Viết `mobile/src/features/auth/model/auth-store.ts` quản lý trạng thái đăng nhập và Dev Fast-Login.
6. **Xây dựng Engine Quản lý Buổi tập & Crash Recovery**:
   - Viết `mobile/src/features/workout/model/active-workout-store.ts` tích hợp tự động lưu trạng thái vào MMKV mỗi khi hoàn thành hiệp tập.
   - Viết `mobile/src/features/workout/model/rest-timer.ts` quản lý đồng hồ nghỉ giữa hiệp kết hợp rung haptic (`nativeHaptics.setComplete()`).
7. **Xây dựng Domain Stores cho các Phân hệ còn lại**:
   - Viết `mobile/src/features/today/model/today-dashboard.ts` tổng hợp dữ liệu ngày.
   - Viết `mobile/src/features/roadmap/model/roadmap-store.ts` điều hướng chu trình 4 tuần.
   - Viết `mobile/src/features/nutrition/model/nutrition-store.ts` quản lý macro và log 4 bữa.
   - Viết `mobile/src/features/profile/model/profile-store.ts` quản lý thể số và đau chấn thương.
   - Viết `mobile/src/features/exercise/model/exercise-catalog-store.ts` bộ nhớ đệm thư viện bài tập.
8. **Thiết lập Khung Điều hướng Expo Router v4 (Root Shell & Auth Screens)**:
   - Viết `mobile/app/_layout.tsx` (Root Shell với SafeAreaProvider và Dark Theme).
   - Viết `mobile/app/index.tsx` (Gatekeeper điều hướng).
   - Viết `mobile/app/(auth)/login.tsx` và `mobile/app/(auth)/onboarding.tsx`.
9. **Thiết lập Bottom Navigation Bar & Màn hình Chính**:
   - Viết `mobile/app/(tabs)/_layout.tsx` cấu hình thanh tab 5 nút cảm ứng.
   - Viết `mobile/app/(tabs)/today.tsx` hiển thị Dashboard hằng ngày (đủ 3 trạng thái).
   - Viết `mobile/app/(tabs)/workout.tsx` hiển thị trung tâm tập luyện.
   - Viết `mobile/app/(tabs)/nutrition.tsx` hiển thị tiến độ dinh dưỡng.
   - Viết `mobile/app/(tabs)/roadmap.tsx` hiển thị lộ trình 4 tuần.
   - Viết `mobile/app/(tabs)/profile.tsx` hiển thị hồ sơ cá nhân và cài đặt.
10. **Xây dựng Màn hình Chi tiết Buổi tập & Modal Tính năng**:
    - Viết `mobile/app/workout/live.tsx` phục vụ tập luyện trực tiếp tại phòng gym.
    - Viết `mobile/app/workout/summary.tsx` tổng kết buổi tập.
    - Viết `mobile/app/nutrition/log-meal.tsx` modal ghi chép bữa ăn.
    - Viết `mobile/app/search/index.tsx` tra cứu thư viện bài tập tức thì.
11. **Viết Bộ Kiểm thử Tự động Toàn diện & Chạy Nghiệm thu**:
    - Viết `tests/unit/mobile-storage.test.ts`.
    - Viết `tests/unit/mobile-offline-queue.test.ts`.
    - Viết `tests/unit/mobile-active-workout-recovery.test.ts`.
    - Viết `tests/unit/mobile-auth-transport.test.ts`.
    - Viết `tests/unit/mobile-ui-states.test.tsx`.
    - Chạy toàn bộ test suites với Vitest, kiểm tra Typecheck, Lint và Task Validator.

---

## Risks

1. **Rủi ro Môi trường Thực thi (Node.js/Vitest vs Native Mobile JSI)**:
   - _Nguy cơ_: `react-native-mmkv` hoặc `expo-secure-store` phụ thuộc vào native bindings C++/Objective-C/Java; khi chạy trong môi trường kiểm thử Vitest trên máy tính sẽ gặp lỗi `NativeModule is null`.
   - _Biện pháp giảm thiểu_: Xây dựng adapter abstraction trong `storage.ts` và `secure-storage.ts` tự động phát hiện môi trường: sử dụng Native bindings khi chạy trên thiết bị thật và fallback sang in-memory dictionary khi chạy trong môi trường kiểm thử Vitest.
2. **Rủi ro Mất sóng Ngoại tuyến ở Phòng Gym**:
   - _Nguy cơ_: Mạng chập chờn khi người dùng đang bấm ghi nhận set tập hoặc log bữa ăn, dẫn đến mất dữ liệu hoặc lỗi ứng dụng.
   - _Biện pháp giảm thiểu_: Mọi hành động ghi nhận dữ liệu tại chỗ được ghi tức thời vào `active-workout-store` (MMKV) và đẩy vào `offline-queue` trước khi cố gắng gửi qua mạng. Giao diện phản hồi ngay lập tức (Optimistic UI) và background sync gửi ngầm khi có mạng.
3. **Rủi ro Rò rỉ Bộ nhớ với Bộ đếm Thời gian Nghỉ (Rest Timer)**:
   - _Nguy cơ_: Timer đếm giây chạy ngầm gây rò rỉ bộ nhớ hoặc tính toán sai khi điện thoại tắt màn hình.
   - _Biện pháp giảm thiểu_: Rest Timer tính toán dựa trên mốc thời gian tuyệt đối (`endTimestamp = Date.now() + durationMs`) thay vì đếm biến `interval` tăng dần. Khi app mở lại hoặc màn hình sáng lên, timer chỉ cần lấy hiệu số `endTimestamp - Date.now()` để hiển thị chính xác.
4. **Rủi ro Hết hạn Token khi Đang Tập Luyện**:
   - _Nguy cơ_: Access Token hết hạn giữa buổi tập khiến các lời gọi API gRPC bị lỗi `Unauthenticated (16)`.
   - _Biện pháp giảm thiểu_: Client transport interceptor tự động bắt lỗi `Code.Unauthenticated`, âm thầm dùng Refresh Token từ `expo-secure-store` để gia hạn phiên và tự động thực hiện lại request ban đầu (single-flight refresh pattern).

---

## Proof

1. **Kiểm thử Tự động Unit Tests (Vitest)**:
   - Lệnh thực thi: `pnpm test tests/unit/mobile`
   - Tiêu chí: 100% test suites liên quan đến mobile (storage, offline-queue, active-workout-recovery, auth-transport, ui-states) pass với 0 lỗi.
2. **Kiểm tra Tính toàn vẹn Kiểu dữ liệu (TypeScript)**:
   - Lệnh thực thi: `pnpm typecheck`
   - Tiêu chí: 0 lỗi type error trong toàn bộ workspace.
3. **Kiểm tra Tiêu chuẩn Code & Quy tắc Next/React (Oxlint)**:
   - Lệnh thực thi: `pnpm lint`
   - Tiêu chí: 0 cảnh báo, 0 lỗi linting.
4. **Kiểm tra Định dạng Code (Oxfmt)**:
   - Lệnh thực thi: `pnpm format:check`
   - Tiêu chí: Mã nguồn định dạng chuẩn xác 100%.
5. **Kiểm tra Vòng đời Kế hoạch SDLC (Task Validator)**:
   - Lệnh thực thi: `pnpm run task:check`
   - Tiêu chí: Thư mục `tasks/2026-09-17-expo-mobile-full-app/` hợp lệ 100%, không dính bất kỳ lỗi phạt nghiêm khắc nào.
