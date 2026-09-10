import type { FlashcardItem, JLPTLevel, CardType } from '$lib/features/flashcard/types';

/**
 * Interface biểu diễn dòng dữ liệu trong bảng cards của Cloudflare D1
 */
export interface CardRow {
	id: string;
	term: string;
	reading: string;
	romaji: string;
	ruby_html: string;
	meaning: string;
	level: string;
	card_type: string | null;
	image_url: string | null;
	example_ja: string | null;
	example_vi: string | null;
	example_ruby_html: string | null;
	tags?: string | null;
	created_at: number;
}

/**
 * Chuyển đổi dòng CardRow từ D1 sang FlashcardItem cho Frontend
 */
export function rowToCard(row: CardRow): FlashcardItem {
	let parsedTags: string[] = [];
	if (row.tags) {
		try {
			parsedTags = JSON.parse(row.tags);
		} catch {
			parsedTags = [];
		}
	}

	return {
		id: row.id,
		term: row.term,
		reading: row.reading,
		romaji: row.romaji,
		rubyHtml: row.ruby_html,
		meaning: row.meaning,
		level: row.level as JLPTLevel,
		type: (row.card_type as CardType) || undefined,
		imageUrl: row.image_url || undefined,
		example: (row.example_ja || row.example_vi) ? {
			japanese: row.example_ja || '',
			vietnamese: row.example_vi || '',
			rubyHtml: row.example_ruby_html || undefined
		} : undefined,
		tags: parsedTags,
		createdAt: Number(row.created_at)
	};
}

/**
 * Lấy toàn bộ danh sách thẻ từ Cloudflare D1
 */
export async function getAllCards(db: D1Database): Promise<FlashcardItem[]> {
	const query = 'SELECT * FROM cards ORDER BY created_at ASC';
	const { results } = await db.prepare(query).all<CardRow>();
	const mapped = (results || []).map(rowToCard);
	return JSON.parse(JSON.stringify(mapped));
}

/**
 * Tìm thẻ theo ID
 */
export async function getCardById(db: D1Database, id: string): Promise<FlashcardItem | null> {
	const row = await db.prepare('SELECT * FROM cards WHERE id = ?').bind(id).first<CardRow>();
	return row ? JSON.parse(JSON.stringify(rowToCard(row))) : null;
}

/**
 * Lấy danh sách thẻ theo Tag chuẩn hóa (ví dụ 'topic:food_drink', 'where:school')
 */
export async function getCardsByTag(db: D1Database, tag: string): Promise<FlashcardItem[]> {
	const query = `
		SELECT cards.* FROM cards, json_each(cards.tags)
		WHERE json_each.value = ?
		ORDER BY created_at ASC
	`;
	const { results } = await db.prepare(query).bind(tag).all<CardRow>();
	const mapped = (results || []).map(rowToCard);
	return JSON.parse(JSON.stringify(mapped));
}

/**
 * Thống kê số lượng thẻ theo từng Tag
 */
export async function getAllTagsSummary(db: D1Database): Promise<{ tag: string; count: number }[]> {
	const query = `
		SELECT json_each.value AS tag, COUNT(*) AS count
		FROM cards, json_each(cards.tags)
		GROUP BY tag
		ORDER BY count DESC, tag ASC
	`;
	const { results } = await db.prepare(query).all<{ tag: string; count: number }>();
	return results || [];
}

/**
 * Tạo thẻ mới trên Cloudflare D1
 */
export async function createCard(db: D1Database, card: FlashcardItem): Promise<void> {
	const stmt = db.prepare(`
		INSERT INTO cards (
			id, term, reading, romaji, ruby_html, meaning, level, 
			card_type, image_url, example_ja, example_vi, example_ruby_html, tags, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	await stmt.bind(
		card.id,
		card.term,
		card.reading,
		card.romaji,
		card.rubyHtml,
		card.meaning,
		card.level,
		card.type || null,
		card.imageUrl || null,
		card.example?.japanese || null,
		card.example?.vietnamese || null,
		card.example?.rubyHtml || null,
		JSON.stringify(card.tags || []),
		card.createdAt || Date.now()
	).run();
}

/**
 * Nhập hàng loạt danh sách thẻ vào D1 bằng db.batch()
 */
export async function batchCreateCards(db: D1Database, cards: FlashcardItem[]): Promise<void> {
	if (cards.length === 0) return;

	const sql = `
		INSERT OR REPLACE INTO cards (
			id, term, reading, romaji, ruby_html, meaning, level, 
			card_type, image_url, example_ja, example_vi, example_ruby_html, tags, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`;

	const stmts = cards.map(card => db.prepare(sql).bind(
		card.id,
		card.term,
		card.reading,
		card.romaji,
		card.rubyHtml,
		card.meaning,
		card.level,
		card.type || null,
		card.imageUrl || null,
		card.example?.japanese || null,
		card.example?.vietnamese || null,
		card.example?.rubyHtml || null,
		JSON.stringify(card.tags || []),
		card.createdAt || Date.now()
	));

	await db.batch(stmts);
}

/**
 * Cập nhật thông tin thẻ
 */
export async function updateCard(db: D1Database, card: FlashcardItem): Promise<void> {
	const stmt = db.prepare(`
		UPDATE cards SET
			term = ?, reading = ?, romaji = ?, ruby_html = ?, meaning = ?, level = ?,
			card_type = ?, image_url = ?, example_ja = ?, example_vi = ?, example_ruby_html = ?, tags = ?
		WHERE id = ?
	`);

	await stmt.bind(
		card.term,
		card.reading,
		card.romaji,
		card.rubyHtml,
		card.meaning,
		card.level,
		card.type || null,
		card.imageUrl || null,
		card.example?.japanese || null,
		card.example?.vietnamese || null,
		card.example?.rubyHtml || null,
		JSON.stringify(card.tags || []),
		card.id
	).run();
}

/**
 * Xóa thẻ khỏi Cloudflare D1
 */
export async function deleteCard(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM cards WHERE id = ?').bind(id).run();
}
