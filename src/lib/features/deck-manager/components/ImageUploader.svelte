<script lang="ts">
	import ImageCropperModal from './ImageCropperModal.svelte';

	interface Props {
		imageUrl?: string;
		onImageChange?: (url: string) => void;
	}

	let { imageUrl = '', onImageChange }: Props = $props();
	let isDragging = $state(false);
	let pasteSuccess = $state(false);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	// State cho bộ cắt ảnh (Cropper)
	let rawImageForCrop = $state('');
	let isCropperOpen = $state(false);

	function handleFile(file: File) {
		if (!file.type.startsWith('image/')) {
			alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WebP, SVG)');
			return;
		}

		// Giới hạn kích thước ảnh 5MB
		if (file.size > 5 * 1024 * 1024) {
			alert('Kích thước ảnh không được vượt quá 5MB!');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			if (result) {
				// Mở ngay modal cắt ảnh 1:1
				rawImageForCrop = result;
				isCropperOpen = true;
				triggerPasteFlash();
			}
		};
		reader.readAsDataURL(file);
	}

	async function handleCroppedResult(croppedUrl: string) {
		isCropperOpen = false;
		if (!onImageChange) return;

		// Nếu ảnh là Base64, tự động tải lên Cloudflare R2 để lấy URL ngắn
		if (croppedUrl.startsWith('data:image/')) {
			try {
				const res = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ image: croppedUrl })
				});
				if (res.ok) {
					const data = (await res.json()) as any;
					if (data?.url) {
						onImageChange(data.url);
						return;
					}
				}
			} catch (err) {
				console.warn('Không thể tải ảnh lên R2, sử dụng fallback Base64:', err);
			}
		}

		onImageChange(croppedUrl);
	}

	function triggerPasteFlash() {
		pasteSuccess = true;
		setTimeout(() => {
			pasteSuccess = false;
		}, 2500);
	}

	/**
	 * Xử lý sự kiện dán ảnh từ Clipboard (Ctrl + V)
	 */
	function handlePaste(event: ClipboardEvent) {
		const items = event.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) {
					event.preventDefault();
					handleFile(file);
					return;
				}
			}
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			handleFile(event.dataTransfer.files[0]);
		}
	}

	function onFileInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFile(target.files[0]);
		}
	}

	function handleUrlChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const url = target.value.trim();
		if (url) {
			rawImageForCrop = url;
			if (onImageChange) {
				onImageChange(url);
			}
		}
	}

	function removeImage() {
		if (onImageChange) {
			onImageChange('');
		}
		rawImageForCrop = '';
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	function openRecrop() {
		if (imageUrl) {
			rawImageForCrop = imageUrl;
			isCropperOpen = true;
		}
	}
</script>

<svelte:window onpaste={handlePaste} />

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<div class="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
			Hình ảnh minh họa (Chuẩn 1:1)
		</div>
		{#if pasteSuccess}
			<span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
				<span>✓</span> Đã nhận ảnh từ bộ nhớ tạm!
			</span>
		{/if}
	</div>

	{#if imageUrl}
		<!-- Khung xem trước ảnh đã cắt vuông 1:1 -->
		<div class="relative w-40 h-40 mx-auto rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 overflow-hidden flex items-center justify-center shadow-lg group">
			<img src={imageUrl} alt="Ảnh thẻ đã cắt" class="w-full h-full object-cover" />
			
			<div class="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
				<button
					type="button"
					class="px-2.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg shadow-md border border-zinc-600 transition-colors cursor-pointer"
					onclick={openRecrop}
					title="Căn chỉnh lại góc cắt"
				>
					✂️ Cắt lại
				</button>
				<button
					type="button"
					class="px-2.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md transition-colors cursor-pointer"
					onclick={removeImage}
				>
					Gỡ
				</button>
			</div>
		</div>
	{:else}
		<!-- Khung kéo thả, chọn file hoặc bấm Ctrl + V -->
		<div
			class="border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer {isDragging ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-300 dark:border-zinc-750 hover:border-rose-500/50 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80'}"
			ondragover={(e) => { e.preventDefault(); isDragging = true; }}
			ondragleave={() => isDragging = false}
			ondrop={onDrop}
			onclick={() => fileInputRef?.click()}
			role="button"
			tabindex="0"
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef?.click()}
			aria-label="Kéo thả, chọn ảnh hoặc bấm Ctrl V để dán"
		>
			<input
				type="file"
				accept="image/*"
				class="hidden"
				bind:this={fileInputRef}
				onchange={onFileInputChange}
			/>

			<div class="flex flex-col items-center justify-center gap-2 py-1">
				<span class="text-3xl">📸</span>
				<div class="text-xs text-zinc-700 dark:text-zinc-200 font-semibold">
					Chọn ảnh từ máy, kéo thả hoặc bấm <kbd class="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-rose-600 dark:text-rose-300 border border-zinc-300 dark:border-zinc-700 font-mono text-[11px] font-bold">Ctrl + V</kbd>
				</div>
				<span class="text-[11px] text-zinc-500 dark:text-zinc-400">Tự động mở công cụ cắt ảnh vuông 1:1 chuẩn xác</span>
			</div>
		</div>

		<!-- Hoặc nhập link ảnh trực tiếp -->
		<div class="flex items-center gap-2">
			<span class="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Hoặc dán URL:</span>
			<input
				type="url"
				placeholder="https://example.com/image.png"
				class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
				value={imageUrl}
				onchange={handleUrlChange}
			/>
		</div>
	{/if}
</div>

<!-- Modal Cắt Ảnh Vuông 1:1 -->
<ImageCropperModal
	isOpen={isCropperOpen}
	imageSrc={rawImageForCrop}
	onCrop={handleCroppedResult}
	onCancel={() => isCropperOpen = false}
/>
