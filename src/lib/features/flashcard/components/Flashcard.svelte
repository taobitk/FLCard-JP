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
		N5: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
		N4: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
		N3: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
		N2: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
		N1: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
	};
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="flip-scene card-perspective-container w-full max-w-[360px] sm:max-w-md mx-auto aspect-[3/4] max-h-[min(540px,65dvh)] min-h-[380px] sm:min-h-[420px]"
	onclick={handleClick}
	onkeydown={handleKeydown}
	role={interactive ? 'button' : 'region'}
	tabindex={interactive ? 0 : -1}
	aria-label={`Thẻ từ vựng: ${card.term}. Nhấn để lật xem nghĩa.`}
>
	<div class="flashcard card-inner-3d {isFlipped ? 'flipped' : ''}">
		<!-- Mặt trước (Front) -->
		<div class="card-face front front-face flex flex-col justify-between p-4 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-zinc-850 dark:via-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-700/80 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden transition-colors duration-300">
			<!-- Header mặt trước: Badge Cấp độ + Audio Button -->
			<div class="flex items-center justify-between w-full z-10">
				<span class="level-pill text-xs font-bold px-3 py-0.5 sm:py-1 rounded-full border shadow-xs {levelBadgeClasses[card.level] || levelBadgeClasses.N5}">
					{card.level}
				</span>
				{#if card.type}
					<span class="hidden sm:inline-block text-xs text-zinc-600 dark:text-zinc-300 font-medium bg-zinc-100 dark:bg-zinc-800/90 px-2.5 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 shadow-xs">
						{card.type}
					</span>
				{/if}
				<AudioButton text={card.reading || card.term} size="sm" />
			</div>

			<!-- Thân giữa mặt trước: Ảnh TO NỔI BẬT 1:1 + Chữ Kanji/Furigana + Romaji -->
			<div class="flex flex-col items-center justify-center flex-1 my-auto text-center z-10">
				{#if card.imageUrl}
					<div class="w-48 h-48 xs:w-52 xs:h-52 sm:w-56 sm:h-56 aspect-square rounded-2xl overflow-hidden mb-2 sm:mb-3 border-2 border-zinc-200 dark:border-zinc-700/90 shadow-xl bg-zinc-100 dark:bg-zinc-950/90 ring-4 ring-rose-500/10 flex-shrink-0">
						<img 
							src={card.imageUrl} 
							alt={card.term} 
							class="w-full h-full object-cover" 
							loading="lazy"
						/>
					</div>
				{/if}

				<div class="my-0.5 sm:my-1">
					<RubyText rubyHtml={card.rubyHtml} fallbackText={card.term} size="xl" />
				</div>
				
				<div class="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base font-semibold tracking-wider font-mono mt-0.5">
					{card.romaji || card.reading}
				</div>
			</div>

			<!-- Họa tiết trang trí nền tinh tế -->
			<div class="absolute -right-16 -bottom-16 w-52 h-52 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>
			<div class="absolute -left-16 -top-16 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
		</div>

		<!-- Mặt sau (Back) -->
		<div class="card-face back back-face flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-700/70 shadow-xl dark:shadow-2xl backdrop-blur-xl relative overflow-hidden transition-colors duration-300">
			<!-- Header mặt sau -->
			<div class="flex items-center justify-between w-full border-b border-zinc-200 dark:border-zinc-800/80 pb-2.5 sm:pb-3 z-10">
				<div class="flex items-center gap-2">
					<RubyText rubyHtml={card.rubyHtml} fallbackText={card.term} size="sm" />
					<span class="text-xs text-zinc-500 dark:text-zinc-400 font-mono">({card.reading})</span>
				</div>
				<AudioButton text={card.reading || card.term} size="sm" />
			</div>

			<!-- Thân giữa mặt sau: Nghĩa tiếng Việt & Câu ví dụ -->
			<div class="flex flex-col items-center justify-center flex-1 my-auto text-center z-10 py-2">
				<div class="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
					Ý nghĩa tiếng Việt
				</div>
				<h3 class="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mb-3 sm:mb-4 px-2">
					{card.meaning}
				</h3>

				{#if card.example}
					<div class="w-full bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 text-left text-xs sm:text-sm space-y-1.5 shadow-xs">
						<div class="text-zinc-900 dark:text-zinc-200 font-jp">
							{#if card.example.rubyHtml}
								{@html card.example.rubyHtml}
							{:else}
								{card.example.japanese}
							{/if}
						</div>
						<div class="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs italic">
							{card.example.vietnamese}
						</div>
					</div>
				{/if}
			</div>

			<!-- Họa tiết trang trí mặt sau -->
			<div class="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
		</div>
	</div>
</div>

<style>
	/* 3D Transform & Perspective - Tuân thủ quy tắc styling-conventions.md */
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
