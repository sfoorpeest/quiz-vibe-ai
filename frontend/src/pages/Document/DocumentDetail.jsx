import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Dùng useNavigate để đi tới trang Quiz
import { 
  ArrowLeft, Sparkles, Trophy, Loader2, BookOpen, Clock, Star, 
  Video, Volume2, Download, GraduationCap, MessageSquare, 
  List, Globe, PauseCircle, X
} from 'lucide-react';
import api from '../../api/axiosClient';
import ReactMarkdown from 'react-markdown';

import ChatbotSection from '../../components/Document/ChatbotSection';
import AchievementCard from '../../components/Document/AchievementCard';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // Hook để chuyển trang
  const [material, setMaterial] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [showAchievement, setShowAchievement] = useState(false);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  
  // Logic Audio & Volume
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);
  const contentContainerRef = useRef(null);

  useEffect(() => {
    const loadMaterial = async () => {
      try {
        setIsLoading(true);
        const res = await api.post('/api/edu/materials/list');
        if (res.data?.data) {
          const found = res.data.data.find(m => m.id.toString() === id);
          if (found) {
            setMaterial({ ...found, author: found.creator_name || 'Nguyễn Văn Lâm', readTime: '15 phút' });
          }
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    loadMaterial();
    return () => synth.cancel(); // Tắt voice khi chuyển trang
  }, [id]);

  // Đồng bộ âm lượng khi đang đọc
  useEffect(() => {
    if (isSpeaking && utteranceRef.current) {
      // Vì speechSynthesis không cho đổi volume giữa chừng dễ dàng, 
      // ta cần dừng lại và đọc tiếp với volume mới hoặc set trực tiếp (tùy trình duyệt)
      utteranceRef.current.volume = volume;
    }
  }, [volume, isSpeaking]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !hasFinishedReading) {
      setHasFinishedReading(true);
      setShowAchievement(true);
    }
  };

  const handleToggleAudio = () => {
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      if (!material?.content) return;
      const textToRead = material.content.replace(/[#*`]/g, '');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'vi-VN';
      utterance.volume = volume; // Đồng bộ volume từ thanh kéo
      utterance.onend = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      synth.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // HÀM QUAN TRỌNG: Đi tới trang làm Quiz (giữ logic từ App.jsx cũ của bạn)
  const handleGoToQuiz = () => {
    // Giả sử route cũ của bạn là /quiz/:id hoặc tương tự
    navigate(`/quiz/${id}`); 
  };

  if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></Link>
            {/* Chỉnh chữ tiêu đề nhỏ lại một xíu theo ý bạn */}
            <h1 className="font-bold text-[13px] uppercase tracking-tight text-slate-400 truncate max-w-xs">{material?.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold"><Video size={16}/> Video</button>
              
              {/* Thanh Audio đồng bộ */}
              <div className="flex items-center px-2 gap-3 border-l border-slate-800">
                <button 
                  onClick={handleToggleAudio}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isSpeaking ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                >
                  {isSpeaking ? <PauseCircle size={16}/> : <Volume2 size={16}/>} Audio
                </button>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold"><Download size={16}/> Tải về</button>
            </div>

            {/* Chỉnh cỡ chữ - Giữ nguyên */}
            <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] font-black uppercase">Size</span>
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="hover:text-white px-2">-</button>
              <span className="text-white font-mono text-sm w-4 text-center">{fontSize}</span>
              <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="hover:text-white px-2">+</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <div className="lg:col-span-8">
          <div 
            ref={contentContainerRef}
            onScroll={handleScroll}
            className="bg-[#0f172a]/95 rounded-[2.5rem] border border-slate-800 p-8 md:p-14 h-[82vh] overflow-y-auto custom-scrollbar"
          >
            <article className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black text-white mb-6">{material?.title}</h2>
              <div style={{ fontSize: `${fontSize}px` }} className="prose prose-invert max-w-none leading-[1.8] text-slate-300">
                <ReactMarkdown>{material?.content}</ReactMarkdown>
              </div>
            </article>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 h-[82vh]">
          {/* Chatbox & Summary */}
          <div className="bg-[#0f172a]/95 rounded-[2.5rem] border border-slate-800 flex-1 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 flex gap-2">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'chat' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                >Hỏi AI</button>
                <button 
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'summary' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                >Tóm tắt</button>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'chat' ? <ChatbotSection content={material?.content} /> : (
                  <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/20">
                    <h4 className="text-amber-500 font-black text-[10px] uppercase mb-2">Ý chính</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{material?.description || "Chưa có tóm tắt."}</p>
                  </div>
                )}
             </div>
             
             {/* Nút SINH 5 CÂU QUIZ - Đã kết nối logic điều hướng */}
             <div className="p-4 bg-slate-900/50">
                <button 
                  onClick={handleGoToQuiz}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                >
                  <GraduationCap size={18} /> Sinh 5 câu Quiz AI
                </button>
             </div>
          </div>
        </div>
      </main>

      {/* Modal thành tích */}
      {showAchievement && (
        <AchievementCard 
          onClose={() => setShowAchievement(false)} 
          onContinue={() => setShowAchievement(false)} 
        />
      )}
    </div>
  );
}