<script lang="ts">
	interface Props {
		rubyHtml?: string;
		fallbackText?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
	}

	let { rubyHtml = '', fallbackText = '', size = 'lg' }: Props = $props();

	const sizeClasses = {
		sm: 'text-lg',
		md: 'text-2xl',
		lg: 'text-4xl md:text-5xl',
		xl: 'text-5xl md:text-6xl'
	};
</script>

<span class="ruby-container {sizeClasses[size]} font-jp font-extrabold text-slate-900 dark:text-white select-none">
	{#if rubyHtml}
		{@html rubyHtml}
	{:else}
		{fallbackText}
	{/if}
</span>

<style>
	.ruby-container :global(ruby) {
		ruby-align: center;
		ruby-position: over;
		margin: 0 1px;
	}

	.ruby-container :global(rt) {
		font-size: 0.42em;
		font-weight: 600;
		color: #64748b;
		line-height: 1;
		user-select: none;
		letter-spacing: 0.05em;
	}

	:global(.dark) .ruby-container :global(rt) {
		color: #94a3b8;
	}
</style>
