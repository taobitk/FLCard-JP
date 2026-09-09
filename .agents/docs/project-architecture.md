# Kiến Trúc Dự Án FLCard-JP (Project Architecture)

---

## 1. Triết Lý Kiến Trúc: Feature-Driven + BDD

Hệ thống được tổ chức theo từng **Miền tính năng độc lập (Domain / Feature Module)**, gắn liền với các hành vi người dùng (Behavior-Driven Development):

```text
src/
├── app.d.ts                     # Khai báo App.Platform (Cloudflare Env: DB, KV, R2)
├── app.html                     # HTML Template tích hợp Font tiếng Nhật Noto Sans JP
│
├── lib/
│   ├── features/                # 🌟 TẦNG TÍNH NĂNG (CLIENT + DOMAIN LOGIC)
│   │   ├── flashcard/           # Quản lý hiển thị Thẻ, Furigana <ruby>, Romaji, Audio
│   │   │   ├── components/      # Flashcard.svelte, RubyText.svelte, AudioButton.svelte
│   │   │   ├── types.ts         # FlashCard, ExampleSentence
│   │   │   └── utils.ts
│   │   │
│   │   ├── study-session/       # Quản lý Phiên ôn tập SRS (Trọng tâm BDD)
│   │   │   ├── components/      # FlipCardScene.svelte, SRSActionBar.svelte, SessionSummary.svelte
│   │   │   ├── srs-engine.ts    # Thuật toán SM-2 (SuperMemo 2)
│   │   │   ├── session.svelte.ts# State phiên học quản lý bằng Svelte 5 Runes
│   │   │   └── types.ts         # ReviewRating, SRSState, SessionStats
│   │   │
│   │   ├── deck-manager/        # Quản lý danh sách và Import/Export bộ thẻ
│   │   │   ├── components/      # DeckCard.svelte, DeckList.svelte, ImportModal.svelte
│   │   │   └── parsers.ts       # Chuyển đổi CSV / JSON sang thẻ chuẩn
│   │   │
│   │   └── progress-analytics/  # Thống kê tiến độ ghi nhớ, Streak, Dự báo JLPT
│   │       ├── components/      # RetentionChart.svelte, StreakCalendar.svelte
│   │       └── metrics.ts
│   │
│   ├── server/                  # 🛡️ TẦNG EDGE SERVER (ISOLATED RUNTIME)
│   │   ├── db/                  # Cloudflare D1 client, schema.sql, migrations
│   │   └── services/            # Tầng Service/Repository (Mock ban đầu -> D1 sau)
│   │       ├── card-service.ts  # Lấy thẻ cần ôn (Due cards), cập nhật tiến độ
│   │       └── deck-service.ts  # CRUD bộ thẻ
│   │
│   └── shared/                  # TẦNG DÙNG CHUNG TOÀN HỆ THỐNG
│       ├── components/          # Button, Modal, ThemeToggle, Toast, ProgressBar
│       ├── types/               # JLPTLevel, Result, CommonProps
│       └── utils/               # DateTime format, text sanitizers
│
└── routes/                      # TẦNG ĐỊNH TUYẾN SVELTEKIT (ROUTING)
    ├── (app)/
    │   ├── +page.svelte         # Trang chủ giới thiệu & Demo
    │   ├── decks/               # Trang danh sách bộ thẻ
    │   ├── study/[deckId]/      # Trang phiên ôn tập (study-session)
    │   └── stats/               # Trang thống kê (progress-analytics)
    └── api/                     # Các API routes (nếu cần cho mobile client)
```

---

## 2. Luồng Dữ Liệu & Ranh Giới Bảo Vệ Cloudflare Edge

```
[ Trình duyệt / Client ]
         │
         ▼  (Gọi Form Action / Page Data Load qua fetch)
[ SvelteKit Routes (+page.server.ts) ]
         │
         ▼  (Gọi tầng Service trong $lib/server/)
[ src/lib/server/services/ ]
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
(Giai đoạn 1: Mock / In-Memory)  (Giai đoạn 2: Cloudflare D1 / KV / R2)
Local Mock Data                  platform.env.DB (SQLite Edge)
                                 platform.env.KV (Cache)
                                 platform.env.R2 (Audio files)
```

### Nguyên tắc bất di bất dịch:
- **Tuyệt đối không import chéo giữa các Feature:** `study-session` không được phụ thuộc trực tiếp vào `deck-manager`.
- **Client tuyệt đối không import `$lib/server/`:** Bảo vệ vững chắc môi trường V8 Isolates của Cloudflare Workers.
