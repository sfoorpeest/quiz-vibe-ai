import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BrainCircuit, MessageSquare, FileText,
  Send, Maximize2, Sparkles, BookOpen, Clock, Lightbulb, Loader2,
  ChevronLeft, ChevronRight, List, CheckCircle2, Volume2, Square,
  Video, Download
} from 'lucide-react';
import api from '../api/axiosClient';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import ReactMarkdown from 'react-markdown';

export default function LearningView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'summary'
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(0); // Để biết đã đọc xa nhất tới đâu
  const [lastSavedProgress, setLastSavedProgress] = useState(0); // Để hạn chế spam API
  const [showToc, setShowToc] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [volume, setVolume] = useState(1);

  // Refs
  const volumeRef = useRef(1);
  const contentRef = useRef(null);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const googleAudioRef = useRef(null);
  const googleAudioQueueRef = useRef([]);
  const googleAudioIndexRef = useRef(0);

  const nativeSpeechQueueRef = useRef([]);
  const nativeSpeechIndexRef = useRef(0);
  const activeUtteranceRef = useRef(null);
  const currentCharIndexRef = useRef(0);
  const volumeTimerRef = useRef(null);

  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Chào bạn! Mình là trợ lý AI QuizVibe được hỗ trợ bởi DeepSeek. Bạn có thắc mắc gì về nội dung bài học này không?' }
  ]);

  const [material, setMaterial] = useState(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadMaterial = async () => {
      try {
        const res = await api.post('/api/edu/materials/list');
        if (isMounted && res.data && res.data.data) {
          const allMates = res.data.data;
          const found = allMates.find(m => m.id.toString() === id);
          if (found) {
            // Xây dựng TOC cơ bản dựa trên thẻ "##"
            const toc = [];
            let i = 1;
            const contentLines = (found.content || '').split('\n');
            contentLines.forEach(line => {
              if (line.trim().startsWith('##')) {
                toc.push({ id: `sec-${i}`, title: line.replace('##', '').trim() });
                i++;
              }
            });

            // Tách các câu tóm tắt (description)
            const summaryArr = found.description
              ? found.description.split('.').filter(s => s.trim() !== '')
              : ['Chưa có tóm tắt.'];

            setMaterial({
              title: found.title,
              author: found.creator_name || 'Giảng viên QuizVibe',
              readTime: '15 phút',
              content: found.content || 'Chưa có nội dung cho bài giảng này.',
              summary: summaryArr,
              toc: toc,
              prevLesson: null,
              nextLesson: null
            });

            // Fetch progress thực tế từ database
            try {
              const progressRes = await api.get(`/api/edu/learning/progress/${id}`);
              if (progressRes.data && progressRes.data.status === 'success') {
                const savedProgress = progressRes.data.progress || 0;
                setMaxProgress(savedProgress);
                setLastSavedProgress(savedProgress);
                setReadingProgress(0); // Bắt đầu ở đầu trang nhưng progress bar đã đạt mốc cũ
              }
            } catch (pErr) {
              console.error("Lỗi khi tải tiến độ cũ:", pErr);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết bài học:", err);
      }
    };

    loadMaterial();

    return () => {
      isMounted = false;
      window.speechSynthesis.cancel();
      // Dọn dẹp Google TTS audio nếu đang phát
      if (googleAudioRef.current) {
        googleAudioRef.current.pause();
        googleAudioRef.current = null;
      }
      googleAudioQueueRef.current = [];
    };
  }, [id]); // Luôn sử dụng ID nguyên bản, không dùng Object phức tạp làm Dependency

  if (!material) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="font-bold text-slate-400 animate-pulse">Đang tải bài giảng từ AI...</p>
      </div>
    );
  }

  // --- Chia văn bản thành các đoạn ngắn cho Google TTS (tối đa ~190 ký tự) ---
  const splitTextForAggressiveTTS = (text) => {
    // Tách theo dấu chấm, chấm hỏi, chấm than, xuống dòng, dấu phẩy, chấm phẩy, hai chấm
    const sentences = text.split(/(?<=[.!?。;:\n,])\s*/);
    const chunks = [];
    let current = '';
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      // Giới hạn chunk nhỏ hơn (~100 ký tự) để thay đổi volume nhanh hơn
      if ((current + ' ' + sentence).trim().length <= 100) {
        current = (current + ' ' + sentence).trim();
      } else {
        if (current) chunks.push(current);
        if (sentence.length > 100) {
          const words = sentence.split(/\s+/);
          current = '';
          for (const word of words) {
            if ((current + ' ' + word).trim().length <= 100) {
              current = (current + ' ' + word).trim();
            } else {
              if (current) chunks.push(current);
              current = word;
            }
          }
        } else {
          current = sentence;
        }
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  // --- Phát từng đoạn Google TTS nối tiếp nhau ---

  // --- Phát từng đoạn Google TTS nối tiếp nhau ---
  const playGoogleTTSChunk = async (index) => {
    if (index >= googleAudioQueueRef.current.length) {
      setIsSpeaking(false);
      googleAudioQueueRef.current = [];
      googleAudioRef.current = null;
      return;
    }
    const chunk = googleAudioQueueRef.current[index];

    try {
      const response = await api.get('/api/edu/tts', {
        params: { text: chunk, lang: 'vi' },
        responseType: 'blob' 
      });

      const blobUrl = URL.createObjectURL(response.data);
      const audio = new Audio(blobUrl);

      googleAudioRef.current = audio;
      googleAudioIndexRef.current = index;

      audio.playbackRate = 1.2;
      audio.volume = volumeRef.current;

      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        playGoogleTTSChunk(index + 1);
      };

      audio.onerror = (err) => {
        console.error('Google TTS chunk error:', err);
        URL.revokeObjectURL(blobUrl);
        playGoogleTTSChunk(index + 1);
      };

      await audio.play();
    } catch (err) {
      console.error('Lỗi khi tải giọng từ proxy:', err);
      setIsSpeaking(false);
    }
  };

  // --- Phát từng đoạn Native Speech Synthesis nối tiếp nhau ---
  const playNativeSpeechChunk = (index, offset = 0) => {
    if (index >= nativeSpeechQueueRef.current.length) {
      setIsSpeaking(false);
      nativeSpeechQueueRef.current = [];
      activeUtteranceRef.current = null;
      currentCharIndexRef.current = 0;
      return;
    }

    const fullChunk = nativeSpeechQueueRef.current[index];
    const textToSpeak = fullChunk.slice(offset);
    
    // Nếu phần còn lại trống rỗng, chuyển sang chunk tiếp theo
    if (!textToSpeak.trim()) {
      currentCharIndexRef.current = 0;
      playNativeSpeechChunk(index + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    activeUtteranceRef.current = utterance;
    nativeSpeechIndexRef.current = index;

    const voices = window.speechSynthesis.getVoices();
    const vnVoice = voices.find(v => v.lang.includes('vi')) || voices.find(v => v.name.includes('Vietnamese'));
    
    if (vnVoice) utterance.voice = vnVoice;
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = volumeRef.current;

    // Cập nhật vị trí đang đọc hiện tại (tính cả offset)
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        currentCharIndexRef.current = offset + event.charIndex;
      }
    };

    utterance.onend = () => {
      if (activeUtteranceRef.current === utterance) {
        currentCharIndexRef.current = 0; // Hết chunk này thì reset về 0 cho chunk kế tiếp
        playNativeSpeechChunk(index + 1);
      }
    };

    utterance.onerror = (err) => {
      if (err.error === 'interrupted') return;
      console.error('Native TTS chunk error:', err);
      if (activeUtteranceRef.current === utterance) {
        playNativeSpeechChunk(index + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // --- Dừng tất cả audio ---
  const stopAllAudio = () => {
    window.speechSynthesis.cancel();
    if (googleAudioRef.current) {
      googleAudioRef.current.pause();
      googleAudioRef.current.currentTime = 0;
      googleAudioRef.current = null;
    }
    googleAudioQueueRef.current = [];
    nativeSpeechQueueRef.current = [];
    activeUtteranceRef.current = null;
    currentCharIndexRef.current = 0;
    setIsSpeaking(false);
  };

  // --- HANDLER CHÍNH: ĐỌC VĂN BẢN ---
  const handleReadAloud = (voiceType = 'male') => {
    setShowVoiceMenu(false);

    if (isSpeaking) {
      stopAllAudio();
      return;
    }

    // Loại bỏ markdown syntax
    const plainText = material.content
      .replace(/[#*`_~>]+/g, '')
      .replace(/\[EXPLAIN\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (voiceType === 'female') {
      // ===== GIỌNG NỮ: Dùng Google Translate TTS (Proxy Backend) =====
      const chunks = splitTextForAggressiveTTS(plainText); // Dùng chunk nhỏ hơn
      if (chunks.length === 0) return;
      googleAudioQueueRef.current = chunks;
      setIsSpeaking(true);
      playGoogleTTSChunk(0);
    } else {
      // ===== GIỌNG NAM: Dùng speechSynthesis với Aggressive Chunking =====
      const chunks = splitTextForAggressiveTTS(plainText); 
      if (chunks.length === 0) return;
      
      nativeSpeechQueueRef.current = chunks;
      setIsSpeaking(true);
      currentCharIndexRef.current = 0;
      
      const startSpeaking = () => {
        playNativeSpeechChunk(0);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          startSpeaking();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        startSpeaking();
      }
    }
  };

  // Tính toán phần trăm cuộn
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - clientHeight <= 0) {
      if (maxProgress < 100) {
        setReadingProgress(100);
        setMaxProgress(100);
        saveProgress(100);
        setLastSavedProgress(100);
      }
      return;
    }

    const currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const roundedProgress = Math.min(100, Math.max(0, Math.round(currentProgress)));

    setReadingProgress(roundedProgress);

    // Chỉ cập nhật và lưu nếu vượt qua tiến độ cũ
    if (roundedProgress > maxProgress) {
      setMaxProgress(roundedProgress);

      // Gửi API chỉ khi đủ 5% chênh lệch so với lần vừa gửi HOẶC đạt 100%
      if (roundedProgress - lastSavedProgress >= 5 || roundedProgress === 100) {
        saveProgress(roundedProgress);
        setLastSavedProgress(roundedProgress);
      }
    }
  };

  // Hàm gọi API lưu tiến độ
  const saveProgress = async (val) => {
    try {
      await api.post('/api/edu/learning/track', {
        material_id: id,
        action: 'VIEWED_MATERIAL',
        progress: val
      });
    } catch (err) {
      console.warn("Lỗi lưu tiến độ:", err);
    }
  };

  const handleDownload = () => {
    if (!material || !contentRef.current) return;
    
    const contentHtml = contentRef.current.innerHTML;
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${material.title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; }
          h1 { color: #2563eb; }
          .metadata { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${material.title}</h1>
        <div class="metadata">
          <p>Tác giả: ${material.author}</p>
          <p>Thời lượng: ${material.readTime}</p>
        </div>
        <hr/>
        ${contentHtml}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${material.title.replace(/[\/\\:*?"<>|]/g, '').trim().replace(/\s+/g, '_')}_QuizVibe.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;

    // Thêm tin nhắn của user
    const newUserMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/edu/chat', {
        context: material.content,
        question: newUserMsg.text
      });

      if (response.data && response.data.answer) {
        setChatHistory(prev => [
          ...prev,
          { sender: 'ai', text: response.data.answer }
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: "Xin lỗi, hiện tại hệ thống AI đang bận. Vui lòng thử lại sau vài giây nhé." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-dvh relative text-slate-50 font-sans flex flex-col overflow-hidden">
      <AnimatedBackground />
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 h-16 flex items-center px-4 sm:px-6">
        <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-xl transition-colors group">
              <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-white" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-100 line-clamp-1">{material.title}</h1>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {material.author}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {material.readTime}</span>
              </div>
            </div>
          </div>

          {/* MEDIA CONTROLS */}
          <div className="flex items-center gap-2">
            <div className="flex items-center px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700/50 text-sm font-semibold text-slate-300 gap-4">
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <Video className="w-4 h-4" /> VIDEO
              </button>

              {/* VOICE MENU (Moved here) */}
              <div className="relative">
                {isSpeaking ? (
                  <button onClick={stopAllAudio} className="flex items-center gap-2 hover:text-white transition-colors text-amber-400">
                    <Square className="w-4 h-4 fill-current animate-pulse" /> DỪNG
                  </button>
                ) : (
                  <button onClick={() => setShowVoiceMenu(!showVoiceMenu)} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Volume2 className="w-4 h-4" /> AUDIO
                  </button>
                )}

                {showVoiceMenu && !isSpeaking && (
                  <>
                    <div className="fixed inset-0 z-90" onClick={() => setShowVoiceMenu(false)}></div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-40 bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden py-1 z-100 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                      <button onClick={() => handleReadAloud('male')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Giọng Nam
                      </button>
                      <div className="h-px bg-slate-700/50 mx-2"></div>
                      <button onClick={() => handleReadAloud('female')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-300 hover:bg-pink-600 hover:text-white transition-all flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                        Giọng Nữ
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={handleDownload} 
                className="flex items-center gap-2 hover:text-white transition-colors" 
                title="Tải về Word (.doc)"
              >
                <Download className="w-4 h-4" /> TẢI VỀ
              </button>
            </div>

            <div className="flex items-center px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700/50 text-sm font-semibold text-slate-300 gap-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={volume} 
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (googleAudioRef.current) {
                      googleAudioRef.current.volume = newVol;
                    }
                    
                    // Xử lý giọng Nam: Không còn thực hiện cancel và restart ở giữa chừng nữa để tránh ngắt quãng.
                    // Với cơ chế Aggressive Chunking (chia nhỏ theo dấu phẩy), volume sẽ thay đổi mượt mà 
                    // ngay sau khi kết thúc 1 cụm từ ngắn (vài giây), không gây lặp chữ hay khựng tiếng.
                  }} 
                  className="w-16 md:w-20 accent-blue-500 h-1.5 bg-slate-600 rounded-full appearance-none outline-none cursor-pointer" 
                />
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(f => Math.max(12, f - 1))} className="text-lg font-bold leading-none text-slate-400 hover:text-white">-</button>
                <span className="w-5 text-center text-blue-400 font-bold">{fontSize}</span>
                <button onClick={() => setFontSize(f => Math.min(30, f + 1))} className="text-lg font-bold leading-none text-slate-400 hover:text-white">+</button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN 2-COLUMN LAYOUT */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto p-4 sm:p-6 gap-6">

        {/* LFET COLUMN: TÀI LIỆU HỌC TẬP */}
        <div className="flex-2 min-w-0 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl flex flex-col shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between z-20 rounded-t-3xl overflow-visible">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                Nội dung chi tiết
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${maxProgress >= 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {maxProgress >= 100 ? '✓ Hoàn thành' : `Tiến độ: ${maxProgress}%`}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Nút Mục Lục */}
              <button
                onClick={() => setShowToc(!showToc)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${showToc ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                <List className="w-4 h-4" /> Mục lục
              </button>
            </div>
          </div>

          {/* Progress bar line under header */}
          <div className="w-full h-1 bg-slate-800 z-10 relative">
            {/* Track đã xem nhiều nhất (maxProgress - màu chính) */}
            <div
              className={`h-full transition-all duration-300 ${maxProgress >= 100 ? 'bg-emerald-500' : 'bg-linear-to-r from-blue-500 to-amber-500'}`}
              style={{ width: `${maxProgress}%` }}
            />
            {/* Vị trí cuộn hiện tại (mờ hơn, chỉ hiện nếu đang cuộn ngược) */}
            {readingProgress < maxProgress && (
              <div
                className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-100 pointer-events-none"
                style={{ width: `${readingProgress}%` }}
              />
            )}
          </div>

          <div className="flex-1 overflow-hidden flex relative">

            {/* TOC Sidebar */}
            {showToc && (
              <div className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 flex flex-col absolute left-0 top-0 bottom-0 z-20 animate-in slide-in-from-left-4 fade-in duration-300 shadow-xl">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-slate-200">Mục lục khóa học</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                  {material.toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const element = document.getElementById(item.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors line-clamp-2 mb-1"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth print-content" onScroll={handleScroll}>
              <div 
                ref={contentRef}
                className="prose prose-invert max-w-[900px] mx-auto text-slate-300 leading-[1.9] font-normal pb-20 prose-headings:mt-20 prose-headings:mb-8 prose-p:my-10 prose-p:text-[1em] prose-li:my-6 prose-li:text-[1em] prose-h2:text-[1.8em] prose-h2:border-b prose-h2:pb-4 prose-h2:border-slate-800 prose-h3:text-[1.4em] prose-strong:text-white prose-strong:font-extrabold prose-ul:list-disc prose-ol:list-decimal prose-marker:text-blue-400 prose-marker:font-black"
                style={{ fontSize: `${fontSize}px` }}
              >
                <h1 className="text-[2.5em] font-extrabold mb-16 bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-violet-400 leading-tight">{material.title}</h1>

                {/* Phân tách và render nội dung theo section để trỏ Mục lục */}
                {(() => {
                  const parts = material.content.split(/(?=## )/g);
                  let secIdx = 0;
                  return parts.map((part, pIdx) => {
                    const isHeader = part.trim().startsWith('## ');
                    const id = isHeader ? `sec-${++secIdx}` : null;
                    return (
                      <div key={pIdx} id={id} className={isHeader ? "mt-10 scroll-mt-6" : ""}>
                        <ReactMarkdown>{part}</ReactMarkdown>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Bài kế tiếp / Trước đó */}
              <div className="max-w-[800px] mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                {material.prevLesson ? (
                  <button className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 group w-full sm:w-auto text-left">
                    <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Bài trước</div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">{material.prevLesson.title}</div>
                    </div>
                  </button>
                ) : <div />}

                {material.nextLesson ? (
                  <button className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 group w-full sm:w-auto text-right justify-end">
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Bài tiếp theo</div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">{material.nextLesson.title}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </button>
                ) : <div />}
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI SIDEBAR */}
        <div className="flex-1 min-w-[320px] lg:max-w-[450px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative min-h-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-violet-500 to-amber-500"></div>

          <div className="px-6 py-5 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3 text-lg font-bold text-white mb-4">
              <div className="p-2 bg-violet-500/10 rounded-lg shadow-inner border border-violet-500/20">
                <BrainCircuit className="w-5 h-5 text-violet-400" />
              </div>
              QuizVibe AI Copilot
            </div>

            {/* TABS */}
            <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-slate-800 text-violet-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <MessageSquare className="w-4 h-4" /> Hỏi AI
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Sparkles className="w-4 h-4" /> Tóm tắt
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="flex-1 min-h-0 flex flex-col bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="overflow-y-auto flex-1 custom-scrollbar p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6">
                  <h3 className="flex items-center gap-2 text-amber-400 font-bold mb-3">
                    <Lightbulb className="w-5 h-5" /> Ý chính cốt lõi
                  </h3>
                  <ul className="space-y-4">
                    {material.summary.map((point, index) => (
                      <li key={index} className="flex gap-3 text-slate-300 font-medium text-sm leading-relaxed">
                        <span className="w-6 h-6 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">{index + 1}</span>
                        <ReactMarkdown>{point}</ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                  <p className="text-sm font-medium text-blue-300/80 mb-3">Sẵn sàng để thử thách kiến thức?</p>
                  <button
                    onClick={() => navigate('/quiz/start', { state: { materialId: id, topic: `Dựa vào nội dung tài liệu: ${material?.title}\n\nNội dung chi tiết:\n${material?.content}` } })}
                    className="flex justify-center items-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] text-sm"
                  >
                    <Sparkles className="w-4 h-4" /> Sinh 5 câu Quiz từ học liệu này
                  </button>
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Message List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 flex flex-col custom-scrollbar">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                      <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex max-w-[85%] self-start">
                      <div className="p-4 rounded-2xl shadow-sm text-sm font-medium bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                        AI đang suy nghĩ...
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                  <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={isLoading}
                      placeholder="Hỏi AI về bài học này..."
                      className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-sm font-medium rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600 shadow-inner disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatMessage.trim() || isLoading}
                      className="absolute right-2 p-2 bg-violet-600 disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-sm disabled:text-slate-500"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-3">AI có thể đưa ra kết quả thiếu chính xác</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      <Footer />

      {/* Global Style Override for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1); 
        }
      `}</style>
    </div>
  );
}
