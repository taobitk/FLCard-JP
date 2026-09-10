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
	class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border border-slate-200 dark:border-[#242f47] bg-white dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 shadow-sm active:scale-95 cursor-pointer"
	onclick={toggleTheme}
	title={isDark ? 'Chuyển sang giao diện Sáng (Light mode)' : 'Chuyển sang giao diện Tối (Dark mode)'}
	aria-label="Chuyển đổi giao diện Sáng / Tối"
>
	{#if isDark}
		<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
		</svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="4"/>
			<path d="M12 2v2"/>
			<path d="M12 20v2"/>
			<path d="m4.93 4.93 1.41 1.41"/>
			<path d="m17.66 17.66 1.41 1.41"/>
			<path d="M2 12h2"/>
			<path d="M20 12h2"/>
			<path d="m6.34 17.66-1.41 1.41"/>
			<path d="m19.07 4.93-1.41 1.41"/>
		</svg>
	{/if}
</button>
