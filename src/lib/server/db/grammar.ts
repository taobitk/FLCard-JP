import type { GrammarItem } from '$lib/features/grammar/types';
import type { JLPTLevel } from '$lib/features/flashcard/types';

export interface GrammarRow {
	id: string;
	title: string;
	meaning: string;
	level: string;
	connection_rule: string;
	target_pos: string;
	explanation: string | null;
	example_ja: string | null;
	example_vi: string | null;
	example_ruby_html: string | null;
	created_at: number;
}

export function rowToGrammar(row: GrammarRow): GrammarItem {
	return {
		id: row.id,
		title: row.title,
		meaning: row.meaning,
		level: row.level as JLPTLevel,
		connectionRule: row.connection_rule,
		targetPos: row.target_pos,
		explanation: row.explanation || undefined,
		example: (row.example_ja || row.example_vi) ? {
			japanese: row.example_ja || '',
			vietnamese: row.example_vi || '',
			rubyHtml: row.example_ruby_html || undefined
		} : undefined,
		createdAt: Number(row.created_at)
	};
}

/**
 * Lấy toàn bộ danh sách ngữ pháp từ Cloudflare D1
 */
export async function getAllGrammars(db: D1Database): Promise<GrammarItem[]> {
	const { results } = await db.prepare('SELECT * FROM grammars ORDER BY created_at ASC').all<GrammarRow>();
	return (results || []).map(rowToGrammar);
}

/**
 * Lấy ngữ pháp theo cấp độ JLPT
 */
export async function getGrammarsByLevel(db: D1Database, level: string): Promise<GrammarItem[]> {
	const { results } = await db.prepare('SELECT * FROM grammars WHERE level = ? ORDER BY created_at ASC').bind(level).all<GrammarRow>();
	return (results || []).map(rowToGrammar);
}
