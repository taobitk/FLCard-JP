-- Migration: 0001_initial_schema.sql
-- Tạo bảng cards lưu trữ bộ flashcard tiếng Nhật và seed dữ liệu JLPT N5

CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    term TEXT NOT NULL,
    reading TEXT NOT NULL,
    romaji TEXT NOT NULL,
    ruby_html TEXT NOT NULL,
    meaning TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    card_type TEXT,
    image_url TEXT,
    example_ja TEXT,
    example_vi TEXT,
    example_ruby_html TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cards_level ON cards(level);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- Seed Data: 10 Thẻ từ vựng JLPT N5 chuẩn thật
INSERT OR IGNORE INTO cards (id, term, reading, romaji, ruby_html, meaning, level, card_type, image_url, example_ja, example_vi, example_ruby_html, created_at) VALUES
('card-seed-1', '食べる', 'たべる', 'taberu', '<ruby>食<rt>た</rt></ruby>べる', 'Ăn (thức ăn, cơm)', 'N5', 'Động từ nhóm 2', '', 'ご飯を食べます。', 'Tôi ăn cơm.', 'ご<ruby>飯<rt>はん</rt></ruby>を<ruby>食<rt>た</rt></ruby>べます。', 1700000001000),
('card-seed-2', '飲む', 'のむ', 'nomu', '<ruby>飲<rt>の</rt></ruby>む', 'Uống (nước, trà)', 'N5', 'Động từ nhóm 1', '', '水を飲みます。', 'Tôi uống nước.', '<ruby>水<rt>みず</rt></ruby>を<ruby>飲<rt>の</rt></ruby>みます。', 1700000002000),
('card-seed-3', '日本語', 'にほんご', 'nihongo', '<ruby>日本語<rt>にほんご</rt></ruby>', 'Tiếng Nhật', 'N5', 'Danh từ', '', '日本語を勉強します。', 'Tôi học tiếng Nhật.', '<ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>します。', 1700000003000),
('card-seed-4', '猫', 'ねこ', 'neko', '<ruby>猫<rt>ねこ</rt></ruby>', 'Con mèo', 'N5', 'Danh từ', '', '猫が好きです。', 'Tôi thích mèo.', '<ruby>猫<rt>ねこ</rt></ruby>が<ruby>好<rt>す</rt></ruby>きです。', 1700000004000),
('card-seed-5', '犬', 'いぬ', 'inu', '<ruby>犬<rt>いぬ</rt></ruby>', 'Con chó', 'N5', 'Danh từ', '', '白い犬がいます。', 'Có một con chó màu trắng.', '<ruby>白<rt>しろ</rt></ruby>い<ruby>犬<rt>いぬ</rt></ruby>がいます。', 1700000005000),
('card-seed-6', '勉強する', 'べんきょうする', 'benkyousuru', '<ruby>勉強<rt>べんきょう</rt></ruby>する', 'Học tập, rèn luyện', 'N5', 'Động từ nhóm 3', '', '毎日勉強します。', 'Tôi học mỗi ngày.', '<ruby>毎日<rt>まいにち</rt></ruby><ruby>勉強<rt>べんきょう</rt></ruby>します。', 1700000006000),
('card-seed-7', '桜', 'さくら', 'sakura', '<ruby>桜<rt>さくら</rt></ruby>', 'Hoa anh đào', 'N5', 'Danh từ', '', '桜が綺麗です。', 'Hoa anh đào thật đẹp.', '<ruby>桜<rt>さくら</rt></ruby>が<ruby>綺麗<rt>きれい</rt></ruby>です。', 1700000007000),
('card-seed-8', '行く', 'いく', 'iku', '<ruby>行<rt>い</rt></ruby>く', 'Đi (tới nơi nào đó)', 'N5', 'Động từ nhóm 1', '', '学校へ行きます。', 'Tôi đi đến trường.', '<ruby>学校<rt>がっこう</rt></ruby>へ<ruby>行<rt>い</rt></ruby>きます。', 1700000008000),
('card-seed-9', '来る', 'くる', 'kuru', '<ruby>来<rt>く</rt></ruby>る', 'Đến, tới', 'N5', 'Động từ nhóm 3', '', '友達が来ます。', 'Bạn tôi sẽ đến.', '<ruby>友達<rt>ともだち</rt></ruby>が<ruby>来<rt>き</rt></ruby>ます。', 1700000009000),
('card-seed-10', '見る', 'みる', 'miru', '<ruby>見<rt>み</rt></ruby>る', 'Nhìn, xem, ngắm', 'N5', 'Động từ nhóm 2', '', '映画を見ます。', 'Tôi xem phim.', '<ruby>映画<rt>えいが</rt></ruby>を<ruby>見<rt>み</rt></ruby>ます。', 1700000010000);
