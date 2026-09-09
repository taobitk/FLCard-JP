import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/assets/[...key]
 * Phục vụ file ảnh được lưu trong Cloudflare R2 Native Bucket
 */
export const GET: RequestHandler = async ({ params, platform }) => {
	if (!platform?.env?.BUCKET) {
		throw error(500, 'Cloudflare R2 Bucket binding (BUCKET) is not available');
	}

	const objectKey = params.key;
	if (!objectKey) {
		throw error(400, 'Missing asset object key');
	}

	const object = await platform.env.BUCKET.get(objectKey);
	if (!object) {
		throw error(404, 'Asset not found in Cloudflare R2');
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(object.body, {
		headers
	});
};
