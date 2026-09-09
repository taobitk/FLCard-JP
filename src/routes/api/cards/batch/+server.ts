import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { batchCreateCards } from '$lib/server/db/cards';
import type { FlashcardItem } from '$lib/features/flashcard/types';

/**
 * POST /api/cards/batch
 * Nhập hàng loạt thẻ vào Cloudflare D1 bằng db.batch()
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Cloudflare D1 Database binding (DB) is not available' }, { status: 500 });
	}

	try {
		const body = (await request.json()) as any;
		const cards = (Array.isArray(body) ? body : body?.cards) as FlashcardItem[];

		if (!cards || !Array.isArray(cards) || cards.length === 0) {
			return json({ error: 'Cards array is required and must not be empty' }, { status: 400 });
		}

		await batchCreateCards(platform.env.DB, cards);

		return json({
			success: true,
			insertedCount: cards.length
		}, { status: 201 });
	} catch (err: any) {
		return json({ error: 'Failed to batch import cards into D1', details: err.message }, { status: 500 });
	}
};
