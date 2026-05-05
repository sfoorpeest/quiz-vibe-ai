const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Trích xuất text thuần túy từ Buffer theo từng loại file
 */
const extractTextFromBuffer = async (buffer, mimetype, originalname) => {
    const ext = (originalname || '').split('.').pop().toLowerCase();

    // ---- TXT / CSV ----
    if (ext === 'txt' || ext === 'csv' || (mimetype && mimetype.startsWith('text/'))) {
        return buffer.toString('utf-8').substring(0, 10000);
    }

    // ---- DOCX (Word) ----
    if (
        ext === 'docx' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
    ) {
        try {
            // mammoth cần nhận đúng kiểu Buffer của Node
            const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
            const result = await mammoth.extractRawText({ buffer: nodeBuffer });
            const text = result.value.trim();
            if (!text || text.length < 10) {
                console.warn('mammoth returned very little or no content. Falling back to default text.');
                return `Tài liệu Word này (tên: ${originalname}) chủ yếu chứa hình ảnh hoặc sơ đồ. Không có nhiều văn bản để AI phân tích.`;
            }
            return text.substring(0, 10000);
        } catch (err) {
            console.error('Mammoth DOCX parse error:', err.message);
            return `Lỗi khi đọc định dạng Word (${originalname}). Tài liệu có thể chỉ chứa biểu đồ/hình ảnh.`;
        }
    }

    // ---- PDF ----
    if (ext === 'pdf' || mimetype === 'application/pdf') {
        try {
            const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
            // Hỗ trợ cả 2 phiên bản pdf-parse (v1.1.1 và v2.4.5)
            const pdfFunc = typeof pdf === 'function' ? pdf : (pdf.PDFParse || pdf.default);
            const data = await pdfFunc(nodeBuffer);
            const text = data.text.trim();
            if (!text || text.length < 10) {
                console.warn('pdf-parse returned no content. Will rely on Gemini Native OCR.');
                return '[PDF Content Empty - Redirecting to Native OCR]';
            }
            return text.substring(0, 10000);
        } catch (err) {
            console.error('PDF local parse error:', err.message);
            console.info('Note: This is normal if the file is scanned or encoded. System will use Gemini Native OCR instead.');
            return '[PDF Local Parse Failed - Redirecting to Native OCR]';
        }
    }

    // Định dạng không hỗ trợ
    return null;
};

/**
 * Scrape text từ URL (Web page)
 */
const extractTextFromUrl = async (url) => {
    try {
        // --- XỬ LÝ RIÊNG CHO YOUTUBE ---
        if (/youtube\.com|youtu\.be/i.test(url)) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(url);
                const transcriptText = transcript.map(t => t.text).join(' ');
                
                // Lấy tiêu đề cơ bản
                const response = await axios.get(url, {
                    timeout: 8000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $ = cheerio.load(response.data);
                const pageTitle = $('title').text().trim() || 'YouTube Video';
                const description = $('meta[name="description"]').attr('content') || '';
                
                return `[Tiêu đề Video: ${pageTitle}]\n[Mô tả Video]: ${description}\n\n[Nội dung Transcript (Phụ đề) Video]:\n${transcriptText || 'Không lấy được phụ đề cho video này.'}`.substring(0, 10000);
            } catch (transcriptError) {
                console.error('YouTube Transcript Error (Video may not have captions):', transcriptError.message);
                // Fallback xuống scrape web thông thường nếu không lấy được phụ đề
            }
        }

        // --- WEB SCRAPING BÌNH THƯỜNG ---
        const response = await axios.get(url, {
            timeout: 12000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            responseType: 'text'
        });

        const $ = cheerio.load(response.data);

        // Xóa thẻ không cần thiết
        $('script, style, nav, footer, header, iframe, noscript, .ads, .sidebar, .menu').remove();

        // Lấy tiêu đề trang
        const pageTitle = $('title').text().trim();

        // Lấy text có ý nghĩa từ body (ưu tiên thẻ article, main, section)
        let bodyText = '';
        const mainContent = $('article, main, .content, .post-content, #content');
        if (mainContent.length > 0) {
            bodyText = mainContent.text();
        } else {
            bodyText = $('body').text();
        }

        const finalText = `${pageTitle}\n\n${bodyText}`;
        return finalText.replace(/\s+/g, ' ').trim().substring(0, 10000);
    } catch (err) {
        console.error('URL Scrape Error:', err.message);
        return null;
    }
};

module.exports = { extractTextFromBuffer, extractTextFromUrl };
