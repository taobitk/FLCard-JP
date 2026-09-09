import os
import sys
import json
import time
import base64
import wave
import subprocess
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def test_chat_model(model_name: str, api_key: str, results_dir: str):
    prompt = {
        "contents": [{
            "parts": [{
                "text": "Phân tích từ tiếng Nhật '猫' (con mèo) thành JSON flashcard với schema: { term: string, reading: string, romaji: string, rubyHtml: string, meaning: string, level: string, type: string, example: { japanese: string, vietnamese: string } }"
            }]
        }],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(prompt).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            elapsed = time.time() - start
            data = json.loads(res.read().decode('utf-8'))
            text = data['candidates'][0]['content']['parts'][0]['text']
            
            # Lưu file JSON
            json_file = os.path.join(results_dir, f"{model_name}.json")
            with open(json_file, 'w', encoding='utf-8') as f:
                f.write(text.strip())
                
            return {
                'model': model_name,
                'category': 'Chat/JSON',
                'status': 'SUCCESS',
                'time': f"{elapsed:.2f}s",
                'output': f"Saved to {os.path.basename(json_file)}"
            }
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        err = e.read().decode('utf-8', errors='ignore')
        return {
            'model': model_name,
            'category': 'Chat/JSON',
            'status': f"HTTP {e.code}",
            'time': f"{elapsed:.2f}s",
            'output': err[:120]
        }
    except Exception as e:
        elapsed = time.time() - start
        return {
            'model': model_name,
            'category': 'Chat/JSON',
            'status': 'ERROR',
            'time': f"{elapsed:.2f}s",
            'output': str(e)[:120]
        }

def test_tts_model(model_name: str, api_key: str, results_dir: str):
    prompt = {
        "contents": [{
            "parts": [{
                "text": "【優しく温かい日本語の先生のトーンで、ゆっくり丁寧に読んでください】：猫。ねこ。猫が部屋で寝ています。"
            }]
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
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(prompt).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=25) as res:
            elapsed = time.time() - start
            data = json.loads(res.read().decode('utf-8'))
            candidates = data.get('candidates', [])
            if candidates:
                for p in candidates[0].get('content', {}).get('parts', []):
                    if 'inlineData' in p:
                        b64_data = p['inlineData'].get('data', '')
                        pcm_bytes = base64.b64decode(b64_data)
                        
                        wav_path = os.path.join(results_dir, f"{model_name}.wav")
                        with wave.open(wav_path, 'wb') as wf:
                            wf.setnchannels(1)
                            wf.setsampwidth(2)
                            wf.setframerate(24000)
                            wf.writeframes(pcm_bytes)

                        mp3_path = os.path.join(results_dir, f"{model_name}.mp3")
                        try:
                            subprocess.run(['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', mp3_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                            out_file = f"{model_name}.mp3"
                        except Exception:
                            out_file = f"{model_name}.wav"

                        return {
                            'model': model_name,
                            'category': 'TTS/Audio',
                            'status': 'SUCCESS',
                            'time': f"{elapsed:.2f}s",
                            'output': f"Audio saved to {out_file}"
                        }
            return {
                'model': model_name,
                'category': 'TTS/Audio',
                'status': 'NO_AUDIO',
                'time': f"{elapsed:.2f}s",
                'output': 'No inlineData in response'
            }
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        err = e.read().decode('utf-8', errors='ignore')
        return {
            'model': model_name,
            'category': 'TTS/Audio',
            'status': f"HTTP {e.code}",
            'time': f"{elapsed:.2f}s",
            'output': err[:120]
        }
    except Exception as e:
        elapsed = time.time() - start
        return {
            'model': model_name,
            'category': 'TTS/Audio',
            'status': 'ERROR',
            'time': f"{elapsed:.2f}s",
            'output': str(e)[:120]
        }

def test_image_model(model_name: str, api_key: str, results_dir: str):
    prompt = {
        "contents": [{
            "parts": [{
                "text": "A cute anime style cat sitting on a tatami mat with a Japanese flashcard, bright studio lighting, vibrant colors, 1:1 square aspect ratio."
            }]
        }]
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(prompt).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=25) as res:
            elapsed = time.time() - start
            data = json.loads(res.read().decode('utf-8'))
            candidates = data.get('candidates', [])
            if candidates:
                for p in candidates[0].get('content', {}).get('parts', []):
                    if 'inlineData' in p:
                        b64_data = p['inlineData'].get('data', '')
                        mime = p['inlineData'].get('mimeType', 'image/png')
                        ext = 'jpg' if 'jpeg' in mime else 'png'
                        img_bytes = base64.b64decode(b64_data)
                        
                        img_path = os.path.join(results_dir, f"{model_name}.{ext}")
                        with open(img_path, 'wb') as f:
                            f.write(img_bytes)

                        return {
                            'model': model_name,
                            'category': 'Image',
                            'status': 'SUCCESS',
                            'time': f"{elapsed:.2f}s",
                            'output': f"Image saved to {os.path.basename(img_path)}"
                        }
                    elif 'text' in p:
                        return {
                            'model': model_name,
                            'category': 'Image',
                            'status': 'TEXT_ONLY',
                            'time': f"{elapsed:.2f}s",
                            'output': p['text'][:100]
                        }
            return {
                'model': model_name,
                'category': 'Image',
                'status': 'EMPTY',
                'time': f"{elapsed:.2f}s",
                'output': 'No candidate returned'
            }
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        err = e.read().decode('utf-8', errors='ignore')
        return {
            'model': model_name,
            'category': 'Image',
            'status': f"HTTP {e.code}",
            'time': f"{elapsed:.2f}s",
            'output': err[:120]
        }
    except Exception as e:
        elapsed = time.time() - start
        return {
            'model': model_name,
            'category': 'Image',
            'status': 'ERROR',
            'time': f"{elapsed:.2f}s",
            'output': str(e)[:120]
        }

def main():
    api_key = load_gemini_key()
    if not api_key:
        print("❌ Không tìm thấy API key")
        return

    base_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'benchmark_results')
    os.makedirs(base_dir, exist_ok=True)

    # 1. Danh sách Chat / JSON Models
    chat_models = [
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-3.1-pro-preview',
        'gemini-pro-latest'
    ]

    # 2. Danh sách TTS Models
    tts_models = [
        'gemini-3.1-flash-tts-preview',
        'gemini-2.5-flash-preview-tts',
        'gemini-2.5-pro-preview-tts'
    ]

    # 3. Danh sách Image Models
    image_models = [
        'gemini-3.1-flash-image',
        'gemini-3.1-flash-image-preview',
        'gemini-2.5-flash-image',
        'gemini-3-pro-image',
        'gemini-3-pro-image-preview'
    ]

    print(f"🚀 BẮT ĐẦU BẮN BĂNG THÔNG TOÀN DIỆN ({len(chat_models)} Chat + {len(tts_models)} TTS + {len(image_models)} Image = {len(chat_models)+len(tts_models)+len(image_models)} Models)")
    print(f"📁 Kết quả sẽ được lưu vào: {os.path.abspath(base_dir)}\n")

    results = []

    # Chạy đồng thời theo từng nhóm với worker pool an toàn (max 4 concurrent để không kích hoạt DDoS firewall)
    all_tasks = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        for m in chat_models:
            all_tasks.append(executor.submit(test_chat_model, m, api_key, base_dir))
        for m in tts_models:
            all_tasks.append(executor.submit(test_tts_model, m, api_key, base_dir))
        for m in image_models:
            all_tasks.append(executor.submit(test_image_model, m, api_key, base_dir))

        for future in as_completed(all_tasks):
            res = future.result()
            results.append(res)
            status_icon = "✅" if res['status'] == 'SUCCESS' else ("⚠️" if "HTTP" in res['status'] else "❌")
            print(f"{status_icon} [{res['category']}] {res['model']:<30} | {res['status']:<10} | {res['time']:<6} | {res['output']}")

    # Ghi file báo cáo tổng hợp
    report_file = os.path.join(base_dir, "benchmark_report.json")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"🎉 HOÀN TẤT ĐO ĐẠC! Báo cáo chi tiết đã lưu tại: {report_file}")
    print("=" * 80)

if __name__ == '__main__':
    main()
