---
name: jlpt-data-validator
description: >-
  Kiểm tra tính hợp lệ và cấu trúc dữ liệu thẻ từ vựng JLPT (Kanji, Furigana ruby, nghĩa tiếng Việt, cấp độ N5-N1).
  Kích hoạt khi người dùng yêu cầu thêm, nhập hoặc kiểm tra dữ liệu bộ flashcard mới.
---

# JLPT Data Validator Skill

Skill này cung cấp quy trình và công cụ kiểm thử dữ liệu thẻ tiếng Nhật trước khi nhập vào cơ sở dữ liệu Cloudflare D1.

## Các bước kiểm tra

1. **Chuẩn bị file JSON:**
   - File JSON phải theo đúng định dạng mẫu: [sample-vocab.json](./examples/sample-vocab.json).
   - Đảm bảo thẻ `<ruby>` chỉ bao bọc chữ Kanji, không bọc phần Okurigana.

2. **Chạy script kiểm tra:**
   ```bash
   python .agents/skills/jlpt-data-validator/scripts/validate.py <đường_dẫn_file_json>
   ```

3. **Xử lý lỗi:**
   - Nếu phát hiện lỗi thiếu trường hoặc sai thẻ `<ruby>`, điều chỉnh lại trước khi tiến hành nạp vào ứng dụng.
