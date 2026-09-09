"""
Script kiểm tra tính hợp lệ của file JSON dữ liệu từ vựng JLPT (FLCard-JP)
Sử dụng: python validate.py <path_to_json>
"""
import sys
import json
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def validate(file_path):
    if not os.path.exists(file_path):
        print(f"❌ Lỗi: File không tồn tại '{file_path}'")
        return False

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Lỗi JSON: {e}")
        return False

    errors = []
    if not data.get("deckId"):
        errors.append("Thiếu trường 'deckId'")
    if not data.get("title"):
        errors.append("Thiếu trường 'title'")
    if data.get("level") not in ["N5", "N4", "N3", "N2", "N1"]:
        errors.append(f"Giá trị 'level' không hợp lệ: {data.get('level')}")

    cards = data.get("cards", [])
    if not isinstance(cards, list) or len(cards) == 0:
        errors.append("Trường 'cards' phải là mảng và không được để trống")
    else:
        for idx, card in enumerate(cards, 1):
            name = card.get("term", f"Thẻ #{idx}")
            if not card.get("id"):
                errors.append(f"{name}: Thiếu 'id'")
            if not card.get("term"):
                errors.append(f"{name}: Thiếu 'term'")
            if not card.get("reading"):
                errors.append(f"{name}: Thiếu 'reading'")
            if not card.get("meaning"):
                errors.append(f"{name}: Thiếu 'meaning'")
            ruby = card.get("rubyHtml")
            if ruby and ("<ruby>" not in ruby or "<rt>" not in ruby):
                errors.append(f"{name}: 'rubyHtml' sai cấu trúc <ruby>...<rt>...</rt></ruby>")

    if errors:
        print(f"❌ Phát hiện {len(errors)} lỗi trong file:")
        for err in errors:
            print(f"  - {err}")
        return False

    print(f"✅ Dữ liệu hợp lệ! Đã kiểm tra {len(cards)} thẻ trong bộ '{data.get('title')}'.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python validate.py <path_to_json>")
        sys.exit(1)
    
    ok = validate(sys.argv[1])
    sys.exit(0 if ok else 1)
