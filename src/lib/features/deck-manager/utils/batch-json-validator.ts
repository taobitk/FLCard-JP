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

		// Kiểm tra trường bắt buộc: term
		if (typeof item.term !== 'string' || !item.term.trim()) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'term' (chữ Kanji/Từ tiếng Nhật bắt buộc).`);
		}

		// Kiểm tra trường bắt buộc: reading
		if (typeof item.reading !== 'string' || !item.reading.trim()) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'reading' (cách đọc Hiragana bắt buộc).`);
		}

		// Kiểm tra trường bắt buộc: meaning
		if (typeof item.meaning !== 'string' || !item.meaning.trim()) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'meaning' (nghĩa tiếng Việt bắt buộc).`);
		}

		// Kiểm tra trường bắt buộc: level
		let level: JLPTLevel = 'N5';
		if (!item.level) {
			errors.push(`Thẻ #${itemNum}: Thiếu trường 'level' (cấp độ JLPT bắt buộc: N5, N4, N3, N2, N1).`);
		} else {
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
		if (item.term && item.reading && item.meaning) {
			const term = String(item.term).trim();
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
 * Mẫu JSON chuẩn 100% để hiển thị hoặc copy
 */
export const SAMPLE_JSON_TEMPLATE = JSON.stringify([
  {
    "term": "食べる",
    "reading": "たべる",
    "romaji": "taberu",
    "meaning": "Ăn (thức ăn, cơm)",
    "level": "N5",
    "type": "Động từ nhóm 2",
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
    "example": {
      "japanese": "日本語を勉強します。",
      "vietnamese": "Tôi học tiếng Nhật."
    }
  }
], null, 2);

/**
 * Mẫu Prompt chuẩn để gửi cho ChatGPT / Gemini
 */
export const SAMPLE_AI_PROMPT = `Bạn là một trợ lý ngôn ngữ tiếng Nhật chuyên sâu. Hãy tạo danh sách từ vựng tiếng Nhật theo danh sách sau:
[DÁN DANH SÁCH TỪ CỦA BẠN VÀO ĐÂY]

Xuất ra ĐÚNG định dạng JSON Array nguyên bản (không bọc giải thích dông dài), tuân thủ cấu trúc mẫu sau:
${SAMPLE_JSON_TEMPLATE}`;
