---
name: srs-calculator
description: >-
  Tính toán và mô phỏng thuật toán lặp lại ngắt quãng SM-2 (Spaced Repetition System) cho thẻ học.
  Kích hoạt khi lập trình, kiểm thử hoặc tối ưu hóa logic chấm điểm trong feature study-session.
---

# SRS Calculator Skill

Skill này cung cấp thuật toán và công cụ hỗ trợ phát triển tính năng tính ngày ôn tập cho Flashcard theo thuật toán SuperMemo 2 (SM-2).

## Quy ước điểm đánh giá (Grade)

- `1`: **Again** (Quên) - Reset chu kỳ về ngày mai, giảm Ease Factor.
- `2`: **Hard** (Khó) - Tăng chu kỳ ngắn, giảm nhẹ Ease Factor.
- `3`: **Good** (Nhớ tốt) - Tăng chu kỳ tiêu chuẩn theo Ease Factor.
- `4`: **Easy** (Dễ) - Tăng chu kỳ nhanh, tăng Ease Factor.

## Chạy thử nghiệm thuật toán

```bash
python .agents/skills/srs-calculator/scripts/calculate_srs.py <grade: 1-4> [repetition] [interval] [ease_factor]
```

Ví dụ:
```bash
python .agents/skills/srs-calculator/scripts/calculate_srs.py 3 1 6 2.5
```
