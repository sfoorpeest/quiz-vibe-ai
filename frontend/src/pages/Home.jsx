import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, Users, Trophy, ArrowRight, Play, Star, LogOut, User, ChevronDown, Settings, Key, UploadCloud, FileText, CheckCircle, Plus, Search, Clock } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
export default function Home() {
  const navigate = useNavigate();
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
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5 uppercase tracking-wider">
                            {user.role_id === 3 ? 'Quản trị viên' : user.role_id === 2 ? 'Giáo viên' : 'Học sinh'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('#profile'); // Tạm thời để anchor
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group focus:outline-none"
                      >
                        <User className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        Hồ sơ cá nhân
                      </button>

                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/change-password');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group focus:outline-none"
                      >
                        <Key className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        Đổi mật khẩu
                      </button>

                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('#settings'); // Tạm thời để anchor
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group focus:outline-none"
                      >
                        <Settings className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform duration-300" />
                        Cài đặt hệ thống
                      </button>
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

      {/* Main Content Area */}
      {!user ? (
        <>
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
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300 fill-mode-both">
                <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 transition-all active:scale-95 text-lg">
                  Bắt đầu học ngay
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
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
        </>
      ) : (user.role_id === 2 || user.role_id === 3) ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* === TEACHER DASHBOARD === */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-50">Chào mừng Thầy/Cô, {user.name}</h1>
              <p className="text-slate-400 mt-2 text-lg">Hôm nay Thầy/Cô muốn chuẩn bị tài liệu gì mới?</p>
            </div>
            <Link to="/upload" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              <UploadCloud className="w-5 h-5" />
              Tải lên Học liệu
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-md hover:border-blue-500/40 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Tổng Học Liệu</p>
                  <h3 className="text-3xl font-bold text-white mt-2">12</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-md hover:border-purple-500/40 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Số Bài Quiz</p>
                  <h3 className="text-3xl font-bold text-white mt-2">8</h3>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <BrainCircuit className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-md hover:border-emerald-500/40 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Lượt Tương tác</p>
                  <h3 className="text-3xl font-bold text-white mt-2">156</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              Học liệu gần đây
            </h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">Xem toàn bộ</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Materials */}
            {[1, 2].map((item) => (
              <div key={item} className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 hover:border-blue-500/50 transition-all rounded-2xl p-5 group cursor-pointer flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-slate-100 font-bold line-clamp-1 group-hover:text-blue-400 transition-colors">Vật lý Đại cương - Lược sử thời gian</h4>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Hôm qua, 14:30</p>
                  </div>
                </div>
                <div className="mt-auto border-t border-slate-700/50 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-md">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã tóm tắt AI
                    </span>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add New Card */}
            <Link to="/upload" className="bg-slate-800/20 border-2 border-slate-700 border-dashed hover:border-blue-500/50 hover:bg-slate-800/40 transition-all rounded-2xl p-5 flex flex-col items-center justify-center min-h-[160px] text-slate-400 hover:text-blue-400 cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-bold">Tải thêm học liệu mới</p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* === STUDENT DASHBOARD === */}
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">Sẵn sàng chinh phục kiến thức, {user.name || 'bạn'}! 🚀</h1>
            <p className="text-slate-400 mt-3 text-lg">Hôm nay là một ngày tuyệt vời để khám phá điều mới.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Progress Card */}
            <div className="lg:col-span-2 bg-linear-to-br from-blue-900/40 to-violet-900/40 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <BrainCircuit className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg uppercase tracking-wider">Đang xem dở</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 relative z-10 drop-shadow-sm">Nhập môn Trí tuệ Nhân tạo cơ bản</h2>
              <p className="text-blue-200/80 text-sm mb-8 max-w-md relative z-10 line-clamp-2">Tìm hiểu về Machine Learning, Deep Learning và cách AI thay đổi thế giới. Bạn đã đọc được 60% bản tóm tắt.</p>
              
              <div className="mb-8 relative z-10 max-w-md">
                <div className="flex justify-between text-sm font-bold text-slate-200 mb-2">
                  <span>Tiến độ học tập</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-linear-to-r from-blue-500 to-cyan-400 h-full rounded-full shadow-[0_0_10px_theme(colors.blue.500)]" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <button className="relative z-10 flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 active:scale-95 w-full sm:w-auto">
                <Play className="w-5 h-5 fill-current" />
                Tiếp tục bài học
              </button>
            </div>

            {/* User Stats Card */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 flex flex-col justify-center">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 text-center sm:text-left">Hồ sơ Của Bạn</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white leading-none">12</p>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Khóa/Bài đã học</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <Trophy className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white leading-none">8.5</p>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Điểm trung bình Quiz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
              Gợi ý cho bạn
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Tìm kiếm bài học..." className="w-full bg-slate-900/80 border border-slate-700 font-medium rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full shadow-lg shadow-black/20">
                <div className="flex justify-between items-start mb-5">
                  <span className="px-3 py-1 bg-violet-500/10 text-violet-300 text-xs font-bold rounded-md">Chủ đề {item}</span>
                  <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <h4 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-blue-300 transition-colors">Phân tích tác phẩm Truyện Kiều</h4>
                <p className="text-slate-400 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">Bộ tài liệu tổng hợp các phân tích chuyên sâu về nhân vật, nghệ thuật và giá trị hiện thực mà AI đã trích xuất lại một cách dễ hiểu nhất.</p>
                <div className="mt-auto flex items-center justify-between border-t border-slate-700/60 pt-5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1.5 rounded-md">
                    <Clock className="w-3.5 h-3.5" /> ~15p đọc
                  </span>
                  <Link to={`/learn/${item}`} className="text-blue-400 text-sm font-bold flex items-center gap-1.5 group-hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg">
                    Vào học <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


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
      {/* Nút Xem kết quả (do user tự chèn) */}
      <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative', zIndex: 10 }}>
        <button 
          onClick={() => navigate('/result')}
          style={{
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Nộp bài & Xem kết quả ngay 🚀
        </button>
      </div>

    </div>
  );
}
