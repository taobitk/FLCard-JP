import { test, expect } from '@playwright/test';

test.describe('Feature: Nhập Thẻ Hàng Loạt Bằng JSON Và Ghép Ảnh (Batch Import Studio)', () => {

	test('Scenario: Người dùng mở Batch Import Studio, kiểm tra nút Copy Prompt và mẫu JSON', async ({ page }) => {
		// Given: Người dùng truy cập trang chủ
		await test.step('Given: Người dùng truy cập trang chủ FLCard-JP', async () => {
			await page.goto('/');
			await page.waitForLoadState('domcontentloaded');
		});

		// When: Nhấn nút "⚡ Nhập JSON" trên thanh điều hướng
		await test.step('When: Người dùng nhấn nút Nhập JSON trên Navbar', async () => {
			const batchBtn = page.locator('#nav-batch-import-btn');
			await expect(batchBtn).toBeVisible();
			await batchBtn.click();
		});

		// Then: Modal Batch Import Studio hiển thị với Bước 1
		await test.step('Then: Modal Batch Import Studio hiển thị với giao diện Bước 1: Nhập JSON', async () => {
			const modalHeader = page.locator('text=Nhập Thẻ Hàng Loạt');
			await expect(modalHeader).toBeVisible();
			const stepBadge = page.locator('text=Bước 1: Nhập JSON');
			await expect(stepBadge).toBeVisible();

			// Kiểm tra các nút copy tiện ích
			const copyPromptBtn = page.locator('button:has-text("Prompt")');
			const copyJsonBtn = page.locator('button:has-text("Mẫu JSON")');
			await expect(copyPromptBtn).toBeVisible();
			await expect(copyJsonBtn).toBeVisible();

			// Textarea mặc định để trống theo chuẩn tối giản
			const textarea = page.locator('#batch-json-input');
			await expect(textarea).toBeVisible();
			const textValue = await textarea.inputValue();
			expect(textValue).toBe('');
		});
	});

	test('Scenario: Quy tắc GIGO - Nhập JSON sai cấu trúc hiển thị danh sách lỗi chi tiết', async ({ page }) => {
		// Given: Người dùng đã mở Modal Batch Import
		await test.step('Given: Người dùng đang ở màn hình Bước 1 Nhập JSON', async () => {
			await page.goto('/');
			await page.waitForLoadState('domcontentloaded');
			await page.locator('#nav-batch-import-btn').click();
		});

		// When: Người dùng nhập JSON sai quy chuẩn (ví dụ thiếu term, level không hợp lệ)
		await test.step('When: Người dùng nhập JSON sai cấu trúc và nhấn tiếp tục', async () => {
			const textarea = page.locator('#batch-json-input');
			const invalidJson = JSON.stringify([
				{
					// Thiếu "term"
					reading: "ねこ",
					meaning: "Con mèo",
					level: "N6" // Level N6 không tồn tại trong JLPT
				}
			], null, 2);

			await textarea.fill(invalidJson);
			const validateBtn = page.locator('#btn-validate-json');
			await validateBtn.click();
		});

		// Then: Hệ thống tuân thủ nghiêm ngặt GIGO, chặn chuyển bước và liệt kê lỗi
		await test.step('Then: Hiển thị thông báo lỗi chi tiết chỉ rõ trường nào bị sai', async () => {
			const errorBox = page.locator('text=Không thể nạp JSON');
			await expect(errorBox).toBeVisible();

			// Kiểm tra các lỗi được chỉ điểm cụ thể
			const missingTermErr = page.locator('text=Thiếu trường \'term\'');
			const invalidLevelErr = page.locator('text=Cấp độ \'N6\' không hợp lệ');
			await expect(missingTermErr).toBeVisible();
			await expect(invalidLevelErr).toBeVisible();

			// Vẫn giữ người dùng ở Bước 1, không được nhảy sang Bước 2
			const stepBadge = page.locator('text=Bước 1: Nhập JSON');
			await expect(stepBadge).toBeVisible();
		});
	});

	test('Scenario: Nhập JSON chuẩn và chuyển sang Bước 2 Studio Ghép Ảnh rồi nạp vào bộ học', async ({ page }) => {
		// Given: Người dùng nhập JSON chuẩn chứa 2 từ mới trong phòng học
		await test.step('Given: Người dùng dán JSON chuẩn gồm 2 từ vựng N5', async () => {
			await page.goto('/study');
			await page.waitForLoadState('domcontentloaded');
			await page.locator('#nav-batch-import-btn').click();

			const validJson = JSON.stringify([
				{
					term: "桜",
					reading: "さくら",
					meaning: "Hoa anh đào",
					level: "N5",
					type: "Danh từ",
					example: {
						japanese: "桜が綺麗です。",
						vietnamese: "Hoa anh đào rất đẹp."
					}
				},
				{
					term: "富士山",
					reading: "ふじさん",
					meaning: "Núi Phú Sĩ",
					level: "N5",
					type: "Danh từ"
				}
			], null, 2);

			await page.locator('#batch-json-input').fill(validJson);
		});

		// When: Người dùng nhấn nút tiếp tục sang Studio Ghép Ảnh
		await test.step('When: Nhấn nút tiếp tục sang Bước 2 Ghép Ảnh', async () => {
			const validateBtn = page.locator('#btn-validate-json');
			await validateBtn.click();
		});

		// Then: Chuyển sang Bước 2 Studio Ghép Ảnh với 2 thẻ
		await test.step('Then: Giao diện chuyển sang Bước 2 hiển thị danh sách 2 thẻ', async () => {
			const stepBadge = page.locator('text=Bước 2: Ghép Ảnh (2 thẻ)');
			await expect(stepBadge).toBeVisible();

			// Thẻ 桜 và 富士山 phải hiển thị trong danh sách Studio
			const modal = page.getByRole('dialog');
			const sakuraCard = modal.getByText('桜', { exact: true });
			const fujiCard = modal.getByText('富士山', { exact: true });
			await expect(sakuraCard).toBeVisible();
			await expect(fujiCard).toBeVisible();

			// Nút nạp toàn bộ thẻ vào bộ học phải sẵn sàng
			const finishBtn = page.locator('#btn-finish-batch-import');
			await expect(finishBtn).toBeVisible();
		});

		// When: Người dùng nhấn hoàn tất nạp thẻ vào bộ học
		await test.step('When: Nhấn nạp toàn bộ thẻ vào bộ học', async () => {
			const finishBtn = page.locator('#btn-finish-batch-import');
			await finishBtn.click();
		});

		// Then: Modal đóng lại, toast thông báo thành công và thẻ mới xuất hiện trên màn hình
		await test.step('Then: Thẻ mới "桜" được nạp vào đầu bộ học và hiển thị ngay trên màn hình', async () => {
			// Modal đóng
			const modalHeader = page.locator('text=Nhập Thẻ Hàng Loạt');
			await expect(modalHeader).not.toBeVisible();

			// Toast thành công
			const toast = page.locator('text=Đã nạp thành công 2 thẻ mới vào bộ học');
			await expect(toast).toBeVisible();

			// Thẻ hiện tại là thẻ mới nhất vừa nạp (桜)
			const currentCardScene = page.locator('.flip-scene[aria-label*="桜"]');
			await expect(currentCardScene).toBeVisible();

			// Romaji 'sakura' hiển thị trên thẻ
			const romajiText = page.locator('main').getByText('sakura');
			await expect(romajiText).toBeVisible();

			// Kiểm tra dữ liệu được lưu bền vững trên Cloudflare D1
			const res = await page.request.get('/api/cards');
			expect(res.status()).toBe(200);
			const data = await res.json();
			const terms = data.cards.map((c: any) => c.term);
			expect(terms).toContain('桜');
			expect(terms).toContain('富士山');
		});
	});

});
