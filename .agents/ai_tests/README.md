# Bộ Script Kiểm Thử & Đo Đạc AI (AI Test Suite - FLCard-JP)

Thư mục này gom toàn bộ các script kiểm thử, đo đạc hiệu năng (benchmark) và trích xuất file mẫu cho cả **Google Gemini API** và **Cloudflare Workers AI**.

---

## 📋 Danh Mục Các Script Kiểm Thử:

### 1. Google Gemini AI (Text, JSON & TTS)
- **`test_gemini.py`**: Kiểm tra kết nối API key, khả năng sinh thẻ của `gemini-3.5-flash-lite`, và xuất thử audio demo.
- **`test_gemini_strict.py`**: Kiểm thử bắt buộc chuẩn Furigana `<ruby>` cả từ vựng và câu ví dụ với `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.7-flash`.
- **`test_tts_one_by_one.py`**: Kiểm thử tuần tự các model & giọng đọc TTS (`kore`, `aoede`, `puck`, `fenrir`), tự động xuất file `.mp3` và `.wav`.
- **`test_fenrir.py`**: Kiểm thử chuyên sâu giọng nam `fenrir` (thầy giáo trầm ấm).
- **`inspect_tts.py`**: Soi chi tiết cấu trúc payload trả về từ Gemini TTS.
- **`list_models_categorized.py`**: Quét trực tiếp qua API key để lấy toàn bộ 50 models của Google và phân loại theo tính năng (Flash-lite, TTS, Pro, Image).
- **`run_all_benchmarks.py`**: Script bắn thử nghiệm hàng loạt (20 models) cùng lúc để đo băng thông và giới hạn rate limit.

### 2. Cloudflare Workers AI (Text & Image)
- **`test_cloudflare_ai.py`**: Kiểm tra kết nối qua REST API Cloudflare với model `@cf/zai-org/glm-4.7-flash` và sinh ảnh với `@cf/black-forest-labs/flux-1-schnell`.
- **`compare_cf_models.py`**: Đo đạc đối đầu các model lớn trên Cloudflare Edge (`@cf/google/gemma-4-26b-a4b-it` và `@cf/nvidia/nemotron-3-120b-a12b`).

---

## 📁 Thư Mục Chứa Kết Quả & File Xuất Ra:
- **`static/tts_comparison/`**: Chứa các file MP3/WAV giọng cô giáo `kore`, `aoede`, và thầy giáo `fenrir`.
- **`static/cf_ai_results/`**: Chứa ảnh sinh từ FLUX-1-Schnell (`flux_1_schnell_cat.png`) và các file JSON từ Cloudflare AI.
- **`static/benchmark_results/`**: Chứa các file JSON đo đạc từ các dòng Gemini 3.5, 3.6, 3.7.
