/**
 * Định nghĩa kiểu dữ liệu Hộp đen hành vi & Khoa học nhận thức (Behavioral Telemetry)
 */

export type TelemetryItemType = 'vocab' | 'grammar';

export interface TelemetryLogInput {
	itemId: string;
	itemType: TelemetryItemType;
	userRating: 1 | 2 | 3 | 4;
	latencyMs: number;
	reviewDurationMs: number;
	repetitionCount: number;
	intervalDays: number;
	easeFactor: number;
	isLapsed?: boolean;
	sessionId?: string;
	cardOrderInSession?: number;
}

export interface TelemetryRecord extends TelemetryLogInput {
	id: string;
	hourOfDay: number;
	createdAt: number;
}
