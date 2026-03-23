import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BrainCircuit, Users, Trophy, ArrowRight, Play, Star, LogOut, User, ChevronDown, Settings, Key } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative min-h-screen font-sans text-slate-50">
      
      {/* Background layer spanning the whole page */}
      <AnimatedBackground />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/70 backdrop-blur-xl border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-blue-700 to-violet-600 bg-clip-text text-transparent drop-shadow-sm">
              QuizVibe
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-200 hidden sm:block max-w-[120px] truncate">
                    {user.name || user.fullName || 'Người dùng'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    
                    {/* User Info Header */}
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-md shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-base font-extrabold text-white truncate">
                            {user.name || user.fullName || 'Người dùng'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                            {user.email || 'Thành viên QuizVibe'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Actions */}
                    <div className="p-2 space-y-1">
                      <Link 
                        to="#profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group"
                      >
                        <User className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        Hồ sơ cá nhân
                      </Link>
                      <Link 
                        to="#password" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group"
                      >
                        <Key className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        Đổi mật khẩu
                      </Link>
                      <Link 
                        to="#settings" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group"
                      >
                        <Settings className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform duration-300" />
                        Cài đặt hệ thống
                      </Link>
                    </div>
                    
                    {/* Logout Footer */}
                    <div className="p-2 border-t border-slate-700 bg-slate-900/30">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group focus:outline-none"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Đăng xuất ngay
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-200 hover:text-blue-400 transition-colors px-2 py-1">
                  Đăng nhập
                </Link>
                <Link to="/register" className="text-sm font-bold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 shadow-lg shadow-blue-600/20">
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex items-center min-h-[85vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/70 backdrop-blur-xl border border-blue-500/30 text-blue-300 text-sm font-medium mb-8 shadow-sm">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Nền tảng học tập thông minh số 1</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-slate-50 drop-shadow-sm">
            Làm chủ kiến thức cùng <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-600 via-blue-600 to-violet-600 animate-pulse-slow drop-shadow-sm"> AI Học Tập</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed font-medium">
            Hệ thống bài tập trực quan, cá nhân hoá qua từng vòng học. Giúp bạn nhớ nhanh, hiểu sâu, và đạt điểm tối đa một cách nhẹ nhàng.
          </p>
          
          {user && (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300 fill-mode-both">
              <Link to="#" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 transition-all active:scale-95 text-lg">
                Bắt đầu học ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="#features" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800/90 backdrop-blur-xl text-blue-300 px-8 py-4 rounded-xl font-semibold border border-slate-700 hover:border-slate-600 hover:bg-slate-800 shadow-xl transition-all text-lg">
                <Play className="w-5 h-5" />
                Tạo quiz
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        {/* Transparent background to show animated bg beneath */}
        <div className="absolute inset-0 bg-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 text-slate-50 drop-shadow-sm">Tính năng nổi bật</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Trải nghiệm phương pháp học tập tương tác, chủ động và mang lại kết quả vượt trội so với cách học truyền thống.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-slate-900/70 backdrop-blur-2xl p-8 rounded-4xl border border-slate-700/50 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-inner border border-slate-700/50">
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-50">Thư viện câu hỏi đa dạng</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                Hàng ngàn câu hỏi trắc nghiệm được biên soạn kỹ lưỡng bám sát chương trình, tích hợp sẵn lời giải chi tiết.
              </p>
            </div>

            <div className="group bg-slate-900/70 backdrop-blur-2xl p-8 rounded-4xl border border-slate-700/50 shadow-xl shadow-violet-500/5 hover:shadow-2xl hover:shadow-violet-500/15 hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 shadow-inner border border-slate-700/50">
                <Trophy className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-50">Học qua thử thách</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                Tham gia các vòng thi đấu hấp dẫn, leo rank bảng xếp hạng, biến việc học trở thành trò chơi cực kỳ thú vị.
              </p>
            </div>

            <div className="group bg-slate-900/70 backdrop-blur-2xl p-8 rounded-4xl border border-slate-700/50 shadow-xl shadow-cyan-500/5 hover:shadow-2xl hover:shadow-cyan-500/15 hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-inner border border-slate-700/50">
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-50">Cộng đồng sôi nổi</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                Trao đổi tài liệu, giải đáp thắc mắc cùng hàng ngàn học sinh và chuyên gia khắp cả nước mọi lúc mọi nơi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-transparent py-12 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0 hover:opacity-80 transition-opacity cursor-pointer">
            <BrainCircuit className="text-blue-400 w-6 h-6" />
            <span className="text-xl font-bold text-slate-50">QuizVibe</span>
          </div>
          <p className="text-slate-400 text-sm font-semibold">
            © {new Date().getFullYear()} QuizVibe. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-semibold">Điều khoản</a>
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-semibold">Bảo mật</a>
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-semibold">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
