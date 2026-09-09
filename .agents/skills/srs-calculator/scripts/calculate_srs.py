"""
Mô-đun tính toán thuật toán lặp lại ngắt quãng SM-2 (SuperMemo 2)
Dành cho feature study-session trong FLCard-JP
Sử dụng: python calculate_srs.py <grade: 1-4> [repetition] [interval] [ease_factor]
"""
import sys
import math

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def calculate_sm2(grade: int, repetition: int = 0, interval: int = 0, ease_factor: float = 2.5):
    """
    grade: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
    Map sang SM-2 scale:
      1 (Again) -> 1
      2 (Hard)  -> 3
      3 (Good)  -> 4
      4 (Easy)  -> 5
    """
    grade_map = {1: 1, 2: 3, 3: 4, 4: 5}
    q = grade_map.get(grade, 3)

    # 1. Tính Ease Factor mới
    new_ef = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if new_ef < 1.3:
        new_ef = 1.3

    # 2. Tính interval và repetition
    if q < 3: # Quên (Again)
        new_repetition = 0
        new_interval = 1
        status = "learning"
    else:
        if repetition == 0:
            new_interval = 1
        elif repetition == 1:
            new_interval = 6
        else:
            new_interval = math.ceil(interval * new_ef)
        
        new_repetition = repetition + 1
        status = "mastered" if new_interval >= 21 else "review"

    return {
        "repetition": new_repetition,
        "interval": new_interval,
        "easeFactor": round(new_ef, 2),
        "status": status
    }

if __name__ == "__main__":
    grade_input = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    rep_input = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    intv_input = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    ef_input = float(sys.argv[4]) if len(sys.argv) > 4 else 2.5

    result = calculate_sm2(grade_input, rep_input, intv_input, ef_input)
    print(f"Kết quả tính SM-2 (Đánh giá: {grade_input}):")
    print(f"  - Repetition mới: {result['repetition']}")
    print(f"  - Interval mới (ngày): {result['interval']}")
    print(f"  - Ease Factor: {result['easeFactor']}")
    print(f"  - Trạng thái: {result['status']}")
