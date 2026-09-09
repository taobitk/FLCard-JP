import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Health check & API validation endpoint
 * Dùng để kiểm thử kết nối HTTP thật từ backend
 */
export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		appName: 'FLCard-JP',
		timestamp: new Date().toISOString(),
		edgeRuntime: 'cloudflare-workers'
	}, {
		headers: {
			'Cache-Control': 'no-cache',
			'X-Powered-By': 'Cloudflare Workers'
		}
	});
};
