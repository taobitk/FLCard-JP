import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllCards, getCardsByTag, createCard, updateCard, deleteCard } from '$lib/server/db/cards';
import type { FlashcardItem } from '$lib/features/flashcard/types';

/**
 * GET /api/cards
 * Lấy danh sách toàn bộ thẻ từ Cloudflare D1 (có thể lọc theo ?tag=xxx)
 */
export const GET: RequestHandler = async ({ url, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Cloudflare D1 Database binding (DB) is not available' }, { status: 500 });
	}

	try {
		const tag = url.searchParams.get('tag');
		const cards = tag
			? await getCardsByTag(platform.env.DB, tag)
			: await getAllCards(platform.env.DB);

		return json({
			count: cards.length,
			tagFilter: tag || null,
			cards
		}, {
			headers: {
				'Cache-Control': 'no-cache',
				'X-Edge-Runtime': 'cloudflare-d1'
			}
		});
	} catch (err: any) {
		return json({ error: 'Failed to query D1 cards', details: err.message }, { status: 500 });
	}
};

/**
 * POST /api/cards
 * Tạo một thẻ mới vào Cloudflare D1
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Cloudflare D1 Database binding (DB) is not available' }, { status: 500 });
	}

	try {
		const card = (await request.json()) as FlashcardItem;
		if (!card || !card.id || !card.term || !card.reading) {
			return json({ error: 'Missing required card fields (id, term, reading)' }, { status: 400 });
		}

		await createCard(platform.env.DB, card);
		return json({ success: true, card }, { status: 201 });
	} catch (err: any) {
		return json({ error: 'Failed to create card in D1', details: err.message }, { status: 500 });
	}
};

/**
 * PUT /api/cards
 * Cập nhật thông tin thẻ trong Cloudflare D1
 */
export const PUT: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Cloudflare D1 Database binding (DB) is not available' }, { status: 500 });
	}

	try {
		const card = (await request.json()) as FlashcardItem;
		if (!card || !card.id) {
			return json({ error: 'Missing card ID for update' }, { status: 400 });
		}

		await updateCard(platform.env.DB, card);
		return json({ success: true, card });
	} catch (err: any) {
		return json({ error: 'Failed to update card in D1', details: err.message }, { status: 500 });
	}
};

/**
 * DELETE /api/cards?id=xxx hoặc body { id: 'xxx' }
 * Xóa thẻ khỏi Cloudflare D1
 */
export const DELETE: RequestHandler = async ({ url, request, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Cloudflare D1 Database binding (DB) is not available' }, { status: 500 });
	}

	try {
		let id = url.searchParams.get('id');
		if (!id) {
			try {
				const body = (await request.json()) as any;
				id = body?.id;
			} catch {
				// body is optional if id is in query
			}
		}

		if (!id) {
			return json({ error: 'Missing card ID to delete' }, { status: 400 });
		}

		await deleteCard(platform.env.DB, id);
		return json({ success: true, deletedId: id });
	} catch (err: any) {
		return json({ error: 'Failed to delete card from D1', details: err.message }, { status: 500 });
	}
};
