import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BrainCircuit, MessageSquare, FileText, 
  Send, Maximize2, Sparkles, BookOpen, Clock, Lightbulb, Loader2,
  ChevronLeft, ChevronRight, List, CheckCircle2
} from 'lucide-react';
import api from '../api/axiosClient';

export default function LearningView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'chat'
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(0); // Để biết đã đọc xa nhất tới đâu
  const [showToc, setShowToc] = useState(false);
  
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Chào bạn! Mình là trợ lý AI QuizVibe được hỗ trợ bởi Google Gemini. Bạn có thắc mắc gì về bài học "Nhập môn Trí tuệ Nhân tạo cơ bản" không?' }
  ]);

  // Mock data for the study material
  const material = {
    title: 'Nhập môn Trí tuệ Nhân tạo cơ bản',
    author: 'AI Generated',
    readTime: '15 phút',
    content: `
      Trí tuệ nhân tạo (AI - Artificial Intelligence) không còn là khái niệm của tương lai mà đã trở thành nền tảng của công nghệ hiện đại. 
      Về bản chất, AI là lĩnh vực khoa học máy tính hướng tới việc tạo ra các cỗ máy thông minh có khả năng thực hiện các nhiệm vụ thường đòi hỏi trí tuệ con người.
      
      ## 1. Machine Learning (Học máy) là gì?
      Machine Learning là một tập con của AI, tập trung vào việc cấp quyền cho hệ thống học hỏi từ dữ liệu và cải thiện hiệu suất theo thời gian mà không cần được lập trình cụ thể.
      Dữ liệu đóng vai trò như "thức ăn" cho các thuật toán. Thuật toán càng tiêu thụ nhiều dữ liệu chất lượng, khả năng dự đoán và ra quyết định của nó càng chính xác.

      ## 2. Deep Learning (Học sâu)
      Đây là một kỹ thuật nâng cao của Machine Learning, sử dụng mạng nơ-ron nhân tạo lấy cảm hứng từ não bộ con người. 
      Deep Learning đặc biệt xuất sắc trong nhận dạng hình ảnh, giọng nói và xử lý ngôn ngữ tự nhiên.

      ## 3. Ứng dụng thực tế
      - Trợ lý ảo: Siri, Alexa, Google Assistant.
      - Gợi ý sản phẩm: Thuật toán của Netflix, Amazon.
      - Xe tự lái: Hệ thống nhận diện đường và chướng ngại vật của Tesla.
      - Y tế: Hỗ trợ chẩn đoán bệnh qua hình ảnh y khoa.
    `,
    summary: [
      'AI là việc tạo ra máy móc có trí tuệ như con người.',
      'Machine Learning (Học máy): Máy tự học từ dữ liệu thay vì được lập trình sẵn.',
      'Deep Learning (Học sâu): Phương pháp nâng cao mô phỏng mạng nơ-ron não bộ (nhận diện ảnh, giọng nói).',
      'Ứng dụng bao trùm từ giải trí (Netflix, Siri) đến y tế và xe tự lái.'
    ],
    toc: [
      { id: "sec-1", title: "1. Machine Learning (Học máy) là gì?" },
      { id: "sec-2", title: "2. Deep Learning (Học sâu)" },
      { id: "sec-3", title: "3. Ứng dụng thực tế" }
    ],
    prevLesson: { id: 1, title: 'Tổng quan Khoa học Máy tính' },
    nextLesson: { id: 3, title: 'Tương lai của Trí tuệ Nhân tạo' }
  };

  // Tính toán phần trăm cuộn
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - clientHeight <= 0) {
      setReadingProgress(100);
      setMaxProgress(100);
      return;
    }
    const currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const roundedProgress = Math.min(100, Math.max(0, Math.round(currentProgress)));
    
    setReadingProgress(roundedProgress);
    if (roundedProgress > maxProgress) {
      setMaxProgress(roundedProgress);
      
      // Giả lập lưu API tiến độ người dùng nếu đọc thêm được 10%
      // if (roundedProgress % 10 === 0) api.post('/api/edu/learning/track', ...)
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
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
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-sm font-bold text-slate-200 border border-slate-700">
              <Maximize2 className="w-4 h-4" /> Toàn màn hình
            </button>
            <Link to="/quiz/start" className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-blue-600 to-violet-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-sm font-bold text-white hover:scale-105">
              Làm Quiz ngay <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN 2-COLUMN LAYOUT */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto p-4 sm:p-6 gap-6">
        
        {/* LFET COLUMN: TÀI LIỆU HỌC TẬP */}
        <div className="flex-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                Nội dung chi tiết
                <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md">
                  Tiến độ: {readingProgress}%
                </span>
              </h2>
            </div>
            
            <button 
              onClick={() => setShowToc(!showToc)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${showToc ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <List className="w-4 h-4" /> Mục lục
            </button>
          </div>
          
          {/* Progress bar line under header */}
          <div className="w-full h-1 bg-slate-800 z-10 relative">
            <div className="h-full bg-linear-to-r from-blue-500 to-amber-500 transition-all duration-100" style={{ width: `${readingProgress}%` }}></div>
            <div className="absolute top-0 left-0 h-full bg-slate-500/30 transition-all duration-300" style={{ width: `${maxProgress}%` }}></div>
          </div>
          
          <div className="flex-1 overflow-hidden flex relative">
            
            {/* TOC Sidebar */}
            {showToc && (
              <div className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 flex flex-col absolute left-0 top-0 bottom-0 z-20 animate-in slide-in-from-left-4 fade-in duration-300 shadow-xl">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-slate-200">Mục lục khóa học</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {material.toc.map((item) => (
                    <button key={item.id} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth" onScroll={handleScroll}>
              <div className="prose prose-invert prose-lg max-w-[800px] mx-auto text-slate-300 leading-relaxed font-medium pb-10">
                <h1 className="text-3xl font-extrabold mb-6 bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-violet-400">{material.title}</h1>
                <div className="whitespace-pre-line">{material.content}</div>
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
        <div className="flex-1 min-w-[320px] lg:max-w-[450px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
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
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Sparkles className="w-4 h-4" /> Tóm tắt
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-slate-800 text-violet-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <MessageSquare className="w-4 h-4" /> Hỏi AI
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="flex-1 overflow-y-auto bg-slate-900/50 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            
            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6">
                  <h3 className="flex items-center gap-2 text-amber-400 font-bold mb-3">
                    <Lightbulb className="w-5 h-5" /> Ý chính cốt lõi
                  </h3>
                  <ul className="space-y-4">
                    {material.summary.map((point, index) => (
                      <li key={index} className="flex gap-3 text-slate-300 font-medium text-sm leading-relaxed">
                        <span className="w-6 h-6 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">{index + 1}</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                  <p className="text-sm font-medium text-blue-300/80 mb-3">Sẵn sàng để thử thách kiến thức?</p>
                  <button className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 font-bold rounded-xl transition-colors text-sm">
                    Sinh thêm 5 câu Quiz
                  </button>
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                      <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                        msg.sender === 'user' 
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

      {/* FOOTER */}
      <footer className="h-12 border-t border-slate-800/50 bg-slate-950 flex items-center justify-center text-xs font-bold text-slate-500">
        QuizVibe Learning Ecosystem 2.0
      </footer>

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
