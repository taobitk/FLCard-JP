import type { TelemetryLogInput, TelemetryRecord } from '$lib/features/telemetry/types';

/**
 * Ghi nhận một sự kiện hành vi học tập vào bảng study_telemetry trên Cloudflare D1
 */
export async function recordTelemetry(db: D1Database, input: TelemetryLogInput): Promise<TelemetryRecord> {
	const now = Date.now();
	const hour = new Date(now).getHours();
	const id = `tel-${now}-${Math.random().toString(36).substring(2, 7)}`;

	await db.prepare(`
		INSERT INTO study_telemetry (
			id, item_id, item_type, user_rating, latency_ms, review_duration_ms,
			repetition_count, interval_days, ease_factor, is_lapsed,
			session_id, card_order_in_session, hour_of_day, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).bind(
		id,
		input.itemId,
		input.itemType,
		input.userRating,
		input.latencyMs,
		input.reviewDurationMs,
		input.repetitionCount,
		input.intervalDays,
		input.easeFactor,
		input.isLapsed ? 1 : 0,
		input.sessionId || null,
		input.cardOrderInSession || null,
		hour,
		now
	).run();

	return {
		id,
		...input,
		hourOfDay: hour,
		createdAt: now
	};
}

/**
 * Thống kê tổng hợp dữ liệu hành vi người dùng
 */
export async function getTelemetrySummary(db: D1Database) {
	const totalReviews = await db.prepare('SELECT COUNT(*) as count FROM study_telemetry').first<{ count: number }>();
	const avgLatency = await db.prepare('SELECT AVG(latency_ms) as avg_latency FROM study_telemetry').first<{ avg_latency: number }>();
	return {
		totalReviews: totalReviews?.count || 0,
		averageLatencyMs: Math.round(avgLatency?.avg_latency || 0)
	};
}
