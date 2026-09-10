<script lang="ts">
	import type { FlashcardItem, JLPTLevel, CardType } from '$lib/features/flashcard/types';
	import { toHiragana, toRomaji } from '../utils/romaji-to-kana';
	import type { KanjiSuggestion } from '../utils/kanji-dictionary';
	import { buildSmartRuby, type RomajiCorrection } from '../utils/romaji-normalizer';
	import ImageUploader from './ImageUploader.svelte';
	import Flashcard from '$lib/features/flashcard/components/Flashcard.svelte';
	import { 
		CANONICAL_TOPICS, 
		CANONICAL_CONTEXTS, 
		CANONICAL_TONES, 
		TOPIC_METADATA, 
		CONTEXT_METADATA,
		type CanonicalTopic,
		type CanonicalContext,
		type CanonicalTone
	} from '$lib/features/taxonomy/constants';
	import { buildFacetedTag, formatDisplayTag } from '$lib/features/taxonomy/normalizer';
	import { classifyWordWithAI } from '$lib/features/taxonomy/services/ai-classifier';

	interface Props {
		isOpen: boolean;
		cardToEdit?: FlashcardItem | null;
		onClose: () => void;
		onSave: (card: FlashcardItem) => void;
	}

	let { isOpen, cardToEdit = null, onClose, onSave }: Props = $props();

	// Form State
	let romajiInput = $state('');
	let termInput = $state('');
	let readingInput = $state('');
	let rubyHtmlInput = $state('');
	let meaningInput = $state('');
	let levelInput = $state<JLPTLevel>('N5');
	let typeInput = $state<CardType>('Danh từ');
	let imageUrlInput = $state('');
	let exampleJpInput = $state('');
	let exampleViInput = $state('');

	// Tag State
	let tagsInput = $state<string[]>([]);
	let selectedTopic = $state<CanonicalTopic>('general');
	let selectedContext = $state<CanonicalContext>('general');
	let isSuggestingTags = $state(false);

	// Điền form khi mở modal ở chế độ chỉnh sửa
	$effect(() => {
		if (isOpen) {
			if (cardToEdit) {
				romajiInput = cardToEdit.romaji || '';
				termInput = cardToEdit.term;
				readingInput = cardToEdit.reading;
				rubyHtmlInput = cardToEdit.rubyHtml;
				meaningInput = cardToEdit.meaning;
				levelInput = cardToEdit.level;
				typeInput = cardToEdit.type || 'Danh từ';
				imageUrlInput = cardToEdit.imageUrl || '';
				exampleJpInput = cardToEdit.example?.japanese || '';
				exampleViInput = cardToEdit.example?.vietnamese || '';
				
				const currentTags = cardToEdit.tags ? [...cardToEdit.tags] : [];
				tagsInput = currentTags;

				const tTag = currentTags.find(t => t.startsWith('topic:'));
				selectedTopic = tTag ? (tTag.replace('topic:', '') as CanonicalTopic) : 'general';
				const cTag = currentTags.find(t => t.startsWith('where:'));
				selectedContext = cTag ? (cTag.replace('where:', '') as CanonicalContext) : 'general';
			} else {
				resetForm();
			}
		}
	});

	// Preview state
	let previewFlipped = $state(false);

	// Derived: Tự động chuyển Romaji -> Hiragana theo thời gian thực
	let autoHiragana = $derived(toHiragana(romajiInput));

	// State cho gợi ý từ điển gọi API trực tuyến & Gợi ý sửa lỗi
	let suggestions = $state<KanjiSuggestion[]>([]);
	let correction = $state<RomajiCorrection | null>(null);
	let isSearching = $state(false);
	let searchTimeout: any = null;

	// Gọi API từ điển trực tuyến (Mazii / Jisho) sau 200ms debounce
	$effect(() => {
		const query = romajiInput.trim();
		if (!query || cardToEdit) {
			suggestions = [];
			correction = null;
			isSearching = false;
			return;
		}

		clearTimeout(searchTimeout);
		isSearching = true;
		searchTimeout = setTimeout(async () => {
			try {
				const res = await fetch(`/api/kanji/suggest?q=${encodeURIComponent(query)}`);
				if (res.ok) {
					const data = (await res.json()) as { 
						suggestions?: KanjiSuggestion[];
						correction?: RomajiCorrection | null;
					};
					suggestions = data.suggestions || [];
					correction = data.correction || null;
				}
			} catch (err) {
				console.error('Lỗi lấy gợi ý từ điển:', err);
			} finally {
				isSearching = false;
			}
		}, 200);

		return () => clearTimeout(searchTimeout);
	});

	// Cập nhật tự động readingInput khi người dùng gõ Romaji nếu chưa can thiệp
	$effect(() => {
		if (!cardToEdit && autoHiragana && !readingInput) {
			readingInput = autoHiragana;
		}
	});

	// Xử lý khi click vào 1 gợi ý Kanji
	function applySuggestion(item: KanjiSuggestion) {
		termInput = item.term;
		readingInput = item.reading;
		// Tự động sửa lại toàn bộ phiên âm Romaji theo âm đọc chuẩn của từ vừa bấm
		romajiInput = toRomaji(item.reading || item.term) || item.romaji;
		rubyHtmlInput = item.rubyHtml;
		meaningInput = item.meaning;
		levelInput = item.level;
		typeInput = item.type;
		correction = null; // Ẩn banner sửa lỗi khi đã chọn từ đúng ý
	}

	// Áp dụng từ gợi ý sửa lỗi (Did you mean...?)
	function applyCorrection(c: RomajiCorrection) {
		romajiInput = c.corrected;
		readingInput = c.hiragana;
		correction = null;
	}

	// Gợi ý thẻ Tag tự động
	async function handleAutoTag() {
		const term = termInput.trim() || autoHiragana.trim();
		const meaning = meaningInput.trim();
		if (!meaning && !term) {
			alert('Vui lòng nhập nghĩa tiếng Việt hoặc từ tiếng Nhật để gợi ý tag!');
			return;
		}

		isSuggestingTags = true;
		try {
			// Gọi API /api/tags (sử dụng Gemini AI Studio từ backend)
			const res = await fetch('/api/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					term: term || '言葉',
					meaning: meaning || 'từ vựng',
					reading: readingInput.trim() || autoHiragana.trim(),
					cardType: typeInput
				})
			});

			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.result) {
					selectedTopic = data.result.topic;
					selectedContext = data.result.context;
					tagsInput = data.result.tags;
					return;
				}
			}

			// Dự phòng heuristic 0ms nếu API không khả dụng
			const fallback = await classifyWordWithAI({
				term: term || '言葉',
				meaning: meaning || 'từ vựng',
				reading: readingInput.trim() || autoHiragana.trim(),
				cardType: typeInput
			});

			selectedTopic = fallback.topic;
			selectedContext = fallback.context;
			tagsInput = fallback.tags;
		} catch (err) {
			console.error('Lỗi gợi ý tag:', err);
		} finally {
			isSuggestingTags = false;
		}
	}

	function handleRemoveTag(tag: string) {
		tagsInput = tagsInput.filter(t => t !== tag);
	}

	function handleTopicChange(newTopic: CanonicalTopic) {
		selectedTopic = newTopic;
		const newTag = buildFacetedTag('topic', newTopic);
		tagsInput = [...tagsInput.filter(t => !t.startsWith('topic:')), newTag];
	}

	function handleContextChange(newContext: CanonicalContext) {
		selectedContext = newContext;
		const newTag = buildFacetedTag('where', newContext);
		tagsInput = [...tagsInput.filter(t => !t.startsWith('where:')), newTag];
	}

	// Tạo đối tượng thẻ xem trước thời gian thực
	let previewCard = $derived<FlashcardItem>({
		id: 'preview-card',
		term: termInput || autoHiragana || '言葉',
		reading: readingInput || autoHiragana || 'ことば',
		romaji: romajiInput || 'kotoba',
		rubyHtml: rubyHtmlInput || (termInput !== readingInput && termInput ? buildSmartRuby(termInput, readingInput || autoHiragana) : (autoHiragana || '言葉')),
		meaning: meaningInput || 'Nghĩa của từ sẽ hiển thị ở đây',
		level: levelInput,
		type: typeInput,
		imageUrl: imageUrlInput,
		example: exampleJpInput ? {
			japanese: exampleJpInput,
			vietnamese: exampleViInput || 'Câu ví dụ minh họa'
		} : undefined,
		tags: tagsInput,
		createdAt: Date.now()
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const finalReading = readingInput.trim() || autoHiragana.trim();
		const finalTerm = termInput.trim() || autoHiragana.trim();

		if (!finalReading && !finalTerm) {
			alert('Vui lòng nhập phiên âm Romaji hoặc từ tiếng Nhật!');
			return;
		}

		if (!meaningInput.trim()) {
			alert('Vui lòng nhập ý nghĩa tiếng Việt của từ vựng!');
			return;
		}

		const finalRuby = rubyHtmlInput.trim() || (
			finalTerm !== finalReading 
				? buildSmartRuby(finalTerm, finalReading)
				: finalReading
		);

		const newCard: FlashcardItem = {
			id: cardToEdit?.id || `card-${Date.now()}`,
			term: finalTerm,
			reading: finalReading,
			romaji: romajiInput.trim(),
			rubyHtml: finalRuby,
			meaning: meaningInput.trim(),
			level: levelInput,
			type: typeInput,
			imageUrl: imageUrlInput.trim() || undefined,
			example: exampleJpInput.trim() ? {
				japanese: exampleJpInput.trim(),
				vietnamese: exampleViInput.trim()
			} : undefined,
			tags: tagsInput,
			createdAt: cardToEdit?.createdAt || Date.now()
		};

		onSave(newCard);
		resetForm();
		onClose();
	}

	function resetForm() {
		romajiInput = '';
		termInput = '';
		readingInput = '';
		rubyHtmlInput = '';
		meaningInput = '';
		levelInput = 'N5';
		typeInput = 'Danh từ';
		imageUrlInput = '';
		exampleJpInput = '';
		exampleViInput = '';
		tagsInput = [];
		selectedTopic = 'general';
		selectedContext = 'general';
		previewFlipped = false;
	}
</script>

{#if isOpen}
	<!-- Backdrop Modal -->
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby="modal-title"
	>
		<div class="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden mt-auto sm:my-auto animate-in fade-in zoom-in-95 duration-200 transition-colors max-h-[92dvh] sm:max-h-[85vh] flex flex-col">
			<!-- Mobile Notch -->
			<div class="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto sm:hidden mt-2 mb-0.5"></div>

			<!-- Modal Header -->
			<div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60 flex-shrink-0">
				<div class="flex items-center gap-2 sm:gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold font-jp text-sm sm:text-base flex-shrink-0">
						{cardToEdit ? '改' : '作'}
					</div>
					<div>
						<h2 id="modal-title" class="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
							{cardToEdit ? 'Chỉnh Sửa Thẻ Học (Edit Card)' : 'Tạo Thẻ Học Mới (Card Creator)'}
						</h2>
						<p class="text-xs text-zinc-500 dark:text-zinc-400">
							{cardToEdit ? 'Cập nhật lại thông tin từ vựng hoặc ảnh minh họa' : 'Tự động chuyển Romaji sang Hiragana và gợi ý Kanji tương ứng'}
						</p>
					</div>
				</div>
				<button
					type="button"
					class="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
					onclick={onClose}
					aria-label="Đóng"
				>
					✕
				</button>
			</div>

			<!-- Modal Body (2 Cột: Form bên trái, Live Preview bên phải) -->
			<form onsubmit={handleSubmit} class="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
				<!-- Cột Form Nhập Liệu (7 cột) -->
				<div class="lg:col-span-7 space-y-4">
					<!-- 1. Ô nhập Romaji (Tự sinh Kana) -->
					<div>
						<div class="flex items-center justify-between mb-1.5">
							<label for="romaji-input" class="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
								<span>1. Phiên âm Romaji</span>
								<span class="text-[10px] text-rose-500 dark:text-rose-400 font-normal">(Ví dụ: watashi, taberu)</span>
							</label>
							{#if autoHiragana}
								<span class="text-xs font-jp font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
									Tự tạo: {autoHiragana}
								</span>
							{/if}
						</div>
						<input
							id="romaji-input"
							type="text"
							placeholder="Gõ phiên âm, ví dụ: watashi"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
							bind:value={romajiInput}
							required
						/>

						{#if correction}
							<div class="mt-2 flex items-center flex-wrap gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 dark:from-amber-500/15 dark:to-transparent border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in slide-in-from-top-1 duration-150 shadow-xs">
								<span class="text-sm">💡</span>
								<span class="font-medium">Có phải ý bạn là:</span>
								<button
									type="button"
									class="font-bold underline text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-white cursor-pointer transition-colors"
									onclick={() => applyCorrection(correction!)}
									title="Bấm để tự động điền phiên âm chuẩn"
								>
									"{correction.corrected}" ({correction.hiragana})
								</button>
								<span class="text-[10px] text-amber-600/75 dark:text-amber-400/75 ml-auto">({correction.reason})</span>
							</div>
						{/if}
					</div>

					<!-- 2. Danh sách gợi ý Kanji (Tự động tra cứu từ điển online khi gõ) -->
					{#if isSearching}
						<div class="p-2.5 bg-zinc-50 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-500 animate-pulse">
							<span class="text-rose-500 font-bold">🔍</span>
							<span>Đang tra cứu từ điển trực tuyến (Mazii / Jisho)...</span>
						</div>
					{:else if suggestions.length > 0}
						<div class="p-3 bg-zinc-50 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
							<div class="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
								<span>💡 Gợi ý từ điển trực tuyến:</span>
								<span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Nhấn để điền tự động</span>
							</div>
							<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
								{#each suggestions as sug}
									<button
										type="button"
										class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800/90 hover:bg-rose-50 dark:hover:bg-rose-500/20 border border-zinc-250 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-500/40 text-left transition-all cursor-pointer group shadow-xs"
										onclick={() => applySuggestion(sug)}
									>
										<span class="font-jp font-bold text-zinc-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-300">{sug.term}</span>
										<span class="text-[11px] text-zinc-500 dark:text-zinc-400">({sug.reading})</span>
										<span class="text-[10px] text-zinc-600 dark:text-zinc-300 italic">- {sug.meaning}</span>
										<span class="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
											{sug.level}
										</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- 3. Chữ Kanji / Từ hiển thị & Cách đọc -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="term-input" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
								Chữ Kanji / Từ (Term)
							</label>
							<input
								id="term-input"
								type="text"
								placeholder={autoHiragana || 'Ví dụ: 私'}
								class="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-jp text-sm focus:outline-none focus:border-rose-500"
								bind:value={termInput}
							/>
						</div>

						<div>
							<label for="reading-input" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
								Cách đọc Hiragana (Reading)
							</label>
							<input
								id="reading-input"
								type="text"
								placeholder={autoHiragana || 'Ví dụ: わたし'}
								class="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-jp text-sm focus:outline-none focus:border-rose-500"
								bind:value={readingInput}
							/>
						</div>
					</div>

					<!-- 4. Nghĩa tiếng Việt -->
					<div>
						<label for="meaning-input" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
							2. Nghĩa tiếng Việt *
						</label>
						<input
							id="meaning-input"
							type="text"
							placeholder="Ví dụ: Tôi, bản thân"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-rose-500"
							bind:value={meaningInput}
							required
						/>
					</div>

					<!-- 5. Tải ảnh minh họa -->
					<ImageUploader 
						imageUrl={imageUrlInput} 
						onImageChange={(url) => imageUrlInput = url} 
					/>

					<!-- 6. Cấp độ JLPT & Từ loại -->
					<div class="grid grid-cols-2 gap-3 pt-1">
						<div>
							<label for="level-select" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
								Cấp độ JLPT
							</label>
							<select
								id="level-select"
								class="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 cursor-pointer"
								bind:value={levelInput}
							>
								<option value="N5">JLPT N5 (Cơ bản)</option>
								<option value="N4">JLPT N4 (Sơ cấp)</option>
								<option value="N3">JLPT N3 (Trung cấp)</option>
								<option value="N2">JLPT N2 (Thượng cấp)</option>
								<option value="N1">JLPT N1 (Cao cấp)</option>
							</select>
						</div>

						<div>
							<label for="type-select" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
								Từ loại
							</label>
							<select
								id="type-select"
								class="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 cursor-pointer"
								bind:value={typeInput}
							>
								<option value="Danh từ">Danh từ</option>
								<option value="Động từ nhóm 1">Động từ nhóm 1</option>
								<option value="Động từ nhóm 2">Động từ nhóm 2</option>
								<option value="Động từ nhóm 3">Động từ nhóm 3</option>
								<option value="Tính từ đuôi い">Tính từ đuôi い</option>
								<option value="Tính từ đuôi な">Tính từ đuôi な</option>
								<option value="Phó từ">Phó từ</option>
								<option value="Cụm từ">Cụm từ</option>
							</select>
						</div>
					</div>

					<!-- 7. Gắn Thẻ Tag Phân Loại Chủ Đề & Bối Cảnh (Taxonomy) -->
					<div class="p-3.5 bg-zinc-50 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
						<div class="flex items-center justify-between">
							<div class="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
								<span>🏷️ Phân loại chủ đề (Tags)</span>
							</div>
							<button
								type="button"
								class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
								onclick={handleAutoTag}
								disabled={isSuggestingTags}
							>
								<span>{isSuggestingTags ? '⏳ Đang gợi ý...' : '✨ Gợi ý tag AI'}</span>
							</button>
						</div>

						<!-- Chọn Chủ đề & Nơi chốn -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label for="topic-select" class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
									Chủ đề đời sống (Topic)
								</label>
								<select
									id="topic-select"
									class="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
									value={selectedTopic}
									onchange={(e) => handleTopicChange(e.currentTarget.value as CanonicalTopic)}
								>
									{#each CANONICAL_TOPICS as top}
										{@const meta = TOPIC_METADATA[top]}
										<option value={top}>{meta.icon} {meta.label}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="context-select" class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
									Bối cảnh sử dụng (Context)
								</label>
								<select
									id="context-select"
									class="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
									value={selectedContext}
									onchange={(e) => handleContextChange(e.currentTarget.value as CanonicalContext)}
								>
									{#each CANONICAL_CONTEXTS as ctx}
										{@const meta = CONTEXT_METADATA[ctx]}
										<option value={ctx}>{meta.icon} {meta.label}</option>
									{/each}
								</select>
							</div>
						</div>

						<!-- Danh sách các thẻ tag đang gắn -->
						{#if tagsInput.length > 0}
							<div class="flex flex-wrap gap-1.5 pt-1">
								{#each tagsInput as tag}
									{@const info = formatDisplayTag(tag)}
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-700 shadow-2xs">
										<span>{info.icon}</span>
										<span>{info.label}</span>
										<button
											type="button"
											class="text-zinc-400 hover:text-rose-500 ml-0.5 cursor-pointer"
											onclick={() => handleRemoveTag(tag)}
											title="Gỡ tag này"
										>
											✕
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Nút Submit -->
					<div class="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
						<button
							type="button"
							class="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
							onclick={onClose}
						>
							Hủy bỏ
						</button>
						<button
							type="submit"
							id="save-card-submit-btn"
							class="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-950/30 active:scale-95 transition-all cursor-pointer"
						>
							{cardToEdit ? '✓ Cập Nhật Thẻ' : '✓ Lưu Thẻ Này'}
						</button>
					</div>
				</div>

				<!-- Cột Phải: Live 3D Preview (5 cột) -->
				<div class="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-gradient-to-b from-zinc-50 to-zinc-100/60 dark:from-zinc-950/80 dark:to-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
					<div class="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-3 flex items-center gap-1.5">
						<span>✨ Xem trước thẻ 3D (Live Preview)</span>
					</div>

					<div class="w-full max-w-[340px]">
						<Flashcard
							card={previewCard}
							isFlipped={previewFlipped}
							onFlip={() => previewFlipped = !previewFlipped}
						/>
					</div>

					<p class="text-[11px] text-zinc-500 dark:text-zinc-400 text-center mt-3 font-medium">
						Thẻ sẽ cập nhật trực tiếp theo từng phím bạn gõ và ảnh bạn cắt. Nhấn thẻ để lật xem mặt sau!
					</p>
				</div>
			</form>
		</div>
	</div>
{/if}
