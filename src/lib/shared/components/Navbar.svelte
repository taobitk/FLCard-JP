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
		<!-- Brand Logo: Trên mobile chỉ hiện icon 日 siêu gọn -->
		<div class="flex items-center gap-3 sm:gap-6">
			<a href="/" class="flex items-center gap-2 group">
				<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center font-bold font-jp text-white text-base shadow-md group-hover:scale-105 transition-transform border border-indigo-400/30 flex-shrink-0">
					日
				</div>
				<span class="brand-title font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
					FLCard<span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">-JP</span>
				</span>
			</a>

			<!-- Nav Navigation Links -->
			<nav class="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
				<a href="/" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#151c2c] transition-colors">Trang chủ</a>
				<a href="/study" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#151c2c] text-indigo-600 dark:text-indigo-400 font-bold transition-colors flex items-center gap-1">
					<span>🎴</span> Ôn Flashcard
				</a>
			</nav>
		</div>

		<!-- Action Buttons: Theme Toggle & Nút Tạo thẻ tối ưu mobile -->
		<div class="flex items-center gap-2 sm:gap-2.5">
			<ThemeToggle />

			<button
				type="button"
				id="nav-batch-import-btn"
				class="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 active:scale-95 transition-all cursor-pointer shadow-xs"
				onclick={() => onBatchImport?.()}
				title="Nhập hàng loạt thẻ từ JSON & ghép ảnh"
			>
				<span>⚡</span>
				<span class="hidden sm:inline">Nhập JSON</span>
			</button>

			<button
				type="button"
				id="nav-create-card-btn"
				class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-950/20 active:scale-95 transition-all cursor-pointer border border-indigo-400/30"
				onclick={() => onCreateCard?.()}
			>
				<span class="text-base leading-none font-bold">+</span>
				<span>Tạo thẻ</span>
			</button>
		</div>
	</div>
</header>
