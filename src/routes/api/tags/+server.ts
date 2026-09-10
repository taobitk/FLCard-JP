import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
	CANONICAL_TOPICS, 
	CANONICAL_CONTEXTS, 
	CANONICAL_TONES, 
	TOPIC_METADATA, 
	CONTEXT_METADATA 
} from '$lib/features/taxonomy/constants';
import { classifyWordWithAI } from '$lib/features/taxonomy/services/ai-classifier';
import { getAllTagsSummary } from '$lib/server/db/cards';

/**
 * GET /api/tags
 * Lấy danh mục taxonomy chuẩn hóa và thống kê phân bổ tag từ D1
 */
export const GET: RequestHandler = async ({ platform }) => {
	let tagSummary: { tag: string; count: number }[] = [];

	if (platform?.env?.DB) {
		try {
			tagSummary = await getAllTagsSummary(platform.env.DB);
		} catch (err: any) {
			console.warn('Could not fetch tags summary:', err?.message);
		}
	}

	return json({
		topics: CANONICAL_TOPICS,
		contexts: CANONICAL_CONTEXTS,
		tones: CANONICAL_TONES,
		topicMetadata: TOPIC_METADATA,
		contextMetadata: CONTEXT_METADATA,
		tagSummary
	});
};

/**
 * POST /api/tags
 * Gửi từ vựng để AI tự động phân loại tag (Topic, Context, Tone)
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as any;
		const { term, meaning, reading, cardType } = body || {};

		if (!term || !meaning) {
			return json({ error: 'Thiếu thông tin term hoặc meaning để phân loại' }, { status: 400 });
		}

		// Gọi service phân loại (đang dừng ở cổng chờ cấu hình model theo chỉ dẫn user)
		const result = await classifyWordWithAI({
			term,
			meaning,
			reading,
			cardType
		});

		return json({
			success: true,
			result
		});
	} catch (err: any) {
		return json({ error: 'Lỗi phân loại thẻ tag', details: err?.message }, { status: 500 });
	}
};
