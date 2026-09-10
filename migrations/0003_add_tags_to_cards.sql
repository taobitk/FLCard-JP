-- Migration: 0003_add_tags_to_cards.sql
-- Bổ sung trường tags (chuỗi JSON mảng tag chuẩn hóa) vào bảng cards

ALTER TABLE cards ADD COLUMN tags TEXT DEFAULT '[]';

-- Cập nhật tag mẫu cho các thẻ seed hiện có
UPDATE cards SET tags = '["where:restaurant", "topic:food_drink", "tone:polite"]' WHERE term IN ('食べる', '飲む');
UPDATE cards SET tags = '["where:school", "topic:education", "tone:polite"]' WHERE term IN ('日本語', '勉強する');
UPDATE cards SET tags = '["where:home_life", "topic:nature_weather", "tone:casual"]' WHERE term IN ('猫', '犬');
UPDATE cards SET tags = '["where:nature_weather", "topic:nature_weather", "tone:polite"]' WHERE term = '桜';
UPDATE cards SET tags = '["where:transport", "topic:daily_routine", "tone:polite"]' WHERE term IN ('行く', '来る', '見る');
