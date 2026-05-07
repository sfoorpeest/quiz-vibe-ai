import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Play, Heart, CheckCircle2, ArrowRight, Search, X, Bookmark, TrendingUp, Star, Edit3, Users } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { eduService } from '../services/eduService';
import { ClipboardList } from 'lucide-react';
import { useItemPreference } from '../context/ItemPreferenceContext';
import { profileService } from '../services/profileService';

// ═══════════════════════════════════════════════════════════
import { materialService } from '../services/materialService';



const TABS = [
  { key: 'all', label: 'Tất cả', icon: BookOpen },
  { key: 'learning', label: 'Đang học', icon: Play },
  { key: 'worksheet', label: 'Phiếu học tập', icon: ClipboardList },
  { key: 'done', label: 'Đã xong', icon: CheckCircle2 },
  { key: 'saved', label: 'Đã lưu', icon: Bookmark },
  { key: 'favorite', label: 'Yêu thích', icon: Heart },
];

const toLessonItem = (material, fallback = {}) => {
  const progress = Number.isFinite(Number(material?.progress))
    ? Number(material.progress)
    : Number.isFinite(Number(material?.reading_progress))
      ? Number(material.reading_progress)
      : 0;

  return {
    id: material?.id,
    type: 'lesson',
    title: material?.title || fallback.title || 'Bài học',
    author: material?.creator_name || fallback.author || 'Giảng viên',
    authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(material?.creator_name || 'GV')}&background=0D8ABC&color=fff`,
    progress,
    status: progress >= 100 ? 'done' : progress > 0 ? 'learning' : 'new',
    isSaved: Boolean(Number(material?.is_saved || 0) || fallback.isSaved),
    isFavorite: Boolean(Number(material?.is_favorite || 0) || fallback.isFavorite),
    updatedAt: new Date(material?.preference_updated_at || material?.created_at || Date.now()).toLocaleDateString('vi-VN')
  };
};

const mergeLessons = (baseLessons = [], savedMaterials = [], favoriteMaterials = []) => {
  const merged = new Map();

  baseLessons.forEach((lesson) => {
    merged.set(String(lesson.id), lesson);
  });

  savedMaterials.forEach((material) => {
    const id = String(material.id);
    const existing = merged.get(id);
    merged.set(id, toLessonItem(material, {
      ...existing,
      isSaved: true,
      isFavorite: existing?.isFavorite,
      title: existing?.title,
      author: existing?.author,
    }));
  });

  favoriteMaterials.forEach((material) => {
    const id = String(material.id);
    const existing = merged.get(id);
    merged.set(id, toLessonItem(material, {
      ...existing,
      isSaved: existing?.isSaved,
      isFavorite: true,
      title: existing?.title,
      author: existing?.author,
    }));
  });

  return [...merged.values()];
};

export default function MyLessons() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lessons, setLessons] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getState, toggleSaved, toggleFavorite, isPending, seedMaterialStates, revision } = useItemPreference();

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lessonsRes, wsRes, groupsRes, savedMaterialsRes, favoriteMaterialsRes] = await Promise.all([
          materialService.getMyLessons(),
          eduService.getAssignedWorksheets(),
          eduService.getStudentGroups(),
          profileService.getSavedMaterials(),
          profileService.getFavoriteMaterials()
        ]);

        const savedMaterials = Array.isArray(savedMaterialsRes) ? savedMaterialsRes : [];
        const favoriteMaterials = Array.isArray(favoriteMaterialsRes) ? favoriteMaterialsRes : [];

        const apiLessons = (lessonsRes.lessons || []).map(m => ({
          id: m.id,
          type: 'lesson',
          title: m.title || 'Bài học',
          author: 'Giảng viên', 
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('GV')}&background=0D8ABC&color=fff`,
          progress: Number.isFinite(Number(m.progress)) ? Number(m.progress) : 0,
          status: Number(m.progress) >= 100 ? 'done' : Number(m.progress) > 0 ? 'learning' : 'new',
          isSaved: Boolean(Number(m.is_saved || 0)),
          isFavorite: Boolean(Number(m.is_favorite || 0)),
          updatedAt: new Date(m.created_at).toLocaleDateString('vi-VN')
        }));

        const apiWorksheets = wsRes.map(w => ({
          id: w.id,
          type: 'worksheet',
          title: w.title || 'Phiếu học tập',
          groupName: w.group_name,
          materialTitle: w.material_title,
          status: 'worksheet',
          updatedAt: new Date(w.created_at).toLocaleDateString('vi-VN')
        }));

        const mergedLessons = mergeLessons(
          apiLessons,
          savedMaterials,
          favoriteMaterials
        );

        setLessons(mergedLessons);
        setWorksheets(apiWorksheets);
        seedMaterialStates(mergedLessons);
        setMyGroups(groupsRes);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  React.useEffect(() => {
    const refreshCollectionRows = async () => {
      if (!user) return;
      try {
        const [savedMaterials, favoriteMaterials] = await Promise.all([
          profileService.getSavedMaterials(),
          profileService.getFavoriteMaterials(),
        ]);

        setLessons((prev) => mergeLessons(
          prev,
          Array.isArray(savedMaterials) ? savedMaterials : [],
          Array.isArray(favoriteMaterials) ? favoriteMaterials : []
        ));
      } catch (err) {
        console.error('Failed to refresh collection rows:', err);
      }
    };

    refreshCollectionRows();
  }, [user, revision]);

  // Filter logic
  const filteredItems = activeTab === 'worksheet'
    ? worksheets.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : lessons.filter(lesson => {
        const pref = getState('material', lesson.id);
        const matchTab =
          activeTab === 'all' ||
          (activeTab === 'learning' && lesson.status === 'learning') ||
          (activeTab === 'done' && lesson.status === 'done') ||
          (activeTab === 'saved' && pref.isSaved) ||
          (activeTab === 'favorite' && pref.isFavorite);
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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">
              Hành trình của bạn, {user?.name || 'Học viên'} ✨
            </h1>
            <p className="text-slate-400 mt-2 text-base">Tiếp tục chinh phục những kiến thức mới mẻ mỗi ngày.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className={`w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-cyan-400' : 'text-slate-500'} transition-colors`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học, giảng viên..."
              className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-700/30 font-medium rounded-xl pl-11 pr-10 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>



        {/* ═══ LỚP HỌC CỦA TÔI (STUDENT GROUPS) ═══ */}
        {myGroups.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-cyan-400" />
              Lớp Học Của Tôi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myGroups.map((group) => (
                <div key={group.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-cyan-500/30 transition-colors">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 mb-1">{group.name}</h3>
                    <p className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md inline-block mb-3 border border-slate-700/50">
                      Giảng viên: <span className="font-semibold text-slate-300">{group.teacher_name}</span>
                    </p>
                    {group.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500 flex items-center justify-between">
                    <span>Đã tham gia</span>
                    <span className="font-medium">{new Date(group.joined_at || group.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
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
                : tab.key === 'worksheet' ? worksheets.length
                : tab.key === 'saved' ? lessons.filter(l => getState('material', l.id).isSaved).length
                : tab.key === 'favorite' ? lessons.filter(l => getState('material', l.id).isFavorite).length
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
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === 'lesson') navigate(`/learn/${item.id}`);
                  else navigate(`/shared/worksheet/${item.id}`);
                }}
                className={`group grid grid-cols-1 md:grid-cols-[auto_1fr_140px_100px_120px] items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-slate-800/60 ${
                  idx < filteredItems.length - 1 ? 'border-b border-slate-800/30' : ''
                }`}
              >
                {/* Icon/Avatar */}
                <div className="hidden md:flex">
                  {item.type === 'lesson' ? (
                    <img
                      src={item.authorAvatar}
                      alt={item.author}
                      className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Title + Author */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                      {item.title}
                    </h4>
                    {item.type === 'lesson' && getState('material', item.id).isFavorite && <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />}
                    {item.progress >= 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.type === 'lesson' ? item.author : `Lớp: ${item.groupName}`}
                  </p>
                  {item.type === 'worksheet' && (
                    <p className="text-[10px] text-slate-600 mt-1 italic">Dựa trên: {item.materialTitle}</p>
                  )}
                </div>

                {/* Progress Bar or Badge */}
                <div className="flex items-center gap-2">
                  {item.type === 'lesson' ? (
                    <>
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getProgressColor(item.progress)}`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-bold min-w-[32px] text-right ${item.progress >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {item.progress}%
                      </span>
                    </>
                  ) : (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded uppercase border border-blue-500/20">
                      Bài tập tự luận
                    </span>
                  )}
                </div>

                {/* Updated At */}
                <div className="hidden md:flex justify-center">
                  <span className="text-xs text-slate-500 font-medium">{item.updatedAt}</span>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    {item.type === 'lesson' && (() => {
                      const pref = getState('material', item.id);
                      return (
                        <>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try { await toggleSaved('material', item.id); } catch (error) { console.error('Toggle saved failed:', error); }
                            }}
                            disabled={isPending('material', item.id, 'save')}
                            className={`flex items-center justify-center h-7 w-7 rounded-md border transition ${pref.isSaved ? 'border-amber-400/50 bg-amber-500/10 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-amber-300'}`}
                            title={pref.isSaved ? 'Bỏ lưu' : 'Lưu'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${pref.isSaved ? 'fill-amber-300' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try { await toggleFavorite('material', item.id); } catch (error) { console.error('Toggle favorite failed:', error); }
                            }}
                            disabled={isPending('material', item.id, 'favorite')}
                            className={`flex items-center justify-center h-7 w-7 rounded-md border transition ${pref.isFavorite ? 'border-rose-400/50 bg-rose-500/10 text-rose-300' : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-300'}`}
                            title={pref.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${pref.isFavorite ? 'fill-rose-300' : ''}`} />
                          </button>
                        </>
                      );
                    })()}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === 'lesson') navigate(`/learn/${item.id}`);
                        else navigate(`/shared/worksheet/${item.id}`);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        item.type === 'worksheet'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                          : item.progress >= 100
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : item.progress > 0
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {item.type === 'worksheet' ? (
                        <><Edit3 className="w-3.5 h-3.5" /> Làm bài</>
                      ) : item.progress >= 100 ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Xem lại</>
                      ) : item.progress > 0 ? (
                        <><Play className="w-3.5 h-3.5" /> Học tiếp</>
                      ) : (
                        <><Bookmark className="w-3.5 h-3.5" /> Bắt đầu</>
                      )}
                    </button>
                  </div>
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
