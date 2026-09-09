import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_mazii(keyword="watashi"):
    print(f"🔍 Đang gọi Mazii API với từ '{keyword}'...")
    url = "https://mazii.net/api/search"
    payload = {
        "dict": "javi",
        "type": "word",
        "query": keyword,
        "limit": 10,
        "page": 1
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode('utf-8'))
            results = data.get('data', [])
            print(f"✅ Mazii trả về {len(results)} kết quả!")
            if results:
                print("Chi tiết 1 kết quả Mazii:")
                print(json.dumps(results[0], indent=2, ensure_ascii=False)[:600])
    except Exception as e:
        print(f"❌ Lỗi Mazii: {e}")
        return False

def test_jisho(keyword="watashi"):
    print(f"\n🔍 Đang gọi Jisho API với từ '{keyword}'...")
    url = f"https://jisho.org/api/v1/search/words?keyword={keyword}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode('utf-8'))
            results = data.get('data', [])
            print(f"✅ Jisho trả về {len(results)} kết quả!")
            for r in results[:3]:
                jp = r.get('japanese', [{}])[0]
                word = jp.get('word', '')
                reading = jp.get('reading', '')
                english = ", ".join(r.get('senses', [{}])[0].get('english_definitions', []))
                jlpt = r.get('jlpt', [])
                print(f"   • {word} ({reading}): {english} | JLPT: {jlpt}")
            return True
    except Exception as e:
        print(f"❌ Lỗi Jisho: {e}")
        return False

if __name__ == '__main__':
    test_mazii("わたし")
    test_mazii("watashi")
    test_jisho("watashi")
