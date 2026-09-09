<script lang="ts">
	let isDark = $state(true);

	// Khởi tạo theme từ localStorage hoặc thiết bị
	$effect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('flcard-theme');
			if (saved === 'light') {
				isDark = false;
				document.documentElement.classList.remove('dark');
			} else {
				isDark = true;
				document.documentElement.classList.add('dark');
			}
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('flcard-theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('flcard-theme', 'light');
		}
	}
</script>

<button
	type="button"
	id="theme-toggle-btn"
	class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 shadow-sm active:scale-95 cursor-pointer"
	onclick={toggleTheme}
	title={isDark ? 'Chuyển sang giao diện Sáng (Light mode)' : 'Chuyển sang giao diện Tối (Dark mode)'}
	aria-label="Chuyển đổi giao diện Sáng / Tối"
>
	{#if isDark}
		<span class="text-base">🌙</span>
	{:else}
		<span class="text-base text-amber-500">☀️</span>
	{/if}
</button>
