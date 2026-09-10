import type { JLPTLevel } from '$lib/features/flashcard/types';

/**
 * Định nghĩa cấu trúc mục ngữ pháp JLPT
 */
export interface GrammarItem {
	id: string;
	title: string;              // Cấu trúc (ví dụ: V-てください)
	meaning: string;            // Ý nghĩa tiếng Việt
	level: JLPTLevel;           // Cấp độ N5 - N1
	connectionRule: string;     // Quy tắc nối (rất quan trọng để AI tạo câu đúng)
	targetPos: string;          // Loại từ áp dụng: 'verb' | 'adj' | 'noun'
	explanation?: string;       // Bối cảnh sử dụng
	example?: {
		japanese: string;
		vietnamese: string;
		rubyHtml?: string;
	};
	createdAt: number;
}
