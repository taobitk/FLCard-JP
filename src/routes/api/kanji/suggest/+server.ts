import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchOnlineDictionary } from '$lib/features/deck-manager/utils/kanji-dictionary';
import { toHiragana } from '$lib/features/deck-manager/utils/romaji-to-kana';
import { detectRomajiCorrection } from '$lib/features/deck-manager/utils/romaji-normalizer';

/**
 * Endpoint gợi ý Kanji & chuyển đổi Romaji sang Hiragana
 * Hỗ trợ HTTP GET request thật từ client hoặc external testing
 */
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const clean = query.trim();

	if (!clean) {
		return json({
			query: '',
			hiragana: '',
			correction: null,
			count: 0,
			suggestions: []
		}, {
			headers: {
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}

	const hiragana = toHiragana(clean);
	const correction = detectRomajiCorrection(clean);
	const suggestions = await searchOnlineDictionary(clean);

	return json({
		query: clean,
		hiragana,
		correction,
		count: suggestions.length,
		suggestions
	}, {
		headers: {
			'Cache-Control': 'public, max-age=3600',
			'X-Edge-Runtime': 'cloudflare-workers'
		}
	});
};
