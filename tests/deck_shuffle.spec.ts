import { test, expect } from '@playwright/test';

test.describe('Feature: Trộn Thẻ Ngẫu Nhiên và Bốc Từ Tức Thì (Deck Shuffle & Random Card)', () => {

	test('Scenario: Người dùng nhấn nút Trộn thẻ hoặc phím S để xáo trộn bộ thẻ và khôi phục thứ tự gốc', async ({ page }) => {
		// Given: Người dùng truy cập phòng học FLCard-JP
		await test.step('Given: Người dùng truy cập phòng học FLCard-JP', async () => {
			await page.goto('/study');
			await page.waitForLoadState('domcontentloaded');
		});

		// When: Người dùng nhấn nút "🔀 Trộn" trên thanh điều hướng thẻ
		await test.step('When: Người dùng nhấn nút Trộn thẻ trên thanh điều hướng', async () => {
			const shuffleBtn = page.locator('#btn-shuffle-deck');
			await expect(shuffleBtn).toBeVisible();
			await expect(shuffleBtn).toContainText('Trộn');
			await shuffleBtn.click();
		});

		// Then: Chế độ xáo trộn được kích hoạt, nút đổi sang "Đang trộn" và có thông báo nổi
		await test.step('Then: Chế độ xáo trộn được kích hoạt thành công', async () => {
			const shuffleBtn = page.locator('#btn-shuffle-deck');
			await expect(shuffleBtn).toContainText('Đang trộn');

			// Toast thông báo trộn ngẫu nhiên xuất hiện
			const toast = page.locator('text=Đã bật chế độ trộn ngẫu nhiên');
			await expect(toast).toBeVisible();
		});

		// When: Người dùng nhấn lại nút Trộn thẻ để tắt chế độ xáo trộn
		await test.step('When: Người dùng nhấn lại nút Trộn để khôi phục thứ tự', async () => {
			const shuffleBtn = page.locator('#btn-shuffle-deck');
			await shuffleBtn.click();
		});

		// Then: Hệ thống khôi phục lại thứ tự gốc và nút trở về trạng thái bình thường
		await test.step('Then: Thứ tự ban đầu được khôi phục', async () => {
			const shuffleBtn = page.locator('#btn-shuffle-deck');
			await expect(shuffleBtn).toContainText('Trộn');

			// Toast thông báo khôi phục thứ tự gốc
			const restoreToast = page.locator('text=Đã khôi phục thứ tự gốc');
			await expect(restoreToast).toBeVisible();
		});

		// When: Người dùng dùng phím tắt 's' trên bàn phím
		await test.step('When: Người dùng bấm phím S để kích hoạt xáo trộn bằng phím tắt', async () => {
			await page.keyboard.press('KeyS');
		});

		// Then: Chế độ xáo trộn được bật lại qua phím tắt
		await test.step('Then: Bật xáo trộn thành công qua phím tắt S', async () => {
			const shuffleBtn = page.locator('#btn-shuffle-deck');
			await expect(shuffleBtn).toContainText('Đang trộn');
		});
	});

	test('Scenario: Người dùng nhấn phím R để nhảy ngẫu nhiên đến một thẻ trong bộ học', async ({ page }) => {
		// Given: Người dùng đang ở phòng học FLCard-JP
		await test.step('Given: Người dùng truy cập phòng học và kiểm tra thẻ hiện tại', async () => {
			await page.goto('/study');
			await page.waitForLoadState('domcontentloaded');
		});

		// When: Người dùng bấm phím R trên bàn phím
		await test.step('When: Người dùng bấm phím R để bốc ngẫu nhiên một thẻ', async () => {
			await page.keyboard.press('KeyR');
		});

		// Then: Hệ thống nhảy sang thẻ ngẫu nhiên và thông báo xuất hiện
		await test.step('Then: Thông báo nhảy ngẫu nhiên xuất hiện trên màn hình', async () => {
			const toast = page.locator('text=Đã nhảy ngẫu nhiên đến thẻ');
			await expect(toast).toBeVisible();
		});
	});

});
