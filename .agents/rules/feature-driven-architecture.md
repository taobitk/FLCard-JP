# Quy Chuẩn Kiến Trúc Feature-Driven & BDD

Dự án **FLCard-JP** áp dụng kiến trúc **Feature-Driven (Hướng tính năng / BDD)**. Mọi lập trình viên và AI Agent phải tuân thủ nghiêm ngặt các nguyên tắc sau:

---

## 1. Cấu trúc thư mục cốt lõi (`src/lib/`)

```text
src/lib/
├── features/                  # Miền tính năng độc lập (Domain / User Behaviors)
│   ├── flashcard/             # Thẻ từ vựng, Kanji, Furigana <ruby>, phát âm
│   ├── study-session/         # Phiên học ôn tập SRS, lật thẻ, chấm điểm, phím tắt
│   ├── deck-manager/          # Quản lý, tạo mới, import/export bộ thẻ JLPT
│   └── progress-analytics/    # Thống kê ghi nhớ, heatmap, streak học tập
│
├── server/                    # 🛡️ BẢO VỆ CLOUDFLARE EDGE (Server-only code)
│   ├── db/                    # Schema Cloudflare D1, migrations, queries
│   └── services/              # Các service server kết nối D1/KV với features
│
└── shared/                    # Thành phần dùng chung toàn hệ thống
    ├── components/            # UI cơ sở (Button, Modal, Drawer, ThemeToggle, Toast)
    ├── types/                 # Kiểu dữ liệu chung (JLPTLevel, Result, CommonProps)
    └── utils/                 # Hàm tiện ích dùng được cả 2 phía client & server
```

---

## 2. Quy tắc trong từng Feature (`src/lib/features/<feature-name>/`)

Mỗi feature đại diện cho một miền nghiệp vụ / hành vi người dùng (BDD) và phải tự chứa:

1. **`components/`**: Các Svelte component chỉ phục vụ riêng cho tính năng này.
2. **`types.ts`**: Định nghĩa dữ liệu, state, sự kiện riêng của feature.
3. **`utils.ts` / `helpers.ts`**: Các hàm tính toán logic thuần túy (pure functions) của feature.
4. **State Management**: Sử dụng Svelte 5 Runes (`.svelte.ts`) hoặc store cục bộ cho feature, không tạo biến toàn cục bừa bãi.

### Quy tắc phụ thuộc (Dependency Rules):
- **Feature KHÔNG ĐƯỢC import chéo feature khác:** `study-session` không được import trực tiếp file nội bộ của `deck-manager`. Nếu cần dùng chung, phải đưa dữ liệu/component đó ra `shared/`.
- **Feature được phép import `shared/`:** Các UI cơ sở như Button, Modal, Type chung.
- **Client code trong Feature KHÔNG ĐƯỢC import trực tiếp `$lib/server/`:** Giao tiếp với server bắt buộc thông qua Form Actions (`+page.server.ts`), Page Load Data, hoặc API routes (`+server.ts`).

---

## 3. Tư duy kiểm thử BDD (Behavior-Driven Development)
- Tên component và hàm phải mô tả chính xác hành vi:
  - Tốt: `FlipController.svelte`, `submitRating(grade)`, `calculateNextInterval(card)`
  - Tránh: `CardHelper.ts`, `DataProcessor.svelte`
- Mỗi feature có kịch bản test E2E tương ứng 1-1 trong `tests/e2e/<feature-name>.spec.ts`.
