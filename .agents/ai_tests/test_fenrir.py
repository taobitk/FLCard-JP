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
    with open(dev_vars_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'GEMINI_API_KEY' in line:
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

def test_single_voice(voice_name, out_name, prompt_text):
    api_key = load_gemini_key()
    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'tts_comparison')
    os.makedirs(out_dir, exist_ok=True)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key={api_key}"
    body = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "response_modalities": ["AUDIO"],
            "speech_config": {
                "voice_config": {
                    "prebuilt_voice_config": {
                        "voice_name": voice_name
                    }
                }
            }
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode('utf-8'))
            candidates = data.get('candidates', [])
            if candidates:
                for p in candidates[0].get('content', {}).get('parts', []):
                    if 'inlineData' in p:
                        b64_data = p['inlineData'].get('data', '')
                        pcm_bytes = base64.b64decode(b64_data)
                        
                        wav_path = os.path.join(out_dir, f"{out_name}.wav")
                        with wave.open(wav_path, 'wb') as wf:
                            wf.setnchannels(1)
                            wf.setsampwidth(2)
                            wf.setframerate(24000)
                            wf.writeframes(pcm_bytes)

                        mp3_path = os.path.join(out_dir, f"{out_name}.mp3")
                        try:
                            subprocess.run(['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', mp3_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                            print(f"✅ Thành công giọng {voice_name}: {out_name}.mp3")
                            return True
                        except Exception:
                            print(f"✅ Thành công giọng {voice_name}: {out_name}.wav")
                            return True
    except Exception as e:
        print(f"❌ Lỗi giọng {voice_name}: {e}")
    return False

# Thử giọng nam fenrir (trầm ấm) và despinas
test_single_voice("fenrir", "tts_4_gemini_3_1_fenrir", "【落ち着いた大人の男性教師のトーンで、ゆっくり発音してください】：猫。ねこ。可愛い猫がいますね。")
