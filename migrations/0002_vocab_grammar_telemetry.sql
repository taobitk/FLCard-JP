-- Migration: 0002_vocab_grammar_telemetry.sql
-- Khởi tạo bảng Ngữ pháp (grammars) và Bảng Hộp đen hành vi học tập (study_telemetry)

-- 1. BẢNG NGỮ PHÁP (GRAMMAR)
CREATE TABLE IF NOT EXISTS grammars (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,                                    -- Ví dụ: V-てください
    meaning TEXT NOT NULL,                                  -- Ví dụ: Xin hãy / Vui lòng làm V
    level TEXT NOT NULL CHECK(level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    connection_rule TEXT NOT NULL,                          -- Cách kết hợp: 'Động từ thể Te (V-て) + ください'
    target_pos TEXT NOT NULL,                               -- Áp dụng cho loại từ: 'verb', 'adj', 'noun'
    explanation TEXT,                                       -- Bối cảnh, sắc thái diễn đạt
    example_ja TEXT,                                        -- Câu mẫu tiếng Nhật
    example_vi TEXT,                                        -- Dịch nghĩa câu mẫu
    example_ruby_html TEXT,                                 -- Furigana câu mẫu
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grammars_level ON grammars(level);

-- 2. BẢNG HỘP ĐEN HÀNH VI HỌC TẬP (BEHAVIORAL TELEMETRY & MEMORY SCIENCE)
CREATE TABLE IF NOT EXISTS study_telemetry (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,                                  -- ID từ vựng (cards/vocabularies) hoặc ngữ pháp
    item_type TEXT NOT NULL CHECK(item_type IN ('vocab', 'grammar')),
    
    -- Dữ liệu chủ quan (User tự đánh giá):
    user_rating INTEGER NOT NULL CHECK(user_rating BETWEEN 1 AND 4), -- 1: Again, 2: Hard, 3: Good, 4: Easy
    
    -- Dữ liệu hành vi khách quan (Đo lường thời gian thực):
    latency_ms INTEGER NOT NULL DEFAULT 0,                  -- Độ trễ nhận thức (thời gian trước khi lật thẻ)
    review_duration_ms INTEGER NOT NULL DEFAULT 0,          -- Thời gian xem đáp án trước khi bấm chấm điểm
    
    -- Thông số toán học trí nhớ (SRS state):
    repetition_count INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    is_lapsed INTEGER DEFAULT 0,                            -- 1 nếu bị quên từ chu kỳ dài về 0
    
    -- Bối cảnh phiên học (Behavioral context):
    session_id TEXT,                                        -- Mã phiên học để gom cụm
    card_order_in_session INTEGER,                          -- Thứ tự thẻ trong phiên (đo mệt mỏi nhận thức)
    hour_of_day INTEGER NOT NULL,                           -- Học lúc mấy giờ (0 - 23h)
    
    created_at INTEGER NOT NULL                             -- Timestamp chính xác
);

CREATE INDEX IF NOT EXISTS idx_telemetry_item ON study_telemetry(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON study_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_hour ON study_telemetry(hour_of_day);

-- 3. SEED DỮ LIỆU MẪU NGỮ PHÁP N5 CƠ BẢN
INSERT OR IGNORE INTO grammars (id, title, meaning, level, connection_rule, target_pos, explanation, example_ja, example_vi, example_ruby_html, created_at) VALUES
('g-n5-01', 'V-てください', 'Xin hãy / Vui lòng làm V', 'N5', 'V-て + ください', 'verb', 'Dùng khi yêu cầu hoặc nhờ vả đối phương một cách lịch sự.', '水を飲んでください。', 'Xin hãy uống nước.', '<ruby>水<rt>みず</rt></ruby>を<ruby>飲<rt>の</rt></ruby>んでください。', 1700000000000),
('g-n5-02', 'V-たいです', 'Muốn làm V', 'N5', 'V(bỏ ます) + たいです', 'verb', 'Bày tỏ mong muốn, nguyện vọng của bản thân ở hiện tại.', '日本へ行きたいです。', 'Tôi muốn đi Nhật Bản.', '<ruby>日本<rt>にほん</rt></ruby>へ<ruby>行<rt>い</rt></ruby>きたいです。', 1700000000001),
('g-n5-03', 'N + が好きです', 'Thích N', 'N5', 'N + が + 好きです', 'noun', 'Bày tỏ sở thích đối với một đối tượng, sự vật.', '猫が好きです。', 'Tôi thích mèo.', '<ruby>猫<rt>ねこ</rt></ruby>が<ruby>好<rt>す</rt></ruby>きです。', 1700000000002),
('g-n5-04', 'V-てもいいです', 'Được phép làm V', 'N5', 'V-て + もいいです', 'verb', 'Biểu thị sự cho phép hoặc hỏi xin phép đối phương.', '写真を撮ってもいいです。', 'Được phép chụp ảnh.', '<ruby>写真<rt>しゃしん</rt></ruby>を<ruby>撮<rt>と</rt></ruby>ってもいいです。', 1700000000003);
