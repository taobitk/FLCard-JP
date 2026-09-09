import os
import sys
import json
import time
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_gemini_key():
    dev_vars_path = os.path.join(os.path.dirname(__file__), '..', '..', '.dev.vars')
    with open(dev_vars_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'GEMINI_API_KEY' in line:
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

def test_gemini_strict():
    api_key = load_gemini_key()
    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'benchmark_results')
    os.makedirs(out_dir, exist_ok=True)

    test_word = "勉強する"
    models = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash"]

    # Prompt có yêu cầu chặt chẽ về example.rubyHtml
    strict_prompt = {
        "contents": [{
            "parts": [{
                "text": f"""Phân tích từ vựng tiếng Nhật '{test_word}' thành JSON flashcard với schema:
{{
  "term": "{test_word}",
  "reading": "hiragana của từ",
  "romaji": "romaji",
  "rubyHtml": "<ruby>勉<rt>べん</rt></ruby><ruby>強<rt>きょう</rt></ruby>する",
  "meaning": "nghĩa tiếng Việt",
  "level": "N5",
  "type": "loại từ",
  "example": {{
    "japanese": "câu ví dụ tiếng Nhật",
    "vietnamese": "nghĩa tiếng Việt của câu ví dụ",
    "rubyHtml": "BẮT BUỘC: Toàn bộ chữ Kanji trong câu ví dụ phải được bọc thẻ ruby Furigana, chữ Kana giữ nguyên"
  }}
}}
Chỉ xuất ra duy nhất JSON hợp lệ."""
            }]
        }],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }

    print("=" * 80)
    print("🔬 TEST XEM GEMINI 3.5, 3.6, 3.7 CÓ BỊ LÀM ẨU KHI PROMPT YÊU CẦU CHẶT KHÔNG")
    print("=" * 80)

    for m in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=json.dumps(strict_prompt).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
        start = time.time()
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                elapsed = time.time() - start
                data = json.loads(res.read().decode('utf-8'))
                text = data['candidates'][0]['content']['parts'][0]['text']
                
                # Lưu file
                out_file = os.path.join(out_dir, f"{m}_benkyou_strict.json")
                with open(out_file, 'w', encoding='utf-8') as f:
                    f.write(text.strip())

                print(f"\n🔹 Model: {m} (Tốc độ: {elapsed:.2f}s)")
                print(f"   Kết quả JSON:\n{text.strip()}")
        except Exception as e:
            print(f"❌ {m} lỗi: {e}")

if __name__ == '__main__':
    test_gemini_strict()
