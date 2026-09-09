## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: sveltekit-adapter

---

# FLCard-JP - Agent Guidelines & Project Constitution

Chào bạn! Đây là tài liệu quy chuẩn tối cao cho AI Agent (Antigravity) khi hoạt động trong dự án **FLCard-JP**.

---

## 1. Thông tin dự án (Project Overview)
- **Tên dự án:** FLCard-JP (Ứng dụng Flashcard Học Tiếng Nhật JLPT).
- **Hạ tầng triển khai:** **Cloudflare Workers (Workers with Static Assets - V8 Isolates)**.
- **Framework chính:** SvelteKit (kết hợp `@sveltejs/adapter-cloudflare`).
- **Triết lý kiến trúc:** **Feature-Driven Architecture & BDD (Behavior-Driven Development)**.

---

## 2. Bản đồ quy tắc (Active Rules)
Mọi thay đổi trong dự án phải tuân thủ các quy tắc trong `.agents/rules/`:

1. [feature-driven-architecture.md](.agents/rules/feature-driven-architecture.md):
   - Phân tách theo miền tính năng độc lập tại `src/lib/features/<feature>/`.
   - Phân lập hoàn toàn tầng dữ liệu Cloudflare Edge tại `src/lib/server/`.
   - Các UI cơ sở đặt tại `src/lib/shared/`.
   - Tuyệt đối không import chéo giữa các feature.

2. [cloudflare-edge.md](.agents/rules/cloudflare-edge.md):
   - Không dùng module Node.js nguyên bản (`fs`, `child_process`).
   - Dữ liệu lưu trữ thông qua Cloudflare D1 (SQLite), Cloudflare KV, hoặc Cloudflare R2.
   - Mọi binding truy cập qua `platform.env` với Type-Safety đầy đủ từ `App.Platform`.

3. [jlpt-conventions.md](.agents/rules/jlpt-conventions.md):
   - Quy chuẩn thẻ `<ruby>` (chỉ bọc Kanji, không bọc Okurigana).
   - Chuẩn cấp độ `N5` - `N1`, phát âm Web Speech API `ja-JP`, thang điểm SRS `1`-`4`.

4. [styling-conventions.md](.agents/rules/styling-conventions.md):
   - Phân định ranh giới giữa Tailwind CSS v4 và Svelte Scoped CSS.
   - Tailwind lo layout/spacing/colors, Svelte `<style>` lo 3D transform/perspective.
   - Cấm nhồi nhét 3D transforms vào class Tailwind hoặc viết style component vào `app.css`.

---

## 3. Kỹ năng hỗ trợ (Active Skills)
Agent có quyền truy cập và sử dụng các công cụ trong `.agents/skills/`:

- **`jlpt-data-validator`**: Script Python kiểm tra tính hợp lệ của dữ liệu thẻ trước khi nạp vào DB.
- **`srs-calculator`**: Công cụ tính toán và mô phỏng chu kỳ lặp lại ngắt quãng SM-2.
- **`customer-ux-interviewer`**: Kỹ năng tư vấn nghiệp vụ, khai phá yêu cầu và đóng 2 vai (Senior UX Designer & Khách hàng) để tư vấn chuẩn ngành và chốt thiết kế trước khi code.

---

## 4. Tài liệu kiến trúc & Bàn giao (.agents/docs/)
Khi bắt đầu hoặc chuyển giao công việc, Agent luôn tham khảo các tài liệu trong `.agents/docs/`:
- [session-handover.md](.agents/docs/session-handover.md): Trạng thái dự án, các việc đã làm và việc cần làm ngay.
- [project-architecture.md](.agents/docs/project-architecture.md): Sơ đồ luồng dữ liệu Feature-Driven & Cloudflare Edge.
- [roadmap.md](.agents/docs/roadmap.md): Kế hoạch và lộ trình phát triển theo từng giai đoạn.

---

## 5. Nguyên tắc ứng xử của Agent
- **Không tự ý code ứng dụng khi chưa có yêu cầu:** Chỉ tập trung chuẩn bị cấu trúc, quy tắc, kiểm thử và tài liệu theo đúng chỉ dẫn của người dùng.
- **Tư vấn & Phỏng vấn UX trước khi Code (Customer Discovery First):** Trước khi code bất kỳ tính năng UI/UX nào, Agent bắt buộc phải kích hoạt skill `customer-ux-interviewer`: giải thích chuẩn phổ thông của thị trường (Anki, Quizlet...), đặt câu hỏi làm rõ các điểm mù UX (không bắt cuộn trang, tỉ lệ ảnh 1:1, phím tắt, popup vs inline), đưa ra 2-3 phương án và chốt thiết kế cùng người dùng.
- **Tư duy BDD:** Khi bắt đầu một tính năng mới, luôn xuất phát từ hành vi của người dùng và thiết kế kịch bản test trước.
- **Bảo toàn tính ổn định trên Cloudflare:** Luôn rà soát để đảm bảo không có bất kỳ thư viện hay code nào vi phạm môi trường V8 Isolates.
- **Bảo mật tuyệt đối (Security & Secret Shield):**
  - Tuyệt đối KHÔNG đọc (`view_file`), tìm kiếm (`grep_search`), ghi đè hay in ra màn hình nội dung các file chứa secret (`.dev.vars`, `.env*`, tokens, private keys).
  - Hệ thống được bảo vệ tự động bằng `secret-shield` hook trong `.agents/hooks.json`. Mọi nỗ lực truy cập vào các file này sẽ bị từ chối ở cấp độ hệ thống.
