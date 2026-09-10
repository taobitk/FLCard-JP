<script lang="ts">
	import type { FlashcardItem } from '$lib/features/flashcard/types';
	import type { PageData } from './$types';
	import Navbar from '$lib/shared/components/Navbar.svelte';
	import Flashcard from '$lib/features/flashcard/components/Flashcard.svelte';
	import CreateCardModal from '$lib/features/deck-manager/components/CreateCardModal.svelte';
	import DeckListModal from '$lib/features/deck-manager/components/DeckListModal.svelte';
	import BatchImportModal from '$lib/features/deck-manager/components/BatchImportModal.svelte';

	let { data }: { data: PageData } = $props();

	let cards = $state<FlashcardItem[]>([]);

	// Đồng bộ trực tiếp dữ liệu thẻ từ Cloudflare D1
	$effect(() => {
		cards = data?.cards ? [...data.cards] : [];
	});

	let currentIndex = $state(0);
	let isFlipped = $state(false);
	let isCreateModalOpen = $state(false);
	let isDeckListModalOpen = $state(false);
	let isBatchImportModalOpen = $state(false);
	let isShuffled = $state(false);
	let unshuffledCards: FlashcardItem[] = [];
	let cardToEdit = $state<FlashcardItem | null>(null);
	let notification = $state('');

	let currentCard = $derived(cards[currentIndex] || cards[0]);

	function toggleFlip() {
		isFlipped = !isFlipped;
	}

	function nextCard() {
		isFlipped = false;
		currentIndex = (currentIndex + 1) % cards.length;
	}

	function prevCard() {
		isFlipped = false;
		currentIndex = (currentIndex - 1 + cards.length) % cards.length;
	}

	function shuffleArray<T>(array: T[]): T[] {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function toggleShuffle() {
		if (cards.length <= 1) {
			showNotification('⚠️ Cần ít nhất 2 thẻ để thực hiện xáo trộn!');
			return;
		}

		if (!isShuffled) {
			unshuffledCards = [...cards];
			cards = shuffleArray(cards);
			isShuffled = true;
			currentIndex = 0;
			isFlipped = false;
			showNotification('🔀 Đã bật chế độ trộn ngẫu nhiên!');
		} else {
			if (unshuffledCards.length > 0) {
				cards = [...unshuffledCards];
			}
			isShuffled = false;
			currentIndex = 0;
			isFlipped = false;
			showNotification('↩️ Đã khôi phục thứ tự gốc!');
		}
	}

	function jumpToRandomCard() {
		if (cards.length <= 1) return;
		let nextIdx = currentIndex;
		while (nextIdx === currentIndex) {
			nextIdx = Math.floor(Math.random() * cards.length);
		}
		currentIndex = nextIdx;
		isFlipped = false;
		showNotification(`🎲 Đã nhảy ngẫu nhiên đến thẻ #${currentIndex + 1}`);
	}

	function handleEditCard(card: FlashcardItem) {
		cardToEdit = card;
		isCreateModalOpen = true;
	}

	async function handleDeleteCard(index: number) {
		const targetCard = cards[index];
		if (!targetCard) return;

		if (cards.length <= 1) {
			showNotification('⚠️ Cần giữ lại ít nhất 1 thẻ trong bộ học!');
			return;
		}

		cards = cards.filter((_, i) => i !== index);

		if (currentIndex >= cards.length) {
			currentIndex = cards.length - 1;
		}
		isFlipped = false;

		try {
			await fetch(`/api/cards?id=${encodeURIComponent(targetCard.id)}`, { method: 'DELETE' });
		} catch (err) {
			console.error('Lỗi khi xóa thẻ khỏi Cloudflare D1:', err);
		}

		showNotification(`🗑️ Đã xóa thẻ: "${targetCard.term}"!`);
	}

	async function handleSaveCard(savedCard: FlashcardItem) {
		const isEdit = Boolean(cardToEdit);
		if (cardToEdit) {
			cards = cards.map(c => c.id === savedCard.id ? savedCard : c);
			showNotification(`✏️ Đã cập nhật thành công thẻ: "${savedCard.term}"!`);
			cardToEdit = null;
		} else {
			cards = [savedCard, ...cards];
			currentIndex = 0;
			showNotification(`🎉 Đã thêm thành công thẻ: "${savedCard.term}"!`);
		}
		isFlipped = false;

		try {
			await fetch('/api/cards', {
				method: isEdit ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(savedCard)
			});
		} catch (err) {
			console.error('Lỗi khi lưu thẻ vào Cloudflare D1:', err);
		}
	}

	async function handleBatchImportCards(newCards: FlashcardItem[]) {
		cards = [...newCards, ...cards];
		currentIndex = 0;
		isFlipped = false;

		try {
			await fetch('/api/cards/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cards: newCards })
			});
		} catch (err) {
			console.error('Lỗi khi nạp hàng loạt thẻ vào Cloudflare D1:', err);
		}

		showNotification(`🚀 Đã nạp thành công ${newCards.length} thẻ mới vào bộ học!`);
	}

	function showNotification(msg: string) {
		notification = msg;
		setTimeout(() => {
			notification = '';
		}, 3000);
	}

	function handleRating(label: string) {
		showNotification(`Đã đánh giá: ${label}!`);
		setTimeout(() => {
			nextCard();
		}, 300);
	}

	function onKeydown(e: KeyboardEvent) {
		if (isCreateModalOpen || isDeckListModalOpen || isBatchImportModalOpen) return;

		if (e.code === 'Space') {
			e.preventDefault();
			toggleFlip();
		} else if (e.code === 'ArrowRight') {
			nextCard();
		} else if (e.code === 'ArrowLeft') {
			prevCard();
		} else if (e.code === 'KeyS') {
			e.preventDefault();
			toggleShuffle();
		} else if (e.code === 'KeyR') {
			e.preventDefault();
			jumpToRandomCard();
		} else if (isFlipped) {
			if (e.key === '1') handleRating('Again');
			if (e.key === '2') handleRating('Hard');
			if (e.key === '3') handleRating('Good');
			if (e.key === '4') handleRating('Easy');
		}
	}

	let touchStartX = 0;
	let touchStartY = 0;

	function onTouchStart(e: TouchEvent) {
		if (isCreateModalOpen || isDeckListModalOpen || isBatchImportModalOpen) return;
		touchStartX = e.changedTouches[0].clientX;
		touchStartY = e.changedTouches[0].clientY;
	}

	function onTouchEnd(e: TouchEvent) {
		if (isCreateModalOpen || isDeckListModalOpen || isBatchImportModalOpen) return;
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const diffX = touchEndX - touchStartX;
		const diffY = touchEndY - touchStartY;

		if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
			if (diffX < 0) {
				nextCard();
			} else {
				prevCard();
			}
		}
	}
</script>

<svelte:window 
	onkeydown={onKeydown} 
	ontouchstart={onTouchStart} 
	ontouchend={onTouchEnd} 
/>

<!-- GIAO DIỆN CHUẨN ZEN: PHÒNG HỌC FLASHCARD (NO SCROLL, 100DVH CHO MOBILE) -->
<div class="h-[100dvh] max-h-[100dvh] w-screen overflow-hidden flex flex-col justify-between pt-14 sm:pt-16 pb-safe bg-[#f8f9fb] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-200 relative select-none touch-manipulation">

	<!-- Navbar Cố Định -->
	<Navbar
		onCreateCard={() => { cardToEdit = null; isCreateModalOpen = true; }}
		onBatchImport={() => isBatchImportModalOpen = true}
	/>

	<!-- Toast thông báo nổi -->
	{#if notification}
		<div class="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-xs px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
			{notification}
		</div>
	{/if}

	<!-- KHU VỰC TRUNG TÂM DUY NHẤT: THẺ HỌC FLASHCARD (Không cuộn, vừa khít màn hình) -->
	<main class="flex-1 w-full max-w-lg mx-auto px-3 sm:px-4 py-1 sm:py-2 flex flex-col items-center justify-center relative z-10">
		<!-- Top Control Bar chuẩn Quizlet: Hub Link, Progress Bar + Chỉ số, Nút Trộn -->
		<div class="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
			<!-- Góc trái: Quay lại Hub -->
			<a 
				href="/"
				class="h-9 px-3 rounded-xl bg-white dark:bg-[#151c2c] hover:bg-slate-50 dark:hover:bg-[#1e293b] border border-slate-200/90 dark:border-[#242f47] text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1.5 shadow-2xs font-semibold"
				title="Quay lại Hub"
			>
				<span>🏠</span>
				<span class="hidden sm:inline">Hub</span>
			</a>

			<!-- Trung tâm: Chỉ số thẻ + Thanh Progress Bar -->
			<div class="flex flex-col items-center gap-1">
				<button
					type="button"
					class="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e293b]"
					onclick={() => isDeckListModalOpen = true}
					title="Bấm để xem danh sách toàn bộ thẻ"
				>
					<span class="text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</span>
					<span class="text-slate-400 font-normal">/</span>
					<span>{cards.length}</span>
					<span class="text-[9px] text-slate-400">▼</span>
				</button>

				<!-- Thanh Progress Bar mảnh tinh tế -->
				<div class="w-28 sm:w-40 h-1.5 bg-slate-200 dark:bg-[#1e293b] rounded-full overflow-hidden">
					<div 
						class="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300 ease-out"
						style="width: {cards.length ? ((currentIndex + 1) / cards.length * 100) : 0}%"
					></div>
				</div>
			</div>

			<!-- Góc phải: Nút Trộn Thẻ Ngẫu Nhiên (Shuffle Mode) -->
			<button
				type="button"
				id="btn-shuffle-deck"
				class="h-9 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 {isShuffled ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 font-bold' : 'bg-white dark:bg-[#151c2c] border-slate-200/90 dark:border-[#242f47] text-slate-700 dark:text-slate-300 hover:text-amber-500'}"
				onclick={toggleShuffle}
				title={isShuffled ? 'Đang bật trộn ngẫu nhiên. Bấm để khôi phục thứ tự gốc (Phím S)' : 'Trộn ngẫu nhiên thứ tự các thẻ (Phím S)'}
			>
				<span>🔀</span>
				<span class="hidden sm:inline">{isShuffled ? 'Đang trộn' : 'Trộn'}</span>
			</button>
		</div>

		<!-- Chiếc Thẻ 3D Hoàn Chỉnh -->
		{#if currentCard}
			<div class="w-full">
				<Flashcard
					card={currentCard}
					{isFlipped}
					onFlip={toggleFlip}
				/>
			</div>
		{:else}
			<div class="w-full py-10 sm:py-14 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-[#242f47] rounded-3xl shadow-sm space-y-3 animate-in fade-in">
				<div class="text-4xl">📭</div>
				<h3 class="text-base font-bold text-slate-900 dark:text-white">Bộ thẻ hiện đang trống</h3>
				<p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs">Hãy bấm "+ Tạo thẻ mới" hoặc "Nhập thẻ hàng loạt" trên thanh menu để nạp từ vựng vào học nhé!</p>
			</div>
		{/if}

		<!-- Khu Vực Điều Khiển Dưới Chân Thẻ -->
		<div class="w-full max-w-[420px] sm:max-w-[460px] mt-2.5 sm:mt-3">
			{#if isFlipped}
				<!-- Khi đã lật: 4 Nút đánh giá SRS kèm nút chuyển thẻ tiện tay -->
				<div class="w-full flex items-center justify-between gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
					<button 
						type="button"
						class="w-10 sm:w-11 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-[#151c2c] hover:bg-slate-50 dark:hover:bg-[#1e293b] border border-slate-200/90 dark:border-[#242f47] text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 text-base font-bold flex-shrink-0"
						onclick={prevCard}
						title="Thẻ trước (Phím ←)"
					>
						<span>←</span>
					</button>

					<div class="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1">
						<button
							type="button"
							class="flex flex-col items-center justify-center h-11 sm:h-12 py-1 px-0.5 rounded-xl sm:rounded-2xl bg-red-500/10 dark:bg-red-500/15 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-300 font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
							onclick={() => handleRating('Again')}
						>
							<span class="text-[11px] sm:text-xs">1. Quên</span>
							<span class="text-[9px] text-red-400/80 font-normal">&lt; 10m</span>
						</button>

						<button
							type="button"
							class="flex flex-col items-center justify-center h-11 sm:h-12 py-1 px-0.5 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
							onclick={() => handleRating('Hard')}
						>
							<span class="text-[11px] sm:text-xs">2. Khó</span>
							<span class="text-[9px] text-amber-400/80 font-normal">1 ngày</span>
						</button>

						<button
							type="button"
							class="flex flex-col items-center justify-center h-11 sm:h-12 py-1 px-0.5 rounded-xl sm:rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300 font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
							onclick={() => handleRating('Good')}
						>
							<span class="text-[11px] sm:text-xs">3. Thuộc</span>
							<span class="text-[9px] text-blue-400/80 font-normal">3 ngày</span>
						</button>

						<button
							type="button"
							class="flex flex-col items-center justify-center h-11 sm:h-12 py-1 px-0.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
							onclick={() => handleRating('Easy')}
						>
							<span class="text-[11px] sm:text-xs">4. Dễ</span>
							<span class="text-[9px] text-emerald-400/80 font-normal">5 ngày</span>
						</button>
					</div>

					<button 
						type="button"
						class="w-10 sm:w-11 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-[#151c2c] hover:bg-slate-50 dark:hover:bg-[#1e293b] border border-slate-200/90 dark:border-[#242f47] text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 text-base font-bold flex-shrink-0"
						onclick={nextCard}
						title="Thẻ tiếp theo (Phím →)"
					>
						<span>→</span>
					</button>
				</div>
			{:else}
				<!-- Khi chưa lật: 3 Nút điều hướng rõ ràng (Trước • Lật xem đáp án • Tiếp) -->
				<div class="w-full flex items-center justify-center gap-3 animate-in fade-in duration-150">
					<button 
						type="button"
						class="w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-white dark:bg-[#151c2c] hover:bg-slate-50 dark:hover:bg-[#1e293b] border border-slate-200/90 dark:border-[#242f47] text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 text-lg font-bold"
						onclick={prevCard}
						title="Thẻ trước (Phím ←)"
					>
						<span>←</span>
					</button>

					<button
						type="button"
						class="flex-1 max-w-[220px] h-11 sm:h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
						onclick={toggleFlip}
					>
						<span>Lật xem đáp án</span>
						<kbd class="hidden sm:inline-block px-1.5 py-0.5 bg-indigo-500/50 border border-indigo-400/40 rounded text-[10px] font-mono">Space</kbd>
					</button>

					<button 
						type="button"
						class="w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-white dark:bg-[#151c2c] hover:bg-slate-50 dark:hover:bg-[#1e293b] border border-slate-200/90 dark:border-[#242f47] text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 text-lg font-bold"
						onclick={nextCard}
						title="Thẻ tiếp theo (Phím →)"
					>
						<span>→</span>
					</button>
				</div>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer class="hidden sm:block w-full py-1.5 text-center text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 relative z-10 select-none">
		FLCard-JP • Space: Lật • ← / →: Chuyển • 1-4: Đánh giá • S: Trộn • R: Ngẫu nhiên
	</footer>

	<!-- Modals -->
	<DeckListModal
		isOpen={isDeckListModalOpen}
		{cards}
		currentCardIndex={currentIndex}
		onSelectCard={(idx) => { currentIndex = idx; isFlipped = false; }}
		onEditCard={handleEditCard}
		onDeleteCard={handleDeleteCard}
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
