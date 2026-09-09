#!/usr/bin/env python3
"""
Smart Git Push & Quality Gate for FLCard-JP
Vị trí: .agents/scripts/smart_push.py

Chức năng:
1. Chạy Quality Gate bắt buộc trước khi đẩy code (Type Check, BDD Compliance, Playwright E2E).
2. Chuẩn hóa Commit Message theo quy chuẩn quốc tế Conventional Commits (feat, fix, test, refactor, docs, chore).
3. Hỗ trợ 2 chế độ:
   - Interactive Menu: Hỏi tương tác từng bước chọn loại commit và phạm vi.
   - Fast CLI Mode: Truyền trực tiếp message qua tham số dòng lệnh (vd: python .agents/scripts/smart_push.py "feat: upload r2").
"""

import sys
import os
import re
import shutil
import subprocess
from pathlib import Path

# Cấu hình mã hóa UTF-8 cho Windows Terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Màu sắc Terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

CONVENTIONAL_TYPES = {
    "1": ("feat", "🌟 Tính năng mới (New Feature)"),
    "2": ("fix", "🐛 Sửa lỗi (Bug Fix)"),
    "3": ("test", "🧪 Kiểm thử BDD / E2E (Testing)"),
    "4": ("refactor", "♻️  Tối ưu hóa / Dọn dẹp code (Refactor)"),
    "5": ("docs", "📚 Cập nhật tài liệu / README (Documentation)"),
    "6": ("chore", "🔧 Cấu hình / Dependencies / Tooling (Chore)")
}

VALID_TYPE_NAMES = ["feat", "fix", "test", "refactor", "docs", "chore", "perf", "style", "ci", "build"]

def print_banner(title: str, color: str = CYAN):
    print(f"\n{color}{BOLD}{'=' * 60}{RESET}")
    print(f"{color}{BOLD} {title}{RESET}")
    print(f"{color}{BOLD}{'=' * 60}{RESET}\n")

def get_git_executable() -> str:
    """Tìm đường dẫn thực thi của Git trên máy"""
    git_cmd = shutil.which("git")
    if git_cmd:
        return git_cmd

    known_paths = [
        r"D:\code\app\git\cmd\git.exe",
        r"D:\code\app\git\bin\git.exe",
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files\Git\bin\git.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Git\cmd\git.exe")
    ]
    for path in known_paths:
        if os.path.isfile(path):
            return path

    print(f"{RED}{BOLD}❌ LỖI: Không tìm thấy Git trên hệ thống!{RESET}")
    sys.exit(1)

def run_command(cmd, desc: str, critical: bool = True) -> bool:
    """Chạy một lệnh shell với hiển thị trạng thái chuyên nghiệp"""
    print(f"{CYAN}⏳ Đang thực thi:{RESET} {BOLD}{desc}{RESET}...")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace"
        )
        if result.returncode == 0:
            print(f"{GREEN}✅ THÀNH CÔNG:{RESET} {desc}")
            return True
        else:
            print(f"{RED}❌ THẤT BẠI:{RESET} {desc}")
            if result.stdout:
                print(f"{YELLOW}--- Output ---{RESET}\n{result.stdout.strip()}")
            if result.stderr:
                print(f"{RED}--- Error Log ---{RESET}\n{result.stderr.strip()}")
            if critical:
                print(f"\n{RED}{BOLD}⛔ CHẶN LỆNH PUSH: Bài kiểm tra không vượt qua! Vui lòng sửa lỗi trước khi đẩy code.{RESET}\n")
                sys.exit(1)
            return False
    except Exception as e:
        print(f"{RED}❌ Lỗi khi gọi tiến trình: {e}{RESET}")
        if critical:
            sys.exit(1)
        return False

def run_quality_gate():
    """Chạy toàn bộ bài test kiểm tra chất lượng (Quality Gate)"""
    print_banner("🛡️ CHẶNG 1: KIỂM TRA CHẤT LƯỢNG MÃ NGUỒN (QUALITY GATE)", MAGENTA)

    # 1. Type check
    run_command("npm run check", "Kiểm tra Type Safety & Svelte Diagnostics (npm run check)")

    # 2. BDD Compliance
    run_command("python .agents/scripts/bdd_checker.py", "Kiểm tra quy chuẩn BDD 12 kịch bản (bdd_checker.py)")

    # 3. E2E Playwright Tests
    run_command("npm run test:e2e", "Kiểm thử trình duyệt Chromium thật & Edge API (npm run test:e2e)")

    print(f"\n{GREEN}{BOLD}🎉 XUẤT SẮC! Toàn bộ Quality Gate đã đạt 100%. Đủ điều kiện để commit và push!{RESET}\n")

def get_git_status(git_exe: str) -> str:
    """Lấy danh sách các file thay đổi"""
    res = subprocess.run([git_exe, "status", "--porcelain"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return res.stdout.strip()

def build_commit_message_interactive() -> str:
    """Hỏi tương tác tạo Commit Message theo chuẩn Conventional Commits"""
    print_banner("🏷️ CHẶNG 2: THIẾT LẬP COMMIT MESSAGE (CONVENTIONAL COMMITS)", CYAN)

    print(f"{BOLD}Vui lòng chọn loại commit (nhập số 1-6):{RESET}")
    for key, (t, desc) in CONVENTIONAL_TYPES.items():
        print(f"  [{BOLD}{key}{RESET}] {CYAN}{t:<9}{RESET} - {desc}")

    commit_type = ""
    while not commit_type:
        choice = input(f"\n{YELLOW}Chọn loại commit [1-6] (Mặc định: 1 - feat): {RESET}").strip()
        if not choice:
            choice = "1"
        if choice in CONVENTIONAL_TYPES:
            commit_type = CONVENTIONAL_TYPES[choice][0]
        elif choice.lower() in VALID_TYPE_NAMES:
            commit_type = choice.lower()
        else:
            print(f"{RED}Lựa chọn không hợp lệ, vui lòng chọn lại!{RESET}")

    scope = input(f"{YELLOW}Nhập phạm vi ảnh hưởng (Scope, vd: d1, r2, deck, ui - Bấm Enter để bỏ qua): {RESET}").strip()
    
    desc = ""
    while not desc:
        desc = input(f"{YELLOW}Nhập mô tả ngắn nội dung thay đổi: {RESET}").strip()
        if not desc:
            print(f"{RED}Mô tả commit không được để trống!{RESET}")

    if scope:
        commit_msg = f"{commit_type}({scope}): {desc}"
    else:
        commit_msg = f"{commit_type}: {desc}"

    return commit_msg

def parse_cli_commit_message(raw_args: list[str]) -> str:
    """Xử lý commit message từ tham số dòng lệnh CLI (Fast Mode)"""
    # Lọc bỏ các cờ -m, --message, --
    cleaned = []
    skip_next = False
    for i, arg in enumerate(raw_args):
        if skip_next:
            skip_next = False
            continue
        if arg in ["--", "-m", "--message"]:
            continue
        cleaned.append(arg)

    raw_msg = " ".join(cleaned).strip()
    if not raw_msg:
        print(f"{RED}❌ Lỗi: Bạn đã truyền cờ CLI nhưng không có nội dung commit message!{RESET}")
        sys.exit(1)

    # 1. Kiểm tra xem đã chuẩn dạng Conventional Commit: type(scope): desc hoặc type: desc chưa
    pattern = r"^([a-zA-Z]+)(\([a-zA-Z0-9_\-.]+\))?:\s*(.+)$"
    match = re.match(pattern, raw_msg)
    if match:
        c_type = match.group(1).lower()
        if c_type in VALID_TYPE_NAMES:
            return f"{c_type}{match.group(2) or ''}: {match.group(3).strip()}"

    # 2. Nếu gõ kiểu: feat them anh r2 hoặc fix bug audio
    first_word = raw_msg.split()[0].lower()
    if first_word in VALID_TYPE_NAMES and len(raw_msg.split()) > 1:
        rest = raw_msg[len(first_word):].strip()
        auto_msg = f"{first_word}: {rest}"
        print(f"{CYAN}👉 Tự động chuẩn hóa Conventional Commit:{RESET} {BOLD}{auto_msg}{RESET}")
        return auto_msg

    # 3. Nếu gõ tự do không có tiền tố (vd: "cap nhat giao dien"), tự động gán feat:
    print(f"{YELLOW}⚠️ Cảnh báo: Message '{raw_msg}' chưa có tiền tố Conventional Commit.{RESET}")
    auto_msg = f"feat: {raw_msg}"
    print(f"{CYAN}👉 Tự động chuẩn hóa thành:{RESET} {BOLD}{auto_msg}{RESET}")
    return auto_msg

def execute_git_push(git_exe: str, commit_msg: str):
    """Tiến hành add, commit và push lên GitHub"""
    print_banner("🚀 CHẶNG 3: TIẾN HÀNH COMMIT & PUSH LÊN GITHUB", GREEN)

    print(f"{BOLD}Nội dung Commit:{RESET} {GREEN}{commit_msg}{RESET}\n")

    # 1. git add .
    subprocess.run([git_exe, "add", "."], check=True)

    # 2. git commit -m
    commit_res = subprocess.run([git_exe, "commit", "-m", commit_msg], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(commit_res.stdout.strip())
    if commit_res.returncode != 0:
        print(f"{RED}❌ Lỗi khi commit: {commit_res.stderr.strip()}{RESET}")
        sys.exit(1)

    # 3. git push origin main
    print(f"\n{CYAN}🛰️  Đang đẩy code lên GitHub repository (origin main)...{RESET}")
    push_res = subprocess.run([git_exe, "push", "origin", "main"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    
    if push_res.stdout:
        print(push_res.stdout.strip())
    if push_res.stderr:
        print(push_res.stderr.strip())

    if push_res.returncode == 0:
        print(f"\n{GREEN}{BOLD}{'=' * 60}{RESET}")
        print(f"{GREEN}{BOLD}🎉 ĐẨY CODE LÊN GITHUB THÀNH CÔNG 100%!{RESET}")
        print(f"{GREEN}Repository: https://github.com/taobitk/FLCard-JP{RESET}")
        print(f"{GREEN}{BOLD}{'=' * 60}{RESET}\n")
    else:
        print(f"\n{RED}{BOLD}❌ LỖI KHI PUSH CODE LÊN GITHUB!{RESET}")
        sys.exit(1)

def main():
    # Hỗ trợ cờ trợ giúp --help / -h
    if any(arg in ["-h", "--help"] for arg in sys.argv[1:]):
        print(f"""
{BOLD}{CYAN}Sử dụng Smart Push (FLCard-JP):{RESET}
  {GREEN}1. Chế độ tương tác (Interactive Mode):{RESET}
     python .agents/scripts/smart_push.py
     npm run push

  {GREEN}2. Chế độ CLI nhanh (Fast CLI Mode - Đẩy thẳng không hỏi):{RESET}
     python .agents/scripts/smart_push.py "feat: upload r2 bucket"
     python .agents/scripts/smart_push.py -m "fix(d1): sua loi serialization"
     npm run push -- "feat: push nhanh khong can hoi"
     npm run push -- -m "chore: cap nhat package.json"
""")
        sys.exit(0)

    git_exe = get_git_executable()

    # Kiểm tra trạng thái Git xem có thay đổi nào cần commit không
    status = get_git_status(git_exe)
    if not status:
        print(f"\n{YELLOW}ℹ️  Thư mục làm việc hoàn toàn sạch sẽ (working tree clean). Không có thay đổi nào mới để commit & push!{RESET}\n")
        sys.exit(0)

    print(f"\n{CYAN}🔍 Phát hiện các file có sự thay đổi:{RESET}")
    for line in status.splitlines()[:10]:
        print(f"  {line}")
    if len(status.splitlines()) > 10:
        print(f"  ... và {len(status.splitlines()) - 10} file khác")
    print()

    # 1. Xác định commit message (CLI args hoặc Interactive)
    cli_args = [arg for arg in sys.argv[1:] if arg != "--"]
    if cli_args:
        # Chế độ Fast CLI Mode: truyền thẳng tham số, không hỏi bất kỳ câu nào
        commit_msg = parse_cli_commit_message(cli_args)
    else:
        # Chế độ Interactive Menu: hỏi tương tác
        commit_msg = build_commit_message_interactive()

    # 2. Chạy Quality Gate (Toàn bộ test phải pass)
    run_quality_gate()

    # 3. Thực thi Commit & Push
    execute_git_push(git_exe, commit_msg)

if __name__ == "__main__":
    main()
