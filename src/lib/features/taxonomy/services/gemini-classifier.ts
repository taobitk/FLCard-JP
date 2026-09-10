import {
	CANONICAL_TOPICS,
	CANONICAL_CONTEXTS,
	CANONICAL_TONES,
	type CanonicalTopic,
	type CanonicalContext,
	type CanonicalTone
} from '../constants';
import { buildFacetedTag, normalizeTopic, normalizeContext } from '../normalizer';

export interface BatchClassificationItem {
	id: string;
	term: string;
	meaning: string;
	reading?: string;
	cardType?: string;
}

export interface BatchClassificationOutput {
	id: string;
	topic: CanonicalTopic;
	context: CanonicalContext;
	tone: CanonicalTone;
	tags: string[];
}

export interface BatchClassificationResult {
	success: boolean;
	modelUsed: string;
	results: BatchClassificationOutput[];
	error?: string;
}

/**
 * Danh sách model Gemini theo thứ tự ưu tiên (Failover Chain)
 */
export const GEMINI_FAILOVER_MODELS = [
	'gemini-3.5-flash-lite',
	'gemini-flash-lite-latest',
	'gemini-3.1-flash-lite',
	'gemini-3.6-flash',
	'gemini-3.7-flash'
] as const;

/**
 * System prompt chuẩn hóa ép kiểu JSON mảng cấu trúc đóng
 */
export const GEMINI_BATCH_SYSTEM_PROMPT = `
You are a precise Japanese vocabulary taxonomy classifier.
Classify each provided word strictly into one canonical topic, one context, and one tone from the following closed lists:

1. TOPICS (life domain):
${JSON.stringify(CANONICAL_TOPICS)}

2. CONTEXTS (where it is most frequently encountered or used):
${JSON.stringify(CANONICAL_CONTEXTS)}

3. TONES (communicative tone):
${JSON.stringify(CANONICAL_TONES)}

Rules:
- You MUST return ONLY a valid JSON array matching each input word by its "id".
- Do NOT wrap in markdown \`\`\`json. Output raw JSON array only.
- Format:
[
  {"id": "<matching_id>", "topic": "<canonical_topic>", "context": "<canonical_context>", "tone": "<canonical_tone>"}
]
`.trim();

/**
 * Phân loại một lô từ vựng bằng Gemini với cơ chế Failover tự động
 */
export async function classifyBatchWithGemini(
	items: BatchClassificationItem[],
	apiKey: string
): Promise<BatchClassificationResult> {
	if (!items || items.length === 0) {
		return { success: true, modelUsed: 'none', results: [] };
	}

	if (!apiKey) {
		throw new Error('Thiếu GEMINI_API_KEY để gọi Google AI Studio');
	}

	const userPayload = items.map((item) => ({
		id: item.id,
		term: item.term,
		meaning: item.meaning,
		reading: item.reading || '',
		type: item.cardType || ''
	}));

	const requestBody = {
		contents: [
			{
				parts: [
					{
						text: `${GEMINI_BATCH_SYSTEM_PROMPT}\n\nClassify these words:\n${JSON.stringify(userPayload, null, 2)}`
					}
				]
			}
		],
		generationConfig: {
			temperature: 0.1,
			responseMimeType: 'application/json'
		}
	};

	let lastError: any = null;

	// Duyệt qua từng model trong chuỗi Failover
	for (const model of GEMINI_FAILOVER_MODELS) {
		const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.warn(`[Gemini Failover] Model ${model} failed with HTTP ${response.status}:`, errorText.slice(0, 200));
				lastError = new Error(`Model ${model} returned ${response.status}: ${errorText.slice(0, 150)}`);
				// Thử model kế tiếp trong chuỗi
				continue;
			}

			const data = await response.json() as any;
			const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

			if (!rawText) {
				console.warn(`[Gemini Failover] Model ${model} returned empty response.`);
				continue;
			}

			const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
			const parsedArray = JSON.parse(cleanJson);

			if (!Array.isArray(parsedArray)) {
				console.warn(`[Gemini Failover] Model ${model} did not return an array.`);
				continue;
			}

			// Chuẩn hóa từng phần tử kết quả
			const normalizedResults: BatchClassificationOutput[] = parsedArray.map((entry: any) => {
				const topic = normalizeTopic(String(entry.topic || 'general'));
				const context = normalizeContext(String(entry.context || 'general'));
				let tone: CanonicalTone = 'polite';
				if ((CANONICAL_TONES as readonly string[]).includes(entry.tone)) {
					tone = entry.tone as CanonicalTone;
				}

				const tags = [
					buildFacetedTag('where', context),
					buildFacetedTag('topic', topic),
					buildFacetedTag('tone', tone)
				];

				return {
					id: String(entry.id),
					topic,
					context,
					tone,
					tags
				};
			});

			return {
				success: true,
				modelUsed: model,
				results: normalizedResults
			};
		} catch (err: any) {
			console.warn(`[Gemini Failover] Error with ${model}:`, err.message);
			lastError = err;
		}
	}

	return {
		success: false,
		modelUsed: 'all_failed',
		results: [],
		error: lastError?.message || 'Tất cả các model trong chuỗi failover đều gặp sự cố'
	};
}
