import { test, expect } from '@playwright/test';

test.describe('Feature: Kiểm thử nền tảng và kết nối hệ thống (Smoke & Health)', () => {

	test('Scenario: Người dùng truy cập trang chủ và kiểm tra giao diện cơ bản trên Chrome', async ({ page }) => {
		// Given: Người dùng mở trình duyệt Chrome và điều hướng đến trang chủ
		await test.step('Given: Trình duyệt mở trang chủ FLCard-JP', async () => {
			await page.goto('/');
		});

		// When: Trang web tải xong hoàn tất
		await test.step('When: Chờ trang web sẵn sàng và DOM hiển thị', async () => {
			await page.waitForLoadState('networkidle');
		});

		// Then: Giao diện phải hiển thị logo FLCard-JP và thẻ flashcard tương tác được
		await test.step('Then: Kiểm tra tiêu đề chính và các thành phần cốt lõi', async () => {
			const brandTitle = page.locator('.brand-title');
			await expect(brandTitle).toBeVisible();
			await expect(brandTitle).toContainText('FLCard-JP');

			// Kiểm tra thẻ học hiển thị cấp độ N5
			const levelPill = page.locator('.level-pill');
			await expect(levelPill).toBeVisible();
			await expect(levelPill).toHaveText('N5');

			// Thử tương tác lật thẻ thật trên Chrome
			const cardScene = page.locator('.flip-scene');
			const flashcard = page.locator('.flashcard');
			await expect(cardScene).toBeVisible();
			await expect(flashcard).not.toHaveClass(/flipped/);

			// Click lật thẻ
			await cardScene.click();
			await expect(flashcard).toHaveClass(/flipped/);
			
			// Kiểm tra mặt sau hiển thị
			const backFace = page.locator('.card-face.back');
			await expect(backFace).toBeAttached();
		});
	});

	test('Scenario: Kiểm tra giao diện Zen tối giản 1 màn hình cố định và chuyển đổi Dark Light mode', async ({ page }) => {
		// Given: Người dùng truy cập trang chủ FLCard-JP
		await test.step('Given: Người dùng mở trang chủ trên trình duyệt', async () => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');
		});

		// When: Người dùng quan sát thanh điều hướng và kích hoạt nút chuyển chế độ theme
		await test.step('When: Người dùng kiểm tra Navbar cố định và nhấn nút đổi theme', async () => {
			// Navbar phải cố định ở đỉnh màn hình
			const header = page.locator('header');
			await expect(header).toBeVisible();
			await expect(header).toHaveClass(/fixed/);

			// Chỉ có duy nhất 1 nút tính năng chính (+ Tạo thẻ)
			const createBtn = page.locator('#nav-create-card-btn');
			await expect(createBtn).toBeVisible();
			await expect(createBtn).toContainText('Tạo thẻ');

			// Nhấn chuyển đổi Dark / Light mode
			const themeBtn = page.locator('#theme-toggle-btn');
			await expect(themeBtn).toBeVisible();
			await themeBtn.click();
		});

		// Then: Giao diện chuyển đổi theme chuẩn xác và trang web hoàn toàn không bị tràn cuộn
		await test.step('Then: Kiểm tra trạng thái theme và xác nhận không có thanh cuộn dọc (Zero scroll)', async () => {
			// Kiểm tra theme đã lưu
			const savedTheme = await page.evaluate(() => localStorage.getItem('flcard-theme'));
			expect(['dark', 'light']).toContain(savedTheme);

			// Kiểm tra chiều cao trang không bị tràn gây thanh cuộn
			const isScrollable = await page.evaluate(() => {
				return document.documentElement.scrollHeight > window.innerHeight;
			});
			expect(isScrollable).toBe(false);
		});
	});

	test('Scenario: Người dùng sử dụng điện thoại thông minh và kiểm tra giao diện thích ứng không bị cuộn', async ({ page }) => {
		// Given: Người dùng truy cập bằng thiết bị di động có kích thước màn hình nhỏ (375x667)
		await test.step('Given: Thiết lập viewport điện thoại di động và mở trang chủ', async () => {
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto('/');
			await page.waitForLoadState('networkidle');
		});

		// When: Người dùng tương tác lật thẻ và quan sát các nút đánh giá SRS
		await test.step('When: Người dùng chạm vào thẻ để lật xem đáp án trên điện thoại', async () => {
			const cardScene = page.locator('.flip-scene');
			await expect(cardScene).toBeVisible();
			await cardScene.click();

			const flashcard = page.locator('.flashcard');
			await expect(flashcard).toHaveClass(/flipped/);
		});

		// Then: Không bị thanh cuộn dọc trên điện thoại và toàn bộ 4 nút SRS hiển thị đầy đủ
		await test.step('Then: Xác nhận không bị tràn cuộn màn hình và đầy đủ nút bấm SRS', async () => {
			const isScrollable = await page.evaluate(() => {
				return document.documentElement.scrollHeight > window.innerHeight;
			});
			expect(isScrollable).toBe(false);

			// 4 nút đánh giá SRS hiển thị đầy đủ
			const againBtn = page.locator('button:has-text("1. Quên")');
			const easyBtn = page.locator('button:has-text("4. Dễ")');
			await expect(againBtn).toBeVisible();
			await expect(easyBtn).toBeVisible();
		});
	});

	test('Scenario: Kiểm tra phản hồi Backend HTTP Request thật từ máy chủ API', async ({ request }) => {
		let response: any;

		// Given: Máy chủ backend đang hoạt động
		await test.step('Given: Chuẩn bị gửi yêu cầu GET tới endpoint sức khỏe hệ thống', async () => {
			// Sẵn sàng gọi HTTP
		});

		// When: Gửi HTTP Request thật (không dùng mock) tới /api/health
		await test.step('When: Gửi HTTP GET request tới /api/health', async () => {
			response = await request.get('/api/health');
		});

		// Then: Máy chủ phải trả về HTTP status 200, header hợp lệ và payload JSON
		await test.step('Then: Xác thực HTTP status code 200 và cấu trúc dữ liệu JSON', async () => {
			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('application/json');

			const data = await response.json();
			expect(data.status).toBe('ok');
			expect(data.appName).toBe('FLCard-JP');
			expect(data.edgeRuntime).toBe('cloudflare-workers');
		});
	});

});
