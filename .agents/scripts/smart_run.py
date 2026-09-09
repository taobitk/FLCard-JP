#!/usr/bin/env python3
"""
Smart Run Script cho FLCard-JP (Python Edition)
Vị trí: .agents/scripts/smart_run.py

Chức năng:
1. So sánh thời gian sửa đổi (mtime) của thư mục src/ với bản build .svelte-kit/cloudflare/_worker.js
2. Nếu có file trong src/ mới hơn -> Tự động chạy 'npm run build'
3. Nếu chưa sửa gì -> Khởi động ngay 'npm run preview' (wrangler dev) trong vòng 1 giây!
"""

import os
import sys
import subprocess
from pathlib import Path

# Cấu hình mã hóa UTF-8 cho Windows Console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Tự động bổ sung đường dẫn Node.js nếu môi trường chưa nạp
NODE_PATHS = [
    Path(r"D:\code\environment\notejs"),
    Path(r"C:\Program Files\nodejs"),
    Path(os.path.expanduser(r"~\AppData\Roaming\npm"))
]
for p in NODE_PATHS:
    if p.exists() and str(p) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(p) + os.pathsep + os.environ.get("PATH", "")

# Màu sắc Terminal
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SRC_DIR = PROJECT_ROOT / "src"
BUILD_WORKER = PROJECT_ROOT / ".svelte-kit" / "cloudflare" / "_worker.js"

def get_latest_src_mtime() -> float:
    """Lấy thời điểm sửa đổi mới nhất của tất cả file trong src/"""
    if not SRC_DIR.exists():
        return 0.0

    latest = 0.0
    for file_path in SRC_DIR.rglob("*"):
        if file_path.is_file():
            mtime = file_path.stat().st_mtime
            if mtime > latest:
                latest = mtime
    return latest

def needs_build() -> bool:
    """Kiểm tra xem có cần build lại dự án không"""
    if not BUILD_WORKER.exists():
        return True

    build_mtime = BUILD_WORKER.stat().st_mtime
    src_mtime = get_latest_src_mtime()

    return src_mtime > build_mtime

def main():
    os.chdir(PROJECT_ROOT)

    if needs_build():
        print(f"\n{YELLOW}{BOLD}📦 [Python Smart Run] Phát hiện thay đổi trong mã nguồn hoặc chưa build.{RESET}")
        print(f"{CYAN}⏳ Đang tiến hành build Cloudflare Workers...{RESET}\n")

        ret = subprocess.run("npm run build", shell=True)
        if ret.returncode != 0:
            print(f"\n{RED}❌ Build thất bại! Vui lòng kiểm tra lại lỗi ở trên.{RESET}")
            sys.exit(ret.returncode)

        print(f"\n{GREEN}{BOLD}✅ Build thành công!{RESET}\n")
    else:
        print(f"\n{GREEN}{BOLD}⚡ [Python Smart Run] Đã có bản build mới nhất và không có file nào thay đổi!{RESET}")
        print(f"{CYAN}🚀 Khởi động ngay Cloudflare Workers Preview không cần build lại...{RESET}\n")

    # Chạy wrangler dev
    try:
        subprocess.run("npm run preview", shell=True)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}👋 Đã dừng máy chủ.{RESET}")
        sys.exit(0)

if __name__ == "__main__":
    main()
