import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình Playwright E2E & HTTP Testing cho FLCard-JP
 * Chạy trên Chrome/Chromium thật kết hợp dev server Vite/SvelteKit.
 */
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],

	/* Tự động bật SvelteKit Vite dev server khi chạy test nếu chưa bật */
	webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 60 * 1000
	}
});
