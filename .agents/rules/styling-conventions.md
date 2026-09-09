# Styling & UI Architecture Conventions

Quy chuẩn phân định rõ ràng trách nhiệm giữa **Tailwind CSS v4** và **Svelte Scoped CSS**, nhằm giữ mã nguồn sạch (clean), đẹp, dễ bảo trì và không lạm quyền công cụ.

---

## 1. Phân định trách nhiệm (Separation of Concerns)

| Công nghệ | Phạm vi phụ trách (Scope) | Khi nào ĐƯỢC dùng? |
| :--- | :--- | :--- |
| **Tailwind CSS v4** | Layout, Spacing, Color Tokens, Typography, Responsive | - Flexbox, CSS Grid, margin, padding.<br>- Bảng màu chuẩn: `bg-zinc-950`, `text-zinc-100`, màu JLPT `text-jlpt-n5`...<br>- Responsive breakpoints (`sm:`, `md:`, `lg:`).<br>- Trạng thái cơ bản: `hover:`, `focus:`, `active:`, `transition-all`. |
| **Svelte Scoped `<style>`** | Micro-interactions, 3D Transforms, Phức hợp hoạt ảnh | - Hiệu ứng lật thẻ 3D (`perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`).<br>- Custom keyframe animations đặc thù riêng của thẻ hoặc biểu đồ.<br>- Các hiệu ứng CSS phức tạp mà nếu viết bằng Tailwind sẽ sinh ra chuỗi class khó đọc. |
| **Inline `style`** | Giá trị tính toán động (Dynamic Values) | - **CHỈ DÙNG** khi giá trị thay đổi liên tục theo biến trạng thái runtime, ví dụ: `style="width: {progressPercent}%"`, `style="transform: rotate({angle}deg)"`. |

---

## 2. Quy tắc chống lạm quyền (Anti-abuse Rules)

1. **Tuyệt đối KHÔNG nhồi nhét 3D transforms vào Tailwind utility classes:**
   - ❌ *Sai:* `class="[perspective:1000px] [&>div]:[transform-style:preserve-3d] [&>div]:[backface-visibility:hidden]"`
   - ✅ *Đúng:* Dùng thẻ `<style>` đặt ở cuối component với class có nghĩa như `.card-scene`, `.card-face`.

2. **Tuyệt đối KHÔNG viết CSS component vào file toàn cục `app.css`:**
   - `app.css` chỉ chứa `@import "tailwindcss";`, khai báo `@theme` (font, màu JLPT, màu SRS) và base style cho `body`.
   - Mọi style đặc thù của component phải nằm trong component đó.

3. **Nguyên tắc chia nhỏ Component (Atomic / Feature-Driven):**
   - Không dồn hàng chục thẻ HTML với hàng dài class Tailwind vào một file duy nhất.
   - Khi một khối UI có logic hiển thị riêng (như Furigana `<ruby>`, nút Audio, thanh tiến độ), phải tách thành subcomponent riêng biệt trong `src/lib/features/<feature>/components/`.

4. **Nhất quán Font chữ & Bảng màu:**
   - Font chữ Kanji / Furigana luôn ưu tiên `font-jp` (`Noto Sans JP`).
   - Cấp độ JLPT dùng đúng token: `text-jlpt-n5`, `text-jlpt-n4`, `text-jlpt-n3`, `text-jlpt-n2`, `text-jlpt-n1`.
