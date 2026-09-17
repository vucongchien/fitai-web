# Intent: FITAI Mobile Native Full-Application Plan (Excluding Admin)

- **Date**: 2026-09-17
- **Owner**: Agent
- **Status**: Completed

## Problem

1. **Triệu chứng (Symptom)**:
   - Ứng dụng FITAI hiện chỉ có phiên bản Web/PWA; chưa có ứng dụng di động Native hoàn chỉnh phân phối chính thức qua Google Play Store và Apple App Store.
   - Thư mục `mobile/` hiện tại mới chỉ dừng lại ở tầng cấu hình hạ tầng kỹ thuật (Giai đoạn 1); chưa có bất kỳ màn hình nào để người dùng trải nghiệm các tính năng cốt lõi (Theo dõi bài tập hôm nay, Tập luyện Live, Quản lý dinh dưỡng, Xem lộ trình 4 tuần, Tra cứu bài tập).
   - Trải nghiệm camera AI trên trình duyệt di động bị giới hạn hiệu năng bởi WebAssembly đơn luồng, không khai thác được bộ tăng tốc phần cứng NPU/Neural Engine của điện thoại.
2. **Bối cảnh (Trigger)**:
   - Người dùng yêu cầu một **kế hoạch toàn diện, đầy đủ toàn bộ chức năng (ngoại trừ admin)** của FITAI được chuyển đổi và xây dựng hoàn chỉnh trên nền tảng di động Expo (React Native).
3. **Nguyên nhân gốc rễ (Root Cause)**:
   - Hệ thống Web hiện tại được xây dựng trên Next.js 16 (React DOM, HTML/CSS, HttpOnly Cookie BFF proxy). Mobile Native đòi hỏi hệ thống Core Components (`<View>`, `<Text>`, `<Pressable>`), cơ chế xác thực Bearer Token qua `expo-secure-store`, và file-based routing của Expo Router v4.
   - Chưa có thiết kế kiến trúc phân hệ toàn diện trên mobile cho 7 module nghiệp vụ chính.
4. **Tác động (Impact)**:
   - Nếu không có bản kế hoạch kiến trúc tổng thể từ đầu, quá trình xây dựng Mobile sẽ bị manh mún, trùng lặp logic nghiệp vụ, thiếu đồng bộ dữ liệu với backend `gym-companion`, và khó khăn trong việc mở rộng AI Camera.

## Desired Outcome

Bản kế hoạch và triển khai toàn diện bao quát 100% tính năng nghiệp vụ của FITAI (ngoại trừ Admin), xử lý đầy đủ **3 trạng thái giao diện bắt buộc (`Loading`, `Error`, `Empty`)**:

1. **[P0 - Core Shell, Auth & Secure Session Storage]**:
   - Expo Router v4 Root Shell (`mobile/app/_layout.tsx` với Dark theme `#09090b`, SafeAreaProvider, StatusBar).
   - Module xác thực (`mobile/src/features/auth/`): Đăng nhập Email/Mật khẩu, Dev Fast-Login, lưu trữ an toàn `accessToken` & `refreshToken` trong `expo-secure-store` (mã hóa phần cứng qua iOS Keychain / Android Keystore).
   - Interceptor gRPC Client tự động đính kèm `Authorization: Bearer <token>` và tự động làm mới token khi hết hạn.
2. **[P0 - Onboarding Flow 4 Bước]**:
   - `mobile/src/features/onboarding/`: Wizard thiết lập hồ sơ thể hình (Mục tiêu, Thể số chiều cao/cân nặng/tuổi, Thiết bị phòng gym có sẵn, và Bộ chọn lịch tập trong tuần `workout-schedule-picker` tái sử dụng domain logic).
3. **[P0 - Today Dashboard (`app/(tabs)/today.tsx`)]**:
   - Header: Avatar, level, streak tập luyện liên tục.
   - Today's Workout Card: Bài tập được xếp lịch hôm nay, thời lượng ước tính, nút 1 chạm "Bắt đầu tập luyện".
   - Daily Macro Tracker: Thanh tiến độ Calo, Protein, Carbs, Fat.
   - Meal Timeline: Danh sách 4 bữa ăn (Sáng, Trưa, Tối, Snack) kèm nút ghi chép nhanh.
   - Quick Actions: "Tập luyện tự do (Ad-hoc)", "Toàn bộ lịch trình (Schedule)", "Thực đơn hôm nay".
4. **[P0 - Workout Execution & AI Motion Engine (`app/workout/...`)]**:
   - **Chế độ Live Workout**:
     - Native Camera HUD: Khung hình 30-60fps, joint skeleton overlay, ROM progress gauge, đếm rep thời gian thực.
     - Tái sử dụng 100% domain toán học thuần: `pose-metrics.ts`, `training-load.ts`, `session-flow.ts`.
     - Phản hồi đa giác quan: Âm thanh hướng dẫn và rung phần cứng (`haptics.ts`).
   - **Chế độ Manual Logging**: Nhập số rep, mức tạ (kg), đánh giá độ mệt (RPE), kèm Rest Timer đếm ngược giờ nghỉ giữa hiệp.
   - **Ad-hoc Workout Builder**: Tạo buổi tập tự do theo nhóm cơ, AI workout recommendation.
   - **Workout Summary Screen**: Tổng kết tổng khối lượng (Volume Tonnes), số set, Form Score, kỷ lục PR mới.
5. **[P1 - Roadmap 4 Tuần & Lịch trình (`app/(tabs)/roadmap.tsx` & `app/schedule/...`)]**:
   - Chu trình tập luyện 4 tuần (4-Week Training Cycle), chi tiết từng buổi tập trong giáo án.
   - Lịch tập tuần trực quan, cho phép chuyển đổi ngày tập và nhận đề xuất điều chỉnh lịch tự động từ AI khi bận.
6. **[P1 - Nutrition & Meal Logging (`app/(tabs)/nutrition.tsx` & `app/nutrition/...`)]**:
   - Phân tích chi tiết dinh dưỡng hằng ngày, lượng calo nạp vào vs mục tiêu.
   - Màn hình Log Meal: Tra cứu món ăn trong thư viện, quét/nhập khối lượng gram, ghi chép vào 4 bữa ăn.
7. **[P1 - Profile, Quản lý Chấn thương & Cài đặt (`app/(tabs)/profile.tsx`)]**:
   - Quản lý thể số (Cân nặng, Chiều cao, % Mỡ, BMI).
   - Quản lý chấn thương & Điểm đau (Injury & Pain Tracking) kèm các bài tập phục hồi chức năng.
   - Cài đặt âm thanh huấn luyện viên, độ rung, và đăng xuất.
8. **[P2 - Exercise Library & Notifications (`app/search/...` & `app/notifications/...`)]**:
   - Thư viện 500+ bài tập thể hình có video minh họa, nhóm cơ chính/phụ, bộ lọc thiết bị.
   - Trung tâm thông báo & Push Notifications nhắc giờ tập và nhắc ghi chép bữa ăn.
9. **[P0 - Kiểm thử tự động]**:
   - Unit tests Vitest kiểm thử: Route exports, cấu trúc Tab Navigation, gRPC Interceptors, Data Mappers, và UI safe rendering.

## Business & Technical References

- `PRODUCT.md` - Định vị thương hiệu FITAI, cam kết Triple Lane signature và trải nghiệm phòng gym chuyên nghiệp.
- `mobile/package.json` - Cấu hình dependencies Expo SDK 52, React Native 0.76, Expo Router v4.
- `mobile/app.json` - Cấu hình định danh app FITAI, quyền hạn Camera, Vibrate, WakeLock.
- `src/features/workout/domain/pose-metrics.ts` - Thuật toán hình học khớp xương, góc ROM và luật đếm rep (FR-CC-02, BR-CC-01).
- `src/features/workout/domain/training-load.ts` - Công thức tính toán tải trọng, Volume và 1RM (Domain dùng chung).
- `src/features/workout/domain/session-flow.ts` - State machine chu trình hiệp tập và timeline buổi tập.
- `src/features/onboarding/domain/workout-times-normalizer.ts` - Thuật toán chuẩn hóa lịch tập đa ngày.
- `src/features/nutrition/model/meal-detail.mapper.ts` - Logic phân tách và chuẩn hóa thực đơn món ăn.
- `src/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb.ts` - Hợp đồng gRPC Workout Execution.
- `src/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb.ts` - Hợp đồng gRPC Coaching & Roadmap.
- `src/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb.ts` - Hợp đồng gRPC Nutrition.
- `src/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb.ts` - Hợp đồng gRPC Profile.
- `src/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb.ts` - Hợp đồng gRPC Exercise Catalog.
- `.agents/skills/vercel-react-native-skills/SKILL.md` - Bộ quy chuẩn Vercel Mobile (Pressable, SafeArea, Icons, Performance).

## Gaps

1. **[Hệ thống Điều hướng Màn hình Mobile (Routing & Navigation)]**:
   - Hiện trạng: Web có 34 routes App Router. Mobile chưa có thư mục `mobile/app/`.
   - Kỳ vọng: Expo Router v4 tổ chức đầy đủ luồng màn hình: Auth (`/login`), Onboarding (`/onboarding`), Tabs chính (`/(tabs)/today`, `/(tabs)/workout`, `/(tabs)/nutrition`, `/(tabs)/profile`), cùng các modal con (`/workout/live`, `/workout/adhoc`, `/nutrition/log-meal`, `/search`).
   - Cần bổ sung: Cấu trúc thư mục file-based routing toàn diện trong `mobile/app/`.
2. **[Cơ chế Xác thực & gRPC Client Native]**:
   - Hiện trạng: Web dùng Next.js BFF proxy và HttpOnly Cookies.
   - Kỳ vọng: Mobile kết nối trực tiếp đến backend gRPC (`gym-companion`) qua ConnectRPC transport, sử dụng Bearer Token lưu trữ mã hóa trong `expo-secure-store`.
   - Cần bổ sung: `mobile/src/shared/api/client-transport.ts` và auth store.
3. **[AI Camera Engine & Live Workout HUD Native]**:
   - Hiện trạng: Web chạy WASM camera trên canvas.
   - Kỳ vọng: Mobile hỗ trợ đồng thời Native Camera AI (VisionCamera + ONNX) và Manual Logging Mode với Rest Timer rung phản hồi.
   - Cần bổ sung: Native HUD overlays và set confirm dialog cho React Native.
4. **[Hệ thống Giao diện & Primitive Components]**:
   - Hiện trạng: Web dùng HTML DOM (`div`, `button`, Tailwind v4).
   - Kỳ vọng: Mobile dùng React Native primitives (`<View>`, `<Text>`, `<Pressable>`, `<ScrollView>`) theo phong cách thiết kế Triple Lane Signature (`Relay Blue`, `Sprint Coral`, `Field Green`).
   - Cần bổ sung: Bộ Design System Native tại `mobile/src/shared/components/`.

## Working Assumptions

1. **[Giao thức Kết nối Backend: ConnectRPC gRPC-Web Trực tiếp]**:
   - Mobile app kết nối trực tiếp đến backend gRPC `gym-companion` (bỏ qua Next.js BFF proxy), tự động gắn Bearer Token lấy từ `expo-secure-store`.
   - _Căn cứ mã nguồn_: `src/shared/api/browser/transport.ts#L1-L20`
   - _Kế hoạch dự phòng_: Cung cấp Mock Client hoặc Offline Mode nếu môi trường dev chưa bật backend gRPC.
2. **[Tái sử dụng 100% Pure TypeScript Domain từ Web]**:
   - Toàn bộ các module toán học trong `src/features/workout/domain/` (`pose-metrics.ts`, `training-load.ts`, `session-flow.ts`) và `workout-times-normalizer.ts` không phụ thuộc DOM, được Metro bundler map trực tiếp sang Mobile.
   - _Căn cứ mã nguồn_: `mobile/metro.config.js#L20-L26`
   - _Kế hoạch dự phòng_: Đã được Metro resolver cấu hình và kiểm chứng trong Phase 1.
3. **[Hỗ trợ Song song 2 Chế độ Tập luyện (Dual Workout Modes)]**:
   - Buổi tập hỗ trợ cả Camera AI đếm rep tự động và Chế độ nhập tay (Manual Gym Logging) để người dùng có thể tập ở mọi phòng gym đông người mà không cần dựng chân máy quay.
   - _Căn cứ mã nguồn_: `src/features/workout/ui/live/live-workout.tsx#L55-L65`

## Open Questions

1. **[Chiến lược Styling & Design Tokens trên Mobile]**:
   - **A (Khuyến nghị)**: Xây dựng hệ thống Primitive Components (`ScreenContainer`, `Card`, `Badge`, `Button`) sử dụng `StyleSheet.create` chuẩn kết hợp bảng hằng số màu sắc Signature Triple Lane (`mobile/src/shared/constants/theme.ts`). Đảm bảo chạy mượt 100% trên Expo Go, không phát sinh lỗi compiler CSS hay xung đột package.
   - **B**: Cài đặt NativeWind v4 (Tailwind cho React Native).
   - _Giả định tạm thời_: Tạm chọn **A** theo nguyên tắc Simplicity First.
2. **[Chiến lược Lưu trữ Cục bộ & Cache Dữ liệu]**:
   - **Đã quyết định (User Approved)**: Kiến trúc hiện đại nhất: **`expo-secure-store` + `MMKV`**.
     - `expo-secure-store`: Lưu thông tin nhạy cảm định danh (`accessToken`, `refreshToken`, `userId`) mã hóa phần cứng qua iOS Keychain / Android Keystore.
     - `MMKV` (hoặc Adapter abstraction tương thích Native JSI + Vitest/Web fallback): Lưu trữ tức thời (0ms synchronous read/write) cho `activeWorkoutSession` (phục hồi phiên tập khi crash/sập nguồn), `pendingSyncQueue` (hàng đợi ngoại tuyến khi phòng gym mất sóng), `userPreferences`, và cache danh mục bài tập.
     - Dữ liệu lịch sử phân tích dài hạn: Giữ nguyên trên Server `gym-companion` (Single Source of Truth), nạp theo phân trang.
3. **[Lộ trình Phân kỳ Thi công (Execution Phasing)]**:
   - **A (Khuyến nghị)**: Triển khai theo 4 Phase có thể kiểm thử và bàn giao độc lập:
     - _Phase 1_: App Shell + Bottom Tabs Navigation + Auth & SecureStore + Today Dashboard.
     - _Phase 2_: Live Workout Execution (Manual Logging Mode + Rest Timer + Summary) + Roadmap Schedule.
     - _Phase 3_: Nutrition & Meal Logging + Profile & Injury Recovery Management.
     - _Phase 4_: Native Camera AI HUD + Exercise Library + Push Notifications.
   - **B**: Thi công tất cả cùng một lúc trong một lượt duy nhất.
   - _Giả định tạm thời_: Tạm chọn **A** để đảm bảo kiểm thử kỹ lưỡng từng phân hệ và tuân thủ nguyên tắc SDLC Checkpoints.
