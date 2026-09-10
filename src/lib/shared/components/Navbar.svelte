<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		onCreateCard?: () => void;
		onBatchImport?: () => void;
	}

	let { onCreateCard, onBatchImport }: Props = $props();
</script>

<!-- Navbar Cố Định (Fixed at top, responsive for mobile) -->
<header class="fixed top-0 left-0 right-0 z-40 w-full h-14 sm:h-16 border-b border-slate-200/80 dark:border-[#242f47] bg-white/85 dark:bg-[#0b0f19]/85 backdrop-blur-xl shadow-xs transition-colors duration-200">
	<div class="max-w-5xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between">
		<!-- Brand Logo -->
		<div class="flex items-center gap-3">
			<a href="/" class="flex items-center gap-2 group">
				<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center font-bold font-jp text-white text-base shadow-md group-hover:scale-105 transition-transform border border-indigo-400/30 flex-shrink-0">
					日
				</div>
				<span class="brand-title font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
					<span>FLCard<span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">-JP</span></span>
					<span class="level-pill text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">N5</span>
				</span>
			</a>
		</div>

		<!-- Action Buttons: Theme Toggle, Nhập File, Tạo thẻ -->
		<div class="flex items-center gap-2">
			<ThemeToggle />

			<button
				type="button"
				id="nav-batch-import-btn"
				class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border border-slate-200 dark:border-[#242f47] bg-white dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs active:scale-95 cursor-pointer"
				onclick={() => onBatchImport?.()}
				title="Nhập hàng loạt thẻ từ JSON"
				aria-label="Nhập thẻ"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="7 10 12 15 17 10"/>
					<line x1="12" y1="15" x2="12" y2="3"/>
				</svg>
			</button>

			<button
				type="button"
				id="nav-create-card-btn"
				class="h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
				onclick={() => onCreateCard?.()}
				title="Tạo thẻ mới"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				<span>Tạo thẻ</span>
			</button>
		</div>
	</div>
</header>
