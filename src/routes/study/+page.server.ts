import type { PageServerLoad } from './$types';
import { getAllCards } from '$lib/server/db/cards';
import type { FlashcardItem } from '$lib/features/flashcard/types';

/**
 * Server Load cho phòng học Flashcard: Tải danh sách thẻ từ Cloudflare D1
 */
export const load: PageServerLoad = async ({ platform }) => {
	if (platform?.env?.DB) {
		try {
			const cards = await getAllCards(platform.env.DB);
			return {
				cards
			};
		} catch (err) {
			console.error('[D1 Database Load Error]: Không thể tải danh sách thẻ từ D1', err);
		}
	}

	return {
		cards: [] as FlashcardItem[]
	};
};
