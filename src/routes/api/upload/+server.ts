import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Chuyển đổi chuỗi Base64 (hoặc Data URL) sang Uint8Array an toàn trên môi trường V8 Isolates
 */
function base64ToUint8Array(base64Str: string): { data: Uint8Array; mime: string } {
	let cleanBase64 = base64Str;
	let mime = 'image/webp';

	const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
	if (matches) {
		mime = matches[1];
		cleanBase64 = matches[2];
	}

	const binaryString = atob(cleanBase64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return { data: bytes, mime };
}

/**
 * POST /api/upload
 * Tải ảnh lên Cloudflare R2 Bucket (Native Binding env.BUCKET)
 * Hỗ trợ cả Base64 JSON payload và Multipart Form Data
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.BUCKET) {
		return json({ error: 'Cloudflare R2 Bucket binding (BUCKET) is not available' }, { status: 500 });
	}

	try {
		const contentType = request.headers.get('content-type') || '';
		let fileData: Uint8Array;
		let mimeType = 'image/webp';

		if (contentType.includes('application/json')) {
			const body = (await request.json()) as any;
			const imageString = body?.image || body?.dataUrl;
			if (!imageString) {
				return json({ error: 'Missing image string in JSON payload' }, { status: 400 });
			}
			const parsed = base64ToUint8Array(imageString);
			fileData = parsed.data;
			mimeType = parsed.mime;
		} else if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = (formData.get('file') || formData.get('image')) as File | null;
			if (!file) {
				return json({ error: 'Missing file in FormData' }, { status: 400 });
			}
			const arrayBuffer = await file.arrayBuffer();
			fileData = new Uint8Array(arrayBuffer);
			mimeType = file.type || 'image/webp';
		} else {
			return json({ error: 'Unsupported Content-Type. Use application/json or multipart/form-data' }, { status: 400 });
		}

		// Xác định đuôi file
		const extension = mimeType.split('/')[1] || 'webp';
		const objectKey = `cards/${crypto.randomUUID()}.${extension}`;

		// Ghi trực tiếp vào Cloudflare R2
		await platform.env.BUCKET.put(objectKey, fileData, {
			httpMetadata: {
				contentType: mimeType,
				cacheControl: 'public, max-age=31536000, immutable'
			}
		});

		const publicUrl = `/api/assets/${objectKey}`;

		return json({
			success: true,
			url: publicUrl,
			key: objectKey,
			size: fileData.length,
			mimeType
		}, { status: 201 });

	} catch (err: any) {
		return json({ error: 'Failed to upload image to Cloudflare R2', details: err.message }, { status: 500 });
	}
};
