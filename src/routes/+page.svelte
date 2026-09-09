<script lang="ts">
	import type { PageData } from './$types';
	import type { FlashcardItem } from '$lib/features/flashcard/types';
	import Navbar from '$lib/shared/components/Navbar.svelte';
	import CreateCardModal from '$lib/features/deck-manager/components/CreateCardModal.svelte';
	import DeckListModal from '$lib/features/deck-manager/components/DeckListModal.svelte';
	import BatchImportModal from '$lib/features/deck-manager/components/BatchImportModal.svelte';

	let { data }: { data: PageData } = $props();

	let cards = $state<FlashcardItem[]>([]);
	$effect(() => {
		cards = data?.cards ? [...data.cards] : [];
	});

	let isCreateModalOpen = $state(false);
	let isDeckListModalOpen = $state(false);
	let isBatchImportModalOpen = $state(false);
	let cardToEdit = $state<FlashcardItem | null>(null);
	let notification = $state('');

	function showNotification(msg: string) {
		notification = msg;
		setTimeout(() => {
			notification = '';
		}, 3000);
	}

	async function handleSaveCard(savedCard: FlashcardItem) {
		cards = [savedCard, ...cards];
		showNotification(`🎉 Đã thêm thành công thẻ: "${savedCard.term}"!`);
		try {
			await fetch('/api/cards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(savedCard)
			});
		} catch (err) {
			console.error('Lỗi khi lưu thẻ:', err);
		}
	}

	async function handleBatchImportCards(newCards: FlashcardItem[]) {
		cards = [...newCards, ...cards];
		showNotification(`🚀 Đã nạp thành công ${newCards.length} thẻ mới vào bộ học!`);
		try {
			await fetch('/api/cards/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cards: newCards })
			});
		} catch (err) {
			console.error('Lỗi khi nạp thẻ hàng loạt:', err);
		}
	}
</script>

<svelte:head>
	<title>FLCard-JP • Học Tiếng Nhật</title>
</svelte:head>

<!-- GIAO DIỆN TỐI GIẢN (KISS: CHỈ ICON & TÊN) -->
<div class="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-200 flex flex-col pt-16 sm:pt-20 pb-12 relative select-none">
	<!-- Navbar Cố Định -->
	<Navbar
		onCreateCard={() => { cardToEdit = null; isCreateModalOpen = true; }}
		onBatchImport={() => isBatchImportModalOpen = true}
	/>

	<!-- Toast Thông Báo -->
	{#if notification}
		<div class="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
			{notification}
		</div>
	{/if}

	<main class="w-full max-w-4xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col gap-6 sm:gap-8">
		<!-- HERO BANNER TỐI GIẢN -->
		<section class="rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="space-y-1.5">
				<div class="flex items-center gap-2">
					<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 level-pill">N5</span>
					<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
						🔥 7 ngày
					</span>
				</div>
				<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
					Hôm nay có <span class="text-indigo-600 dark:text-indigo-400">{cards.length} thẻ</span> cần ôn.
				</h1>
			</div>

			<a
				href="/study"
				class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
			>
				<span>▶ Ôn Flashcard</span>
				<span>→</span>
			</a>
		</section>

		<!-- LƯỚI TÍNH NĂNG (CHỈ ICON + TÊN) -->
		<section class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
			<!-- 1. Flashcard -->
			<a
				href="/study"
				class="p-6 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-indigo-50/50 dark:hover:bg-[#1c263c] border border-slate-200/90 dark:border-[#242f47] hover:border-indigo-400/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group active:scale-98"
			>
				<span class="text-4xl group-hover:scale-110 transition-transform">🎴</span>
				<span class="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
					Flashcard
				</span>
			</a>

			<!-- 2. Kanji -->
			<button
				type="button"
				class="p-6 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-rose-50/50 dark:hover:bg-[#251f2d] border border-slate-200/90 dark:border-[#242f47] hover:border-rose-400/60 dark:hover:border-rose-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group active:scale-98"
				onclick={() => showNotification('✍️ Tra cứu Kanji')}
			>
				<span class="text-4xl group-hover:scale-110 transition-transform">✍️</span>
				<span class="font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
					Kanji
				</span>
			</button>

			<!-- 3. Shadowing -->
			<button
				type="button"
				class="p-6 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-amber-50/50 dark:hover:bg-[#292420] border border-slate-200/90 dark:border-[#242f47] hover:border-amber-400/60 dark:hover:border-amber-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group active:scale-98"
				onclick={() => showNotification('🎙️ Luyện nói Shadowing')}
			>
				<span class="text-4xl group-hover:scale-110 transition-transform">🎙️</span>
				<span class="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
					Shadowing
				</span>
			</button>

			<!-- 4. Đặt câu AI -->
			<button
				type="button"
				class="p-6 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-purple-50/50 dark:hover:bg-[#251e33] border border-slate-200/90 dark:border-[#242f47] hover:border-purple-400/60 dark:hover:border-purple-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group active:scale-98"
				onclick={() => showNotification('🤖 Đặt câu AI')}
			>
				<span class="text-4xl group-hover:scale-110 transition-transform">🤖</span>
				<span class="font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
					Đặt câu AI
				</span>
			</button>

			<!-- 5. Kho thẻ -->
			<button
				type="button"
				class="p-6 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-blue-50/50 dark:hover:bg-[#1b2536] border border-slate-200/90 dark:border-[#242f47] hover:border-blue-400/60 dark:hover:border-blue-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group active:scale-98"
				onclick={() => isDeckListModalOpen = true}
			>
				<span class="text-4xl group-hover:scale-110 transition-transform">📚</span>
				<span class="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
					Kho thẻ
				</span>
			</button>

			<!-- 6. Thống kê -->
			<button
				type="button"
				class="p-6 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-emerald-50/50 dark:hover:bg-[#1b2b28] border border-slate-200/90 dark:border-[#242f47] hover:border-emerald-400/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group active:scale-98"
				onclick={() => showNotification(`📊 Tổng: ${cards.length} thẻ D1`)}
			>
				<span class="text-4xl group-hover:scale-110 transition-transform">📊</span>
				<span class="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
					Thống kê
				</span>
			</button>
		</section>

		<!-- THẺ GẦN ĐÂY -->
		<section class="p-5 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs space-y-3">
			<div class="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
				<span>THẺ GẦN ĐÂY</span>
				<a href="/study" class="text-indigo-600 dark:text-indigo-400 hover:underline">Vào học →</a>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
				{#each cards.slice(0, 5) as card}
					<div class="p-2.5 rounded-2xl bg-[#f8f9fb] dark:bg-[#0b0f19] border border-slate-200/80 dark:border-[#242f47] text-center">
						<div class="text-base font-bold font-jp text-slate-900 dark:text-white">{card.term}</div>
						<div class="text-[11px] text-indigo-600 dark:text-indigo-400 font-jp">{card.reading}</div>
						<div class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{card.meaning}</div>
					</div>
				{/each}
			</div>
		</section>
	</main>

	<!-- Modals -->
	<DeckListModal
		isOpen={isDeckListModalOpen}
		{cards}
		currentCardIndex={0}
		onSelectCard={() => {}}
		onEditCard={(card) => { cardToEdit = card; isCreateModalOpen = true; }}
		onDeleteCard={async (idx) => {
			const target = cards[idx];
			if (target) {
				cards = cards.filter((_, i) => i !== idx);
				await fetch(`/api/cards?id=${encodeURIComponent(target.id)}`, { method: 'DELETE' });
				showNotification(`🗑️ Đã xóa: "${target.term}"!`);
			}
		}}
		onClose={() => isDeckListModalOpen = false}
		onCreateNewCard={() => { cardToEdit = null; isCreateModalOpen = true; }}
	/>

	<CreateCardModal
		isOpen={isCreateModalOpen}
		{cardToEdit}
		onClose={() => { isCreateModalOpen = false; cardToEdit = null; }}
		onSave={handleSaveCard}
	/>

	<BatchImportModal
		isOpen={isBatchImportModalOpen}
		onClose={() => isBatchImportModalOpen = false}
		onImport={handleBatchImportCards}
	/>
</div>
