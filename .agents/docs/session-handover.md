# Báo Cáo Bàn Giao Giữa Các Phiên Làm Việc (Session Handover)

> **Mục đích:** Tài liệu này dùng để đồng bộ trạng thái, tiến độ và các bước tiếp theo khi chuyển đổi giữa các phiên chat của AI Agent hoặc giữa các lập trình viên.

---

## 1. Trạng thái hiện tại của dự án (Project Status)
- **Tình trạng:** Đã hoàn thiện Feature Flashcard 3D, Quản lý thẻ (Tạo, Sửa, Xóa thẻ), Tích hợp tra cứu từ điển trực tuyến Mazii + Jisho fallback (xóa bỏ hoàn toàn mảng hardcode).
- **Node.js Environment:** Đã thêm `D:\code\environment\notejs` (Node v24.12.0, npm 11.6.2) vào `User PATH`.
- **Target Platform:** Cloudflare Workers (với Static Assets), quản lý bởi `wrangler.jsonc`.
- **Kiểm thử chất lượng & BDD:** 
  - `npm run check`: **0 errors, 0 warnings**.
  - `npm test`: **7/7 kịch bản BDD & E2E passed 100%** (326ms - 3.7s).
  - Tất cả các script benchmark / test AI được quy hoạch gọn gàng trong `.agents/ai_tests/`.

---

## 2. Các tệp tin cấu hình then chốt đã thiết lập
1. **[AGENTS.md](file:///d:/code/file%20code/javascrip/SvelteKit/FLCard-JP/AGENTS.md):** Hiến pháp tối cao của dự án.
2. **[.agents/rules/](file:///d:/code/file%20code/javascrip/SvelteKit/FLCard-JP/.agents/rules/):**
   - `feature-driven-architecture.md`: Quy chuẩn BDD và phân tách domain độc lập.
   - `cloudflare-edge.md`: Ràng buộc V8 Isolates, cấm Node APIs, chuẩn bindings `platform.env`.
   - `jlpt-conventions.md`: Quy chuẩn thẻ Furigana `<ruby>`, phát âm Web Speech API, thang điểm SRS 1-4.
3. **[.agents/skills/](file:///d:/code/file%20code/javascrip/SvelteKit/FLCard-JP/.agents/skills/):**
   - `jlpt-data-validator`: Script Python validate cấu trúc dữ liệu JSON từ vựng.
   - `srs-calculator`: Script Python tính toán chu kỳ lặp lại ngắt quãng SM-2.
4. **[.agents/hooks.json](file:///d:/code/file%20code/javascrip/SvelteKit/FLCard-JP/.agents/hooks.json):** `secret-shield` chặn Agent đọc/sửa file `.dev.vars`, `.env*`.
5. **[.agents/docs/](file:///d:/code/file%20code/javascrip/SvelteKit/FLCard-JP/.agents/docs/):**
   - `project-architecture.md`: Sơ đồ kiến trúc Feature-Driven chi tiết.
   - `session-handover.md`: Bản ghi chép bàn giao này.
   - `roadmap.md`: Lộ trình triển khai các feature.

---

## 3. Việc cần làm ngay trong phiên làm việc tiếp theo (Next Actions)

Khi mở cửa sổ chat mới, Agent cần tập trung thực hiện theo thứ tự sau:

1. **Bước 1: Khởi tạo Mock Data Service:**
   - Tạo `src/lib/server/services/card-service.ts` cung cấp dữ liệu thẻ mẫu N5 (10-15 từ vựng phổ biến).
2. **Bước 2: Xây dựng Feature `flashcard`:**
   - Tạo `src/lib/features/flashcard/components/Flashcard.svelte` (3D flip, thẻ Furigana `<ruby>`, nút phát âm).
   - Tạo `src/lib/features/flashcard/types.ts`.
3. **Bước 3: Xây dựng Feature `study-session` (Trọng tâm BDD):**
   - Quản lý trạng thái phiên học bằng Svelte 5 Runes (`session.svelte.ts`).
   - Tích hợp thuật toán tính điểm SM-2 và hiển thị thanh tiến độ ôn tập.
