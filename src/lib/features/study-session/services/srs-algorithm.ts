/**
 * KHUNG THUẬT TOÁN LẶP LẠI NGẮT QUÃNG & KHOA HỌC NHẬN THỨC (SRS & BEHAVIORAL ALGORITHM)
 * 
 * Trạng thái: Đang để trống phần tính toán logic lõi theo yêu cầu của User để hoàn thiện sau.
 */

export interface SRSCalculationInput {
	rating: 1 | 2 | 3 | 4;          // 1: Again (Quên), 2: Hard (Khó), 3: Good (Thuộc), 4: Easy (Dễ)
	previousRepetition: number;     // Số lần lặp lại thành công trước đó
	previousIntervalDays: number;   // Chu kỳ ngày trước đó
	previousEaseFactor: number;     // Hệ số độ khó trước đó
	latencyMs?: number;             // Độ trễ phản xạ não bộ (Cognitive Latency)
}

export interface SRSCalculationOutput {
	nextRepetition: number;
	nextIntervalDays: number;
	nextEaseFactor: number;
	status: 'new' | 'learning' | 'review' | 'mastered';
	cognitiveFeedback?: string;     // Phản hồi hành vi (ví dụ: phản xạ nhanh / do dự)
}

/**
 * Hàm tính toán thuật toán ghi nhớ
 * 
 * TODO: [KHUNG CHỜ] Sẽ hoàn thiện công thức tính toán chi tiết ở bước tiếp theo cùng User.
 */
export function calculateNextReview(input: SRSCalculationInput): SRSCalculationOutput {
	// Khung chờ logic tính toán:
	return {
		nextRepetition: input.previousRepetition + 1,
		nextIntervalDays: 1,
		nextEaseFactor: input.previousEaseFactor || 2.5,
		status: 'learning'
	};
}
