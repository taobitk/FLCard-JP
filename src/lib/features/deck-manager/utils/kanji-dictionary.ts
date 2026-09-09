import type { JLPTLevel, CardType } from '$lib/features/flashcard/types';
import { toHiragana, toRomaji } from './romaji-to-kana';
import { detectRomajiCorrection, buildSmartRuby } from './romaji-normalizer';

export interface KanjiSuggestion {
	term: string;
	reading: string;
	romaji: string;
	rubyHtml: string;
	meaning: string;
	level: JLPTLevel;
	type: CardType;
}

/**
 * Thuật toán chấm điểm mức độ liên quan để đẩy từ chuẩn N5/N4 và đúng ý lên đầu
 */
function scoreSuggestion(
	term: string,
	reading: string,
	level: JLPTLevel,
	searchKey: string,
	hiragana: string
): number {
	let score = 0;
	const sKey = searchKey.toLowerCase();
	const hKey = hiragana.toLowerCase();
	const t = term.toLowerCase();
	const r = reading.toLowerCase();

	// 1. Khớp hoàn toàn (Exact match)
	if (r === hKey || t === hKey || r === sKey || t === sKey) {
		score += 150;
	}
	// 2. Bắt đầu bằng từ khóa (Prefix match)
	else if (r.startsWith(hKey) || t.startsWith(hKey) || r.startsWith(sKey) || t.startsWith(sKey)) {
		score += 80;
	}
	// 3. Chứa từ khóa
	else if (r.includes(hKey) || t.includes(hKey)) {
		score += 30;
	}

	// 4. Ưu tiên cấp độ JLPT phổ biến
	if (level === 'N5') score += 40;
	else if (level === 'N4') score += 30;
	else if (level === 'N3') score += 20;
	else if (level === 'N2') score += 10;

	// 5. Trừ điểm những cụm từ quá dài lê thê
	if (term.length > hKey.length + 5) {
		score -= 25;
	}

	return score;
}

/**
 * Gọi API từ điển trực tuyến kết hợp Reranker & Smart Ruby
 * Giới hạn Top 3 - 4 kết quả chất lượng nhất, dọn sạch từ rác
 */
export async function searchOnlineDictionary(query: string): Promise<KanjiSuggestion[]> {
	const clean = query.trim();
	if (!clean) return [];

	const correction = detectRomajiCorrection(clean);
	const hiragana = toHiragana(clean);
	// Nếu phát hiện gõ sai kiểu tiếng Việt, dùng từ chuẩn hóa làm chìa khóa tìm kiếm chính
	const searchKey = correction ? correction.hiragana : (hiragana || clean);

	let candidates: KanjiSuggestion[] = [];

	// 1. Thử gọi Mazii API (Từ điển Nhật - Việt chất lượng cao)
	try {
		const maziiRes = await fetch('https://mazii.net/api/search', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'FLCard-JP/1.0 (Cloudflare Edge Worker)'
			},
			body: JSON.stringify({
				dict: 'javi',
				type: 'word',
				query: searchKey,
				limit: 10,
				page: 1
			})
		});

		if (maziiRes.ok) {
			const data: any = await maziiRes.json();
			const items: any[] = data.data || [];
			if (items.length > 0) {
				candidates = items.map((item: any) => {
					const term = item.word || (item.phonetic ? item.phonetic.trim().split(/\s+/)[0] : searchKey);
					const phonetics = item.phonetic ? item.phonetic.trim().split(/\s+/) : [];
					const reading = phonetics.find((p: string) => p === hiragana || p === searchKey) || phonetics[0] || item.word || hiragana;
					const rawMean = item.short_mean || (item.means && item.means[0] ? item.means[0].mean : '');
					const meaning = (rawMean || '').replace(/^(n|v|adj-i|adj-na),\s*/i, '').trim();

					// Parse cấp độ JLPT (N5 - N1)
					let level: JLPTLevel = 'N5';
					if (item.level && item.level.length > 0) {
						const lvlStr = String(item.level[0]).toUpperCase();
						if (['N5', 'N4', 'N3', 'N2', 'N1'].includes(lvlStr)) {
							level = lvlStr as JLPTLevel;
						}
					}

					// Parse loại từ
					let type: CardType = 'Danh từ';
					const kindStr = (item.means && item.means[0] && item.means[0].kind) ? String(item.means[0].kind).toLowerCase() : '';
					if (kindStr.includes('v5') || kindStr.includes('động từ nhóm 1')) {
						type = 'Động từ nhóm 1';
					} else if (kindStr.includes('v1') || kindStr.includes('động từ nhóm 2')) {
						type = 'Động từ nhóm 2';
					} else if (kindStr.includes('vk') || kindStr.includes('vs') || kindStr.includes('động từ nhóm 3')) {
						type = 'Động từ nhóm 3';
					} else if (kindStr.includes('verb') || kindStr.includes('động từ')) {
						type = 'Động từ nhóm 1';
					} else if (kindStr.includes('adj-i') || kindStr.includes('tính từ đuôi い')) {
						type = 'Tính từ đuôi い';
					} else if (kindStr.includes('adj-na') || kindStr.includes('tính từ đuôi な')) {
						type = 'Tính từ đuôi な';
					} else if (kindStr.includes('adj') || kindStr.includes('tính từ')) {
						type = 'Tính từ đuôi い';
					} else if (kindStr.includes('adv') || kindStr.includes('phó từ')) {
						type = 'Phó từ';
					}

					// Bọc Furigana Ruby thông minh (chỉ bọc Kanji, không bọc Okurigana)
					const rubyHtml = buildSmartRuby(term, reading);

					return {
						term,
						reading: reading || term,
						romaji: toRomaji(reading || term) || (correction ? correction.corrected : clean),
						rubyHtml,
						meaning: meaning || 'Từ vựng tiếng Nhật',
						level,
						type
					};
				});
			}
		}
	} catch (err) {
		console.warn('Mazii API search error, falling back to Jisho:', err);
	}

	// 2. Dự phòng sang Jisho API nếu Mazii không có ứng viên
	if (candidates.length === 0) {
		try {
			const jishoRes = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(searchKey)}`, {
				headers: { 'User-Agent': 'FLCard-JP/1.0' }
			});
			if (jishoRes.ok) {
				const data: any = await jishoRes.json();
				const items: any[] = data.data || [];
				candidates = items.slice(0, 10).map((item: any) => {
					const jp = item.japanese && item.japanese[0] ? item.japanese[0] : {};
					const term = jp.word || jp.reading || searchKey;
					const reading = jp.reading || jp.word || hiragana;
					const english = item.senses && item.senses[0] && item.senses[0].english_definitions ? item.senses[0].english_definitions.join(', ') : '';

					let level: JLPTLevel = 'N5';
					if (item.jlpt && item.jlpt.length > 0) {
						const m = String(item.jlpt[0]).match(/jlpt-n([1-5])/i);
						if (m) level = `N${m[1]}` as JLPTLevel;
					}

					const rubyHtml = buildSmartRuby(term, reading);

					return {
						term,
						reading,
						romaji: toRomaji(reading || term) || (correction ? correction.corrected : clean),
						rubyHtml,
						meaning: english || 'Từ vựng tiếng Nhật',
						level,
						type: 'Danh từ'
					};
				});
			}
		} catch (err) {
			console.error('Jisho API fallback error:', err);
		}
	}

	// 3. Reranker: Chấm điểm và sắp xếp, chỉ lấy Top 3 hoặc 4 kết quả ưu việt nhất
	const scored = candidates.map((item) => ({
		item,
		score: scoreSuggestion(item.term, item.reading, item.level, searchKey, hiragana)
	}));

	scored.sort((a, b) => b.score - a.score);

	// Chỉ lấy Top 3 gợi ý tinh gọn, loại bỏ các kết quả điểm quá thấp
	return scored.slice(0, 4).map((s) => s.item);
}

/**
 * Tương thích ngược: Alias cho searchOnlineDictionary
 */
export const findKanjiSuggestions = searchOnlineDictionary;
