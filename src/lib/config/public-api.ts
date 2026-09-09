/**
 * Cấu hình các API và tài nguyên công khai (Public APIs & Endpoints)
 * Có thể truy cập an toàn ở cả Client (Trình duyệt) và Server.
 */

export const PUBLIC_CONFIG = {
	appName: 'FLCard-JP',
	appSubtitle: 'Học Tiếng Nhật JLPT Thông Minh với Spaced Repetition (SRS)',
	version: '1.0.0',

	// Cấu hình ngôn ngữ & phát âm
	locale: {
		defaultLang: 'vi-VN',
		ttsTargetLang: 'ja-JP',
		ttsPitch: 1.0,
		ttsRate: 0.78 // Tốc độ đọc chậm, rõ ràng cho người học nghe tách bạch từng âm
	},

	// Các API & Endpoint công khai dành cho từ điển & Kanji
	apis: {
		// API tìm kiếm từ vựng Jisho (CORS / REST)
		jishoSearch: 'https://jisho.org/api/v1/search/words',

		// Kanji Stroke Order SVG (Thứ tự nét viết chữ Hán từ kho mã nguồn mở KanjiVG)
		kanjiVgSvgBase: 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji',

		// Kho ví dụ câu tiếng Nhật công khai Tatoeba
		tatoebaSearch: 'https://tatoeba.org/vi/sentences/search'
	},

	// Cấu hình thuật toán Spaced Repetition (SM-2) mặc định
	srsDefaults: {
		initialIntervalDays: 1,
		initialEaseFactor: 2.5,
		minimumEaseFactor: 1.3
	}
} as const;

export type PublicConfig = typeof PUBLIC_CONFIG;
