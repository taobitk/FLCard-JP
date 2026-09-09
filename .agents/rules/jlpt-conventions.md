# Quy Chuẩn Dữ Liệu & Xử Lý Tiếng Nhật (JLPT Conventions)

---

## 1. Cấu trúc Thẻ HTML Furigana (`<ruby>`)
- Thẻ `<ruby>` dùng để hiển thị cách đọc Hiragana trên đầu chữ Kanji.
- **Quy tắc vàng:** Chỉ bọc chữ Hán (Kanji), **tuyệt đối không bọc phần Okurigana** (chữ Hiragana kèm theo của từ).
  - ✅ **Đúng:** `<ruby>食<rt>た</rt></ruby>べる`
  - ❌ **Sai:** `<ruby>食べる<rt>たべる</rt></ruby>`
  - ✅ **Đúng:** `<ruby>大<rt>おお</rt></ruby>きい`
  - ❌ **Sai:** `<ruby>大きい<rt>おおきい</rt></ruby>`

---

## 2. Chuẩn phân loại cấp độ JLPT
- Toàn hệ thống sử dụng kiểu chuỗi thống nhất: `'N5' | 'N4' | 'N3' | 'N2' | 'N1'`.
- Mỗi từ vựng cần có các trường tối thiểu:
  - `term`: Chữ viết gốc (Kanji/Kana)
  - `reading`: Cách đọc Hiragana
  - `romaji`: Phiên âm Latin
  - `meaning`: Nghĩa tiếng Việt
  - `level`: Cấp độ JLPT

---

## 3. Phát âm & Âm thanh (Audio TTS)
- Ưu tiên sử dụng Web Speech API với ngôn ngữ `ja-JP`:
  ```javascript
  const utterance = new SpeechSynthesisUtterance(term);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9; // Tốc độ vừa phải cho người học
  window.speechSynthesis.speak(utterance);
  ```
- Nếu có file audio cục bộ, lưu trữ trong thư mục `static/audio/` và tham chiếu theo đường dẫn tương đối `/audio/...`.

---

## 4. Hệ thống đánh giá SRS (Spaced Repetition System)
- Hỗ trợ 4 mức phản hồi với phím tắt tương ứng:
  - `1` / `Again` (Quên hoàn toàn): Reset chu kỳ về ban đầu.
  - `2` / `Hard` (Khó / Nhớ chật vật): Tăng chu kỳ ngắn.
  - `3` / `Good` (Tốt / Nhớ vừa phải): Tăng chu kỳ chuẩn theo hệ số Ease Factor.
  - `4` / `Easy` (Dễ / Nhớ ngay tức khắc): Tăng chu kỳ dài và tăng Ease Factor.
- Phím `Space` hoặc `Enter` luôn dùng để lật mặt thẻ (Flip).
