import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Play, Heart, CheckCircle2, ArrowRight, Search, X, Bookmark, TrendingUp, Star } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════
import { materialService } from '../services/materialService';

// ═══════════════════════════════════════════════════════════
// MOCK DATA for missing fields pending backend update 
// ═══════════════════════════════════════════════════════════
const MOCK_STATS = { totalLessons: 12, totalHours: 45 };

const MOCK_CONTINUE_LESSON = {
  id: 101,
  title: 'Lịch sử thế giới thời cận đại — Chương 3: Cách mạng Công nghiệp',
  description: 'Tìm hiểu sâu về cuộc Cách mạng Công nghiệp lần thứ nhất tại Anh và ảnh hưởng lan rộng toàn cầu.',
  author: 'Thầy Nguyễn Văn An',
  authorAvatar: 'https://i.pravatar.cc/150?u=teacher-an',
  progress: 65,
  updatedAt: '2 giờ trước',
};

const TABS = [
  { key: 'all', label: 'Tất cả', icon: BookOpen },
  { key: 'learning', label: 'Đang học', icon: Play },
  { key: 'done', label: 'Đã xong', icon: CheckCircle2 },
  { key: 'favorite', label: 'Yêu thích', icon: Heart },
];

export default function MyLessons() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const res = await materialService.getMyLessons();
        const apiLessons = (res.data || []).map(m => ({
          id: m.id,
          title: m.title || 'Bài học',
          author: 'Hệ thống / Giảng viên', // Temporary mock as DB lacks creator relation via user_materials currently
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('HT')}&background=0D8ABC&color=fff`,
          progress: Math.floor(Math.random() * 100), // Random mock
          status: Math.random() > 0.5 ? 'learning' : 'done', // Random mock
          isFavorite: false,
          updatedAt: new Date(m.created_at).toLocaleDateString('vi-VN')
        }));
        setLessons(apiLessons);
      } catch (err) {
        console.error("Failed to fetch my lessons:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchLessons();
    }
  }, [user]);

  // Filter logic
  const filteredLessons = lessons.filter(lesson => {
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'learning' && lesson.status === 'learning') ||
      (activeTab === 'done' && lesson.status === 'done') ||
      (activeTab === 'favorite' && lesson.isFavorite);
    const matchSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  // Progress bar color
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (progress >= 50) return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]';
    return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
  };

  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10 pt-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 w-full">

        {/* ═══ HEADER: Chào mừng + Stats ═══ */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Không gian học tập
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">
              Hành trình của bạn, {user?.name || 'Học viên'} ✨
            </h1>
            <p className="text-slate-400 mt-2 text-base">Tiếp tục chinh phục những kiến thức mới mẻ mỗi ngày.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-lg">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{MOCK_STATS.totalLessons}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Bài đã học</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-lg">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{MOCK_STATS.totalHours}h</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Giờ học</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ HERO: Bài đang học dở — Wide Horizontal Banner ═══ */}
        {MOCK_CONTINUE_LESSON && (
          <div className="mb-12 group">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900/80 via-cyan-950/30 to-slate-900/80 backdrop-blur-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-500 shadow-xl shadow-black/30 hover:shadow-[0_0_40px_rgba(0,255,255,0.08)]">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row items-stretch">
                {/* Left: Info (60%) */}
                <div className="flex-3 p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-lg uppercase tracking-wider">Đang xem dở</span>
                    <span className="text-slate-500 text-xs font-bold">{MOCK_CONTINUE_LESSON.updatedAt}</span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3 leading-tight group-hover:text-cyan-50 transition-colors">
                    {MOCK_CONTINUE_LESSON.title}
                  </h2>
                  <p className="text-slate-400 text-sm mb-6 max-w-xl leading-relaxed">
                    {MOCK_CONTINUE_LESSON.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={MOCK_CONTINUE_LESSON.authorAvatar} className="w-8 h-8 rounded-full border-2 border-slate-700 shadow-md" alt="avatar" />
                    <span className="text-xs font-bold text-slate-300">{MOCK_CONTINUE_LESSON.author}</span>
                  </div>
                </div>

                {/* Right: Progress + CTA (40%) */}
                <div className="flex-2 p-8 lg:p-10 flex flex-col justify-center items-center lg:items-end border-t lg:border-t-0 lg:border-l border-cyan-500/10">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm font-bold text-slate-200 mb-3">
                      <span>Tiến độ học tập</span>
                      <span className="text-cyan-400">{MOCK_CONTINUE_LESSON.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden shadow-inner mb-8">
                      <div
                        className="bg-linear-to-r from-cyan-500 to-blue-400 h-full rounded-full shadow-[0_0_12px_rgba(6,182,212,0.5)] transition-all duration-1000"
                        style={{ width: `${MOCK_CONTINUE_LESSON.progress}%` }}
                      ></div>
                    </div>
                    <button
                      onClick={() => navigate(`/learn/${MOCK_CONTINUE_LESSON.id}`)}
                      className="w-full flex items-center justify-center gap-2.5 bg-linear-to-r from-cyan-500 to-blue-500 text-slate-950 px-8 py-4 rounded-2xl font-extrabold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] active:scale-[0.97] text-base"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Tiếp tục bài học
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FILTER BAR: Tabs + Search ═══ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          {/* Pill Tabs */}
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/50">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const count = tab.key === 'all' ? lessons.length
                : tab.key === 'favorite' ? lessons.filter(l => l.isFavorite).length
                : lessons.filter(l => l.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className={`w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-cyan-400' : 'text-slate-500'} transition-colors`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học, giảng viên..."
              className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 font-medium rounded-xl pl-11 pr-10 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ═══ LIST VIEW — Row-based (Spotify-style for Desktop) ═══ */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[auto_1fr_140px_100px_120px] items-center gap-4 px-6 py-3 border-b border-slate-700/30 text-[11px] font-black text-slate-500 uppercase tracking-widest">
            <span className="w-10"></span>
            <span>Tên bài học</span>
            <span className="text-center">Tiến độ</span>
            <span className="text-center">Cập nhật</span>
            <span className="text-right">Hành động</span>
          </div>

          {/* Lesson Rows */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold">Đang tải...</p>
            </div>
          ) : filteredLessons.length > 0 ? (
            filteredLessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/learn/${lesson.id}`)}
                className={`group grid grid-cols-1 md:grid-cols-[auto_1fr_140px_100px_120px] items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-slate-800/60 ${
                  idx < filteredLessons.length - 1 ? 'border-b border-slate-800/30' : ''
                }`}
              >
                {/* Avatar */}
                <div className="hidden md:flex">
                  <img
                    src={lesson.authorAvatar}
                    alt={lesson.author}
                    className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors shadow-md"
                  />
                </div>

                {/* Title + Author */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                      {lesson.title}
                    </h4>
                    {lesson.isFavorite && <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />}
                    {lesson.progress >= 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <img src={lesson.authorAvatar} className="w-4 h-4 rounded-full md:hidden" alt="" />
                    {lesson.author}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getProgressColor(lesson.progress)}`}
                      style={{ width: `${lesson.progress}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-bold min-w-[32px] text-right ${lesson.progress >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {lesson.progress}%
                  </span>
                </div>

                {/* Updated At */}
                <div className="hidden md:flex justify-center">
                  <span className="text-xs text-slate-500 font-medium">{lesson.updatedAt}</span>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/learn/${lesson.id}`); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      lesson.progress >= 100
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : lesson.progress > 0
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {lesson.progress >= 100 ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Xem lại</>
                    ) : lesson.progress > 0 ? (
                      <><Play className="w-3.5 h-3.5" /> Học tiếp</>
                    ) : (
                      <><Bookmark className="w-3.5 h-3.5" /> Bắt đầu</>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-lg mb-1">Không tìm thấy bài học nào</p>
              <p className="text-slate-500 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}
