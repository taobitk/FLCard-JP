import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { classifyBatchWithGemini, type BatchClassificationItem } from '$lib/features/taxonomy/services/gemini-classifier';

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
		const batchResult = await classifyBatchWithGemini(cards, apiKey);

		if (!batchResult.success) {
			return json({
				error: 'Lỗi phân loại lô từ vựng từ AI Studio',
				details: batchResult.error
			}, { status: 502 });
		}

		// Nếu có kết nối Cloudflare D1, tự động cập nhật trường tags cho từng card
		if (platform?.env?.DB && batchResult.results.length > 0) {
			try {
				const updateSql = 'UPDATE cards SET tags = ? WHERE id = ?';
				const stmts = batchResult.results.map((res) =>
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
			count: batchResult.results.length,
			modelUsed: batchResult.modelUsed,
			results: batchResult.results
		});
	} catch (err: any) {
		return json({ error: 'Lỗi xử lý batch tags', details: err?.message }, { status: 500 });
	}
};
