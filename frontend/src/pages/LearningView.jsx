import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BrainCircuit, FileText, Send, Lightbulb, Loader2,
  List, Volume2, Video, Download, GraduationCap, Trophy,
  ArrowRight, PauseCircle, CheckCircle2, X
} from 'lucide-react';
import api from '../api/axiosClient';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import ReactMarkdown from 'react-markdown';

// --- SUB-COMPONENT: ACHIEVEMENT CARD ---
const AchievementCard = ({ onClose, onQuizStart }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-500">
    <div className="relative bg-slate-900 border border-blue-500/30 p-10 rounded-[3rem] max-w-sm w-full text-center shadow-[0_0_50px_-10px_rgba(59,130,246,0.5)] animate-in zoom-in-95 duration-300">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
      >
        <X size={20} />
      </button>

      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
        <Trophy className="text-white w-10 h-10" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-900">
          <CheckCircle2 size={12} className="text-white" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-[1px] w-8 bg-slate-700"></div>
        <span className="text-blue-400 font-black text-sm uppercase tracking-[0.3em]">100% Đã Học</span>
        <div className="h-[1px] w-8 bg-slate-700"></div>
      </div>

      <h2 className="text-xl font-bold text-white mb-8 leading-tight">
        Sẵn sàng thử thách <br /> làm trắc nghiệm nào!
      </h2>

      <button
        onClick={onQuizStart}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
      >
        Làm Quiz ngay <ArrowRight size={18} />
      </button>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function LearningView() {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [maxProgress, setMaxProgress] = useState(0);
  const [material, setMaterial] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Chào bạn! Mình là trợ lý AI QuizVibe. Bạn có thắc mắc gì về nội dung bài học này không?' }
  ]);

  // Refs
  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);
  const endOfContentRef = useRef(null);

  // 1. Load Initial Data
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const res = await api.post('/api/edu/materials/list');
        const found = res.data?.data?.find(m => m.id.toString() === id);
        if (found) {
          const toc = (found.content || '').split('\n')
            .filter(l => l.trim().startsWith('##'))
            .map((l, i) => ({ id: `sec-${i + 1}`, title: l.replace('##', '').trim() }));

          setMaterial({
            title: found.title,
            content: found.content || '',
            summary: found.description?.split('.').filter(s => s.trim()) || [],
            toc
          });

          const pRes = await api.get(`/api/edu/learning/progress/${id}`);
          if (pRes.data?.progress) setMaxProgress(pRes.data.progress);
        }
      } catch (e) { console.error(e); }
    };
    loadData();
    return () => synth.cancel();
  }, [id]);

  // 2. TTS Volume Control
  useEffect(() => {
    if (utteranceRef.current) {
      utteranceRef.current.volume = volume;
      if (isSpeaking) {
        synth.pause();
        synth.resume();
      }
    }
  }, [volume, isSpeaking]);

  // 3. Auto-show Achievement on scroll end
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && maxProgress >= 95) {
        setShowAchievement(true);
      }
    }, { threshold: 0.5 });

    if (endOfContentRef.current) observer.observe(endOfContentRef.current);
    return () => observer.disconnect();
  }, [maxProgress]);

  // --- Handlers ---
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const current = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    if (current > maxProgress) {
      setMaxProgress(current);
      if (current % 10 === 0 || current === 100) {
        api.post('/api/edu/learning/track', { material_id: id, action: 'VIEWED_MATERIAL', progress: current });
      }
    }
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      const text = material.content.replace(/[#*`_]+/g, '');
      const ut = new SpeechSynthesisUtterance(text);
      ut.lang = 'vi-VN';
      ut.volume = volume;
      ut.onend = () => setIsSpeaking(false);
      utteranceRef.current = ut;
      synth.speak(ut);
      setIsSpeaking(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;

    const userMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/edu/chat', { 
        context: material.content, 
        question: userMsg.text 
      });
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
    } catch {
      setChatHistory(prev => [...prev, { sender: 'ai', text: "Lỗi kết nối AI." }]);
    } finally { 
      setIsLoading(false); 
    }
  };

  const generateQuizQuestions = () => {
    return [
      {
        id: 1,
        question: "Trí tuệ nhân tạo (AI) được định nghĩa như thế nào?",
        options: [
          "A. Một công cụ chỉ dùng để tính toán số học",
          "B. Lĩnh vực khoa học máy tính tạo ra máy móc có trí tuệ như con người",
          "C. Phần mềm quản lý cơ sở dữ liệu",
          "D. Công cụ vẽ đồ họa 3D"
        ],
        correct: 1,
        explanation: "AI là lĩnh vực khoa học máy tính hướng tới việc tạo ra các cỗ máy thông minh có khả năng thực hiện các nhiệm vụ đòi hỏi trí tuệ con người."
      },
      {
        id: 2,
        question: "Machine Learning khác với lập trình truyền thống như thế nào?",
        options: [
          "A. Không khác gì, vẫn cần lập trình chi tiết",
          "B. Cho phép hệ thống học từ dữ liệu và cải thiện mà không cần lập trình cụ thể",
          "C. Chỉ dùng để tạo giao diện người dùng",
          "D. Chỉ hoạt động trên máy tính bảng"
        ],
        correct: 1,
        explanation: "Machine Learning tập trung vào việc học từ dữ liệu và cải thiện hiệu suất theo thời gian mà không cần được lập trình cụ thể."
      },
      {
        id: 3,
        question: "Deep Learning lấy cảm hứng từ bộ phận nào của con người?",
        options: ["A. Tim mạch", "B. Não bộ và mạng nơ-ron", "C. Hệ tiêu hóa", "D. Hệ cơ xương khớp"],
        correct: 1,
        explanation: "Deep Learning sử dụng mạng nơ-ron nhân tạo lấy cảm hứng từ cấu trúc và hoạt động của não bộ con người."
      },
      {
        id: 4,
        question: "Deep Learning đặc biệt hiệu quả trong lĩnh vực nào?",
        options: [
          "A. Chỉ xử lý văn bản thuần túy",
          "B. Nhận dạng hình ảnh, giọng nói và ngôn ngữ tự nhiên",
          "C. Chỉ tính toán số học cơ bản",
          "D. Chỉ tạo biểu đồ thống kê"
        ],
        correct: 1,
        explanation: "Deep Learning xuất sắc trong nhận dạng hình ảnh, xử lý giọng nói và ngôn ngữ tự nhiên nhờ khả năng học từ dữ liệu phức tạp."
      },
      {
        id: 5,
        question: "Ví dụ nào sau đây KHÔNG phải là ứng dụng thực tế của AI?",
        options: [
          "A. Trợ lý ảo như Siri, Alexa",
          "B. Gợi ý sản phẩm trên Netflix, Amazon",
          "C. Máy in laser thông thường",
          "D. Hỗ trợ chẩn đoán bệnh trong y tế"
        ],
        correct: 2,
        explanation: "Máy in laser thông thường không sử dụng AI, trong khi các ứng dụng khác đều tận dụng công nghệ trí tuệ nhân tạo."
      }
    ];
  };

  if (!material) return <div className="h-screen flex items-center justify-center bg-slate-950 text-blue-500 font-bold animate-pulse">Đang tải nội dung...</div>;

  return (
    <div className="h-dvh flex flex-col bg-[#020617] text-slate-50 overflow-hidden relative">
      <AnimatedBackground />

      {/* HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl flex items-center px-6 justify-between z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><ArrowLeft size={18} /></Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 line-clamp-1 max-w-[150px]">{material.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all text-slate-400 hover:text-white">
              <Video size={14} /> Video
            </button>
            <button
              onClick={handleReadAloud}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${isSpeaking ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {isSpeaking ? <PauseCircle size={14} /> : <Volume2 size={14} />} Audio
            </button>
            <button className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all text-slate-400 hover:text-white">
              <Download size={14} /> Tải về
            </button>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
              <Volume2 size={12} className="text-slate-500" />
              <input
                type="range" min="0" max="1" step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-blue-500 appearance-none bg-slate-800 rounded-full cursor-pointer hover:accent-blue-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="text-slate-400 hover:text-white font-bold">-</button>
              <span className="text-blue-500 font-mono text-[10px] font-black">{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(30, f + 2))} className="text-slate-400 hover:text-white font-bold">+</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 min-h-0 z-10">
        {/* LEFT COLUMN: LESSON CONTENT */}
        <div className="flex-[2] bg-slate-900/60 border border-slate-800 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
            <h2 className="font-bold flex items-center gap-2 text-slate-100"><FileText size={18} className="text-blue-400" /> Nội dung bài học</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{maxProgress}% HOÀN THÀNH</span>
              <button onClick={() => setShowToc(!showToc)} className={`p-2 rounded-lg transition-all ${showToc ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}><List size={16} /></button>
            </div>
          </div>
          <div className="h-1 bg-slate-800">
            <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300" style={{ width: `${maxProgress}%` }} />
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth relative" onScroll={handleScroll}>
            {showToc && (
              <div className="absolute left-6 top-6 w-60 bg-slate-900 border border-slate-700 rounded-2xl p-3 z-20 shadow-2xl animate-in fade-in slide-in-from-left-2">
                {material.toc.map(t => (
                  <button key={t.id} onClick={() => { document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }); setShowToc(false); }} className="w-full text-left p-2.5 text-xs text-slate-400 hover:text-white hover:bg-blue-600/20 rounded-lg mb-1 transition-all">{t.title}</button>
                ))}
              </div>
            )}
            <article style={{ fontSize: `${fontSize}px` }} className="prose prose-invert max-w-none leading-relaxed prose-headings:text-white prose-p:text-slate-300">
              <h1 className="text-4xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{material.title}</h1>
              <ReactMarkdown>{material.content}</ReactMarkdown>
              <div ref={endOfContentRef} className="h-20 w-full mt-10 border-t border-slate-800/50 flex items-center justify-center opacity-30">
                <CheckCircle2 size={32} className="text-blue-500 animate-pulse" />
              </div>
            </article>
          </div>
        </div>

        {/* RIGHT COLUMN: AI CHAT & SUMMARY */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl min-w-[360px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'chat' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Hỏi AI</button>
              <button onClick={() => setActiveTab('summary')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'summary' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Tóm tắt</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm max-w-[90%] shadow-sm ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>{m.text}</div>
                  </div>
                ))}
                {isLoading && <div className="flex items-center gap-2 text-[10px] text-blue-400 animate-pulse font-black uppercase tracking-widest"><BrainCircuit size={14} /> AI đang suy nghĩ...</div>}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-[2rem]">
                  <h3 className="text-amber-500 font-black text-[10px] uppercase mb-4 flex items-center gap-2 tracking-widest"><Lightbulb size={14} /> Nội dung cốt lõi</h3>
                  <ul className="space-y-3">
                    {material.summary.map((s, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-amber-500 font-bold">✦</span>{s}</li>)}
                  </ul>
                </div>
                
                {/* Logic Group: Quiz Buttons */}
                <div className="space-y-3">
                  <button onClick={() => navigate('/quiz/start', { state: { materialId: id, topic: material.content } })} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all">
                    <GraduationCap size={20} className="inline mr-2" /> Làm trắc nghiệm ngay
                  </button>
                  
                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                    <p className="text-sm font-medium text-blue-300/80 mb-3">Sẵn sàng để thử thách kiến thức?</p>
                    <button
                      onClick={() => {
                        const generatedQuestions = generateQuizQuestions();
                        navigate('/quiz-play', { state: { questions: generatedQuestions } });
                      }}
                      className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 font-bold rounded-xl transition-colors text-sm"
                    >
                      Sinh thêm 5 câu Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'chat' && (
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 focus-within:border-blue-500/50 transition-all">
                <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Nhập câu hỏi cho AI..." className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-700" />
                <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:scale-90 transition-all shadow-lg"><Send size={16} /></button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* POPUP THÀNH TÍCH */}
      {showAchievement && (
        <AchievementCard
          onClose={() => setShowAchievement(false)}
          onQuizStart={() => navigate('/quiz/start', { state: { materialId: id, topic: material.content } })}
        />
      )}
      <Footer />
    </div>
  );
}