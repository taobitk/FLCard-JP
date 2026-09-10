<script lang="ts">
	import type { PageData } from './$types';
	import type { FlashcardItem } from '$lib/features/flashcard/types';
	import Navbar from '$lib/shared/components/Navbar.svelte';
	import CreateCardModal from '$lib/features/deck-manager/components/CreateCardModal.svelte';
	import DeckListModal from '$lib/features/deck-manager/components/DeckListModal.svelte';
	import BatchImportModal from '$lib/features/deck-manager/components/BatchImportModal.svelte';
	import { tagQueue } from '$lib/features/taxonomy/services/tag-queue';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let cards = $state<FlashcardItem[]>([]);
	$effect(() => {
		cards = data?.cards ? [...data.cards] : [];
	});

	onMount(() => {
		const unsubscribe = tagQueue.subscribe((cardId, newTags) => {
			cards = cards.map(c => c.id === cardId ? { ...c, tags: newTags } : c);
		});
		return unsubscribe;
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

		// Nếu thẻ chưa có tag hoặc tag rỗng, tự động đưa vào hàng đợi AI 30s
		if (!savedCard.tags || savedCard.tags.length === 0) {
			tagQueue.enqueue({
				id: savedCard.id,
				term: savedCard.term,
				meaning: savedCard.meaning,
				reading: savedCard.reading,
				cardType: savedCard.type
			});
		}

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

		// Nếu có thẻ chưa có tag, phân loại ngay lập tức
		const needTags = newCards.filter(c => !c.tags || c.tags.length === 0);
		if (needTags.length > 0) {
			tagQueue.classifyImmediately(needTags.map(c => ({
				id: c.id,
				term: c.term,
				meaning: c.meaning,
				reading: c.reading,
				cardType: c.type
			})));
		}
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

	<main class="w-full max-w-3xl mx-auto px-4 sm:px-6 my-auto flex-1 flex flex-col justify-center relative z-10 py-6 sm:py-10">
		<!-- LƯỚI TÍNH NĂNG (CHỈ ICON + TÊN) -->
		<section class="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
			<!-- 1. Flashcard -->
			<a
				href="/study"
				class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-indigo-50/50 dark:hover:bg-[#1c263c] border border-slate-200/90 dark:border-[#242f47] hover:border-indigo-400/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer group active:scale-98"
			>
				<span class="text-5xl group-hover:scale-110 transition-transform">🎴</span>
				<span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
					Flashcard
				</span>
			</a>

			<!-- 2. Kanji -->
			<button
				type="button"
				class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-rose-50/50 dark:hover:bg-[#251f2d] border border-slate-200/90 dark:border-[#242f47] hover:border-rose-400/60 dark:hover:border-rose-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer group active:scale-98"
				onclick={() => showNotification('✍️ Tra cứu Kanji')}
			>
				<span class="text-5xl group-hover:scale-110 transition-transform">✍️</span>
				<span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
					Kanji
				</span>
			</button>

			<!-- 3. Shadowing -->
			<button
				type="button"
				class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-amber-50/50 dark:hover:bg-[#292420] border border-slate-200/90 dark:border-[#242f47] hover:border-amber-400/60 dark:hover:border-amber-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer group active:scale-98"
				onclick={() => showNotification('🎙️ Luyện nói Shadowing')}
			>
				<span class="text-5xl group-hover:scale-110 transition-transform">🎙️</span>
				<span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
					Shadowing
				</span>
			</button>

			<!-- 4. Đặt câu AI -->
			<button
				type="button"
				class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-purple-50/50 dark:hover:bg-[#251e33] border border-slate-200/90 dark:border-[#242f47] hover:border-purple-400/60 dark:hover:border-purple-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer group active:scale-98"
				onclick={() => showNotification('🤖 Đặt câu AI')}
			>
				<span class="text-5xl group-hover:scale-110 transition-transform">🤖</span>
				<span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
					Đặt câu AI
				</span>
			</button>

			<!-- 5. Kho thẻ -->
			<button
				type="button"
				class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-blue-50/50 dark:hover:bg-[#1b2536] border border-slate-200/90 dark:border-[#242f47] hover:border-blue-400/60 dark:hover:border-blue-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer group active:scale-98"
				onclick={() => isDeckListModalOpen = true}
			>
				<span class="text-5xl group-hover:scale-110 transition-transform">📚</span>
				<span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
					Kho thẻ
				</span>
			</button>

			<!-- 6. Thống kê -->
			<button
				type="button"
				class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-emerald-50/50 dark:hover:bg-[#1b2b28] border border-slate-200/90 dark:border-[#242f47] hover:border-emerald-400/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer group active:scale-98"
				onclick={() => showNotification(`📊 Tổng: ${cards.length} thẻ D1`)}
			>
				<span class="text-5xl group-hover:scale-110 transition-transform">📊</span>
				<span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
					Thống kê
				</span>
			</button>
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
