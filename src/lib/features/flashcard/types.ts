/**
 * Định nghĩa kiểu dữ liệu cho thẻ Flashcard JLPT
 */

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type CardType = 
	| 'Danh từ' 
	| 'Động từ nhóm 1' 
	| 'Động từ nhóm 2' 
	| 'Động từ nhóm 3' 
	| 'Tính từ đuôi い' 
	| 'Tính từ đuôi な' 
	| 'Phó từ' 
	| 'Cụm từ';

export interface ExampleSentence {
	japanese: string;
	rubyHtml?: string;
	vietnamese: string;
}

export interface FlashcardItem {
	id: string;
	term: string;          // Từ Kanji hoặc Kana (ví dụ: 日本語 hoặc わたし)
	reading: string;       // Cách đọc Hiragana thuần (ví dụ: にほんご, わたし)
	romaji: string;        // Phiên âm Latin (ví dụ: nihongo, watashi)
	rubyHtml: string;      // HTML chứa thẻ <ruby> (ví dụ: <ruby>私<rt>わたし</rt></ruby>)
	meaning: string;       // Nghĩa tiếng Việt (ví dụ: Tôi, bản thân)
	level: JLPTLevel;      // Cấp độ JLPT (N5 - N1)
	type?: CardType;       // Từ loại
	imageUrl?: string;     // URL ảnh hoặc data:image Base64
	example?: ExampleSentence; // Câu ví dụ minh họa
	createdAt: number;     // Timestamp tạo thẻ
}
