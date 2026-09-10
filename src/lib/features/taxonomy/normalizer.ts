import {
	CANONICAL_TOPICS,
	CANONICAL_CONTEXTS,
	CANONICAL_TONES,
	SYNONYM_MAP,
	TOPIC_METADATA,
	CONTEXT_METADATA,
	type CanonicalTopic,
	type CanonicalContext,
	type CanonicalTone
} from './constants';

/**
 * Chuẩn hóa một chuỗi chủ đề về Canonical Topic chuẩn
 */
export function normalizeTopic(rawTopic: string): CanonicalTopic {
	const clean = rawTopic.trim().toLowerCase();
	const mapped = SYNONYM_MAP[clean] || clean;
	if ((CANONICAL_TOPICS as readonly string[]).includes(mapped)) {
		return mapped as CanonicalTopic;
	}
	return 'general';
}

/**
 * Chuẩn hóa một chuỗi bối cảnh về Canonical Context chuẩn
 */
export function normalizeContext(rawContext: string): CanonicalContext {
	const clean = rawContext.trim().toLowerCase();
	const mapped = SYNONYM_MAP[clean] || clean;
	if ((CANONICAL_CONTEXTS as readonly string[]).includes(mapped)) {
		return mapped as CanonicalContext;
	}
	return 'general';
}

/**
 * Tạo thẻ Facet chuẩn hóa (e.g. 'topic:food_drink', 'where:restaurant')
 */
export function buildFacetedTag(facet: 'where' | 'topic' | 'tone', rawValue: string): string {
	let normalizedValue = rawValue.trim().toLowerCase();
	if (facet === 'topic') {
		normalizedValue = normalizeTopic(normalizedValue);
	} else if (facet === 'where') {
		normalizedValue = normalizeContext(normalizedValue);
	} else if (facet === 'tone') {
		if (!(CANONICAL_TONES as readonly string[]).includes(normalizedValue)) {
			normalizedValue = 'polite';
		}
	}
	return `${facet}:${normalizedValue}`;
}

/**
 * Định dạng nhãn hiển thị UI cho thẻ tag
 */
export function formatDisplayTag(tag: string): { label: string; icon: string; facet: string } {
	const parts = tag.split(':');
	if (parts.length === 2) {
		const [facet, val] = parts;
		if (facet === 'topic' && val in TOPIC_METADATA) {
			const meta = TOPIC_METADATA[val as CanonicalTopic];
			return { label: meta.label, icon: meta.icon, facet: 'Chủ đề' };
		}
		if (facet === 'where' && val in CONTEXT_METADATA) {
			const meta = CONTEXT_METADATA[val as CanonicalContext];
			return { label: meta.label, icon: meta.icon, facet: 'Nơi chốn' };
		}
		if (facet === 'tone') {
			const toneLabels: Record<string, string> = { polite: 'Lịch sự', casual: 'Thân mật', formal: 'Trang trọng' };
			return { label: toneLabels[val] || val, icon: '💬', facet: 'Sắc thái' };
		}
	}

	return { label: tag, icon: '🏷️', facet: 'Khác' };
}
