<script lang="ts">
	import type { FlashcardItem } from '$lib/features/flashcard/types';
	import { 
		validateBatchJson, 
		SAMPLE_JSON_TEMPLATE, 
		SAMPLE_AI_PROMPT 
	} from '../utils/batch-json-validator';
	import { tagQueue } from '$lib/features/taxonomy/services/tag-queue';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onImport: (cards: FlashcardItem[]) => void;
	}

	let { isOpen, onClose, onImport }: Props = $props();

	// Step State: 1 = Nhập JSON, 2 = Studio Ghép Ảnh
	let currentStep = $state<1 | 2>(1);

	// JSON Input State
	let jsonContent = $state('');
	let validationErrors = $state<string[]>([]);
	let parsedCards = $state<FlashcardItem[]>([]);
	let copyNotification = $state('');

	// Quản lý active card để dán ảnh qua Clipboard Ctrl+V
	let activeCardIndex = $state<number | null>(null);

	function resetModal() {
		currentStep = 1;
		jsonContent = '';
		validationErrors = [];
		parsedCards = [];
		copyNotification = '';
		activeCardIndex = null;
	}

	function handleClose() {
		resetModal();
		onClose();
	}

	// Copy JSON mẫu hoặc Prompt AI
	function copyToClipboard(text: string, label: string) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
			copyNotification = `Đã copy ${label} vào Clipboard!`;
			setTimeout(() => {
				copyNotification = '';
			}, 2500);
		}
	}

	// Xử lý nạp file .json từ máy
	function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result as string;
			if (content) {
				jsonContent = content;
				handleParseJson();
			}
		};
		reader.readAsText(file);
	}

	// Bước 1: Parse & Validate JSON
	function handleParseJson() {
		const res = validateBatchJson(jsonContent);
		if (!res.success) {
			validationErrors = res.errors;
			parsedCards = [];
		} else {
			validationErrors = [];
			parsedCards = res.cards;
			currentStep = 2; // Chuyển sang Studio ghép ảnh
		}
	}

	// Bước 2: Xử lý Tải nhiều ảnh hàng loạt (Bulk Upload)
	function handleBulkImages(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.length === 0) return;

		Array.from(files).forEach((file, idx) => {
			if (idx < parsedCards.length) {
				resizeImageToBase64(file, (base64) => {
					parsedCards[idx].imageUrl = base64;
				});
			}
		});
		target.value = ''; // Reset input file
	}

	// Gán ảnh riêng cho từng thẻ
	function handleSingleImageUpload(file: File, index: number) {
		resizeImageToBase64(file, (base64) => {
			parsedCards[index].imageUrl = base64;
		});
	}

	// Nén ảnh sang Base64 tỉ lệ vuông (tối đa 600px để tối ưu lưu trữ)
	function resizeImageToBase64(file: File, callback: (base64: string) => void) {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const size = Math.min(img.width, img.height, 600);
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					// Crop tâm hình vuông 1:1
					const startX = (img.width - size) / 2;
					const startY = (img.height - size) / 2;
					ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
					callback(canvas.toDataURL('image/jpeg', 0.85));
				}
			};
			img.src = event.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	// Bắt sự kiện dán ảnh từ Clipboard (Ctrl+V) vào thẻ đang chọn
	function handlePasteOnCard(e: ClipboardEvent, index: number) {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			if (items[i].type.startsWith('image/')) {
				const file = items[i].getAsFile();
				if (file) {
					e.preventDefault();
					handleSingleImageUpload(file, index);
					break;
				}
			}
		}
	}

	// Xóa ảnh của thẻ
	function removeCardImage(index: number) {
		parsedCards[index].imageUrl = undefined;
	}

	let isSubmitting = $state(false);

	// Hoàn tất lưu toàn bộ thẻ vào bộ học
	async function handleFinishImport() {
		if (parsedCards.length === 0 || isSubmitting) return;
		isSubmitting = true;

		try {
			// Tự động đẩy các ảnh Base64 lên Cloudflare R2
			for (const card of parsedCards) {
				if (card.imageUrl && card.imageUrl.startsWith('data:image/')) {
					try {
						const res = await fetch('/api/upload', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ image: card.imageUrl })
						});
						if (res.ok) {
							const data = (await res.json()) as any;
							if (data?.url) {
								card.imageUrl = data.url;
							}
						}
					} catch (e) {
						console.warn('Lỗi khi tải ảnh lên R2:', e);
					}
				}
			}

			// Tự động phân loại tag cho các thẻ chưa có tag trước khi lưu
			const untaggedCards = parsedCards.filter(c => !c.tags || c.tags.length === 0);
			if (untaggedCards.length > 0) {
				try {
					const classified = await tagQueue.classifyImmediately(
						untaggedCards.map(c => ({
							id: c.id,
							term: c.term,
							meaning: c.meaning,
							reading: c.reading,
							cardType: c.type
						}))
					);
					for (const item of classified) {
						const card = parsedCards.find(c => c.id === item.id);
						if (card) {
							card.tags = item.tags;
						}
					}
				} catch (tagErr) {
					console.warn('Lỗi phân loại batch tag khi import:', tagErr);
				}
			}

			onImport(parsedCards);
			handleClose();
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop Modal -->
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
		onclick={(e) => e.target === e.currentTarget && handleClose()}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
			<!-- Header Modal -->
			<div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
				<div class="flex items-center gap-2.5 sm:gap-3">
					<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-amber-500/20">
						⚡
					</div>
					<div>
						<h2 class="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
							<span>Nhập Thẻ Hàng Loạt</span>
							<span class="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
								{currentStep === 1 ? 'Bước 1: Nhập JSON' : `Bước 2: Ghép Ảnh (${parsedCards.length} thẻ)`}
							</span>
						</h2>
						<p class="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400">
							{currentStep === 1 ? 'Dán dữ liệu JSON chuẩn để trích xuất danh sách thẻ' : 'Ghép ảnh minh họa hoặc để trống tùy ý trước khi nạp vào bộ học'}
						</p>
					</div>
				</div>

				<button
					type="button"
					class="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
					onclick={handleClose}
					aria-label="Đóng"
				>
					✕
				</button>
			</div>

			<!-- Body Modal -->
			<div class="p-3 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
				
				<!-- BƯỚC 1: NHẬP VÀ KIỂM TRA JSON -->
				{#if currentStep === 1}
					<!-- Thanh tiện ích: Copy Prompt & Template & Chọn file -->
					<div class="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
						<div class="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
							<button
								type="button"
								class="px-2.5 py-1 text-[11px] sm:text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium hover:border-amber-400 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
								onclick={() => copyToClipboard(SAMPLE_AI_PROMPT, 'Prompt AI')}
							>
								<span>📋</span>
								<span class="inline sm:hidden">Prompt AI</span>
								<span class="hidden sm:inline">Copy Prompt cho ChatGPT/Gemini</span>
							</button>
							<button
								type="button"
								class="px-2.5 py-1 text-[11px] sm:text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium hover:border-amber-400 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
								onclick={() => copyToClipboard(SAMPLE_JSON_TEMPLATE, 'Mẫu JSON')}
							>
								<span>📄</span>
								<span>Mẫu JSON</span>
							</button>
						</div>

						<label class="px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 cursor-pointer transition-all active:scale-95 flex items-center gap-1">
							<span>📁</span>
							<span class="inline sm:hidden">Chọn file</span>
							<span class="hidden sm:inline">Chọn file .json</span>
							<input type="file" accept=".json,application/json" class="hidden" onchange={handleFileUpload} />
						</label>
					</div>

					{#if copyNotification}
						<div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-150">
							✅ {copyNotification}
						</div>
					{/if}

					<!-- Textarea nhập JSON -->
					<div class="space-y-1">
						<div class="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 px-0.5">
							<label for="batch-json-input" class="font-bold text-zinc-700 dark:text-zinc-300">
								Dán mảng JSON
							</label>
							<span class="text-[10px] sm:text-[11px] text-zinc-400">Chuẩn mảng [&#123;...&#125;]</span>
						</div>
						<textarea
							id="batch-json-input"
							bind:value={jsonContent}
							rows="7"
							placeholder={'Dán mảng JSON vào đây, hoặc chọn file .json bên trên...'}
							class="w-full p-3 font-mono text-xs rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition-colors sm:rows-12"
						></textarea>
					</div>

					<!-- Khung thông báo lỗi chi tiết (GIGO Error Box) -->
					{#if validationErrors.length > 0}
						<div class="p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in duration-150">
							<div class="font-bold flex items-center gap-1.5 text-xs sm:text-sm text-rose-600 dark:text-rose-400">
								<span>⚠️ Không thể nạp JSON ({validationErrors.length} lỗi):</span>
							</div>
							<ul class="list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto font-mono text-[11px]">
								{#each validationErrors as err}
									<li>{err}</li>
								{/each}
							</ul>
						</div>
					{/if}

				<!-- BƯỚC 2: STUDIO GHÉP ẢNH & DUYỆT THẺ -->
				{:else if currentStep === 2}
					<!-- Thanh điều khiển Studio -->
					<div class="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30">
						<div class="flex items-center gap-1.5 sm:gap-2">
							<span class="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
								🖼️ Studio Ghép Ảnh ({parsedCards.length})
							</span>
							<span class="text-[10px] sm:text-[11px] text-amber-600/70 dark:text-amber-400/70 hidden sm:inline">
								(Ảnh không bắt buộc - cho phép để trống)
							</span>
						</div>

						<div class="flex items-center gap-1.5 sm:gap-2">
							<label class="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs hover:opacity-90 cursor-pointer transition-all active:scale-95">
								📁 Chọn ảnh
								<input type="file" multiple accept="image/*" class="hidden" onchange={handleBulkImages} />
							</label>

							<button
								type="button"
								class="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 transition-all cursor-pointer"
								onclick={() => currentStep = 1}
							>
								← Sửa JSON
							</button>
						</div>
					</div>

					<!-- Danh sách thẻ và vị trí gắn ảnh -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-[58vh] overflow-y-auto p-0.5">
						{#each parsedCards as card, idx}
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 flex gap-2.5 sm:gap-3 items-center bg-zinc-50/70 dark:bg-zinc-850/50 {activeCardIndex === idx ? 'border-amber-400 dark:border-amber-500 shadow-md ring-2 ring-amber-400/20' : 'border-zinc-200 dark:border-zinc-700/80'}"
								onclick={() => activeCardIndex = idx}
								onpaste={(e) => handlePasteOnCard(e, idx)}
								tabindex="0"
							>
								<!-- Cột ảnh 1:1 -->
								<div class="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 relative group flex items-center justify-center">
									{#if card.imageUrl}
										<img src={card.imageUrl} alt={card.term} class="w-full h-full object-cover" />
										<button
											type="button"
											class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-600"
											onclick={(e) => { e.stopPropagation(); removeCardImage(idx); }}
											title="Xoá ảnh này"
										>
											✕
										</button>
									{:else}
										<label class="w-full h-full flex flex-col items-center justify-center text-[10px] text-zinc-400 hover:text-amber-500 cursor-pointer p-1 text-center hover:bg-amber-500/5 transition-colors">
											<span class="text-base leading-none mb-0.5">📷</span>
											<span>Thêm ảnh</span>
											<span class="text-[8px] text-zinc-400/70 hidden sm:inline">(Ctrl+V)</span>
											<input
												type="file"
												accept="image/*"
												class="hidden"
												onchange={(e) => {
													const file = (e.target as HTMLInputElement).files?.[0];
													if (file) handleSingleImageUpload(file, idx);
												}}
											/>
										</label>
									{/if}
								</div>

								<!-- Cột thông tin từ vựng -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5 mb-0.5">
										<span class="text-xs font-mono font-bold text-zinc-400">#{idx + 1}</span>
										<span class="font-jp font-bold text-base text-zinc-900 dark:text-white truncate">{card.term}</span>
										<span class="text-xs text-zinc-500">({card.reading})</span>
										<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 ml-auto">
											{card.level}
										</span>
									</div>

									<p class="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate mb-0.5">
										{card.meaning}
									</p>

									{#if card.example}
										<p class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate italic">
											"{card.example.japanese}" - {card.example.vietnamese}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}

			</div>

			<!-- Footer Modal -->
			<div class="px-4 sm:px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
				<button
					type="button"
					class="px-3.5 py-2 sm:px-4 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
					onclick={handleClose}
				>
					Hủy
				</button>

				{#if currentStep === 1}
					<button
						type="button"
						id="btn-validate-json"
						class="px-4 sm:px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
						onclick={handleParseJson}
					>
						<span class="inline sm:hidden">Tiếp tục ➔</span>
						<span class="hidden sm:inline">Tiếp tục: Sang Studio Ghép Ảnh ➔</span>
					</button>
				{:else if currentStep === 2}
					<button
						type="button"
						id="btn-finish-batch-import"
						class="px-4 sm:px-6 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
						onclick={handleFinishImport}
					>
						<span>🚀</span>
						<span class="inline sm:hidden">Nạp {parsedCards.length} thẻ</span>
						<span class="hidden sm:inline">Nạp Toàn Bộ {parsedCards.length} Thẻ Vào Bộ Học</span>
					</button>
				{/if}
			</div>

		</div>
	</div>
{/if}
