import {
	CANONICAL_TOPICS,
	CANONICAL_CONTEXTS,
	CANONICAL_TONES,
	type CanonicalTopic,
	type CanonicalContext,
	type CanonicalTone
} from '../constants';
import { buildFacetedTag, normalizeTopic, normalizeContext } from '../normalizer';

export interface ClassificationRequest {
	term: string;           // Từ vựng tiếng Nhật (e.g. 食べる)
	meaning: string;        // Nghĩa tiếng Việt (e.g. Ăn cơm)
	reading?: string;       // Cách đọc (e.g. たべる)
	cardType?: string;      // Động từ nhóm 2
}

export interface ClassificationResult {
	topic: CanonicalTopic;
	context: CanonicalContext;
	tone: CanonicalTone;
	tags: string[];         // Mảng tag Faceted hoàn chỉnh: ['where:...', 'topic:...', 'tone:...']
	confidence: number;     // 0.0 - 1.0
}

/**
 * System Prompt chuẩn hóa cho AI phân loại từ vựng
 */
export const AI_CLASSIFIER_SYSTEM_PROMPT = `
Bạn là chuyên gia phân loại ngôn ngữ học tiếng Nhật (JLPT Taxonomy Classifier).
Nhiệm vụ của bạn là nhận vào một từ vựng tiếng Nhật và phân loại CHÍNH XÁC theo danh mục đóng (Faceted Controlled Taxonomy) sau:

1. TOPIC (Chủ đề): CHỈ ĐƯỢC CHỌN 1 TRONG CÁC GIÁ TRỊ SAU:
${JSON.stringify(CANONICAL_TOPICS)}

2. CONTEXT (Nơi chốn / Bối cảnh sử dụng phổ biến nhất): CHỈ ĐƯỢC CHỌN 1 TRONG CÁC GIÁ TRỊ SAU:
${JSON.stringify(CANONICAL_CONTEXTS)}

3. TONE (Sắc thái giao tiếp): CHỈ ĐƯỢC CHỌN 1 TRONG CÁC GIÁ TRỊ SAU:
${JSON.stringify(CANONICAL_TONES)}

Hãy trả về kết quả thuần JSON không kèm markdown:
{
  "topic": "<giá_trị_thuộc_TOPIC>",
  "context": "<giá_trị_thuộc_CONTEXT>",
  "tone": "<giá_trị_thuộc_TONE>",
  "confidence": 0.95
}
`.trim();

import { classifyBatchWithGemini } from './gemini-classifier';

export async function classifyWordWithAI(
	request: ClassificationRequest,
	apiKey?: string
): Promise<ClassificationResult> {
	// 1. Thử gọi Google Gemini nếu có apiKey
	if (apiKey) {
		try {
			const batchRes = await classifyBatchWithGemini(
				[
					{
						id: 'single',
						term: request.term,
						meaning: request.meaning,
						reading: request.reading,
						cardType: request.cardType
					}
				],
				apiKey
			);

			if (batchRes.success && batchRes.results.length > 0) {
				const item = batchRes.results[0];
				return {
					topic: item.topic,
					context: item.context,
					tone: item.tone,
					tags: item.tags,
					confidence: 0.98
				};
			}
		} catch (err) {
			console.warn('Gemini single classification failed, using heuristic fallback:', err);
		}
	}

	// 2. Heuristic phân loại sơ bộ 0ms dự phòng khi không có mạng hoặc chưa truyền API key
	const lowerMeaning = request.meaning.toLowerCase();
	let topic: CanonicalTopic = 'general';
	let context: CanonicalContext = 'general';
	let tone: CanonicalTone = 'polite';

	if (lowerMeaning.includes('ăn') || lowerMeaning.includes('uống') || lowerMeaning.includes('cơm') || lowerMeaning.includes('món')) {
		topic = 'food_drink';
		context = 'restaurant';
	} else if (lowerMeaning.includes('học') || lowerMeaning.includes('sách') || lowerMeaning.includes('trường')) {
		topic = 'education';
		context = 'school';
	} else if (lowerMeaning.includes('mèo') || lowerMeaning.includes('chó') || lowerMeaning.includes('hoa') || lowerMeaning.includes('cây')) {
		topic = 'nature_weather';
		context = 'general';
	} else if (lowerMeaning.includes('đi') || lowerMeaning.includes('đến') || lowerMeaning.includes('xe') || lowerMeaning.includes('tàu')) {
		topic = 'transport';
		context = 'station';
	} else if (lowerMeaning.includes('việc') || lowerMeaning.includes('công ty') || lowerMeaning.includes('họp')) {
		topic = 'work_business';
		context = 'office';
	} else if (lowerMeaning.includes('khám') || lowerMeaning.includes('bệnh') || lowerMeaning.includes('thuốc') || lowerMeaning.includes('viện')) {
		topic = 'health_body';
		context = 'hospital';
	}

	const tags = [
		buildFacetedTag('where', context),
		buildFacetedTag('topic', topic),
		buildFacetedTag('tone', tone)
	];

	return {
		topic: normalizeTopic(topic),
		context: normalizeContext(context),
		tone,
		tags,
		confidence: 0.85
	};
}
