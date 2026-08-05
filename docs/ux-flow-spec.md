# UX Flow Spec — App Tập luyện & Dinh dưỡng (FE)

**Đối tượng:** người mới bắt đầu tập luyện & ăn uống lành mạnh
**Mục tiêu chính:** giảm friction, tạo cảm giác "dễ bắt đầu – dễ quay lại"
**Căn cứ:** UC-01 Onboarding · UC-02 Coaching & Planning · UC-03 Workout Execution · UC-04 Adaptive Review Cycle · UC-05 Nutrition

---

## 0. Nguyên tắc UX xuyên suốt

- **Zero-blank-state**: màn hình rỗng luôn có CTA gợi ý bước tiếp theo.
- **Progress luôn nhìn thấy**: tuần/pha hiện tại + streak hiển thị ngay ở Home.
- **Không phạt khi thất bại**: bỏ buổi, skip, ăn lệch → phản hồi trung tính/khích lệ.
- **Zero-friction logging**: mọi hành động log (ăn, set tập) tối thiểu thao tác, không bắt nhập liệu nếu không cần thiết.
- **Giải thích "tại sao"**: mọi thay đổi tự động (giảm tải, đổi bài, tăng calo...) đều có 1 dòng lý do ngắn, tránh cảm giác app "tự ý quyết định".
- **1 tay thao tác được** trong lúc tập.

---

## 1. Auth & Onboarding

```
Splash → Đăng nhập/Đăng ký ( Google/FB) → Hồ sơ sức khoẻ → (tuỳ chọn) Báo chấn thương
→ Preview Roadmap → Home
```

### 1.1 Đăng ký / Đăng nhập

- Social login ưu tiên; email/SĐT + OTP là fallback.
- OTP sai 3 lần → khoá 15 phút (hiển thị đếm ngược, không chỉ báo lỗi khô khan).
- Tài khoản trạng thái `Incomplete` ngay sau khi tạo — chưa vào Home mà chuyển thẳng sang Hồ sơ sức khoẻ.

### 1.2 Hồ sơ sức khoẻ (Complete Health Profile)

Form nhiều bước, có **thanh % hoàn thiện hồ sơ** hiển thị xuyên suốt (vì ≥80% mới mở khoá AI Coach):

1. Tuổi, giới tính, chiều cao, cân nặng
2. Mục tiêu chính: Tăng cơ / Giảm mỡ
3. Dụng cụ tập có sẵn (mặc định luôn có "Bodyweight", user thêm nếu có tạ/máy)
4. Nhóm cơ ưu tiên (optional — bỏ qua thì hệ thống tự chia đều Push/Pull/Legs)
5. **Khung giờ rảnh trong tuần** — UI dạng lưới lịch tuần (7 ngày x khung giờ), cho tick nhiều ô vì 1 ngày có thể có nhiều buổi. Có thể bỏ qua, chỉnh lại sau trong Settings.

Validate inline (cân nặng/chiều cao ≤ 0 → báo lỗi ngay tại field, không chờ submit).

Khi đạt ≥ 80%: hiện toast "Hồ sơ đã sẵn sàng — AI Coach đang lên lộ trình cho bạn" → chuyển bước tiếp theo.
Nếu < 80% và user thoát giữa chừng: lưu draft, Home hiển thị banner "Hoàn thiện hồ sơ để nhận lộ trình cá nhân hoá" thay vì chặn cứng.

### 1.3 Báo chấn thương (optional, chỉ hiện nếu user chọn "Có chấn thương/bệnh lý")

```
Chọn vùng cơ/khớp (list: vai, gối, lưng dưới, cổ tay...) → Mô tả ngắn → Lưu
```

- Hệ thống dùng info này để loại bài tập tác động vùng đó khỏi roadmap — nên thông báo ngắn: "Chúng tôi sẽ tránh các bài tác động vùng [X] cho bạn".
- Trong Settings về sau, mỗi chấn thương có nút **"Đã hồi phục"** → khi bấm, hệ thống tự kích hoạt giai đoạn bảo vệ 3 buổi đầu (xem mục 6.6) trước khi mở lại tải bình thường — cần 1 dòng giải thích nhỏ để user không thắc mắc sao bài còn nhẹ.

### 1.4 Preview Roadmap

- Màn hình chờ cho AI tạo roadmap.( nếu lúc đầu nhập hết > 80 % còn nếu k thì mấy cái liên quan đến roadmap thì cứ hiển thị là nhắc nhở hoàn thành hồ sơ, đề xuất mấy bài tập phổ biến lên , nếu có road map rồi thì làm như cũ , mấy bài tập thì để xuống cuối màn hình hoặc xóa luôn )
- Xem trước tóm tắt: số buổi/tuần, 4 pha (Làm quen → Tăng tải → Đỉnh cao → Deload), mục tiêu calo/ngày.
- CTA: "Bắt đầu roadmap của tôi" → vào Home.

### 1.5 Cập nhật hồ sơ sau này (Settings)

- Sửa mục tiêu / dụng cụ / nhóm cơ / khung giờ rảnh → hiện confirm dialog:
  > "Cập nhật sẽ điều chỉnh các buổi tập **chưa diễn ra**. Các buổi đã hoàn thành giữ nguyên." → Đồng ý / Huỷ.
- Sau khi đồng ý: hiện toast ngắn khi quay lại Home "Lịch tập đã được cập nhật theo thông tin mới".

---

## 2. Home / Dashboard

HÔM NAY

[Header ngày hiện tại]
Tuần 2 · search · streak icon nhỏ có số 4 ngày

[Coach priority — conditional]
Coach đã giảm nhẹ buổi hôm nay vì bạn báo mệt.

[Daily timeline]
07:30 Bữa sáng >
12:00 Bữa trưa >
17:30 Buổi tập thân trên >
19:00 Bữa tối >

Tuy nhiên timeline không nên chỉ là lịch chết. Nó phải ưu tiên “next best action”. ( có thể nhấn vào trong mấy cái line đó để xem chi tiết bữa ăn hoặc là buổi tập , trong màn hình buổi tập cũng có thể nhấn để xem chi tiết bài tập )

Ví dụ 18:00 user mở app:
icon base ( cần sắp xếp vị trí, size to nhỏ , màu sắc, shape , icon , phù hợp để thể hiện từng trạng thái rõ ràng . icon hoặc cái gì đó để cho user biết đã đến thời gian này rồi, là có thể click vào để bắt đầu buổi tập hoặc click để đánh giấu là hoàn thành bữa ( có hiệu ứng rõ ràng ). )
✓ Bữa sáng
✓ Bữa trưa
● Buổi tập thân trên
○ Bữa tối

Thứ tự thị giác nên là:

Đang làm
→ Có thể làm ngay
→ Sắp tới
→ Đã hoàn thành

[Thông tin ngày]
Hôm nay khẩu phần tăng nhẹ vì có buổi tập.

[Quick actions]

- Tập thêm
- Cập nhật cân nặng

khám phá nhẹ ( trình bày exercise hoặc cta điều hướng để search , filter theo group , )

---

## 3. Roadmap & Lịch tập (UC-02)

### 3.1 Khởi tạo Roadmap (ngầm, sau Preview)

1. hiển thị lịch trình road map theo nghiệp vụ , tôi chưa biết trình bày sau.
2. phân tích chi tiết , khoa học, mục tiêu, lời khuyên , .
3. flow xem chi tiết ()

---

## 4. Nutrition ( mock data )

1. theo dõi chi tiết ăn uống. ( lịch sử, phân tích chi tiết ) ...
2. confirm đã hoàn thành bữa hôm nay, hoặc là làm gì đó
3. flow xem chi tiết. ()

---

## 5. Tập luyện (UC-03 Workout Execution)

### 5.1 Vào buổi tập — 3 giai đoạn rõ ràng

```
[Warm-up] (nếu có, nút Skip) → [Bài tập chính] → [Cooldown] (nếu có, nút Skip) → Kết thúc
```

FE cần thiết kế 3 khối riêng biệt trong 1 flow tuyến tính, không gộp chung "tập" như 1 khối duy nhất.

### 5.2 Chọn nhạc & bắt đầu

- cho phép người dùng chọn playlist (hoặc giữ mặc định) → phát ngầm xuyên suốt session, kể cả qua Warm-up/Cooldown. ( bất kỳ lúc nào cũng có thể đổi bài )

### 5.3 Nhánh AI Camera

```
chỉ khác là thay vì bấm giờ thì
Bật camera → Hiệu chỉnh khoảng cách (1.5–2m, có feedback trực quan "lùi lại/tiến lên")
→ Vào set → AI tracking pose theo thời gian thực → Rep tự động đếm khi ROM ≥ 70%
→ [Xem hướng dẫn] toggle: overlay video demo góc màn hình, thu gọn mặc định
→ [Nghe hướng dẫn] toggle: giọng AI, khi phát → nhạc nền tự giảm 70% (audio ducking)
→ Kết thúc set: hiện kết quả auto-fill (rep/tạ/FormScore) → User xác nhận hoặc sửa tay → Lưu
→ Đếm ngược nghỉ giữa set
```

**Cần thiết kế riêng:**

- Màn Calibration (feedback trực quan khoảng cách) — 1 màn hình mới.
- 2 toggle độc lập Xem/Nghe (không gộp thành 1 nút "hướng dẫn").
- Bước **xác nhận/sửa kết quả set** trước khi lưu — không tự động lưu luôn.
- Toast fallback mượt khi tự chuyển sang Phi AI (thiếu sáng / bài nằm sàn): "Ánh sáng chưa đủ, chuyển sang chế độ tự ghi nhận" — không phải lỗi đỏ.
- Cuối buổi nếu tỉ lệ tracking hợp lệ thấp → gắn nhãn nhẹ nhàng trong Post-session Report ("Một số set chưa xác thực được bằng camera"), không dùng ngôn ngữ buộc tội ("gian lận").

### 5.4 Nhánh Phi AI

```
Timer đếm ngược set → Nhạc nền + 2 toggle Xem/Nghe hướng dẫn (giống trên)
→ Hết giờ → Form nhập nhanh: rep, tạ, RPE (RPE optional, mặc định N/A nếu bỏ trống)
→ Lưu set
```

- Bài bodyweight/khởi động/dãn cơ: cho phép tạ=0 mà không cảnh báo; các bài chính khác nếu rep=0 & tạ=0 → cảnh báo nhẹ trước khi lưu.

### 5.5 Kết thúc buổi tập

```
Nhấn kết thúc → (Cooldown nếu chưa làm) → Kiểm tra volume bất thường
→ [Nếu vượt 250% trung bình 5 buổi gần nhất]: dialog xác nhận "Buổi này nặng hơn nhiều so với thường lệ, bạn chắc chắn muốn lưu? Chúng tôi sẽ thêm 1 ngày nghỉ sau đó" → Đồng ý/Huỷ
→ Post-session Report: tổng set, volume, FormScore trung bình, calories ước tính
→ (optional) cập nhật cân nặng hiện tại ngay tại đây
→ Celebration / Streak update
```

- Nếu có **Personal Record mới**: dùng 1 khoảnh khắc celebration **khác biệt** hẳn so với hoàn thành thường (badge/confetti riêng, không dùng chung UI với streak) — đây là dopamine hook mạnh nhất nên cần nổi bật.
- Cảnh báo buổi >90 phút: banner nhẹ "Buổi tập đã khá dài, bạn có muốn kết thúc không?" — vẫn cho tiếp tục.
- Không có `WorkoutSetLog` nào khi bấm kết thúc → hỏi "Bạn có muốn huỷ buổi tập này không?" thay vì lưu rỗng.

### 5.6 Huỷ buổi khi báo đau

```
Nút ⚠️ báo đau/huỷ (luôn hiển thị cố định trong lúc tập) → chọn lý do (đau/hết giờ/không thoải mái)
→ Huỷ session → gợi ý nhẹ "Nghỉ ngơi hôm nay, ngày mai thử lại" + optional bài giãn cơ thay thế
```

### 5.7 Adhoc (tập thêm ngoài plan)

```
"+ Tập thêm" → A) Tự custom (chọn bài từ thư viện + set/rep) hoặc B) Nhờ AI tạo (nhập mục tiêu/thời gian có) ( yêu cầu UI phải đẹp ko thì user rất khó lòng để chọn được bài tập tốt, UI UX là rất quan trọng. )
→ Preview → Xác nhận → chạy qua flow 5.1–5.6 như bình thường

AI chỉ đóng vai trò chọn hộ , còn lại thì user vẫn có thể tự thêm xóa sửa.
```

- Nhấn mạnh: không ảnh hưởng roadmap chính.
- Nếu tập vào ngày nghỉ hoặc buổi thứ 2+ trong ngày → hệ thống sẽ hỏi lý do sau đó (xem UC-04 Signal B3, mục 6.4) — FE không cần chặn lúc này, chỉ ghi nhận bình thường.

---

## 6. Adaptive & Retention Engine (UC-04) — phần giữ chân người dùng quan trọng nhất ( phần này nghe có vẻ khá khó và chưa biết lấy data như thế nào ,.... )

Đây là nhóm tính năng chủ động "chăm sóc" user, cần thiết kế như **tin nhắn từ Coach**, giọng điệu ấm áp, không như thông báo hệ thống khô khan.

### 6.1 Tổng kết tuần (cuối mỗi tuần / cuối chu kỳ 4 tuần)

```
Màn "Tổng kết tuần" — thân thiện, không phải bảng số liệu khô:
- Tỷ lệ hoàn thành (SCR) dạng thanh tiến độ, không phải % trần trụi
- 1 dòng nhận xét ngắn từ Coach: "Tuần này bạn hoàn thành tốt, tuần sau tăng nhẹ độ khó nhé!"
- Nếu SCR ≥ 80% & mệt vừa phải → tăng tải nhẹ tuần sau (giải thích ngắn, không chỉ số kỹ thuật)
- Nếu RPE cao liên tục → tự chuyển tuần Deload, giải thích: "Cơ thể bạn cần nghỉ ngơi nhiều hơn, tuần này sẽ nhẹ hơn"
```

### 6.2 SCR quá thấp (<50%) — cứu vãn thay vì ép buộc

```
Thông báo mềm: "Có vẻ lịch hiện tại hơi nặng với bạn. Chuyển sang giáo án Express 30 phút?"
→ Đồng ý: áp dụng ngay
→ Từ chối: giữ nguyên số buổi cũ nhưng vẫn tự chuyển sang bản Express để hỗ trợ (không hỏi lại nhiều lần)
→ Không phản hồi 48h: tự áp dụng Express, không chặn
```

### 6.3 Signal B1 — Bỏ tập 3 buổi liên tiếp / mất tích 7 ngày (⭐ Win-back flow, quan trọng nhất cho retention) ( chưa biết flow ux đi sao cho user ko thấy phiền )

```
Tin nhắn check-in kiểu Coach (không phải "Bạn đã bỏ lỡ X buổi tập" — nghe như bị trách):
"Dạo này bận hả? Không sao, mình bắt đầu lại nhẹ nhàng nhé 💪"
→ 2 lựa chọn:
   (a) "Tiếp tục từ buổi gần nhất" — giữ nguyên tiến độ
   (b) "Làm mới lịch tuần này" — reset nhẹ, giảm áp lực bắt kịp
→ Không phản hồi 24h: không tự đổi gì, gửi nhắc nhẹ lại sau 24h (không spam)
```

- Đây nên là 1 push notification/in-app card xuất hiện ngay khi user **quay lại mở app** sau thời gian vắng — đúng khoảnh khắc dễ giữ chân nhất.

### 6.4 Signal B2 — Kẹt lịch cố định (bỏ cùng 1 ngày ≥3 lần)( chưa biết flow ux đi sao cho user ko thấy phiền )

```
Đề xuất: "Có vẻ [Thứ X] không hợp với bạn, đổi sang [Thứ Y] nhé?"
→ Đồng ý: cập nhật lịch
→ Từ chối: im lặng, không hỏi lại vấn đề này nữa (tránh gây phiền)
```

### 6.5 Signal B3 — Tập ngoài lịch (ngày nghỉ hoặc buổi thứ 2+/ngày)( chưa biết flow ux đi sao cho user ko thấy phiền )

```
Check-in hỏi lý do: [Quá nhẹ] [Thừa thời gian] [Quá sức]
→ Quá nhẹ: tăng tạ gợi ý cho buổi sau
→ Thừa thời gian: ghi nhận, giữ nguyên (hoặc gợi ý thêm buổi/tuần nếu user muốn)
→ Quá sức: cảnh báo nhẹ + tự chèn 1 ngày nghỉ phục hồi
```

### 6.6 Signal B4 — Plateau (không tăng sức mạnh 2 tuần liên tiếp)( chưa biết flow ux đi sao cho user ko thấy phiền )

```
Push/in-app alert: "Có vẻ bạn đang chững lại, thử đổi cách tập nhé?"
→ 3 lựa chọn: (a) đổi biến thể bài tập  (b) đổi dải rep/set  (c) đổi thứ tự bài tập
→ Không tương tác: tự động đổi biến thể bài tập tương đương (an toàn nhất)
```

### 6.7 Hậu phục hồi chấn thương

```
Sau khi user bấm "Đã hồi phục" (mục 1.3) → 3 buổi đầu vào giai đoạn bảo vệ:
- Banner nhẹ trong buổi tập: "Coach đang bảo vệ [vùng cơ] của bạn, tải nhẹ hơn bình thường"
- Ưu tiên bài bodyweight/máy, tải tối đa 50% PR trước chấn thương
- Sau 3 buổi đạt chuẩn an toàn → thông báo "Đã sẵn sàng quay lại tập bình thường 🎉"
```

---

## 7. Tìm kiếm & Lọc bài tập

```
Tab "Khám phá" → Search bar + Filter chips (nhóm cơ, thiết bị, độ khó, thời lượng, có/không AI-tracking)
→ Kết quả dạng grid card → Chi tiết bài tập ( desgin kỹ chút , hình, video hướng dẫn, tag , nhóm cơ , liên quan .... phù hợp với mục tiêu gì ) → "Thêm vào buổi adhoc" hoặc "Tập ngay"
```

- Trải nghiệm giống e-commerce: filter đa chọn, sort (phổ biến / mới / thời lượng ngắn nhất).
- Empty state khi filter rỗng → gợi ý nới lỏng điều kiện.

---

## theo dõi tiến trình, tiến độ , tiến bộ

- hỗ trợ xem mình đã tiến bộ những gì, có thể cho cái mô hình nhóm cơ 2d vip vào hoặc trình bày kiểu gì cho user biets , hoặc lần đầu mấy cái giờ đã mấy cái ,.... nhiều thứ khác
- tiền trình đến đâu rồi,
- phân tích mà người bình thường k dùng app sẽ k cảm nhận được sự thuận tiện này.
- theo dõi thói quen dùng cái heat map như [] [] [] [] [] [icon tập luyện] [] [] [] [] [] [] [icon tập luyện | icon ăn uống] [] như kiểu cái contribute trên github , sẽ đổi màu bg càng đậm càng xịn thì mình custom lại đổi màu lại , còn cái layout vẫn thế

## 8. Retention hooks — tổng hợp

1. **Win-back (Signal B1)** — quan trọng nhất, giọng điệu Coach ấm áp, không trách móc.
2. **Streak + đóng băng 1 ngày/tuần** — tránh mất chuỗi vì lỡ 1 hôm.
3. **Quick win đầu tiên** — buổi tập/bữa ăn đầu tiên dễ hoàn thành 100%.
4. **Giải thích "tại sao"** mọi lúc hệ thống tự điều chỉnh — giảm cảm giác bị áp đặt.
5. **PR celebration riêng biệt** — dopamine hook mạnh, không lẫn với hoàn thành thường.
6. **Zero-friction nutrition logging** — tick 1 chạm, không bắt "làm kế toán calo".
7. **Không phạt khi skip/huỷ** — luôn có lối thoát nhẹ nhàng.

---

## 9. Sơ đồ luồng tổng quan (rút gọn)

```
[Đăng ký/Login] → [Hồ sơ sức khoẻ (+chấn thương optional)] → [Preview Roadmap] → [Home]
                                                                                     │
        ┌────────────────────────────────────────────────────────────────────────────┼───────────────────────────┐
        ▼                                                                              ▼                           ▼
  [Tick/Chụp ảnh bữa ăn]                                                    [Check-in → Warm-up → Bài chính        [Tập adhoc]
                                                                              → Cooldown → Kết thúc]                    │
        │                                                                              │                           │
        ▼                                                                              ▼                           ▼
  [Progress cập nhật]                                                        [Post-session Report + PR/Streak] ◄────┘
                                                                                         │
                                                                                         ▼
                                                                          [Cuối tuần: Adaptive Review Cycle
                                                                           (SCR, Signal B1–B4, tăng/giảm tải)]
```

---

## 10. Ưu tiên xây dựng (MVP → mở rộng)

| Giai đoạn       | Tính năng                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP**         | Auth, Hồ sơ sức khoẻ, Preview Roadmap, Home, Nutrition tick/chụp ảnh, Tập theo plan (Phi AI + timer, nhập tay set), Warm-up/Cooldown skip, Post-session Report cơ bản     |
| **Giai đoạn 2** | AI Camera (calibration, pose tracking, on-demand guide, audio ducking), Adhoc tự custom, Check-in trước buổi tập, Streak, PR celebration                                  |
| **Giai đoạn 3** | Adaptive Review Cycle đầy đủ (Signal B1–B4, weekly review, deload tự động), Hậu phục hồi chấn thương, AI tạo bài tập adhoc, Filter e-commerce nâng cao, TrainingLoadGuard |
