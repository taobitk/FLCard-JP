<script lang="ts">
	interface Props {
		isOpen: boolean;
		imageSrc: string;
		onCrop: (croppedDataUrl: string) => void;
		onCancel: () => void;
	}

	let { isOpen, imageSrc, onCrop, onCancel }: Props = $props();

	let canvasRef = $state<HTMLCanvasElement | null>(null);
	let scale = $state(1);
	let posX = $state(0);
	let posY = $state(0);
	let isDragging = $state(false);
	let startDragX = 0;
	let startDragY = 0;
	let imgElement = $state<HTMLImageElement | null>(null);

	const CANVAS_SIZE = 320; // Kích thước khung cắt vuông 1:1

	// Khởi tạo ảnh khi mở modal
	$effect(() => {
		if (isOpen && imageSrc) {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				imgElement = img;
				// Tính scale sao cho ảnh vừa khít khung
				const minDim = Math.min(img.width, img.height);
				scale = CANVAS_SIZE / minDim;
				posX = (CANVAS_SIZE - img.width * scale) / 2;
				posY = (CANVAS_SIZE - img.height * scale) / 2;
				draw();
			};
			img.src = imageSrc;
		}
	});

	function draw() {
		if (!canvasRef || !imgElement) return;
		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

		// Vẽ ảnh theo scale và vị trí kéo
		ctx.save();
		ctx.drawImage(
			imgElement,
			posX,
			posY,
			imgElement.width * scale,
			imgElement.height * scale
		);
		ctx.restore();
	}

	function onMouseDown(e: MouseEvent) {
		isDragging = true;
		startDragX = e.clientX - posX;
		startDragY = e.clientY - posY;
	}

	function onMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		posX = e.clientX - startDragX;
		posY = e.clientY - startDragY;
		draw();
	}

	function onMouseUp() {
		isDragging = false;
	}

	// Hỗ trợ chạm kéo trên màn hình điện thoại (Touch Support)
	function onTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			isDragging = true;
			startDragX = e.touches[0].clientX - posX;
			startDragY = e.touches[0].clientY - posY;
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (!isDragging || e.touches.length !== 1) return;
		e.preventDefault(); // Ngăn cuộn trang khi đang kéo ảnh
		posX = e.touches[0].clientX - startDragX;
		posY = e.touches[0].clientY - startDragY;
		draw();
	}

	function onTouchEnd() {
		isDragging = false;
	}

	function handleScaleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newScale = parseFloat(target.value);
		if (!imgElement) return;

		// Zoom từ tâm
		const centerCanvas = CANVAS_SIZE / 2;
		const imgCenterX = (centerCanvas - posX) / scale;
		const imgCenterY = (centerCanvas - posY) / scale;

		scale = newScale;
		posX = centerCanvas - imgCenterX * scale;
		posY = centerCanvas - imgCenterY * scale;

		draw();
	}

	function handleApplyCrop() {
		if (!canvasRef) return;
		const croppedDataUrl = canvasRef.toDataURL('image/webp', 0.9);
		onCrop(croppedDataUrl);
	}
</script>

{#if isOpen && imageSrc}
	<div
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
		aria-labelledby="cropper-title"
		tabindex="-1"
	>
		<div class="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 transition-colors">
			<div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 sm:pb-3">
				<div>
					<h3 id="cropper-title" class="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
						<span>✂️</span> Cắt & Căn Chỉnh Ảnh Vuông 1:1
					</h3>
					<p class="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Dùng ngón tay hoặc chuột để kéo căn vị trí ảnh</p>
				</div>
				<button
					type="button"
					class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-lg p-1 cursor-pointer transition-colors"
					onclick={onCancel}
				>
					✕
				</button>
			</div>

			<!-- Vùng Canvas Cắt Ảnh: Co giãn theo màn hình điện thoại -->
			<div class="flex flex-col items-center justify-center py-1 sm:py-2">
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div 
					class="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-2xl overflow-hidden border-2 border-rose-500/80 shadow-2xl shadow-rose-950/30 cursor-grab active:cursor-grabbing bg-zinc-950 touch-none"
					onmousedown={onMouseDown}
					onmousemove={onMouseMove}
					onmouseup={onMouseUp}
					onmouseleave={onMouseUp}
					ontouchstart={onTouchStart}
					ontouchmove={onTouchMove}
					ontouchend={onTouchEnd}
					ontouchcancel={onTouchEnd}
					role="application"
					aria-label="Kéo để di chuyển ảnh"
				>
					<canvas
						bind:this={canvasRef}
						width={CANVAS_SIZE}
						height={CANVAS_SIZE}
						class="w-full h-full"
					></canvas>

					<!-- Lưới tỉ lệ 1/3 (Rule of thirds grid) -->
					<div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
						<div class="border-r border-b border-white/15"></div>
						<div class="border-r border-b border-white/15"></div>
						<div class="border-b border-white/15"></div>
						<div class="border-r border-b border-white/15"></div>
						<div class="border-r border-b border-white/15"></div>
						<div class="border-b border-white/15"></div>
						<div class="border-r border-white/15"></div>
						<div class="border-r border-white/15"></div>
						<div></div>
					</div>
				</div>
			</div>

			<!-- Thanh Zoom Phóng to / Thu nhỏ -->
			<div class="space-y-1">
				<div class="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium">
					<span>🔍 Phóng to / Thu nhỏ</span>
					<span>{Math.round(scale * 100)}%</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xs text-zinc-400 dark:text-zinc-500">−</span>
					<input
						type="range"
						min="0.2"
						max="3.0"
						step="0.05"
						value={scale}
						oninput={handleScaleChange}
						class="w-full accent-rose-500 cursor-pointer"
					/>
					<span class="text-xs text-zinc-400 dark:text-zinc-500">+</span>
				</div>
			</div>

			<!-- Nút thao tác -->
			<div class="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
				<button
					type="button"
					class="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
					onclick={onCancel}
				>
					Hủy bỏ
				</button>
				<button
					type="button"
					id="apply-crop-btn"
					class="px-5 py-2 text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl shadow-lg shadow-rose-950/30 transition-all cursor-pointer active:scale-95"
					onclick={handleApplyCrop}
				>
					✓ Áp Dụng Cắt Ảnh
				</button>
			</div>
		</div>
	</div>
{/if}
