import os
import sys
import json
import urllib.request

# Khắc phục UTF-8 trên Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_gemini_key():
    dev_vars_path = os.path.join(os.path.dirname(__file__), '..', '..', '.dev.vars')
    if not os.path.exists(dev_vars_path):
        return None
    try:
        with open(dev_vars_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GEMINI_API_KEY=') or line.startswith('GEMINI_API_KEY ='):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        return parts[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return None

def main():
    api_key = load_gemini_key()
    if not api_key:
        print("❌ Không tìm thấy GEMINI_API_KEY trong .dev.vars")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    req = urllib.request.Request(url, method='GET')
    
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode('utf-8'))
            models = data.get('models', [])
    except Exception as e:
        print(f"❌ Lỗi truy vấn API: {e}")
        return

    # Phân loại các model
    flash_lite = []
    flash_general = []
    tts_audio = []
    pro_reasoning = []
    embedding_special = []

    for m in models:
        name = m.get('name', '').replace('models/', '')
        disp = m.get('displayName', '')
        methods = m.get('supportedGenerationMethods', [])
        in_limit = m.get('inputTokenLimit', 0)
        out_limit = m.get('outputTokenLimit', 0)

        # Bỏ qua các model chỉ embed
        if 'generateContent' not in methods:
            embedding_special.append((name, disp, methods))
            continue

        item = {
            'name': name,
            'displayName': disp,
            'inputLimit': in_limit,
            'outputLimit': out_limit,
            'desc': m.get('description', '')
        }

        if 'tts' in name.lower() or 'audio' in name.lower():
            tts_audio.append(item)
        elif 'lite' in name.lower():
            flash_lite.append(item)
        elif 'flash' in name.lower():
            flash_general.append(item)
        elif 'pro' in name.lower():
            pro_reasoning.append(item)
        else:
            flash_general.append(item)

    print("=" * 80)
    print(f"📋 TỔNG HỢP TOÀN BỘ CÁC MODEL KHẢ DỤNG CHO API KEY CỦA BẠN ({len(models)} Models)")
    print("=" * 80)

    print("\n⚡ 1. NHÓM SIÊU TỐC & TIẾT KIỆM QUOTA (FLASH-LITE - TỐT NHẤT CHO TẠO THẺ):")
    for m in flash_lite:
        print(f"   • {m['name']:<30} | Input: {m['inputLimit']:>10,} tokens | Output: {m['outputLimit']:>6,} tokens")

    print("\n🎧 2. NHÓM PHÁT ÂM THANH & GIỌNG ĐỌC (TTS - TEXT TO SPEECH):")
    for m in tts_audio:
        print(f"   • {m['name']:<30} | {m['displayName']}")

    print("\n🚀 3. NHÓM ĐA DỤNG TỐC ĐỘ CAO (FLASH SERIES):")
    for m in flash_general:
        print(f"   • {m['name']:<30} | Input: {m['inputLimit']:>10,} tokens | Output: {m['outputLimit']:>6,} tokens")

    print("\n🧠 4. NHÓM SUY LUẬN SÂU (PRO SERIES):")
    for m in pro_reasoning:
        print(f"   • {m['name']:<30} | Input: {m['inputLimit']:>10,} tokens | Output: {m['outputLimit']:>6,} tokens")

    print("\n" + "=" * 80)

if __name__ == '__main__':
    main()
