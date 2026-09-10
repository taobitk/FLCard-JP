import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { classifyBatchWithGemini, type BatchClassificationItem } from '$lib/features/taxonomy/services/gemini-classifier';
import { classifyWordWithAI } from '$lib/features/taxonomy/services/ai-classifier';

/**
 * POST /api/tags/batch
 * Xử lý phân loại tag hàng loạt cho mảng từ vựng và tự động cập nhật vào Cloudflare D1
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = (await request.json()) as any;
		const cards = (body?.cards || body) as BatchClassificationItem[];

		if (!Array.isArray(cards) || cards.length === 0) {
			return json({ error: 'Danh sách cards rỗng hoặc không đúng định dạng mảng' }, { status: 400 });
		}

		// Lấy API key từ Cloudflare Platform Environment
		const apiKey = (platform?.env as any)?.GEMINI_API_KEY || (platform?.env as any)?.GOOGLE_API_KEY;

		if (!apiKey) {
			return json({
				error: 'Chưa cấu hình GEMINI_API_KEY trên Cloudflare Environment',
				hint: 'Thêm GEMINI_API_KEY vào .dev.vars hoặc Cloudflare Dashboard'
			}, { status: 500 });
		}

		// Gọi Gemini với cơ chế Failover Chain
		let batchResult = await classifyBatchWithGemini(cards, apiKey);
		let finalResults = batchResult.results;
		let modelUsed = batchResult.modelUsed;

		// Graceful Fallback: Nếu Gemini gặp sự cố (ví dụ IP Cloudflare bị Google chặn location hoặc 429)
		if (!batchResult.success || !finalResults || finalResults.length === 0) {
			console.warn('[Tags Batch] Gemini failover failed, falling back to Heuristic classifier:', batchResult.error);
			finalResults = await Promise.all(
				cards.map(async (c) => {
					const res = await classifyWordWithAI({
						term: c.term,
						meaning: c.meaning,
						reading: c.reading,
						cardType: c.cardType
					});
					return {
						id: c.id,
						topic: res.topic,
						context: res.context,
						tone: res.tone,
						tags: res.tags
					};
				})
			);
			modelUsed = 'heuristic_fallback';
		}

		// Nếu có kết nối Cloudflare D1, tự động cập nhật trường tags cho từng card
		if (platform?.env?.DB && finalResults.length > 0) {
			try {
				const updateSql = 'UPDATE cards SET tags = ? WHERE id = ?';
				const stmts = finalResults.map((res) =>
					platform.env.DB.prepare(updateSql).bind(
						JSON.stringify(res.tags),
						res.id
					)
				);

				await platform.env.DB.batch(stmts);
			} catch (dbErr: any) {
				console.warn('Lỗi cập nhật tags vào D1 trong batch:', dbErr.message);
			}
		}

		return json({
			success: true,
			count: finalResults.length,
			modelUsed,
			results: finalResults
		});
	} catch (err: any) {
		return json({ error: 'Lỗi xử lý batch tags', details: err?.message }, { status: 500 });
	}
};
