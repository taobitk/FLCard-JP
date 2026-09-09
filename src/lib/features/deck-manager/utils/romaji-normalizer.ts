import { toHiragana } from './romaji-to-kana';

/**
 * Cấu trúc thông tin gợi ý sửa lỗi (Did you mean...?)
 */
export interface RomajiCorrection {
	original: string;
	corrected: string;
	hiragana: string;
	reason: string;
}

/**
 * Bảng ánh xạ lỗi gõ Romaji phổ biến kiểu người Việt
 * (Bỏ trường âm, gõ theo tai nghe tiếng Việt, viết thiếu chữ)
 */
const COMMON_TYPO_MAP: Record<string, { corrected: string; hiragana: string; reason: string }> = {
	'ohaiyo': { corrected: 'ohayou', hiragana: 'おはよう', reason: 'Chào buổi sáng' },
	'ohaiyou': { corrected: 'ohayou', hiragana: 'おはよう', reason: 'Chào buổi sáng' },
	'ohayo': { corrected: 'ohayou', hiragana: 'おはよう', reason: 'Chào buổi sáng' },
	'ohaiyo gozaimasu': { corrected: 'ohayou gozaimasu', hiragana: 'おはようございます', reason: 'Chào buổi sáng (Lịch sự)' },
	'ohayo gozaimasu': { corrected: 'ohayou gozaimasu', hiragana: 'おはようございます', reason: 'Chào buổi sáng (Lịch sự)' },
	'ohayou gozaimas': { corrected: 'ohayou gozaimasu', hiragana: 'おはようございます', reason: 'Chào buổi sáng (Lịch sự)' },
	'arigato': { corrected: 'arigatou', hiragana: 'ありがとう', reason: 'Cảm ơn' },
	'arigatoo': { corrected: 'arigatou', hiragana: 'ありがとう', reason: 'Cảm ơn' },
	'arigato gozaimasu': { corrected: 'arigatou gozaimasu', hiragana: 'ありがとうございます', reason: 'Cảm ơn (Lịch sự)' },
	'arigatou gozaimas': { corrected: 'arigatou gozaimasu', hiragana: 'ありがとうございます', reason: 'Cảm ơn (Lịch sự)' },
	'konichiwa': { corrected: 'konnichiwa', hiragana: 'こんにちは', reason: 'Xin chào' },
	'konnitiwa': { corrected: 'konnichiwa', hiragana: 'こんにちは', reason: 'Xin chào' },
	'konbanwa': { corrected: 'konbanwa', hiragana: 'こんばんは', reason: 'Chào buổi tối' },
	'kombanwa': { corrected: 'konbanwa', hiragana: 'こんばんは', reason: 'Chào buổi tối' },
	'sayonara': { corrected: 'sayounara', hiragana: 'さようなら', reason: 'Tạm biệt' },
	'sayonaraa': { corrected: 'sayounara', hiragana: 'さようなら', reason: 'Tạm biệt' },
	'suimasen': { corrected: 'sumimasen', hiragana: 'すみません', reason: 'Xin lỗi' },
	'sumimansen': { corrected: 'sumimasen', hiragana: 'すみません', reason: 'Xin lỗi' },
	'gomen': { corrected: 'gomennasai', hiragana: 'ごめんなさい', reason: 'Xin lỗi' },
	'gomenasai': { corrected: 'gomennasai', hiragana: 'ごめんなさい', reason: 'Xin lỗi' },
	'daijobu': { corrected: 'daijoubu', hiragana: 'だいじょうぶ', reason: 'Không sao / Ổn' },
	'oishi': { corrected: 'oishii', hiragana: 'おいしい', reason: 'Ngon miệng' },
	'kawai': { corrected: 'kawaii', hiragana: 'かわいい', reason: 'Dễ thương' },
	'senpai': { corrected: 'senpai', hiragana: 'せんぱい', reason: 'Tiền bối' },
	'sempai': { corrected: 'senpai', hiragana: 'せんぱい', reason: 'Tiền bối' },
	'douzo': { corrected: 'douzo', hiragana: 'どうぞ', reason: 'Xin mời' },
	'dozo': { corrected: 'douzo', hiragana: 'どうぞ', reason: 'Xin mời' }
};

/**
 * Kiểm tra xem từ người dùng gõ có cần gợi ý sửa lỗi (Did you mean...?) hay không
 */
export function detectRomajiCorrection(query: string): RomajiCorrection | null {
	const clean = query.trim().toLowerCase().replace(/\s+/g, ' ');
	if (!clean) return null;

	const match = COMMON_TYPO_MAP[clean];
	if (match) {
		// Chỉ gợi ý nếu từ người dùng gõ khác với từ chuẩn
		if (clean !== match.corrected.toLowerCase()) {
			return {
				original: query,
				corrected: match.corrected,
				hiragana: match.hiragana,
				reason: match.reason
			};
		}
	}

	return null;
}

/**
 * Xây dựng chuỗi thẻ Ruby thông minh, chỉ bọc đúng phần Kanji
 * Tránh lỗi bọc nguyên cả cụm dài ngoằng Okurigana (Ví dụ: お早うございます -> お<ruby>早<rt>はや</rt></ruby>うございます)
 */
export function buildSmartRuby(term: string, reading: string): string {
	if (!term || !reading || term === reading) return term;

	// Tìm tiền tố Kana chung
	let prefixLen = 0;
	while (
		prefixLen < term.length &&
		prefixLen < reading.length &&
		term[prefixLen] === reading[prefixLen]
	) {
		prefixLen++;
	}

	// Tìm hậu tố Kana chung
	let suffixLen = 0;
	while (
		suffixLen < (term.length - prefixLen) &&
		suffixLen < (reading.length - prefixLen) &&
		term[term.length - 1 - suffixLen] === reading[reading.length - 1 - suffixLen]
	) {
		suffixLen++;
	}

	const prefix = term.slice(0, prefixLen);
	const suffix = term.slice(term.length - suffixLen);
	const midTerm = term.slice(prefixLen, term.length - suffixLen);
	const midReading = reading.slice(prefixLen, reading.length - suffixLen);

	if (!midTerm) {
		return term;
	}

	return `${prefix}<ruby>${midTerm}<rt>${midReading}</rt></ruby>${suffix}`;
}
