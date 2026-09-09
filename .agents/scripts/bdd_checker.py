#!/usr/bin/env python3
"""
BDD Test Compliance Checker (Kiểm tra quy chuẩn BDD cho FLCard-JP)
Vị trí: .agents/scripts/bdd_checker.py

Quy chuẩn BDD bắt buộc:
1. Feature & Scenario rõ ràng: Mỗi file/block phải định danh rõ Feature và User Story.
2. Cấu trúc Given - When - Then: Sử dụng test.step() của Playwright hoặc comment BDD rõ ràng:
   - Given: Tiền điều kiện (dữ liệu ban đầu, trang được tải, trạng thái người dùng).
   - When: Hành vi kích hoạt (người dùng bấm nút, phím tắt, hoặc gửi HTTP request).
   - Then: Kết quả mong đợi (thẻ lật, điểm cập nhật, HTTP status code 200/201).
3. Phân định ranh giới Front & Back:
   - Frontend E2E: Tương tác thật trên Chrome (DOM, click, lật thẻ, phím tắt).
   - Backend API: Gửi HTTP Request thật (request.get, request.post) kiểm tra status & response payload.
"""

import os
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Màu sắc hiển thị Terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

class BDDChecker:
    def __init__(self, test_dir="tests"):
        self.test_dir = Path(test_dir)
        self.violations = []
        self.passed_tests = 0
        self.total_tests = 0
        self.has_ui_tests = False
        self.has_http_api_tests = False

    def check_file(self, file_path: Path):
        content = file_path.read_text(encoding="utf-8")
        file_name = file_path.name
        
        # 1. Kiểm tra Feature Header
        feature_match = re.search(r"test\.describe\(\s*['\"](?:Feature|Tính năng|Miền):\s*([^'\"]+)['\"]", content, re.IGNORECASE)
        if not feature_match:
            self.violations.append(f"[{file_name}] Thiếu khai báo 'Feature:' trong test.describe(). Ví dụ: test.describe('Feature: Lật thẻ Flashcard', ...)")

        # 2. Tìm tất cả các test case (Scenarios) bằng cách quét token và đếm dấu ngoặc {}
        test_pattern = re.compile(r"test\(\s*['\"]([^'\"]+)['\"]\s*,\s*async\s*\(\s*\{([^}]+)\}\s*\)\s*=>\s*\{")
        matches = list(test_pattern.finditer(content))
        
        if not matches:
            self.violations.append(f"[{file_name}] Không tìm thấy kịch bản test() nào.")
            return

        test_blocks = []
        for i, match in enumerate(matches):
            title = match.group(1)
            fixtures = match.group(2)
            start_pos = match.end() - 1 # Vị trí ký tự '{'
            
            # Đếm dấu ngoặc để lấy toàn bộ thân hàm test
            brace_count = 0
            end_pos = start_pos
            for pos in range(start_pos, len(content)):
                char = content[pos]
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = pos
                        break
            
            body = content[start_pos:end_pos]
            test_blocks.append((title, fixtures, body))

        for test_title, fixtures, body in test_blocks:
            self.total_tests += 1
            test_id = f"[{file_name} -> '{test_title}']"
            is_valid = True

            # Kiểm tra xem có phải test UI hay test HTTP API
            is_ui = "page" in fixtures or "page." in body
            is_http = "request" in fixtures or "request." in body

            if is_ui:
                self.has_ui_tests = True
            if is_http:
                self.has_http_api_tests = True

            # Kiểm tra tên kịch bản BDD
            if not re.search(r"^(?:Scenario|Kịch bản|Khi|Khi người dùng|Given):", test_title, re.IGNORECASE):
                self.violations.append(f"{test_id} Tiêu đề test nên bắt đầu bằng 'Scenario:' hoặc hành vi người dùng rõ ràng.")
                is_valid = False

            # Kiểm tra cấu trúc Given - When - Then (thông qua test.step hoặc comments)
            has_given = bool(re.search(r"(?:test\.step\(\s*['\"]Given|//\s*Given|/\*\s*Given)", body, re.IGNORECASE))
            has_when = bool(re.search(r"(?:test\.step\(\s*['\"]When|//\s*When|/\*\s*When)", body, re.IGNORECASE))
            has_then = bool(re.search(r"(?:test\.step\(\s*['\"]Then|//\s*Then|/\*\s*Then)", body, re.IGNORECASE))

            missing_steps = []
            if not has_given: missing_steps.append("Given (Tiền điều kiện)")
            if not has_when: missing_steps.append("When (Hành động kích hoạt)")
            if not has_then: missing_steps.append("Then (Kết quả mong đợi)")

            if missing_steps:
                self.violations.append(f"{test_id} Thiếu các bước BDD: {', '.join(missing_steps)}. Hãy dùng test.step('Given ...') hoặc comment.")
                is_valid = False

            # Kiểm tra Assertions (phải có expect)
            if "expect(" not in body:
                self.violations.append(f"{test_id} Không chứa bất kỳ câu lệnh khẳng định expect() nào! Test rỗng không có giá trị.")
                is_valid = False

            # Nếu là test HTTP API, kiểm tra xem có assert status code và response body thật không
            if is_http:
                if not re.search(r"\.status\(\)|\.ok\(\)|status\s*:\s*\d{3}", body):
                    self.violations.append(f"{test_id} Test HTTP API thật cần kiểm tra status code phản hồi (ví dụ: expect(response.status()).toBe(200)).")
                    is_valid = False

            if is_valid:
                self.passed_tests += 1

    def run(self) -> bool:
        print(f"\n{BOLD}{CYAN}=== KIỂM TRA QUY CHUẨN BDD & E2E (FLCard-JP) ==={RESET}\n")

        if not self.test_dir.exists():
            print(f"{RED}❌ Thư mục test '{self.test_dir}' chưa tồn tại.{RESET}")
            return False

        test_files = list(self.test_dir.glob("**/*.spec.ts")) + list(self.test_dir.glob("**/*.test.ts"))

        if not test_files:
            print(f"{YELLOW}⚠️ Chưa tìm thấy file test nào trong '{self.test_dir}'.{RESET}")
            return False

        print(f"🔍 Đang quét {len(test_files)} file test trong '{self.test_dir}'...")

        for file_path in test_files:
            self.check_file(file_path)

        print("\n" + "=" * 50)
        print(f"{BOLD}KẾT QUẢ ĐÁNH GIÁ QUY CHUẨN BDD:{RESET}")
        print(f"- Tổng số kịch bản test: {self.total_tests}")
        print(f"- Số kịch bản đạt chuẩn BDD 100%: {GREEN}{self.passed_tests}{RESET}")
        print(f"- Có test Frontend UI (Chrome): {'✅' if self.has_ui_tests else '❌ (Chưa có)'}")
        print(f"- Có test Backend HTTP Request thật: {'✅' if self.has_http_api_tests else '❌ (Chưa có)'}")
        print("=" * 50 + "\n")

        if self.violations:
            print(f"{RED}{BOLD}CÁC LỖI QUY CHUẨN BDD CẦN KHẮC PHỤC ({len(self.violations)} lỗi):{RESET}")
            for i, err in enumerate(self.violations, 1):
                print(f" {i}. {err}")
            print(f"\n{RED}❌ BDD Compliance: KHÔNG ĐẠT (Cần sửa các mục trên trước khi bàn giao).{RESET}\n")
            return False
        else:
            print(f"{GREEN}{BOLD}🎉 XUẤT SẮC! Tất cả kịch bản test đều đạt chuẩn BDD và phân lập Front/Back!{RESET}\n")
            return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "tests"
    checker = BDDChecker(test_dir=target)
    success = checker.run()
    sys.exit(0 if success else 1)
