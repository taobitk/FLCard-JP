"""
Security Guard Hook cho Antigravity
Chặn Agent đọc, sửa, hoặc quét các file nhạy cảm (.env, .dev.vars, secrets)
"""
import sys
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    data = json.load(sys.stdin)
    tool_call = data.get("toolCall", {})
    name = tool_call.get("name", "")
    args = tool_call.get("args", {})

    target_path = (
        args.get("AbsolutePath") or 
        args.get("TargetFile") or 
        args.get("SearchPath") or 
        ""
    ).lower()

    # Danh sách các mẫu file/thư mục nhạy cảm cấm truy cập
    forbidden_patterns = [".dev.vars", ".env", "secret", "private_key", "credentials", "id_rsa"]

    # Cho phép các file mẫu/template công khai (ví dụ .dev.vars.example)
    is_template = any(target_path.endswith(ext) for ext in [".example", ".template", ".sample"])

    is_blocked = (not is_template) and any(pattern in target_path for pattern in forbidden_patterns)

    if is_blocked:
        response = {
            "decision": "deny",
            "reason": f"🛡️ [SECURITY SHIELD ACTIVATED] Truy cập bị từ chối! Agent không được phép đọc hoặc chỉnh sửa file bảo mật: '{target_path}'."
        }
    else:
        response = {
            "decision": "allow"
        }

    print(json.dumps(response, ensure_ascii=False))

except Exception as e:
    # Nếu có lỗi khi parse stdin, cho phép hoặc từ chối an toàn
    print(json.dumps({"decision": "allow"}))
