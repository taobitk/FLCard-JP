/**
 * HỆ THỐNG DANH MỤC PHÂN LOẠI CHUẨN HOÁ (CONTROLLED TAXONOMY)
 * Dựa trên chuẩn The Japan Foundation (JF Standard) & CEFR tiếng Nhật
 */

// 1. 15 Chủ đề cốt lõi (100% bao phủ từ vựng JLPT N5 - N1)
export const CANONICAL_TOPICS = [
	'food_drink',     // Ẩm thực, ăn uống, đồ uống, nấu nướng
	'daily_routine',  // Sinh hoạt hàng ngày, thời gian, lịch trình, hành động
	'home_life',      // Nhà cửa, gia đình, đồ đạc, sinh hoạt
	'work_business',  // Công sở, công việc, công ty, sự nghiệp
	'transport',      // Giao thông, đi lại, phương tiện, phương hướng
	'shopping',       // Mua sắm, tiền tệ, giá cả, dịch vụ
	'nature_weather', // Thiên nhiên, thời tiết, động thực vật
	'health_body',    // Cơ thể, sức khỏe, y tế, bệnh tật
	'education',      // Học tập, trường học, thi cử, nghiên cứu
	'leisure_hobby',  // Giải trí, sở thích, thể thao, nghệ thuật
	'social_culture', // Xã hội, văn hóa, quan hệ, giao tiếp
	'tech_science',   // Công nghệ, máy móc, internet, khoa học
	'identity',       // Bản thân, tính cách, ngoại hình, cảm xúc
	'abstract_mind',  // Khái niệm trừu tượng, tư duy, suy nghĩ
	'general'         // Hư từ, từ dùng chung, phó từ phổ quát
] as const;

export type CanonicalTopic = typeof CANONICAL_TOPICS[number];

// 2. 8 Bối cảnh không gian / địa điểm (Where)
export const CANONICAL_CONTEXTS = [
	'home',        // Ở nhà
	'restaurant',  // Quán ăn, nhà hàng, quán cà phê
	'office',      // Văn phòng, nơi làm việc, công sở
	'station',     // Nhà ga, sân bay, bến xe, trên đường
	'store',       // Cửa hàng, siêu thị, trung tâm thương mại
	'hospital',    // Bệnh viện, hiệu thuốc
	'school',      // Trường học, lớp học
	'general'      // Bối cảnh tổng quát
] as const;

export type CanonicalContext = typeof CANONICAL_CONTEXTS[number];

// 3. 3 Sắc thái giao tiếp (Tone)
export const CANONICAL_TONES = [
	'polite',  // Lịch sự (thể Masu/Desu)
	'casual',  // Thân mật (thể thường, bạn bè/gia đình)
	'formal'   // Trang trọng (kính ngữ Keigo, công việc)
] as const;

export type CanonicalTone = typeof CANONICAL_TONES[number];

// 4. Bảng ánh xạ đồng nghĩa (Synonym Normalizer)
// Ép các biến thể tiếng Việt và tiếng Anh về đúng chuẩn duy nhất
export const SYNONYM_MAP: Record<string, string> = {
	// food_drink
	'food': 'food_drink',
	'drink': 'food_drink',
	'cuisine': 'food_drink',
	'meal': 'food_drink',
	'thức ăn': 'food_drink',
	'thực phẩm': 'food_drink',
	'ẩm thực': 'food_drink',
	'đồ ăn': 'food_drink',
	'uống': 'food_drink',

	// work_business
	'work': 'work_business',
	'business': 'work_business',
	'job': 'work_business',
	'công việc': 'work_business',
	'công sở': 'work_business',
	'công ty': 'work_business',

	// transport
	'travel': 'transport',
	'traffic': 'transport',
	'xe': 'transport',
	'đi lại': 'transport',
	'giao thông': 'transport',

	// home_life
	'home': 'home_life',
	'house': 'home_life',
	'family': 'home_life',
	'nhà cửa': 'home_life',
	'gia đình': 'home_life',

	// nature_weather
	'nature': 'nature_weather',
	'weather': 'nature_weather',
	'animal': 'nature_weather',
	'thiên nhiên': 'nature_weather',
	'thời tiết': 'nature_weather',
	'động vật': 'nature_weather',

	// health_body
	'health': 'health_body',
	'body': 'health_body',
	'medical': 'health_body',
	'sức khỏe': 'health_body',
	'y tế': 'health_body',

	// education
	'study': 'education',
	'school': 'education',
	'học tập': 'education',
	'trường học': 'education'
};

// 5. Metadata tiếng Việt & Icon hiển thị trên giao diện (UI)
export const TOPIC_METADATA: Record<CanonicalTopic, { label: string; icon: string }> = {
	food_drink:     { label: 'Ẩm thực & Đồ uống', icon: '🍜' },
	daily_routine:  { label: 'Sinh hoạt hàng ngày', icon: '⏰' },
	home_life:      { label: 'Nhà cửa & Đời sống', icon: '🏠' },
	work_business:  { label: 'Công việc & Công sở', icon: '💼' },
	transport:      { label: 'Giao thông & Đi lại', icon: '🚆' },
	shopping:       { label: 'Mua sắm & Tiền tệ', icon: '🛒' },
	nature_weather: { label: 'Thiên nhiên & Thời tiết', icon: '🌸' },
	health_body:    { label: 'Sức khỏe & Cơ thể', icon: '🏥' },
	education:      { label: 'Học tập & Giáo dục', icon: '📚' },
	leisure_hobby:  { label: 'Giải trí & Sở thích', icon: '🎮' },
	social_culture: { label: 'Văn hóa & Xã hội', icon: '🎎' },
	tech_science:   { label: 'Công nghệ & Kỹ thuật', icon: '💻' },
	identity:       { label: 'Bản thân & Cảm xúc', icon: '👤' },
	abstract_mind:  { label: 'Tư duy trừu tượng', icon: '🧠' },
	general:        { label: 'Từ dùng chung', icon: '🏷️' }
};

export const CONTEXT_METADATA: Record<CanonicalContext, { label: string; icon: string }> = {
	home:       { label: 'Ở nhà', icon: '🏡' },
	restaurant: { label: 'Quán ăn / Nhà hàng', icon: '🍽️' },
	office:     { label: 'Văn phòng / Nơi làm việc', icon: '🏢' },
	station:    { label: 'Nhà ga / Tàu điện', icon: '🚉' },
	store:      { label: 'Cửa hàng / Siêu thị', icon: '🏪' },
	hospital:   { label: 'Bệnh viện / Y tế', icon: '💉' },
	school:     { label: 'Trường học / Giảng đường', icon: '🏫' },
	general:    { label: 'Mọi nơi', icon: '🌐' }
};
