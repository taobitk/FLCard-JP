import { test, expect } from '@playwright/test';

test.describe('Feature: Quản lý và Tự Tạo Thẻ Flashcard Thông Minh', () => {

	test('Scenario: Người dùng mở Modal tạo thẻ từ Navbar, gõ Romaji và nhận gợi ý Kanji tự động', async ({ page }) => {
		// Given: Người dùng đang ở trang chủ FLCard-JP
		await test.step('Given: Người dùng truy cập trang chủ', async () => {
			await page.goto('/');
			await page.waitForLoadState('domcontentloaded');
		});

		// When: Người dùng nhấn nút "+ Tạo thẻ mới" trên Navbar
		await test.step('When: Nhấn nút Tạo thẻ mới trên thanh điều hướng', async () => {
			const createBtn = page.locator('#nav-create-card-btn');
			await expect(createBtn).toBeVisible();
			await createBtn.click();
		});

		// Then: Modal tạo thẻ phải mở ra
		await test.step('Then: Modal tạo thẻ hiển thị trên màn hình', async () => {
			const modalTitle = page.locator('#modal-title');
			await expect(modalTitle).toBeVisible();
			await expect(modalTitle).toContainText('Tạo Thẻ Học Mới');
		});

		// When: Người dùng gõ "watashi" vào ô Romaji
		await test.step('When: Người dùng nhập "watashi" vào ô Romaji', async () => {
			const romajiInput = page.locator('#romaji-input');
			await romajiInput.fill('watashi');
		});

		// Then: Hệ thống tự động chuyển thành "わたし" và gợi ý Kanji "私"
		await test.step('Then: Chuyển đổi sang Hiragana và hiển thị gợi ý Kanji 私', async () => {
			// Kiểm tra badge tự tạo Hiragana hiển thị
			const autoPill = page.locator('text=Tự tạo: わたし');
			await expect(autoPill).toBeVisible();

			// Kiểm tra có nút gợi ý Kanji 私
			const kanjiSuggestionBtn = page.locator('button:has-text("私")').first();
			await expect(kanjiSuggestionBtn).toBeVisible();

			// Click chọn gợi ý Kanji 私
			await kanjiSuggestionBtn.click();

			// Kiểm tra ô nghĩa tiếng Việt tự động điền nghĩa từ API (chứa 'tôi')
			const meaningInput = page.locator('#meaning-input');
			await expect(meaningInput).toHaveValue(/tôi/i);
		});

		// When: Người dùng dán ảnh từ bộ nhớ tạm (Clipboard Ctrl+V)
		await test.step('When: Người dùng dán ảnh từ bộ nhớ tạm', async () => {
			await page.evaluate(() => {
				const byteString = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
				const ab = new ArrayBuffer(byteString.length);
				const ia = new Uint8Array(ab);
				for (let i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				const blob = new Blob([ab], { type: 'image/png' });
				const file = new File([blob], 'clipboard_test.png', { type: 'image/png' });

				const dt = new DataTransfer();
				dt.items.add(file);
				const pasteEvent = new ClipboardEvent('paste', {
					clipboardData: dt,
					bubbles: true,
					cancelable: true
				});
				window.dispatchEvent(pasteEvent);
			});
		});

		// Then: Hệ thống mở popup cắt ảnh vuông và xác nhận dán thành công
		await test.step('Then: Kiểm tra thông báo dán ảnh thành công và mở công cụ cắt ảnh', async () => {
			const pasteSuccessNotice = page.locator('text=Đã nhận ảnh từ bộ nhớ tạm!');
			await expect(pasteSuccessNotice).toBeVisible();

			// Bấm nút Áp dụng cắt ảnh
			const applyCropBtn = page.locator('#apply-crop-btn');
			await expect(applyCropBtn).toBeVisible();
			await applyCropBtn.click();

			// Sau khi cắt xong, nút Gỡ và Cắt lại xuất hiện
			const removeBtn = page.locator('button:has-text("Gỡ")');
			await expect(removeBtn).toBeAttached();
		});

		// When: Người dùng bấm nút Lưu thẻ
		await test.step('When: Người dùng bấm Lưu Thẻ Này', async () => {
			const saveBtn = page.locator('#save-card-submit-btn');
			await saveBtn.click();
		});

		// Then: Modal đóng lại và thẻ mới xuất hiện trên giao diện
		await test.step('Then: Thẻ mới 私 xuất hiện trong danh sách và hiển thị thành công', async () => {
			// Modal đã đóng
			const modalTitle = page.locator('#modal-title');
			await expect(modalTitle).not.toBeVisible();

			// Toast thông báo xuất hiện
			const toast = page.locator('text=Đã thêm thành công thẻ: "私"!');
			await expect(toast).toBeVisible();

			// Reload trang để kiểm chứng tính năng lưu trữ bền vững trên Cloudflare D1
			await page.reload();
			await page.waitForLoadState('domcontentloaded');
			const res = await page.request.get('/api/cards');
			expect(res.status()).toBe(200);
			const data = await res.json();
			const terms = data.cards.map((c: any) => c.term);
			expect(terms).toContain('私');
		});
	});

	test('Scenario: Người dùng mở danh sách thẻ để chỉnh sửa nội dung thẻ và xóa thẻ thành công', async ({ page }) => {
		// Given: Người dùng mở trang chủ và bấm vào số thứ tự để mở danh sách thẻ
		await test.step('Given: Người dùng truy cập trang chủ và mở Popup danh sách thẻ', async () => {
			await page.goto('/');
			await page.waitForLoadState('domcontentloaded');

			// Bấm vào nút số thứ tự thẻ để mở DeckListModal
			const deckListTrigger = page.locator('button[title*="danh sách toàn bộ thẻ"]');
			await expect(deckListTrigger).toBeVisible();
			await deckListTrigger.click();

			const modalTitle = page.locator('#deck-modal-title');
			await expect(modalTitle).toBeVisible();
		});

		// When: Người dùng bấm nút Sửa trên thẻ đầu tiên và thay đổi ý nghĩa tiếng Việt
		await test.step('When: Người dùng bấm nút chỉnh sửa và cập nhật nghĩa mới cho thẻ', async () => {
			const editBtn = page.locator('button[title="Chỉnh sửa thẻ này"]').first();
			await expect(editBtn).toBeVisible();
			await editBtn.click();

			// Modal chỉnh sửa xuất hiện
			const editModalTitle = page.locator('#modal-title');
			await expect(editModalTitle).toContainText('Chỉnh Sửa Thẻ Học');

			// Sửa nghĩa tiếng Việt
			const meaningInput = page.locator('#meaning-input');
			await meaningInput.fill('Ý nghĩa đã được cập nhật kiểm thử');

			// Bấm nút Cập Nhật
			const updateBtn = page.locator('#save-card-submit-btn');
			await expect(updateBtn).toContainText('Cập Nhật Thẻ');
			await updateBtn.click();
		});

		// Then: Thẻ được cập nhật thành công, sau đó người dùng xóa thử 1 thẻ với xác nhận
		await test.step('Then: Kiểm tra thẻ đã được cập nhật và thực hiện xóa thẻ có xác nhận', async () => {
			// Toast thông báo cập nhật
			const updateToast = page.locator('text=Đã cập nhật thành công thẻ:');
			await expect(updateToast).toBeVisible();

			// Mở lại danh sách để xóa 1 thẻ
			const deckListTrigger = page.locator('button[title*="danh sách toàn bộ thẻ"]');
			await deckListTrigger.click();

			// Bấm icon xóa thẻ đầu tiên
			const deleteBtn = page.locator('button[title="Xóa thẻ này"]').first();
			await expect(deleteBtn).toBeVisible();
			await deleteBtn.click();

			// Hộp thoại xác nhận inline xuất hiện (nút 'Có')
			const confirmYesBtn = page.locator('button:has-text("Có")');
			await expect(confirmYesBtn).toBeVisible();
			await confirmYesBtn.click();

			// Toast xóa thành công
			const deleteToast = page.locator('text=Đã xóa thẻ:');
			await expect(deleteToast).toBeVisible();
		});
	});

	test('Scenario: Kiểm tra phản hồi Backend HTTP Request thật tới API gợi ý Kanji', async ({ request }) => {
		let response: any;

		// Given: Chuẩn bị tham số truy vấn tìm kiếm từ vựng
		await test.step('Given: Chuẩn bị tham số truy vấn "watashi"', async () => {
			// Sẵn sàng gọi HTTP
		});

		// When: Gửi HTTP GET request thật tới /api/kanji/suggest?q=watashi
		await test.step('When: Gửi HTTP GET tới /api/kanji/suggest?q=watashi', async () => {
			response = await request.get('/api/kanji/suggest?q=watashi');
		});

		// Then: API trả về HTTP 200 và danh sách Kanji có chứa 私
		await test.step('Then: Kiểm tra status code 200 và dữ liệu gợi ý chứa Kanji 私', async () => {
			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('application/json');

			const data = await response.json();
			expect(data.query).toBe('watashi');
			expect(data.hiragana).toBe('わたし');
			expect(data.count).toBeGreaterThan(0);

			const hasWatashi = data.suggestions.some((s: any) => s.term === '私' && s.reading === 'わたし');
			expect(hasWatashi).toBe(true);
		});
	});

});
