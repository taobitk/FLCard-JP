import type { BatchClassificationItem, BatchClassificationOutput } from './gemini-classifier';

export type TagUpdateCallback = (cardId: string, tags: string[]) => void;

class TagQueueService {
	private queue: Map<string, BatchClassificationItem> = new Map();
	private listeners: Set<TagUpdateCallback> = new Set();
	private timer: any = null;
	private debounceMs = 30000; // 30 giây gom lô
	private isProcessing = false;

	/**
	 * Đăng ký listener nhận sự kiện khi thẻ được cập nhật tag thành công
	 */
	public subscribe(callback: TagUpdateCallback): () => void {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}

	/**
	 * Kiểm tra xem một thẻ có đang nằm trong hàng đợi chờ AI gắn tag hay không
	 */
	public isPending(cardId: string): boolean {
		return this.queue.has(cardId);
	}

	/**
	 * Đưa một thẻ vào hàng đợi phân loại AI
	 */
	public enqueue(item: BatchClassificationItem) {
		this.queue.set(item.id, item);

		// Nếu chưa có timer đếm ngược 30s, bắt đầu kích hoạt
		if (!this.timer) {
			this.timer = setTimeout(() => {
				this.flushQueue();
			}, this.debounceMs);
		}
	}

	/**
	 * Gom toàn bộ các thẻ trong hàng đợi và gửi request AI
	 */
	public async flushQueue(): Promise<BatchClassificationOutput[]> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		if (this.queue.size === 0 || this.isProcessing) {
			return [];
		}

		const items = Array.from(this.queue.values());
		this.isProcessing = true;

		try {
			const res = await fetch('/api/tags/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cards: items })
			});

			if (!res.ok) {
				console.warn('Lỗi khi flush tag queue:', await res.text());
				return [];
			}

			const data = (await res.json()) as {
				success: boolean;
				results: BatchClassificationOutput[];
			};

			if (data.success && Array.isArray(data.results)) {
				// Xóa các item đã hoàn thành khỏi queue và thông báo cho listeners
				for (const result of data.results) {
					this.queue.delete(result.id);
					this.notifyListeners(result.id, result.tags);
				}
				return data.results;
			}
		} catch (err) {
			console.error('Lỗi mạng khi gọi /api/tags/batch:', err);
		} finally {
			this.isProcessing = false;
		}

		return [];
	}

	/**
	 * Phân loại ngay lập tức (dùng cho Batch Import Studio hoặc khi người dùng bấm yêu cầu ngay)
	 */
	public async classifyImmediately(items: BatchClassificationItem[]): Promise<BatchClassificationOutput[]> {
		if (items.length === 0) return [];

		// Chia thành các chunk tối đa 25 từ để đảm bảo độ trễ thấp và an toàn token
		const chunkSize = 25;
		const allResults: BatchClassificationOutput[] = [];

		for (let i = 0; i < items.length; i += chunkSize) {
			const chunk = items.slice(i, i + chunkSize);
			try {
				const res = await fetch('/api/tags/batch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cards: chunk })
				});

				if (res.ok) {
					const data = (await res.json()) as {
						success: boolean;
						results: BatchClassificationOutput[];
					};
					if (data.success && Array.isArray(data.results)) {
						allResults.push(...data.results);
						for (const r of data.results) {
							this.queue.delete(r.id);
							this.notifyListeners(r.id, r.tags);
						}
					}
				}
			} catch (err) {
				console.error('Lỗi khi classify immediately:', err);
			}
		}

		return allResults;
	}

	private notifyListeners(cardId: string, tags: string[]) {
		for (const cb of this.listeners) {
			try {
				cb(cardId, tags);
			} catch (e) {
				console.warn('Lỗi listener tag update:', e);
			}
		}
	}
}

// Export singleton instance
export const tagQueue = new TagQueueService();
