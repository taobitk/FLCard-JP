<script lang="ts">
	import type { FlashcardItem } from '../types';
	import RubyText from './RubyText.svelte';
	import AudioButton from './AudioButton.svelte';

	interface Props {
		card: FlashcardItem;
		isFlipped?: boolean;
		onFlip?: () => void;
		interactive?: boolean;
	}

	let { 
		card, 
		isFlipped = false, 
		onFlip,
		interactive = true 
	}: Props = $props();

	function handleClick() {
		if (interactive && onFlip) {
			onFlip();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (interactive && onFlip && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			onFlip();
		}
	}

	// Level colors
	const levelBadgeClasses = {
		N5: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
		N4: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
		N3: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
		N2: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
		N1: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
	};
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="flip-scene card-perspective-container w-full max-w-[360px] sm:max-w-[420px] mx-auto aspect-[3/4] max-h-[min(540px,65dvh)] min-h-[380px] sm:min-h-[440px]"
	onclick={handleClick}
	onkeydown={handleKeydown}
	role={interactive ? 'button' : 'region'}
	tabindex={interactive ? 0 : -1}
	aria-label={`Thẻ từ vựng: ${card.term}. Nhấn để lật xem nghĩa.`}
>
	<div class="flashcard card-inner-3d {isFlipped ? 'flipped' : ''}">
		<!-- Mặt trước (Front) -->
		<div class="card-face front front-face flex flex-col justify-between p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-lg dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
			<!-- Header mặt trước: Badge Cấp độ + Audio Button -->
			<div class="flex items-center justify-between w-full z-10">
				<span class="level-pill text-xs font-bold px-3 py-1 rounded-full border shadow-2xs {levelBadgeClasses[card.level] || levelBadgeClasses.N5}">
					{card.level}
				</span>
				{#if card.type}
					<span class="text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-[#1e293b] px-3 py-0.5 rounded-lg border border-slate-200 dark:border-[#2e3c59]">
						{card.type}
					</span>
				{/if}
				<AudioButton text={card.reading || card.term} size="sm" />
			</div>

			<!-- Thân giữa mặt trước: Ảnh TO NỔI BẬT 1:1 + Chữ Kanji/Furigana + Romaji -->
			<div class="flex flex-col items-center justify-center flex-1 my-auto text-center z-10">
				{#if card.imageUrl}
					<div class="w-48 h-48 sm:w-56 sm:h-56 aspect-square rounded-2xl overflow-hidden mb-3 border border-slate-200 dark:border-[#242f47] shadow-md bg-slate-50 dark:bg-[#0b0f19] flex-shrink-0">
						<img 
							src={card.imageUrl} 
							alt={card.term} 
							class="w-full h-full object-cover" 
							loading="lazy"
						/>
					</div>
				{/if}

				<div class="my-1">
					<RubyText rubyHtml={card.rubyHtml} fallbackText={card.term} size="xl" />
				</div>
				
				<div class="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-semibold tracking-wider font-mono mt-1">
					{card.romaji || card.reading}
				</div>
			</div>
		</div>

		<!-- Mặt sau (Back) -->
		<div class="card-face back back-face flex flex-col justify-between p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-lg dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
			<!-- Header mặt sau -->
			<div class="flex items-center justify-between w-full border-b border-slate-100 dark:border-[#1e293b] pb-3 z-10">
				<div class="flex items-center gap-2">
					<RubyText rubyHtml={card.rubyHtml} fallbackText={card.term} size="sm" />
					<span class="text-xs text-slate-500 dark:text-slate-400 font-mono">({card.reading})</span>
				</div>
				<AudioButton text={card.reading || card.term} size="sm" />
			</div>

			<!-- Thân giữa mặt sau: Nghĩa tiếng Việt & Câu ví dụ -->
			<div class="flex flex-col items-center justify-center flex-1 my-auto text-center z-10 py-2">
				<div class="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
					Ý NGHĨA
				</div>
				<h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 px-2">
					{card.meaning}
				</h3>

				{#if card.example}
					<div class="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-[#242f47] rounded-2xl p-4 text-left text-xs sm:text-sm space-y-1.5 shadow-2xs">
						<div class="text-slate-900 dark:text-slate-200 font-jp font-medium">
							{#if card.example.rubyHtml}
								{@html card.example.rubyHtml}
							{:else}
								{card.example.japanese}
							{/if}
						</div>
						<div class="text-slate-500 dark:text-slate-400 text-xs italic">
							{card.example.vietnamese}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* 3D Transform & Perspective */
	.card-perspective-container {
		perspective: 1200px;
		cursor: pointer;
	}

	.card-inner-3d {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1);
		transform-style: preserve-3d;
	}

	.card-inner-3d.flipped {
		transform: rotateY(180deg);
	}

	.card-face {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.back-face {
		transform: rotateY(180deg);
	}
</style>
