import type { FlashcardItem, JLPTLevel, CardType } from '$lib/features/flashcard/types';
import { toRomaji } from './romaji-to-kana';
import { buildSmartRuby } from './romaji-normalizer';
import { buildFacetedTag } from '$lib/features/taxonomy/normalizer';

const VALID_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const VALID_TYPES: CardType[] = [
	'Danh từ',
	'Động từ nhóm 1',
	'Động từ nhóm 2',
	'Động từ nhóm 3',
	'Tính từ đuôi い',
	'Tính từ đuôi な',
	'Phó từ',
	'Cụm từ'
];

export interface ValidationResult {
	success: boolean;
	cards: FlashcardItem[];
	errors: string[];
}

/**
 * Kiểm tra cú pháp và cấu trúc JSON theo chuẩn nghiêm ngặt GIGO (Garbage In, Garbage Out)
 */
export function validateBatchJson(jsonText: string): ValidationResult {
	const errors: string[] = [];
	const clean = jsonText.trim();

	if (!clean) {
		return { success: false, cards: [], errors: ['Dữ liệu JSON đang để trống. Vui lòng dán nội dung JSON!'] };
	}

	// 1. Phân tích cú pháp JSON cơ bản (Bóc markdown block nếu có)
	let rawJson = clean;
	if (rawJson.startsWith('```')) {
		rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
	}

	let parsed: any;
	try {
		parsed = JSON.parse(rawJson);
	} catch (err: any) {
		return {
			success: false,
			cards: [],
			errors: [`Lỗi cú pháp JSON không hợp lệ: ${err.message || 'Sai dấu ngoặc, dấu phẩy hoặc ký tự đặc biệt'}`]
		};
	}

	// 2. Chấp nhận mảng hoặc object chứa mảng `cards`
	let items: any[] = [];
	if (Array.isArray(parsed)) {
		items = parsed;
	} else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cards)) {
		items = parsed.cards;
	} else {
		return {
			success: false,
			cards: [],
			errors: ['Dữ liệu gốc phải là một Mảng các thẻ [ { ... } ] hoặc đối tượng có trường "cards": [ ... ]']
		};
	}

	if (items.length === 0) {
		return {
			success: false,
			cards: [],
			errors: ['Danh sách không chứa bất kỳ từ vựng nào (Mảng rỗng).']
		};
	}

	// 3. Kiểm tra chi tiết từng phần tử theo nguyên tắc GIGO
	const validatedCards: FlashcardItem[] = [];

	items.forEach((item, index) => {
		const itemNum = index + 1;
		if (!item || typeof item !== 'object') {
			errors.push(`Thẻ #${itemNum}: Không phải là một đối tượng JSON hợp lệ.`);
			return;
		}

		// Hỗ trợ cả 'term', 'japanese', 'kanji', 'word' để tương thích ngược linh hoạt
		const rawTerm = item.term || item.japanese || item.word || item.kanji;
		if (typeof rawTerm !== 'string' || !rawTerm.trim()) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'term' (hoặc 'japanese' / 'kanji').`);
		}

		// Kiểm tra trường bắt buộc: reading
		if (typeof item.reading !== 'string' || !item.reading.trim()) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'reading' (cách đọc Hiragana bắt buộc).`);
		}

		// Kiểm tra trường bắt buộc: meaning
		if (typeof item.meaning !== 'string' || !item.meaning.trim()) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'meaning' (nghĩa tiếng Việt bắt buộc).`);
		}

		// Kiểm tra trường level: nếu để trống thì mặc định là 'N5'
		let level: JLPTLevel = 'N5';
		if (item.level) {
			const lvlUpper = String(item.level).toUpperCase() as JLPTLevel;
			if (!VALID_LEVELS.includes(lvlUpper)) {
				errors.push(`Thẻ #${itemNum}: Cấp độ '${item.level}' không hợp lệ. Chỉ chấp nhận: N5, N4, N3, N2, N1.`);
			} else {
				level = lvlUpper;
			}
		}

		// Kiểm tra trường tùy chọn: type
		let type: CardType | undefined = undefined;
		if (item.type) {
			if (VALID_TYPES.includes(item.type as CardType)) {
				type = item.type as CardType;
			} else {
				errors.push(`Thẻ #${itemNum}: Từ loại '${item.type}' không nằm trong danh mục hỗ trợ (Danh từ, Động từ nhóm 1/2/3, Tính từ đuôi い/な, Phó từ, Cụm từ).`);
			}
		}

		// Nếu không có lỗi cấu trúc cơ bản thì tạo thẻ hoàn chỉnh
		if (rawTerm && item.reading && item.meaning) {
			const term = String(rawTerm).trim();
			const reading = String(item.reading).trim();
			const romaji = (typeof item.romaji === 'string' && item.romaji.trim())
				? item.romaji.trim().toLowerCase()
				: toRomaji(reading);

			const rubyHtml = (typeof item.rubyHtml === 'string' && item.rubyHtml.trim())
				? item.rubyHtml.trim()
				: buildSmartRuby(term, reading);

			let example: FlashcardItem['example'] = undefined;
			if (item.example && typeof item.example === 'object') {
				if (item.example.japanese && item.example.vietnamese) {
					example = {
						japanese: String(item.example.japanese).trim(),
						vietnamese: String(item.example.vietnamese).trim(),
						rubyHtml: item.example.rubyHtml ? String(item.example.rubyHtml).trim() : undefined
					};
				}
			}

			let tags: string[] | undefined = undefined;
			if (Array.isArray(item.tags)) {
				tags = item.tags.map((t: any) => {
					const str = String(t).trim();
					if (str.startsWith('topic:') || str.startsWith('where:') || str.startsWith('tone:')) {
						const [facet, val] = str.split(':');
						return buildFacetedTag(facet as any, val);
					}
					return buildFacetedTag('topic', str);
				});
			}

			validatedCards.push({
				id: item.id ? String(item.id) : `card-${Date.now()}-${itemNum}-${Math.random().toString(36).slice(2, 6)}`,
				term,
				reading,
				romaji,
				rubyHtml,
				meaning: String(item.meaning).trim(),
				level,
				type,
				imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
				example,
				tags,
				createdAt: Date.now() + index
			});
		}
	});

	if (errors.length > 0) {
		return {
			success: false,
			cards: [],
			errors
		};
	}

	return {
		success: true,
		cards: validatedCards,
		errors: []
	};
}

/**
 * Mẫu JSON chuẩn 100% kèm trường tags (Faceted Taxonomy) để hiển thị hoặc copy
 */
export const SAMPLE_JSON_TEMPLATE = JSON.stringify([
	{
		"term": "食べる",
		"reading": "たべる",
		"romaji": "taberu",
		"meaning": "Ăn (thức ăn, cơm)",
		"level": "N5",
		"type": "Động từ nhóm 2",
		"tags": [
			"topic:food_drink",
			"where:restaurant",
			"tone:polite"
		],
		"example": {
			"japanese": "ご飯を食べます。",
			"vietnamese": "Tôi ăn cơm."
		}
	},
	{
		"term": "日本語",
		"reading": "にほんご",
		"romaji": "nihongo",
		"meaning": "Tiếng Nhật",
		"level": "N5",
		"type": "Danh từ",
		"tags": [
			"topic:education",
			"where:school",
			"tone:formal"
		],
		"example": {
			"japanese": "日本語を勉強します。",
			"vietnamese": "Tôi học tiếng Nhật."
		}
	},
	{
		"term": "桜",
		"reading": "さくら",
		"romaji": "sakura",
		"meaning": "Hoa anh đào",
		"level": "N5",
		"type": "Danh từ",
		"tags": [
			"topic:nature_weather",
			"where:nature",
			"tone:polite"
		],
		"example": {
			"japanese": "春に桜が綺麗に咲きます。",
			"vietnamese": "Mùa xuân hoa anh đào nở rất đẹp."
		}
	}
], null, 2);

/**
 * Mẫu Prompt chuẩn để gửi cho ChatGPT / Gemini tạo dữ liệu JSON hợp lệ 100%
 */
export const SAMPLE_AI_PROMPT = `Bạn là một chuyên gia biên soạn giáo trình tiếng Nhật JLPT. Hãy chuyển đổi danh sách từ vựng dưới đây thành định dạng JSON Array chuẩn hóa 100% để nạp vào ứng dụng FLCard-JP:

[DÁN DANH SÁCH TỪ VỰNG CỦA BẠN VÀO ĐÂY]

YÊU CẦU CẤU TRÚC JSON (Mỗi phần tử đại diện 1 thẻ flashcard):
- "term": Từ tiếng Nhật (Kanji/Kana).
- "reading": Cách đọc thuần Hiragana/Katakana (không chứa Kanji).
- "romaji": Phiên âm Latinh chuẩn Hepburn (vd: taberu, nihongo, sakura).
- "meaning": Nghĩa tiếng Việt ngắn gọn, súc tích.
- "level": Cấp độ JLPT bắt buộc (chỉ 1 trong: "N5", "N4", "N3", "N2", "N1").
- "type": Từ loại (chỉ 1 trong: "Danh từ", "Động từ nhóm 1", "Động từ nhóm 2", "Động từ nhóm 3", "Tính từ đuôi い", "Tính từ đuôi な", "Phó từ", "Cụm từ").
- "tags": Mảng phân loại Faceted Taxonomy:
  + "topic:<chủ_đề>": Chọn 1 trong [food_drink, daily_routine, home_life, work_business, transport, shopping, nature_weather, health_body, education, leisure_hobby, social_culture, tech_science, identity, abstract_mind, general]
  + "where:<bối_cảnh>": Chọn 1 trong [home, restaurant, office, station, store, hospital, school, general]
  + "tone:<sắc_thái>": Chọn 1 trong [polite, casual, formal]
- "example": Ví dụ câu gồm "japanese" (câu ví dụ tiếng Nhật) và "vietnamese" (dịch nghĩa).

Quy tắc xuất kết quả:
- Xuất DUY NHẤT một mảng JSON nguyên bản [ { ... } ].
- Tuyệt đối KHÔNG bọc trong markdown \`\`\`json và KHÔNG kèm văn bản giải thích nào khác.

Cấu trúc mẫu tham khảo:
${SAMPLE_JSON_TEMPLATE}`;
