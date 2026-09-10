<script lang="ts">
	import type { FlashcardItem } from '$lib/features/flashcard/types';
	import { formatDisplayTag } from '$lib/features/taxonomy/normalizer';

	interface Props {
		isOpen: boolean;
		cards: FlashcardItem[];
		currentCardIndex: number;
		onSelectCard: (index: number) => void;
		onEditCard?: (card: FlashcardItem, index: number) => void;
		onDeleteCard?: (index: number) => void;
		onClose: () => void;
		onCreateNewCard: () => void;
	}

	let { 
		isOpen, 
		cards, 
		currentCardIndex, 
		onSelectCard, 
		onEditCard,
		onDeleteCard,
		onClose, 
		onCreateNewCard 
	}: Props = $props();

	let searchQuery = $state('');
	let deletingIndex = $state<number | null>(null);

	let filteredCards = $derived(
		cards.map((card, originalIdx) => ({ card, originalIdx })).filter(({ card }) => {
			const q = searchQuery.trim().toLowerCase();
			if (!q) return true;
			const matchesBasic = (
				card.term.toLowerCase().includes(q) ||
				card.reading.toLowerCase().includes(q) ||
				card.meaning.toLowerCase().includes(q) ||
				card.level.toLowerCase().includes(q)
			);
			const matchesTag = (card.tags || []).some(t => {
				const info = formatDisplayTag(t);
				return t.toLowerCase().includes(q) || info.label.toLowerCase().includes(q);
			});
			return matchesBasic || matchesTag;
		})
	);
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
		aria-labelledby="deck-modal-title"
		tabindex="-1"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<div class="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/90 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[88dvh] sm:max-h-[85vh] flex flex-col transition-colors duration-200">
			<!-- Thanh kéo vuốt trên Mobile (Mobile Bottom Sheet Notch) -->
			<div class="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto sm:hidden -mt-1 mb-1"></div>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 sm:pb-3 flex-shrink-0">
				<div>
					<h3 id="deck-modal-title" class="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
						<span>📚</span> Kho Bộ Thẻ ({cards.length})
					</h3>
					<p class="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Bấm thẻ để học, hoặc chỉnh sửa & xóa theo ý bạn</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-xs transition-all cursor-pointer border border-rose-400/30 active:scale-95"
						onclick={() => { onClose(); onCreateNewCard(); }}
					>
						+ Thêm thẻ mới
					</button>
					<button
						type="button"
						class="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 flex items-center justify-center text-lg cursor-pointer transition-colors"
						onclick={onClose}
					>
						✕
					</button>
				</div>
			</div>

			<!-- Ô tìm kiếm nhanh -->
			<div class="relative flex-shrink-0">
				<input
					type="text"
					placeholder="Tìm kiếm theo Kanji, Hiragana hoặc nghĩa tiếng Việt..."
					class="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-750 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
					bind:value={searchQuery}
				/>
				{#if searchQuery}
					<button
						type="button"
						class="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
						onclick={() => searchQuery = ''}
					>
						Xóa
					</button>
				{/if}
			</div>

			<!-- Danh sách cuộn mượt mà -->
			<div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
				{#if filteredCards.length === 0}
					<div class="text-center py-10 text-zinc-500 text-xs">
						Không tìm thấy từ vựng nào khớp với từ khóa "{searchQuery}"
					</div>
				{:else}
					{#each filteredCards as item}
						<div
							class="w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all group {item.originalIdx === currentCardIndex ? 'bg-rose-50/80 dark:bg-zinc-800/90 border-rose-500/80 shadow-xs ring-1 ring-rose-500/30' : 'bg-white dark:bg-zinc-950/70 hover:bg-zinc-50 dark:hover:bg-zinc-850 border-zinc-200 dark:border-zinc-800'}"
						>
							<!-- Phần nội dung thẻ: click để chọn học ngay -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div 
								class="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
								onclick={() => { onSelectCard(item.originalIdx); onClose(); }}
							>
								<!-- Ảnh thẻ vuông 1:1 -->
								{#if item.card.imageUrl}
									<div class="w-12 h-12 rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 flex-shrink-0 shadow-xs">
										<img src={item.card.imageUrl} alt={item.card.term} class="w-full h-full object-cover" />
									</div>
								{:else}
									<div class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 flex items-center justify-center font-jp font-bold text-base text-zinc-700 dark:text-zinc-300 flex-shrink-0">
										{item.card.term.slice(0, 1)}
									</div>
								{/if}

								<div class="min-w-0 pr-2">
									<div class="font-jp font-bold text-base text-zinc-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors flex items-center gap-2">
										<span>{item.card.term}</span>
										<span class="text-xs text-zinc-500 dark:text-zinc-400 font-normal font-mono">({item.card.reading})</span>
									</div>
									<div class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
										{item.card.meaning}
									</div>
									{#if item.card.tags && item.card.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-1">
											{#each item.card.tags as tag}
												{@const info = formatDisplayTag(tag)}
												<span class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">
													<span>{info.icon}</span>
													<span>{info.label}</span>
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</div>

							<!-- Nút hành động & Cấp độ -->
							<div class="flex items-center gap-2 flex-shrink-0">
								{#if item.originalIdx === currentCardIndex}
									<span class="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
										Đang học
									</span>
								{/if}
								<span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-750">
									{item.card.level}
								</span>

								<!-- Nút Sửa & Xóa -->
								{#if deletingIndex === item.originalIdx}
									<div class="flex items-center gap-1.5 animate-in fade-in duration-150 bg-red-50 dark:bg-red-950/40 p-1 rounded-xl border border-red-200 dark:border-red-900/50">
										<span class="text-[11px] font-medium text-red-600 dark:text-red-300 pl-1">Xóa?</span>
										<button
											type="button"
											class="text-[11px] font-bold px-2 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-500 cursor-pointer transition-colors"
											onclick={() => { onDeleteCard?.(item.originalIdx); deletingIndex = null; }}
										>
											Có
										</button>
										<button
											type="button"
											class="text-[11px] px-1.5 py-0.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
											onclick={() => deletingIndex = null}
										>
											Không
										</button>
									</div>
								{:else}
									<div class="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
										<button
											type="button"
											class="w-7 h-7 rounded-lg text-xs flex items-center justify-center text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
											onclick={() => { onEditCard?.(item.card, item.originalIdx); onClose(); }}
											title="Chỉnh sửa thẻ này"
											aria-label={`Chỉnh sửa thẻ ${item.card.term}`}
										>
											✏️
										</button>
										<button
											type="button"
											class="w-7 h-7 rounded-lg text-xs flex items-center justify-center text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
											onclick={() => deletingIndex = item.originalIdx}
											title="Xóa thẻ này"
											aria-label={`Xóa thẻ ${item.card.term}`}
										>
											🗑️
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
