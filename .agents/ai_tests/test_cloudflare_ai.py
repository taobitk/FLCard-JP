import os
import sys
import json
import time
import base64
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
    if not os.path.exists(dev_vars_path):
        return env
    try:
        with open(dev_vars_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except Exception as e:
        print(f"Lỗi đọc .dev.vars: {e}")
    return env

def test_workers_ai():
    env = load_dev_vars()
    account_id = env.get('CLOUDFLARE_ACCOUNT_ID')
    if not account_id or account_id == 'your_cloudflare_account_id_here':
        account_id = "84dbdcece9a6564c85eefabe074023cb"

    api_token = env.get('CLOUDFLARE_WORKERS_API_KEY') or env.get('CLOUDFLARE_API_TOKEN')

    if not account_id:
        print("❌ Thiếu CLOUDFLARE_ACCOUNT_ID trong .dev.vars")
        return
    if not api_token:
        print("❌ Thiếu CLOUDFLARE_WORKERS_API_KEY / CLOUDFLARE_API_TOKEN trong .dev.vars")
        return

    masked_token = api_token[:4] + "..." + api_token[-4:] if len(api_token) > 8 else "***"
    print(f"🔑 Tìm thấy Account ID: {account_id[:6]}... và API Token: {masked_token}")

    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'cf_ai_results')
    os.makedirs(out_dir, exist_ok=True)

    # 1. Test Text Model: @cf/zai-org/glm-4.7-flash
    text_model = "@cf/zai-org/glm-4.7-flash"
    print(f"\n⏳ [1/2] Đang gọi Text Model: {text_model} ...")
    url_text = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{text_model}"
    
    payload_text = {
        "messages": [
            {
                "role": "system",
                "content": "Bạn là trợ lý tiếng Nhật. Hãy phân tích từ vựng thành JSON gồm: term, reading, meaning, example."
            },
            {
                "role": "user",
                "content": "Phân tích từ tiếng Nhật: 猫 (con mèo)"
            }
        ]
    }

    req_text = urllib.request.Request(
        url_text,
        data=json.dumps(payload_text).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    start = time.time()
    try:
        with urllib.request.urlopen(req_text, timeout=30) as res:
            elapsed = time.time() - start
            data = json.loads(res.read().decode('utf-8'))
            print(f"✅ THÀNH CÔNG GLM-4.7-Flash trong {elapsed:.2f}s!")
            
            # Lưu phản hồi JSON
            json_path = os.path.join(out_dir, "glm_4_7_flash_result.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"   📁 Kết quả lưu tại: {os.path.basename(json_path)}")
            response_content = data.get('result', {}).get('response', '')
            print(f"   💬 Phản hồi:\n{response_content[:200]}...")
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='ignore')
        print(f"❌ HTTP {e.code} với GLM: {err}")
    except Exception as e:
        print(f"❌ Lỗi GLM: {e}")

    # 2. Test Image Model: @cf/black-forest-labs/flux-1-schnell
    image_model = "@cf/black-forest-labs/flux-1-schnell"
    print(f"\n⏳ [2/2] Đang gọi Image Model: {image_model} ...")
    url_img = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{image_model}"

    payload_img = {
        "prompt": "a cute cartoon cat on a Japanese tatami mat with a Japanese flashcard, anime style, 1:1 square"
    }

    req_img = urllib.request.Request(
        url_img,
        data=json.dumps(payload_img).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    start = time.time()
    try:
        with urllib.request.urlopen(req_img, timeout=40) as res:
            elapsed = time.time() - start
            content_type = res.headers.get('Content-Type', '')
            img_bytes = res.read()
            
            img_path = os.path.join(out_dir, "flux_1_schnell_cat.png")
            # Xử lý nếu trả về binary hoặc base64 json
            if 'application/json' in content_type:
                data = json.loads(img_bytes.decode('utf-8'))
                b64_image = data.get('result', {}).get('image', '')
                if b64_image:
                    with open(img_path, 'wb') as f:
                        f.write(base64.b64decode(b64_image))
                else:
                    print(f"JSON response không có b64 image: {data}")
            else:
                with open(img_path, 'wb') as f:
                    f.write(img_bytes)

            size_kb = os.path.getsize(img_path) // 1024
            print(f"🎉 THÀNH CÔNG FLUX-1-Schnell trong {elapsed:.2f}s!")
            print(f"   🖼️ Đã lưu file ảnh: {img_path} ({size_kb} KB)")
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='ignore')
        print(f"❌ HTTP {e.code} với FLUX: {err}")
    except Exception as e:
        print(f"❌ Lỗi FLUX: {e}")

if __name__ == '__main__':
    test_workers_ai()
