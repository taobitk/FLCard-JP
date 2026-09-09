#!/usr/bin/env python3
"""
Sync Cloud Script for FLCard-JP
Vị trí: .agents/scripts/sync_cloud.py

Chức năng:
1. Kiểm tra trạng thái xác thực Wrangler với Cloudflare (wrangler whoami).
2. Tự động trích xuất các file ảnh từ Miniflare Local R2 Blobs.
3. Đẩy toàn bộ Schema D1 lên Cloudflare D1 Remote (flcard-jp-db).
4. Đẩy toàn bộ ảnh lên Cloudflare R2 Remote (flcard-jp-assets).
5. Tùy chọn triển khai (deploy) ứng dụng lên Cloudflare Workers.
"""

import os
import sys
import glob
import shutil
import sqlite3
import subprocess
from pathlib import Path

# Mã hóa UTF-8 cho Windows Terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BUCKET_NAME = "flcard-jp-assets"
DB_NAME = "flcard-jp-db"

def print_banner(title: str, color=CYAN):
    print(f"\n{color}{BOLD}{'=' * 60}{RESET}")
    print(f"{color}{BOLD} {title}{RESET}")
    print(f"{color}{BOLD}{'=' * 60}{RESET}\n")

def check_auth() -> bool:
    """Kiểm tra xác thực wrangler"""
    res = subprocess.run("npx wrangler whoami", shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if "You are not authenticated" in res.stdout or "You are not authenticated" in res.stderr or res.returncode != 0:
        return False
    return True

def extract_local_blobs() -> list[tuple[str, str]]:
    """Trích xuất file ảnh từ local SQLite sang file thật để sẵn sàng upload"""
    db_files = [x for x in glob.glob(str(PROJECT_ROOT / r".wrangler\state\v3\r2\miniflare-R2BucketObject\*.sqlite")) if "metadata" not in x]
    if not db_files:
        return []

    conn = sqlite3.connect(db_files[0])
    rows = conn.execute("SELECT key, blob_id FROM _mf_objects").fetchall()
    
    out_dir = PROJECT_ROOT / ".wrangler" / "exported_assets"
    out_dir.mkdir(parents=True, exist_ok=True)

    blobs_dir = PROJECT_ROOT / ".wrangler" / "state" / "v3" / "r2" / BUCKET_NAME / "blobs"
    extracted = []

    for key, blob_id in rows:
        blob_path = blobs_dir / blob_id
        if blob_path.exists():
            target_path = out_dir / Path(key.replace("/", os.sep))
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(blob_path, target_path)
            extracted.append((key, str(target_path)))

    return extracted

def sync_r2_assets(assets: list[tuple[str, str]]):
    """Upload các file lên R2 Bucket thật trên Cloudflare"""
    print_banner(f"🪣 1. ĐỒNG BỘ ẢNH LÊN R2 BUCKET THẬT ({BUCKET_NAME})", CYAN)
    
    if not assets:
        print(f"{YELLOW}ℹ️  Không có file ảnh nào cần tải lên.{RESET}")
        return

    for key, file_path in assets:
        print(f"{CYAN}⏳ Đang tải lên R2 Remote:{RESET} {BOLD}{key}{RESET}...")
        cmd = f'npx wrangler r2 object put "{BUCKET_NAME}/{key}" --file="{file_path}" --remote'
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode == 0:
            print(f"{GREEN}✅ Tải lên R2 Remote thành công:{RESET} {key}")
        else:
            print(f"{RED}❌ Lỗi khi tải {key}:{RESET} {res.stderr.strip() or res.stdout.strip()}")

def sync_d1_database():
    """Chạy migration D1 lên Cloudflare D1 Remote"""
    print_banner(f"🗄️  2. ĐỒNG BỘ DỮ LIỆU LÊN CLOUDFLARE D1 REMOTE ({DB_NAME})", CYAN)
    cmd = f"npx wrangler d1 migrations apply {DB_NAME} --remote"
    res = subprocess.run(cmd, input="y\n", shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(res.stdout.strip())
    if res.returncode != 0 and "No migrations to apply" not in res.stdout and "No migrations to apply" not in res.stderr:
        print(f"{RED}❌ Lỗi khi đồng bộ D1 remote: {res.stderr.strip()}{RESET}")
    else:
        print(f"{GREEN}✅ Đồng bộ D1 Remote thành công!{RESET}")

def deploy_app():
    """Deploy ứng dụng lên Cloudflare Workers"""
    print_banner("🚀 3. TRIỂN KHAI ỨNG DỤNG LÊN CLOUDFLARE WORKERS", GREEN)
    cmd = "npm run deploy"
    res = subprocess.run(cmd, shell=True)
    if res.returncode == 0:
        print(f"\n{GREEN}{BOLD}🎉 TRIỂN KHAI TOÀN DIỆN THÀNH CÔNG!{RESET}\n")
    else:
        print(f"\n{RED}{BOLD}❌ Triển khai thất bại! Vui lòng kiểm tra log ở trên.{RESET}\n")

def main():
    os.chdir(PROJECT_ROOT)
    print_banner("⚡ CLOUDFLARE REMOTE SYNC & DEPLOY TOOL", MAGENTA)

    # 1. Kiểm tra xác thực
    if not check_auth():
        print(f"{RED}{BOLD}❌ BẠN CHƯA ĐĂNG NHẬP VÀO CLOUDFLARE TRÊN MÁY TÍNH!{RESET}\n")
        print(f"{YELLOW}Để đưa ảnh lên R2 thật và deploy ứng dụng, bạn chỉ cần thực hiện 1 bước duy nhất:{RESET}")
        print(f"\n👉 Mở Terminal trên máy và gõ:")
        print(f"   {GREEN}{BOLD}npx wrangler login{RESET}\n")
        print(f"{CYAN}(Trình duyệt sẽ tự động bật lên trang đăng nhập Cloudflare, bạn chỉ cần bấm [Authorize / Cho phép] là xong).{RESET}\n")
        print(f"Sau khi login xong, hãy chạy lại lệnh:")
        print(f"   {GREEN}python .agents/scripts/sync_cloud.py{RESET}\n")
        sys.exit(1)

    print(f"{GREEN}✅ Đã kết nối và xác thực thành công với Cloudflare Account!{RESET}\n")

    # 2. Trích xuất file ảnh local
    assets = extract_local_blobs()
    print(f"📸 Tìm thấy {len(assets)} file ảnh local đã được trích xuất sẵn sàng.")

    # 3. Đồng bộ ảnh lên R2
    sync_r2_assets(assets)

    # 4. Đồng bộ D1 Remote
    sync_d1_database()

    # 5. Hỏi hoặc tự động deploy
    deploy_app()

if __name__ == "__main__":
    main()
