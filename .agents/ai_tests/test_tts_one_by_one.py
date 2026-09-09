import os
import sys
import json
import time
import base64
import wave
import subprocess
import urllib.request
import urllib.error

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
        print("❌ Không tìm thấy GEMINI_API_KEY")
        return

    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'tts_comparison')
    os.makedirs(out_dir, exist_ok=True)

    test_cases = [
        {
            "id": "tts_1_gemini_3_1_kore",
            "model": "gemini-3.1-flash-tts-preview",
            "voice": "kore",
            "title": "Gemini 3.1 Flash - Giọng nữ Kore (Cô giáo dịu dàng)",
            "prompt": "【優しく丁寧な日本語教師のトーンで、ゆっくり発音してください】：猫。ねこ。可愛い猫が部屋で寝ています。"
        },
        {
            "id": "tts_2_gemini_2_5_kore",
            "model": "gemini-2.5-flash-preview-tts",
            "voice": "kore",
            "title": "Gemini 2.5 Flash - Giọng nữ Kore",
            "prompt": "【優しく丁寧な日本語教師のトーンで、ゆっくり発音してください】：猫。ねこ。可愛い猫が部屋で寝ています。"
        },
        {
            "id": "tts_3_gemini_3_1_aoede",
            "model": "gemini-3.1-flash-tts-preview",
            "voice": "aoede",
            "title": "Gemini 3.1 Flash - Giọng nữ Aoede (Ngọt ngào, truyền cảm)",
            "prompt": "【優しく丁寧な日本語教師のトーンで、ゆっくり発音してください】：猫。ねこ。可愛い猫が部屋で寝ています。"
        },
        {
            "id": "tts_4_gemini_3_1_puck",
            "model": "gemini-3.1-flash-tts-preview",
            "voice": "puck",
            "title": "Gemini 3.1 Flash - Giọng nam Puck (Thầy giáo ấm áp)",
            "prompt": "【優しく丁寧な日本語教師のトーンで、ゆっくり発音してください】：猫。ねこ。可愛い猫が部屋で寝ています。"
        },
        {
            "id": "tts_5_gemini_2_5_pro",
            "model": "gemini-2.5-pro-preview-tts",
            "voice": "kore",
            "title": "Gemini 2.5 Pro - Giọng nữ Kore (Bản Pro chuyên sâu)",
            "prompt": "【優しく丁寧な日本語教師のトーンで、ゆっくり発音してください】：猫。ねこ。可愛い猫が部屋で寝ています。"
        }
    ]

    print("=" * 80)
    print(f"🎙️ BẮT ĐẦU TEST TỪNG MODEL TTS TUẦN TỰ ({len(test_cases)} cấu hình)")
    print(f"📁 Thư mục lưu file: {os.path.abspath(out_dir)}")
    print("=" * 80)

    results = []

    for i, tc in enumerate(test_cases, 1):
        print(f"\n[{i}/{len(test_cases)}] ⏳ Đang gọi {tc['title']}...")
        
        body = {
            "contents": [{
                "parts": [{"text": tc['prompt']}]
            }],
            "generationConfig": {
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": tc['voice']
                        }
                    }
                }
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{tc['model']}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')

        start = time.time()
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                elapsed = time.time() - start
                data = json.loads(res.read().decode('utf-8'))
                candidates = data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    for p in parts:
                        if 'inlineData' in p:
                            b64_data = p['inlineData'].get('data', '')
                            pcm_bytes = base64.b64decode(b64_data)
                            
                            wav_path = os.path.join(out_dir, f"{tc['id']}.wav")
                            with wave.open(wav_path, 'wb') as wf:
                                wf.setnchannels(1)
                                wf.setsampwidth(2)
                                wf.setframerate(24000)
                                wf.writeframes(pcm_bytes)

                            mp3_path = os.path.join(out_dir, f"{tc['id']}.mp3")
                            try:
                                subprocess.run(['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', mp3_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                                saved_file = f"{tc['id']}.mp3"
                            except Exception:
                                saved_file = f"{tc['id']}.wav"

                            size_kb = os.path.getsize(os.path.join(out_dir, saved_file)) // 1024
                            print(f"   ✅ THÀNH CÔNG trong {elapsed:.2f}s! Đã lưu: {saved_file} ({size_kb} KB)")
                            results.append({
                                'id': tc['id'],
                                'title': tc['title'],
                                'model': tc['model'],
                                'voice': tc['voice'],
                                'status': 'SUCCESS',
                                'time': f"{elapsed:.2f}s",
                                'file': saved_file
                            })
                            break
                    else:
                        print(f"   ⚠️ Không tìm thấy inlineData audio trong phản hồi ({elapsed:.2f}s)")
                        results.append({'id': tc['id'], 'title': tc['title'], 'status': 'NO_AUDIO', 'time': f"{elapsed:.2f}s"})
                else:
                    print(f"   ⚠️ Candidates rỗng ({elapsed:.2f}s)")
                    results.append({'id': tc['id'], 'title': tc['title'], 'status': 'EMPTY', 'time': f"{elapsed:.2f}s"})

        except urllib.error.HTTPError as e:
            elapsed = time.time() - start
            err = e.read().decode('utf-8', errors='ignore')
            print(f"   ❌ Thất bại: HTTP {e.code} ({elapsed:.2f}s) - {err[:100]}")
            results.append({'id': tc['id'], 'title': tc['title'], 'status': f"HTTP {e.code}", 'time': f"{elapsed:.2f}s"})
        except Exception as e:
            elapsed = time.time() - start
            print(f"   ❌ Lỗi: {e} ({elapsed:.2f}s)")
            results.append({'id': tc['id'], 'title': tc['title'], 'status': 'ERROR', 'time': f"{elapsed:.2f}s"})

        # Nghỉ 3 giây giữa các lượt gọi để an toàn 100% không bị rate limit
        if i < len(test_cases):
            print("   ⏳ Nghỉ 3s để bảo đảm quota...")
            time.sleep(3)

    print("\n" + "=" * 80)
    print("📊 TỔNG HỢP KẾT QUẢ TEST TTS TUẦN TỰ:")
    for r in results:
        status_icon = "✅" if r['status'] == 'SUCCESS' else "❌"
        file_info = f" -> File: {r.get('file')}" if 'file' in r else ""
        print(f" {status_icon} {r['title']:<50} | {r['status']:<10} | {r['time']}{file_info}")
    print("=" * 80)

if __name__ == '__main__':
    main()
