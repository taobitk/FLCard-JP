import os
import sys
import json
import urllib.request
import urllib.error

# Khắc phục bảng mã UTF-8 trên Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_gemini_key():
    dev_vars_path = os.path.join(os.path.dirname(__file__), '..', '..', '.dev.vars')
    if not os.path.exists(dev_vars_path):
        print("❌ Không tìm thấy file .dev.vars tại thư mục gốc của dự án.")
        return None

    try:
        with open(dev_vars_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GEMINI_API_KEY=') or line.startswith('GEMINI_API_KEY ='):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key = parts[1].strip().strip('"').strip("'")
                        if key:
                            return key
    except Exception as e:
        print(f"❌ Lỗi khi đọc file .dev.vars: {e}")
        return None

    return None

def list_all_models(api_key: str):
    print("🔍 Đang truy vấn danh sách toàn bộ model từ Google Gemini API...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    try:
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode('utf-8'))
            models = data.get('models', [])
            print(f"\n📋 TỔNG CỘNG CÓ {len(models)} MODELS KHẢ DỤNG:")
            flash_models = []
            for m in models:
                name = m.get('name', '').replace('models/', '')
                methods = m.get('supportedGenerationMethods', [])
                if 'generateContent' in methods:
                    if 'flash' in name.lower() or 'lite' in name.lower():
                        flash_models.append(name)
            
            print("\n⚡ CÁC MODEL FLASH & LITE TỐC ĐỘ CAO:")
            for fm in flash_models:
                print(f"   • {fm}")
            return True
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách model: {e}")
        return False

def test_tts_models(api_key: str):
    tts_models = [
        "gemini-3.1-flash-tts-preview",
        "gemini-2.5-flash-preview-tts",
        "gemini-3.5-transcribe"
    ]
    
    print("🔍 KIỂM TRA METADATA CỦA CÁC MODEL TTS:")
    for model in tts_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}?key={api_key}"
        try:
            req = urllib.request.Request(url, method='GET')
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode('utf-8'))
                name = data.get('name')
                methods = data.get('supportedGenerationMethods')
                desc = data.get('description', '')
                print(f"\n🔹 Model: {name}")
                print(f"   Phương thức: {methods}")
                print(f"   Mô tả: {desc[:100]}...")
        except urllib.error.HTTPError as e:
            print(f"\n❌ Model {model}: HTTP {e.code} - {e.read().decode('utf-8', errors='ignore')}")
        except Exception as e:
            print(f"\n❌ Model {model}: {e}")

    # Thử nghiệm tinh chỉnh phong cách & ngữ điệu (Style Prompting)
    import base64
    import wave
    import subprocess

    # Thử nghiệm 2 phong cách tinh chỉnh cho giọng Kore:
    # 1. Cô giáo dịu dàng, phát âm chậm rãi rõ ràng
    # 2. Cô bé vui tươi, dễ thương, truyền cảm hứng học tập
    variations = [
        {
            "name": "kore_gentle_teacher",
            "title": "Cô giáo dịu dàng, chuẩn mực",
            "prompt": "【優しく温かい日本語の先生のトーンで、発音をはっきりと、ゆっくり丁寧に読んでください】：こんにちは！今日も一緒に日本語の勉強を頑張りましょうね。"
        },
        {
            "name": "kore_cheerful_anime",
            "title": "Vui tươi, dễ thương (Anime style)",
            "prompt": "【明るく元気で、可愛らしいトーンで、親しみやすく読んでください】：こんにちは！今日も一緒に日本語の勉強を頑張りましょう！"
        }
    ]

    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'audio')
    os.makedirs(out_dir, exist_ok=True)

    model = "gemini-3.1-flash-tts-preview"
    for item in variations:
        print(f"\n🎧 Đang tạo giọng Kore ({item['title']})...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        body = {
            "contents": [{
                "parts": [{"text": item['prompt']}]
            }],
            "generationConfig": {
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": "kore"
                        }
                    }
                }
            }
        }

        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=25) as res:
                data = json.loads(res.read().decode('utf-8'))
                candidates = data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    for p in parts:
                        if 'inlineData' in p:
                            b64_data = p['inlineData'].get('data', '')
                            pcm_bytes = base64.b64decode(b64_data)
                            
                            wav_path = os.path.join(out_dir, f"{item['name']}.wav")
                            with wave.open(wav_path, 'wb') as wf:
                                wf.setnchannels(1)
                                wf.setsampwidth(2)
                                wf.setframerate(24000)
                                wf.writeframes(pcm_bytes)

                            mp3_path = os.path.join(out_dir, f"{item['name']}.mp3")
                            try:
                                cmd = ['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', mp3_path]
                                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                                print(f"✅ Đã tạo thành công: {item['name']}.mp3")
                            except Exception:
                                pass
        except Exception as e:
            print(f"❌ Lỗi: {e}")

    return True

def test_gemini_api(api_key: str):
    test_tts_models(api_key)
    return True
    
    test_prompt = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Hãy trả lời cực ngắn gọn: 'Chào bạn! Kết nối Gemini API đã sẵn sàng cho FLCard-JP!' kèm từ vựng tiếng Nhật '猫 (neko - con mèo)'."
                    }
                ]
            }
        ]
    }

    req_data = json.dumps(test_prompt).encode('utf-8')

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                status_code = response.getcode()
                res_body = response.read().decode('utf-8')
                res_json = json.loads(res_body)

                # Trích xuất text phản hồi
                candidates = res_json.get('candidates', [])
                if candidates:
                    content_parts = candidates[0].get('content', {}).get('parts', [])
                    if content_parts:
                        reply_text = content_parts[0].get('text', '').strip()
                        print("\n=======================================================")
                        print(f"🎉 KẾT NỐI GEMINI API THÀNH CÔNG RỰC RỠ! (HTTP {status_code})")
                        print(f"🔹 Model hoạt động: {model}")
                        print(f"🔹 Phản hồi từ AI:")
                        print(f"   \"{reply_text}\"")
                        print("=======================================================\n")
                        return True
                
                print(f"⚠️ Model {model} trả về 200 nhưng cấu trúc không có text: {res_body}")
                return True

        except urllib.error.HTTPError as err:
            err_body = err.read().decode('utf-8', errors='ignore')
            print(f"⚠️ Thử nghiệm {model} thất bại (HTTP {err.code}):")
            try:
                err_json = json.loads(err_body)
                error_msg = err_json.get('error', {}).get('message', err_body)
                print(f"   Chi tiết: {error_msg}")
            except Exception:
                print(f"   Chi tiết: {err_body}")

        except Exception as e:
            print(f"❌ Lỗi mạng / kết nối với {model}: {e}")

    print("\n🔍 Đang truy vấn danh sách models được cấp phép cho API key này...")
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    try:
        req = urllib.request.Request(list_url, method='GET')
        with urllib.request.urlopen(req, timeout=10) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            models_list = [m.get('name', '').replace('models/', '') for m in res_data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
            print(f"📋 Các models hỗ trợ generateContent hiện có: {models_list[:6]}")
    except Exception as e:
        print(f"⚠️ Không thể lấy danh sách models: {e}")

    return False

if __name__ == '__main__':
    key = load_gemini_key()
    if not key:
        print("❌ Không tìm thấy giá trị của GEMINI_API_KEY trong file .dev.vars hoặc key đang bị rỗng.")
        sys.exit(1)

    # In ra xác nhận có key mà không làm lộ secret
    masked_key = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
    print(f"🔑 Đã tìm thấy GEMINI_API_KEY (Định dạng: {masked_key})")

    success = test_gemini_api(key)
    if not success:
        sys.exit(1)
