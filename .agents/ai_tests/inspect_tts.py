import urllib.request, json, os

dev_vars = open('.dev.vars', encoding='utf-8').read()
key = [line.split('=')[1].strip().strip('\'"') for line in dev_vars.splitlines() if 'GEMINI_API_KEY' in line][0]

prompt = {
    'contents': [{'parts': [{'text': '【優しく温かい日本語の先生のトーンで、ゆっくり丁寧に読んでください】：猫。ねこ。猫が部屋で寝ています。'}]}],
    'generationConfig': {
        'response_modalities': ['AUDIO'],
        'speech_config': {'voice_config': {'prebuilt_voice_config': {'voice_name': 'kore'}}}
    }
}

req = urllib.request.Request(
    f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key={key}',
    data=json.dumps(prompt).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.loads(res.read().decode('utf-8'))
        candidates = data.get('candidates', [])
        if candidates:
            parts = candidates[0].get('content', {}).get('parts', [])
            for p in parts:
                if 'inlineData' in p:
                    print("✅ Có inlineData audio! mimeType:", p['inlineData']['mimeType'])
                elif 'text' in p:
                    print("⚠️ Trả về Text thay vì Audio:", p['text'])
        else:
            print("❌ Không có candidates:", data)
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code, e.read().decode('utf-8'))
