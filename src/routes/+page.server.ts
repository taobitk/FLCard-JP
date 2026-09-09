import type { PageServerLoad } from './$types';
import { getAllCards } from '$lib/server/db/cards';
import type { FlashcardItem } from '$lib/features/flashcard/types';

/**
 * Server Load cho Trang chủ Portal Hub:
 * Cung cấp dữ liệu thống kê bộ thẻ, số lượng thẻ theo từng cấp độ JLPT từ Cloudflare D1
 */
export const load: PageServerLoad = async ({ platform }) => {
	let cards: FlashcardItem[] = [];

	if (platform?.env?.DB) {
		try {
			cards = await getAllCards(platform.env.DB);
		} catch (err) {
			console.error('[D1 Database Load Error]: Không thể tải danh sách thẻ từ D1', err);
		}
	}

	const levelCounts = {
		N5: cards.filter(c => c.level === 'N5').length,
		N4: cards.filter(c => c.level === 'N4').length,
		N3: cards.filter(c => c.level === 'N3').length,
		N2: cards.filter(c => c.level === 'N2').length,
		N1: cards.filter(c => c.level === 'N1').length
	};

	return {
		cards,
		totalCards: cards.length,
		levelCounts
	};
};
