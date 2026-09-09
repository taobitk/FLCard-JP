import os
import sys
import json
import time
import urllib.request
import urllib.error

# Khắc phục bảng mã UTF-8 trên Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_dev_vars():
    dev_vars_path = os.path.join(os.path.dirname(__file__), '..', '..', '.dev.vars')
    env = {}
    with open(dev_vars_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def test_compare_models():
    env = load_dev_vars()
    account_id = "84dbdcece9a6564c85eefabe074023cb"
    api_token = env.get('CLOUDFLARE_WORKERS_API_KEY') or env.get('CLOUDFLARE_API_TOKEN')

    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'cf_ai_results')
    os.makedirs(out_dir, exist_ok=True)

    # Thử thách phức tạp: Từ '勉強する' (Động từ nhóm 3, yêu cầu thẻ ruby chuẩn)
    test_word = "勉強する"
    prompt_instruction = f"Phân tích từ vựng tiếng Nhật '{test_word}' thành JSON flashcard với format: {{ term: string, reading: string, romaji: string, rubyHtml: string (chỉ bọc kanji trong ruby, ví dụ <ruby>勉<rt>べん</rt></ruby><ruby>強<rt>きょう</rt></ruby>する), meaning: string (tiếng Việt), level: 'N5'|'N4'|'N3'|'N2'|'N1', type: string, example: {{ japanese: string, vietnamese: string, rubyHtml: string }} }}. Chỉ trả về JSON duy nhất, không thêm giải thích."

    models = [
        "@cf/zai-org/glm-4.7-flash",
        "@cf/google/gemma-4-26b-a4b-it",
        "@cf/nvidia/nemotron-3-120b-a12b"
    ]

    print("=" * 80)
    print("🥊 ĐẠI CHIẾN SO GĂNG: CLOUDFLARE WORKERS AI vs GOOGLE GEMINI (Từ '勉強する')")
    print("=" * 80)

    results = {}

    for model in models:
        print(f"\n⏳ Đang test: {model} ...")
        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "Bạn là chuyên gia tiếng Nhật JLPT. Chỉ xuất ra JSON chuẩn theo yêu cầu."
                },
                {
                    "role": "user",
                    "content": prompt_instruction
                }
            ]
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )

        start = time.time()
        try:
            with urllib.request.urlopen(req, timeout=35) as res:
                elapsed = time.time() - start
                data = json.loads(res.read().decode('utf-8'))
                
                # Trích xuất nội dung text
                content = ""
                if 'result' in data:
                    res_obj = data['result']
                    if 'response' in res_obj:
                        content = res_obj['response']
                    elif 'choices' in res_obj and res_obj['choices']:
                        content = res_obj['choices'][0].get('message', {}).get('content', '')
                
                # Lưu file json kết quả
                safe_name = model.replace('@cf/', '').replace('/', '_')
                res_file = os.path.join(out_dir, f"{safe_name}_benkyou.json")
                with open(res_file, 'w', encoding='utf-8') as f:
                    f.write(content.strip())

                neurons = data.get('result', {}).get('usage', {}).get('neurons', 'N/A')
                print(f"✅ Hoàn thành trong {elapsed:.2f}s! (Neurons: {neurons}) -> Lưu: {os.path.basename(res_file)}")
                results[model] = {
                    'status': 'SUCCESS',
                    'time': f"{elapsed:.2f}s",
                    'neurons': neurons,
                    'content': content.strip()[:300]
                }
        except urllib.error.HTTPError as e:
            elapsed = time.time() - start
            err = e.read().decode('utf-8', errors='ignore')
            print(f"❌ HTTP {e.code} ({elapsed:.2f}s): {err[:150]}")
            results[model] = {'status': f"HTTP {e.code}", 'time': f"{elapsed:.2f}s", 'content': err[:150]}
        except Exception as e:
            elapsed = time.time() - start
            print(f"❌ Lỗi ({elapsed:.2f}s): {e}")
            results[model] = {'status': 'ERROR', 'time': f"{elapsed:.2f}s", 'content': str(e)[:150]}

    print("\n" + "=" * 80)
    print("📊 BẢNG TỔNG KẾT VÀ ĐÁNH GIÁ ĐỐI ĐẦU:")
    for m, r in results.items():
        print(f"\n🔹 Model: {m}")
        print(f"   Trạng thái: {r['status']} | Thời gian: {r['time']}")
        print(f"   Trích xuất phản hồi:\n{r['content']}")
    print("=" * 80)

if __name__ == '__main__':
    test_compare_models()
