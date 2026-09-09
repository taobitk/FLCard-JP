# Lộ Trình Phát Triển FLCard-JP (Project Roadmap)

---

## Giai đoạn 1: Khởi tạo Nền tảng & Kiến trúc (Hoàn thành 100% ✅)
- [x] Thiết lập môi trường Node.js v24 + SvelteKit 2 + Svelte 5 Runes.
- [x] Cấu hình `@sveltejs/adapter-cloudflare` với target Cloudflare Workers (Static Assets).
- [x] Xây dựng bộ quy chuẩn Antigravity Rules & Skills.
- [x] Tạo trang Demo Flashcard 3D Flip trực quan với âm thanh Web Speech API.
- [x] Thiết lập hệ thống tài liệu kiến trúc & bàn giao tại `.agents/docs/`.

---

## Giai đoạn 2: Xây dựng Feature Core với Mock Data (Kế hoạch phiên tiếp theo 🚀)
- [ ] **Feature `flashcard`:**
  - Component hiển thị thẻ 2 mặt hoàn chỉnh (Furigana `<ruby>`, Romaji, Nghĩa, Loại từ, Ví dụ câu).
  - Tích hợp âm thanh giọng Nhật chuẩn qua Web Speech API `ja-JP`.
- [ ] **Feature `study-session` (BDD):**
  - Session Store quản lý bằng Svelte 5 Runes (`session.svelte.ts`).
  - Tích hợp thuật toán lặp lại ngắt quãng SM-2 (các mức đánh giá: Again, Hard, Good, Easy).
  - Phím tắt bàn phím: `Space` (lật thẻ), `1`-`4` (chấm điểm).
  - Màn hình tổng kết phiên học (Session Summary: Số thẻ đã ôn, tỷ lệ nhớ).

---

## Giai đoạn 3: Tích hợp Dữ liệu Cloudflare Edge (D1 & KV)
- [ ] Khởi tạo Cloudflare D1 Database schema cho `decks`, `cards`, `review_logs`.
- [ ] Chuyển đổi tầng `src/lib/server/services/` từ Mock Data sang D1 queries thật.
- [ ] Kiểm thử chạy D1 cục bộ với `wrangler dev`.

---

## Giai đoạn 4: Deck Manager & Mở rộng
- [ ] **Feature `deck-manager`:** Tạo bộ thẻ mới, Import thẻ từ file JSON/CSV bằng script Python hoặc UI.
- [ ] **Feature `progress-analytics`:** Biểu đồ Streak học tập, tỷ lệ ghi nhớ từ vựng JLPT N5-N1.
