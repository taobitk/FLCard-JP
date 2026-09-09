/**
 * Bộ chuyển đổi Romaji sang Hiragana thuần TypeScript (Zero-dependency)
 * Hoạt động mượt mà cả ở Client lẫn Cloudflare Workers (V8 Isolates)
 */

const ROMAJI_TO_HIRAGANA_MAP: Record<string, string> = {
	// Vowels
	'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',

	// K-row
	'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
	'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',

	// S-row
	'sa': 'さ', 'shi': 'し', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
	'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',

	// T-row
	'ta': 'た', 'chi': 'ち', 'ti': 'ち', 'tsu': 'つ', 'tu': 'つ', 'te': 'て', 'to': 'と',
	'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',

	// N-row
	'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
	'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',

	// H-row
	'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
	'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',

	// M-row
	'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
	'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',

	// Y-row
	'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',

	// R-row
	'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
	'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',

	// W-row
	'wa': 'わ', 'wo': 'を',

	// G-row (Dakuten)
	'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
	'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',

	// Z/J-row
	'za': 'ざ', 'ji': 'じ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
	'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',

	// D-row
	'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',

	// B-row
	'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
	'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',

	// P-row (Handakuten)
	'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
	'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',

	// Special
	'nn': 'ん'
};

/**
 * Chuyển đổi chuỗi Romaji thành Hiragana
 * Ví dụ: "watashi" -> "わたし", "taberu" -> "たべる", "chotto" -> "ちょっと"
 */
export function toHiragana(input: string): string {
	if (!input) return '';
	
	let lower = input.toLowerCase().trim();
	let result = '';
	let i = 0;

	while (i < lower.length) {
		// Kiểm tra âm ngắt (Sokuon: lặp phụ âm tt, kk, pp, ss...)
		if (
			i + 1 < lower.length &&
			lower[i] === lower[i + 1] &&
			/[b-df-hj-np-tv-z]/.test(lower[i]) &&
			lower[i] !== 'n'
		) {
			result += 'っ';
			i++;
			continue;
		}

		// Kiểm tra cụm 3 ký tự (kya, chu, sho, etc.)
		if (i + 3 <= lower.length) {
			const sub3 = lower.slice(i, i + 3);
			if (ROMAJI_TO_HIRAGANA_MAP[sub3]) {
				result += ROMAJI_TO_HIRAGANA_MAP[sub3];
				i += 3;
				continue;
			}
		}

		// Kiểm tra cụm 2 ký tự (ka, sa, to, chi, etc.)
		if (i + 2 <= lower.length) {
			const sub2 = lower.slice(i, i + 2);
			if (ROMAJI_TO_HIRAGANA_MAP[sub2]) {
				result += ROMAJI_TO_HIRAGANA_MAP[sub2];
				i += 2;
				continue;
			}
		}

		// Kiểm tra chữ 'n' đơn lẻ đứng trước phụ âm hoặc ở cuối
		if (lower[i] === 'n') {
			if (
				i + 1 === lower.length || // ở cuối chuỗi
				(!/[aeiouy]/.test(lower[i + 1])) // không phải nguyên âm
			) {
				result += 'ん';
				i++;
				continue;
			}
		}

		// Kiểm tra 1 ký tự nguyên âm (a, i, u, e, o)
		const sub1 = lower[i];
		if (ROMAJI_TO_HIRAGANA_MAP[sub1]) {
			result += ROMAJI_TO_HIRAGANA_MAP[sub1];
			i++;
			continue;
		}

		// Nếu là ký tự khác (khoảng trắng, dấu, tiếng Nhật đã có sẵn), giữ nguyên
		result += sub1;
		i++;
	}

	return result;
}

const HIRAGANA_TO_ROMAJI_MAP: Record<string, string> = {};
for (const [romaji, kana] of Object.entries(ROMAJI_TO_HIRAGANA_MAP)) {
	if (!HIRAGANA_TO_ROMAJI_MAP[kana] || romaji === 'shi' || romaji === 'chi' || romaji === 'tsu' || romaji === 'ji') {
		HIRAGANA_TO_ROMAJI_MAP[kana] = romaji;
	}
}
HIRAGANA_TO_ROMAJI_MAP['ん'] = 'n';

/**
 * Chuyển đổi chuỗi Kana (Hiragana) sang Romaji chuẩn Hepburn
 * Ví dụ: "おはよっす" -> "ohayossu", "おはようございます" -> "ohayougozaimasu", "わたし" -> "watashi"
 */
export function toRomaji(kana: string): string {
	if (!kana) return '';
	let result = '';
	let i = 0;

	while (i < kana.length) {
		// Xử lý âm ngắt sokuon (っ / ッ)
		if (kana[i] === 'っ' || kana[i] === 'ッ') {
			if (i + 1 < kana.length) {
				const nextSub2 = kana.slice(i + 1, i + 3);
				const nextSub1 = kana.slice(i + 1, i + 2);
				const nextRomaji = HIRAGANA_TO_ROMAJI_MAP[nextSub2] || HIRAGANA_TO_ROMAJI_MAP[nextSub1];
				if (nextRomaji && nextRomaji.length > 0) {
					result += nextRomaji[0];
					i++;
					continue;
				}
			}
			result += 't';
			i++;
			continue;
		}

		// Xử lý âm đôi 2 ký tự (きゃ, しゃ, etc.)
		if (i + 2 <= kana.length) {
			const sub2 = kana.slice(i, i + 2);
			if (HIRAGANA_TO_ROMAJI_MAP[sub2]) {
				result += HIRAGANA_TO_ROMAJI_MAP[sub2];
				i += 2;
				continue;
			}
		}

		// Xử lý 1 ký tự
		const sub1 = kana[i];
		if (HIRAGANA_TO_ROMAJI_MAP[sub1]) {
			result += HIRAGANA_TO_ROMAJI_MAP[sub1];
			i++;
			continue;
		}

		// Giữ nguyên ký tự khác (khoảng trắng, dấu, Latin...)
		result += sub1;
		i++;
	}

	return result;
}

