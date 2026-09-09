# Ràng Buộc Kỹ Thuật Cloudflare Workers (Edge Runtime)

Dự án **FLCard-JP** chạy trên nền tảng **Cloudflare Workers (Workers with Static Assets - V8 Isolates)**. AI Agent và lập trình viên phải tuân thủ nghiêm ngặt các quy tắc sau:

---

## 1. Môi trường Edge Runtime (V8 Isolates)
- **Cấm hoàn toàn:** Không dùng `node:fs`, `node:child_process`, `node:net`, `node:dns` hoặc thư viện phụ thuộc C++ addons.
- **Lưu trữ dữ liệu & State:**
  - Dữ liệu quan hệ (Thẻ, Deck, Tiến độ SRS) $\rightarrow$ **Cloudflare D1** (SQLite ở Edge).
  - Cache / Session / Rate limit $\rightarrow$ **Cloudflare KV**.
  - File âm thanh, hình ảnh upload $\rightarrow$ **Cloudflare R2** (Object Storage).
  - Tệp tĩnh của giao diện $\rightarrow$ Phục vụ tự động qua **Workers Static Assets** (`assets.directory`).

---

## 2. Quy chuẩn Bindings & Type Safety
- Không dùng `process.env`. Mọi dịch vụ được tiêm qua `platform.env` trong SvelteKit server load / form actions:
  ```typescript
  // Trong +page.server.ts hoặc +server.ts
  export const load = async ({ platform }) => {
    const d1 = platform?.env?.DB;       // D1 Database
    const kv = platform?.env?.KV;       // KV Namespace
    const r2 = platform?.env?.R2;       // R2 Bucket
  };
  ```
- **Type Safety:** Định nghĩa các bindings trong `App.Platform` (`src/app.d.ts`), đồng bộ với `wrangler.jsonc` và chạy `npm run gen` (`wrangler types`) sau mỗi lần sửa bindings.

---

## 3. Quy trình Deploy & Preview
- **Phát triển cục bộ:** `npm run dev` (Vite dev server) hoặc `npm run preview` (`wrangler dev`).
- **Deploy:** `npm run deploy` (tự động build SvelteKit và chạy `wrangler deploy` đẩy code lên Cloudflare Workers).
- File cấu hình trung tâm: `wrangler.jsonc` sử dụng `main` trỏ tới worker bundle và `assets` trỏ tới thư mục static output.
