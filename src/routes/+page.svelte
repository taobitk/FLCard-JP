<script lang="ts">
	import type { PageData } from './$types';
	import type { FlashcardItem } from '$lib/features/flashcard/types';
	import Navbar from '$lib/shared/components/Navbar.svelte';
	import CreateCardModal from '$lib/features/deck-manager/components/CreateCardModal.svelte';
	import DeckListModal from '$lib/features/deck-manager/components/DeckListModal.svelte';
	import BatchImportModal from '$lib/features/deck-manager/components/BatchImportModal.svelte';

	let { data }: { data: PageData } = $props();

	let cards = $state<FlashcardItem[]>([]);
	$effect(() => {
		cards = data?.cards ? [...data.cards] : [];
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
	<title>FLCard-JP • Trung Tâm Học Tiếng Nhật Thông Minh</title>
</svelte:head>

<!-- GIAO DIỆN LEARNING PORTAL HUB -->
<div class="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-200 flex flex-col pt-16 sm:pt-20 pb-12 relative select-none">
	<!-- Ambient Background Glow -->
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none"></div>

	<!-- Navbar Cố Định -->
	<Navbar
		onCreateCard={() => { cardToEdit = null; isCreateModalOpen = true; }}
		onBatchImport={() => isBatchImportModalOpen = true}
	/>

	<!-- Toast Thông Báo -->
	{#if notification}
		<div class="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
			{notification}
		</div>
	{/if}

	<main class="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col gap-6 sm:gap-8">
		<!-- HERO DASHBOARD BANNER -->
		<section class="rounded-3xl p-5 sm:p-7 bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
			<div class="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 level-pill">N5</span>
					<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
						<span>🔥</span> Chuỗi học 7 ngày
					</span>
					<span class="text-xs text-slate-500 dark:text-slate-400">| Bộ thẻ hoạt động</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
					Chào bạn! Hôm nay bạn có <span class="text-indigo-600 dark:text-indigo-400">{cards.length} thẻ</span> cần ôn.
				</h1>
				<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
					Khám phá các phương pháp học tiếng Nhật đa giác quan: Luyện phản xạ Flashcard ngắt quãng, tra cứu Kanji chuyên sâu, luyện nói Shadowing và sáng tạo câu với AI.
				</p>
			</div>

			<!-- CTA Tiếp tục ôn tập -->
			<div class="flex-shrink-0 flex items-center gap-3">
				<a
					href="/study"
					class="px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
					title="Bắt đầu phòng ôn Flashcard tập trung"
				>
					<span>▶ Vào phòng ôn Flashcard</span>
					<span class="group-hover:translate-x-1 transition-transform">→</span>
				</a>
			</div>
		</section>

		<!-- LEARNING MODULES GRID (CÁC PHÂN HỆ TÍNH NĂNG) -->
		<section class="space-y-3 sm:space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
					<span>🎌</span> Các Phân Hệ Học Tập & Luyện Tập
				</h2>
				<span class="text-xs text-slate-500 dark:text-slate-400">Chọn một phân hệ để bắt đầu</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<!-- Module 1: Flashcard SRS -->
				<a
					href="/study"
					class="group p-5 rounded-3xl bg-white dark:bg-[#151c2c] hover:bg-slate-50/80 dark:hover:bg-[#1a2337] border border-slate-200/90 dark:border-[#242f47] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden"
				>
					<div class="space-y-2.5">
						<div class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
							🎴
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
							Luyện Flashcard (SRS)
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
							Ôn tập ngắt quãng SM-2, lật thẻ 3D hai mặt, hỗ trợ âm thanh Web Speech và phím tắt 1-4 một tay.
						</p>
					</div>
					<div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
						<span>{cards.length} thẻ sẵn sàng</span>
						<span class="group-hover:translate-x-1 transition-transform">Học ngay →</span>
					</div>
				</a>

				<!-- Module 2: Kanji Hub & Stroke Order -->
				<div
					role="button"
					tabindex="0"
					class="group p-5 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
					onclick={() => showNotification('💡 Tra cứu nhanh Kanji đã được tích hợp sẵn trong form tạo thẻ!')}
					onkeydown={(e) => e.key === 'Enter' && showNotification('💡 Tra cứu nhanh Kanji đã được tích hợp sẵn trong form tạo thẻ!')}
				>
					<div class="space-y-2.5">
						<div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
							✍️
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
							Luyện & Tra Cứu Kanji
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
							Tra từ điển Mazii, gợi ý Furigana chuẩn thẻ ruby, âm Hán Việt và phân tích bộ thủ trực quan.
						</p>
					</div>
					<div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
						<span>Tích hợp 0ms</span>
						<span class="group-hover:translate-x-1 transition-transform">Tra cứu →</span>
					</div>
				</div>

				<!-- Module 3: Shadowing & Luyện Nói -->
				<div
					role="button"
					tabindex="0"
					class="group p-5 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
					onclick={() => showNotification('🎙️ Tính năng Shadowing đa giọng AI đang được hoàn thiện!')}
					onkeydown={(e) => e.key === 'Enter' && showNotification('🎙️ Tính năng Shadowing đa giọng AI đang được hoàn thiện!')}
				>
					<div class="space-y-2.5">
						<div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
							🎙️
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
							Shadowing & Luyện Phát Âm
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
							Nghe phát âm chuẩn ngữ điệu Tokyo (Kore, Aoede, Fenrir) và luyện phản xạ nói chuẩn xác.
						</p>
					</div>
					<div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
						<span>Speech Lab</span>
						<span class="group-hover:translate-x-1 transition-transform">Thử giọng →</span>
					</div>
				</div>

				<!-- Module 4: Đặt câu AI -->
				<div
					role="button"
					tabindex="0"
					class="group p-5 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
					onclick={() => showNotification('🤖 Tính năng Đặt câu AI ngữ cảnh qua Gemini Edge sẽ sớm ra mắt!')}
					onkeydown={(e) => e.key === 'Enter' && showNotification('🤖 Tính năng Đặt câu AI ngữ cảnh qua Gemini Edge sẽ sớm ra mắt!')}
				>
					<div class="space-y-2.5">
						<div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
							🤖
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
							Đặt Câu Ngữ Cảnh AI
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
							Tạo câu ví dụ giao tiếp thực tế theo từng cấp độ JLPT từ N5 đến N1 bằng mô hình Gemini Flash.
						</p>
					</div>
					<div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
						<span>Gemini Edge</span>
						<span class="group-hover:translate-x-1 transition-transform">Tạo câu →</span>
					</div>
				</div>

				<!-- Module 5: Quản lý bộ thẻ (Deck Library) -->
				<div
					role="button"
					tabindex="0"
					class="group p-5 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
					onclick={() => isDeckListModalOpen = true}
					onkeydown={(e) => e.key === 'Enter' && (isDeckListModalOpen = true)}
				>
					<div class="space-y-2.5">
						<div class="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
							📚
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
							Kho Thẻ & Thư Viện
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
							Duyệt danh mục từ vựng, tìm kiếm nhanh theo Kanji/Romaji, chỉnh sửa thẻ và quản lý ảnh R2.
						</p>
					</div>
					<div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
						<span>Duyệt toàn bộ kho</span>
						<span class="group-hover:translate-x-1 transition-transform">Mở kho →</span>
					</div>
				</div>

				<!-- Module 6: Thống kê & Tiến độ -->
				<div
					role="button"
					tabindex="0"
					class="group p-5 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
					onclick={() => showNotification(`📊 Tổng cộng: ${cards.length} thẻ trong cơ sở dữ liệu Cloudflare D1.`)}
					onkeydown={(e) => e.key === 'Enter' && showNotification(`📊 Tổng cộng: ${cards.length} thẻ trong cơ sở dữ liệu Cloudflare D1.`)}
				>
					<div class="space-y-2.5">
						<div class="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
							📊
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
							Thống Kê Tiến Độ
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
							Theo dõi số lượng thẻ đã thuộc, tần suất ôn tập và phân bổ từ vựng theo từng cấp độ JLPT.
						</p>
					</div>
					<div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
						<span>N5: {data.levelCounts?.N5 ?? cards.length} thẻ</span>
						<span class="group-hover:translate-x-1 transition-transform">Chi tiết →</span>
					</div>
				</div>
			</div>
		</section>

		<!-- QUICK VOCABULARY PREVIEW SECTION -->
		<section class="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-[#242f47] shadow-xs space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
					<span>✨</span> Thẻ Từ Vựng Gần Đây
				</h3>
				<a href="/study" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
					Xem tất cả trong phòng học →
				</a>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
				{#each cards.slice(0, 5) as card}
					<div class="p-3 rounded-2xl bg-[#f8f9fb] dark:bg-[#0b0f19] border border-slate-200/80 dark:border-[#242f47] flex flex-col items-center justify-center text-center hover:border-indigo-400/60 transition-colors">
						<span class="text-lg font-bold text-slate-900 dark:text-white font-jp">{card.term}</span>
						<span class="text-[11px] text-indigo-600 dark:text-indigo-400 font-jp">{card.reading}</span>
						<span class="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{card.meaning}</span>
					</div>
				{/each}
			</div>
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
				showNotification(`🗑️ Đã xóa thẻ: "${target.term}"!`);
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
