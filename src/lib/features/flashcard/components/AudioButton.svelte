<script lang="ts">
	import { PUBLIC_CONFIG } from '$lib/config/public-api';

	interface Props {
		text: string;
		size?: 'sm' | 'md';
		title?: string;
	}

	let { text, size = 'md', title = 'Phát âm tiếng Nhật' }: Props = $props();
	let isPlaying = $state(false);

	function playAudio(event: MouseEvent) {
		event.stopPropagation();
		if (!text) return;

		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = PUBLIC_CONFIG.locale.ttsTargetLang;
			utterance.rate = PUBLIC_CONFIG.locale.ttsRate;
			utterance.pitch = PUBLIC_CONFIG.locale.ttsPitch;

			isPlaying = true;
			utterance.onend = () => {
				isPlaying = false;
			};
			utterance.onerror = () => {
				isPlaying = false;
			};

			window.speechSynthesis.speak(utterance);
		}
	}
</script>

<button
	type="button"
	class="inline-flex items-center justify-center rounded-full transition-all duration-200 border border-slate-200 dark:border-[#2e3c59] bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-[#28354f] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs active:scale-95 cursor-pointer {size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-base'}"
	onclick={playAudio}
	{title}
	aria-label={title}
>
	{#if isPlaying}
		<span class="animate-pulse text-emerald-500 dark:text-emerald-400">🔊</span>
	{:else}
		<span>🔊</span>
	{/if}
</button>
