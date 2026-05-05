import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Sparkles, ArrowRight, Clock, CheckCircle2, XCircle, Search, History, Zap, Target, BookOpen } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { eduService } from '../services/eduService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';



export default function Practice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promptValue, setPromptValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    fetchHistory();
    fetchCategories();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await profileService.getQuizHistory();
      setHistory(data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const tags = await eduService.getTags();
      setCategories(tags.slice(0, 8));
    } catch (error) {
      setCategories([]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const topic = promptValue.trim();
    if (!topic) return;

    setIsGenerating(true);
    try {
      const quizData = await eduService.generateQuiz({
        topic,
        limit: 5
      });

      navigate('/quiz/start', { state: { topic, quizData } });
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert(error?.response?.data?.message || 'Không thể tạo quiz lúc này. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickCategory = (label) => {
    setPromptValue(`Tạo 5 câu trắc nghiệm về ${label}`);
  };

  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10 pt-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 w-full">

        {/* ═══ CENTER HERO: AI Prompt Form ═══ */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-bold mb-6">
            <BrainCircuit className="w-4 h-4" />
            AI-Powered Practice
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-50 mb-4 leading-tight">
            Luyện tập với
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-violet-400"> Trí tuệ Nhân tạo</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Nhập chủ đề bạn muốn ôn tập, AI sẽ tạo bài kiểm tra trắc nghiệm tùy chỉnh ngay lập tức.
          </p>

          {/* Big Prompt Input */}
          <form onSubmit={handleGenerate} className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-purple-600/20 via-violet-600/20 to-blue-600/20 rounded-3xl blur-xl group-focus-within:blur-2xl group-focus-within:opacity-100 opacity-60 transition-all duration-500 pointer-events-none"></div>
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-2xl border border-purple-500/20 group-focus-within:border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/5 transition-all">
              <Sparkles className="w-6 h-6 text-purple-400 ml-5 shrink-0" />
              <input
                type="text"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder="Bạn muốn luyện tập nội dung gì hôm nay? (VD: 5 câu trắc nghiệm Sinh 12 chương 1)..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 px-4 py-5 text-base font-medium focus:outline-none"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!promptValue.trim() || isGenerating}
                className="mr-3 flex items-center gap-2 bg-linear-to-r from-purple-600 to-violet-600 disabled:from-slate-700 disabled:to-slate-700 text-white px-6 py-3 rounded-xl font-extrabold transition-all hover:from-purple-500 hover:to-violet-500 active:scale-95 shadow-lg shadow-purple-500/20 disabled:shadow-none disabled:text-slate-500"
              >
                {isGenerating ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang tạo...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Tạo Quiz</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ═══ QUICK CATEGORIES ═══ */}
        <div className="max-w-3xl mx-auto mb-16">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 text-center">⚡ Gợi ý luyện tập nhanh</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {categories.map(tag => (
              <button
                key={tag}
                onClick={() => handleQuickCategory(tag)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/40 rounded-xl text-sm font-bold text-slate-300 hover:text-purple-300 transition-all hover:bg-slate-800/80 active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ QUIZ HISTORY TABLE ═══ */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-50 flex items-center gap-2.5">
              <History className="w-5 h-5 text-purple-400" />
              Lịch sử luyện tập
            </h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{history.length} bài đã làm</span>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Đang tải lịch sử...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <History className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-slate-300 font-bold mb-1">Chưa có lịch sử luyện tập</h3>
                <p className="text-slate-500 text-sm max-w-xs">Hãy thử tạo một bài Quiz bằng AI ở trên để bắt đầu hành trình chinh phục kiến thức!</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-[1fr_100px_80px_120px_100px] items-center gap-4 px-6 py-3 border-b border-slate-700/30 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Chủ đề</span>
                  <span className="text-center">Kết quả</span>
                  <span className="text-center">Điểm</span>
                  <span className="text-center">Thời gian</span>
                  <span className="text-right">Trạng thái</span>
                </div>

                {history.map((quiz, idx) => {
                  const correct = Number(quiz.correctCount || 0);
                  const wrong = Number(quiz.wrongCount || 0);
                  const total = correct + wrong;
                  const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
                  const passed = scorePercentage >= 60;
                  const timeAgo = quiz.date ? formatDistanceToNow(new Date(quiz.date), { addSuffix: true, locale: vi }) : 'Vừa xong';

                  return (
                    <div
                      key={idx}
                      className={`group grid grid-cols-1 md:grid-cols-[1fr_100px_80px_120px_100px] items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-slate-800/60 ${
                        idx < history.length - 1 ? 'border-b border-slate-800/30' : ''
                      }`}
                    >
                      {/* Topic */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                          {quiz.materialTitle || 'Bài luyện tập tự do'}
                        </h4>
                      </div>

                      {/* Result */}
                      <div className="flex justify-center">
                        <span className="text-xs font-bold text-slate-400">
                          {correct}/{total}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex justify-center">
                        <span className={`text-sm font-extrabold px-3 py-1 rounded-lg ${
                          scorePercentage >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                          scorePercentage >= 60 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {scorePercentage}%
                        </span>
                      </div>

                      {/* Date */}
                      <div className="hidden md:flex justify-center">
                        <span className="text-xs text-slate-500 font-medium capitalize-first">{timeAgo}</span>
                      </div>

                      {/* Status */}
                      <div className="flex justify-end">
                        {passed ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đạt
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Chưa đạt
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
