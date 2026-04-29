import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, Users, Trophy, ArrowRight, Play, Star, LogOut, User, ChevronDown, Settings, Key, UploadCloud, FileText, CheckCircle, Plus, Search, Clock, ShieldCheck, X, AlertTriangle, Gamepad2, SlidersHorizontal, Download } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import { eduService } from '../services/eduService';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';

// Biến toàn cục (Module-level) để khóa vĩnh viễn vòng lặp bất kể React có remount bao nhiêu lần
let isMaterialsFetched = false;

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // States lưu học liệu thật từ Database
  const [materials, setMaterials] = useState([]);
  const [dashboardData, setDashboardData] = useState({ 
    lastMaterial: null, 
    stats: { totalLearned: 0, avgScore: 0 } 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'title'
  const [creatorFilter, setCreatorFilter] = useState(''); // ID người tạo
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [systemTags, setSystemTags] = useState([]); // Tags từ hệ thống

  // Kéo dữ liệu Dashboard & Học liệu
  useEffect(() => {
    let isMounted = true;
    
    const loadDashboard = async () => {
      if (!user?.id) return;
      try {
        const statsRes = await api.get('/api/edu/dashboard/stats');
        if (isMounted && statsRes.data && statsRes.data.status === 'success') {
          setDashboardData(statsRes.data.data);
        }
        
        const materialsRes = await api.post('/api/edu/materials/list');
        if (isMounted && materialsRes.data && materialsRes.data.data) {
          setMaterials(materialsRes.data.data);
        }

        const tagsRes = await api.get('/api/edu/tags');
        if (isMounted && tagsRes.data && tagsRes.data.status === 'success') {
          setSystemTags(tagsRes.data.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu Home:", err);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const fetchMaterialsManual = async () => {
    if (!user?.id) return;
    try {
      const res = await api.post('/api/edu/materials/list');
      if (res.data && res.data.data) {
        setMaterials(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải học liệu thủ công:", err);
    }
  };

  // Debounced Search: Gọi API tìm kiếm sau 400ms kể từ lần gõ cuối
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!user?.id) return;
      setIsSearching(true);
      try {
        const queryParams = new URLSearchParams({
          q: searchQuery,
          sort: sortBy
        });
        if (creatorFilter) queryParams.append('creatorId', creatorFilter);
        if (selectedTag) queryParams.append('tag', selectedTag);

        const res = await api.get(`/api/edu/materials/search?${queryParams.toString()}`);

        if (res.data && res.data.data) {
          setMaterials(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, sortBy, creatorFilter, selectedTag, user?.id]);



  // State cho Modal Xóa và Thông báo (Toast)
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // Utils: Hiện Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Nút Xóa (Mở Modal Xác Nhận)
  const handleDeleteMaterial = (e, id) => {
    e.stopPropagation(); // Ngăn navigate vào trang học
    
    if (user.role_id !== 3) {
      showToast("Chỉ Quản trị viên mới có quyền xóa học liệu này.", "error");
      return;
    }
    setDeletingId(id); // Kích hoạt Modal lên
  };

  // Xác nhận Xóa khi bấm trong Modal
  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/edu/admin/materials/${deletingId}`);
      showToast("Đã xóa học liệu thành công!", "success");
      fetchMaterialsManual(); // Tải lại danh sách sau khi xóa
    } catch (err) {
      console.error("Lỗi xóa học liệu:", err);
      showToast("Không thể xóa học liệu. Vui lòng thử lại sau.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTagClick = (tag) => {
    setSelectedTag(prev => prev === tag ? '' : tag);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
  };

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
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      
      {/* Background layer spanning the whole page */}
      <AnimatedBackground />

      {/* Header / Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
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
              <h1 className="text-3xl font-extrabold text-slate-50">
                Chào mừng {user.role_id === 3 ? 'Quản trị viên' : 'Thầy/Cô'}, {user.name}
              </h1>
              <p className="text-slate-400 mt-2 text-lg">
                Hôm nay {user.role_id === 3 ? 'Quản trị viên' : 'Thầy/Cô'} muốn chuẩn bị tài liệu gì mới?
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link to="/teacher/groups" className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-cyan-500/30 text-cyan-400 px-6 py-3 rounded-xl font-bold hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all shadow-lg active:scale-95">
                <Users className="w-5 h-5" />
                Quản lý Lớp
              </Link>
              <Link to="/teacher/worksheets" className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-amber-500/30 text-amber-400 px-6 py-3 rounded-xl font-bold hover:bg-amber-500/10 hover:border-amber-500/50 transition-all shadow-lg active:scale-95">
                <FileText className="w-5 h-5" />
                Phiếu Học Tập
              </Link>
              <Link to="/upload" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                <UploadCloud className="w-5 h-5" />
                Tải lên Học liệu
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-md hover:border-blue-500/40 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Tổng Học Liệu</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{dashboardData?.stats?.totalMaterials || 0}</h3>
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
                  <h3 className="text-3xl font-bold text-white mt-2">{dashboardData?.stats?.totalQuizzes || 0}</h3>
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
                  <h3 className="text-3xl font-bold text-white mt-2">{dashboardData?.stats?.totalInteractions || 0}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              {searchQuery ? `Kết quả tìm kiếm (${materials.length})` : 'Học liệu gần đây'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Creator Filter - Chỉ hiện button rút gọn nếu muốn */}
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 font-bold text-xs text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="latest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Theo tiêu đề (A-Z)</option>
              </select>

              <div className="relative w-full sm:w-72">
                <Search className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài học... (@tag hoặc #tag)"
                  className="w-full bg-slate-900/80 border border-slate-700 font-medium rounded-xl pl-10 pr-10 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Filter Tags - Teacher Dashboard */}
          {(searchQuery || selectedTag) && (
              <div className="flex flex-wrap gap-2 mb-4">
                  {searchQuery && (
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-medium flex items-center gap-1 border border-blue-500/20 animate-in fade-in zoom-in duration-300">
                          Tìm kiếm: {searchQuery}
                          <button onClick={() => setSearchQuery('')} className="hover:text-blue-100 transition-colors">
                              <X size={12} />
                          </button>
                      </span>
                  )}
                  {selectedTag && (
                      <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-medium flex items-center gap-1 border border-purple-500/20 animate-in fade-in zoom-in duration-300">
                          Tag: {selectedTag}
                          <button onClick={() => setSelectedTag('')} className="hover:text-purple-100 transition-colors">
                              <X size={12} />
                          </button>
                      </span>
                  )}
                  <button 
                      onClick={clearFilters}
                      className="text-xs text-slate-500 hover:text-slate-300 underline"
                  >
                      Xóa tất cả
                  </button>
              </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-10 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2">Bộ lọc nhanh:</span>
            {systemTags && systemTags.length > 0 ? (
              systemTags.slice(0, 8).map((tag) => (
                <button
                  key={tag.tag || tag}
                  onClick={() => handleTagClick(tag.tag || tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    selectedTag === (tag.tag || tag) 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95' 
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  #{tag.tag || tag}
                </button>
              ))
            ) : (
              ['Toán học', 'Lịch sử', 'Khoa học', 'Công nghệ', 'Ngoại ngữ'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    selectedTag === tag 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95' 
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))
            )}
            {selectedTag && (
              <button 
                onClick={() => setSelectedTag('')}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 ml-2 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Xóa lọc
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Thực tế: Hiển thị materials lấy từ API */}
            {materials.length > 0 ? (
              materials.map((item) => (
                <div key={item.id} onClick={() => navigate(`/learn/${item.id}`)} className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 hover:border-blue-500/50 transition-all rounded-2xl p-5 group cursor-pointer flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-slate-100 font-bold line-clamp-1 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                      <p className="text-slate-500 text-xs mt-1 font-medium">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Hiển thị Tags từ AI (Trích xuất từ description) */}
                  {(() => {
                    const tagMatch = item.description?.match(/^\[TAGS:(.*?)\]/);
                    if (tagMatch) {
                      const tagList = tagMatch[1].split(',');
                      return (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tagList.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/50 text-blue-300 border border-blue-500/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="mt-auto border-t border-slate-700/50 pt-4">
                    <div className="flex items-center justify-between gap-3 overflow-hidden">
                      <div className="flex items-center gap-2">
                        {user.role_id === 3 ? (
                          <button 
                            onClick={(e) => handleDeleteMaterial(e, item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Xóa
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-700/50 text-slate-400 px-2 py-1.5 rounded-md">
                            <User className="w-3 h-3" /> bởi {item.creator_name || "Hệ thống"}
                          </span>
                        )}
                      </div>

                      <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/5 text-emerald-500/80 px-2 py-1.5 rounded-md">
                        <CheckCircle className="w-3 h-3" /> AI Summary
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-center text-slate-400 py-10 font-medium">Chưa có học liệu nào. Hãy bắt đầu tải lên!</div>
            )}
            
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
            {/* Progress Card - Chỉ hiện nếu có bài đang học dở */}
            {dashboardData.lastMaterial && (
              <div className="lg:col-span-2 bg-linear-to-br from-blue-900/40 to-violet-900/40 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                  <BrainCircuit className="w-48 h-48" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg uppercase tracking-wider">Đang xem dở</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10 drop-shadow-sm">{dashboardData.lastMaterial.title}</h2>
                <p className="text-blue-200/80 text-sm mb-8 max-w-md relative z-10 line-clamp-2">
                  {dashboardData.lastMaterial.description || "Hãy tiếp tục hoàn thành bài học này để nắm vững kiến thức nhé!"}
                </p>
                
                <div className="mb-8 relative z-10 max-w-md">
                  <div className="flex justify-between text-sm font-bold text-slate-200 mb-2">
                    <span>Tiến độ học tập</span>
                    <span>{dashboardData.lastMaterial.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-linear-to-r from-blue-500 to-cyan-400 h-full rounded-full shadow-[0_0_10px_var(--color-blue-500)] transition-all duration-1000" 
                      style={{ width: `${dashboardData.lastMaterial.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/learn/${dashboardData.lastMaterial.id}`)}
                  className="relative z-10 flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 active:scale-95 w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Tiếp tục bài học
                </button>
              </div>
            )}

            {/* User Stats Card */}
            <div className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 flex flex-col justify-center ${!dashboardData.lastMaterial ? 'lg:col-span-3' : ''}`}>
              <h3 className={`text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 ${!dashboardData.lastMaterial ? 'text-left' : 'text-center sm:text-left'}`}>Hồ sơ Của Bạn</h3>
              
              <div className={`space-y-6 ${!dashboardData.lastMaterial ? 'space-y-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto w-full' : ''}`}>
                <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white leading-none">{dashboardData.stats.totalLearned}</p>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Khóa/Bài đã học</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <Trophy className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white leading-none">{dashboardData.stats.avgScore}</p>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Điểm trung bình Quiz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === DEPARTURE HUB (ASYMMETRICAL BENTO GRID) === */}
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <h2 className="text-2xl font-bold text-slate-50 mb-1">Trung tâm Điều hướng</h2>
            <p className="text-slate-400 text-sm mb-6">Chọn lối đi cho hành trình học tập của bạn</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* 1. Bài học của tôi (Chiếm 2 cột) */}
               <Link to="/my-lessons" className="md:col-span-2 group rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-black/20 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                 <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-10 border border-slate-700 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                      <BookOpen className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-4xl font-bold text-white mb-3">Bài học của tôi</h3>
                      <p className="text-slate-400 text-lg">Tiếp tục hành trình học tập</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between mt-12 relative z-10">
                    <div className="flex items-center -space-x-3">
                      <UserAvatar 
                        user={user} 
                        size="sm" 
                        className="w-10 h-10 border-2 border-[#0f172a] shadow-lg" 
                      />
                      {dashboardData.lastMaterial?.teacher_name && (
                        <UserAvatar 
                          user={{
                            name: dashboardData.lastMaterial.teacher_name,
                            avatar: dashboardData.lastMaterial.teacher_avatar,
                            role_id: 2
                          }} 
                          size="sm" 
                          className="w-10 h-10 border-2 border-[#0f172a] shadow-lg" 
                        />
                      )}
                      <div className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-cyan-400 shadow-lg">
                        +{dashboardData.stats.totalLearned}
                      </div>
                    </div>
                    
                    <div className="bg-[#99f6e4] text-slate-950 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(153,246,228,0.2)]">
                      Vào học ngay
                      <ArrowRight className="w-5 h-5" />
                    </div>
                 </div>

                 {/* Subtle Glow */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
               </Link>

               {/* 2. Tự luyện tập (Chiếm 1 cột) */}
               <Link to="/practice" className="md:col-span-1 group rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300 p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-black/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <h3 className="text-xl font-extrabold text-white">Tự luyện tập</h3>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      <BrainCircuit className="w-5 h-5 text-purple-400" />
                    </div>
                 </div>
                 <p className="text-slate-400 text-sm mb-8 relative z-10 font-medium">
                   Bạn đã thực hiện <span className="text-purple-400 font-bold">{dashboardData.stats.totalQuizzes || 0}</span> lượt tự luyện tập. 
                   Tiếp tục rèn luyện để nâng cao kỹ năng nhé!
                 </p>
                 <div className="relative z-10 flex items-center gap-2 text-purple-400 font-bold text-sm group-hover:text-purple-300 mt-auto">
                   Bắt đầu luyện ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
                 <div className="absolute left-[-10%] bottom-[-10%] opacity-10 group-hover:opacity-20 group-hover:scale-105 transition-all duration-700 pointer-events-none">
                    <BrainCircuit className="w-48 h-48 text-purple-400" />
                 </div>
               </Link>

               {/* 3. Kho tài liệu (Chiếm 1 cột) */}
               <div className="md:col-span-1 group rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all duration-300 p-8 flex flex-col relative overflow-hidden shadow-lg shadow-black/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                 <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-xl font-extrabold text-white">Kho tài liệu</h3>
                    <Link to="/materials" className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
                      Xem tất cả
                    </Link>
                 </div>
                 
                 <div className="flex gap-2 mb-6 relative z-10">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Tìm tài liệu, sách giáo khoa, bài giải..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <button className="p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                 </div>

                 <div className="space-y-4 relative z-10 overflow-hidden">
                    {materials.length > 0 ? (
                      materials.slice(0, 2).map((item) => (
                        <Link key={item.id} to={`/learn/${item.id}`} className="flex items-center gap-4 group/item cursor-pointer">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.content_url?.endsWith('.pdf') ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <FileText className={`w-5 h-5 ${item.content_url?.endsWith('.pdf') ? 'text-red-500 fill-red-500/10' : 'text-blue-500 fill-blue-500/10'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover/item:text-emerald-400 transition-colors">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium">
                              {item.content_url?.split('.').pop()?.toUpperCase() || 'DOC'} • {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-slate-500 hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs italic py-4">Chưa có tài liệu nào được cập nhật.</p>
                    )}
                 </div>

                 {/* Subtle Glow */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
               </div>

               {/* 4. Edu Game (Chiếm 2 cột) */}
               <Link to="/games" className="md:col-span-2 group rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-amber-500/40 hover:bg-slate-800/80 transition-all duration-300 p-8 flex flex-col sm:flex-row justify-between relative overflow-hidden shadow-lg shadow-black/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                 <div className="relative z-10 flex-1 pr-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-extrabold text-white">Edu Game</h3>
                      <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold tracking-widest uppercase">Live Challenge</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-sm">
                      Battle other scholars in real-time knowledge duels and earn unique badges.
                    </p>
                    <div className="flex gap-4">
                       <span className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
                         <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Best: 12,450
                       </span>
                       <span className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
                         <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rank: #14
                       </span>
                    </div>
                 </div>
                 <div className="relative z-10 mt-6 sm:mt-0 flex items-center justify-center sm:w-1/3">
                    <div className="relative group-hover:scale-105 transition-transform duration-500 group-hover:rotate-3">
                       <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] relative rotate-12">
                          <Gamepad2 className="w-12 h-12 text-white fill-white" />
                       </div>
                       <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
                          <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                       </div>
                    </div>
                 </div>
                 <div className="absolute right-[-10%] bottom-[-10%] opacity-5 group-hover:opacity-10 group-hover:scale-105 transition-all duration-700 pointer-events-none">
                    <Gamepad2 className="w-64 h-64 text-amber-400" />
                 </div>
               </Link>

            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
              {searchQuery ? `Kết quả tìm kiếm` : 'Gợi ý cho bạn'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-bold uppercase hidden md:inline">Sắp xếp:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-900/80 border border-slate-700 font-bold text-xs text-blue-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="latest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="title">A-Z</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài học... (@tag hoặc #tag)"
                  className="w-full bg-slate-900/80 border border-slate-700 font-medium rounded-xl pl-10 pr-10 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Gợi ý tìm theo tag */}
                {(searchQuery.startsWith('@') || searchQuery.startsWith('#')) && searchQuery.length === 1 && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl z-20 text-xs text-slate-400 font-medium">
                    🏷️ Gõ tiếp tên tag bạn muốn tìm, VD: <span className="text-blue-400">{searchQuery}toán học</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Filter Tags - Student Dashboard */}

          <div className="flex flex-wrap items-center gap-2 mb-10 animate-in fade-in slide-in-from-left-4 duration-700 delay-100 px-4 sm:px-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2">Bộ lọc nhanh:</span>
            {systemTags.length > 0 ? (
              systemTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    selectedTag === tag 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95' 
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))
            ) : (
              ['Toán học', 'Lịch sử', 'Khoa học', 'Công nghệ', 'Ngoại ngữ'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    selectedTag === tag 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95' 
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))
            )}
            {selectedTag && (
              <button 
                onClick={() => setSelectedTag('')}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 ml-2 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Xóa lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {materials.length > 0 ? (
              materials.map((item) => (
                <div key={item.id} className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full shadow-lg shadow-black/20">
                  <div className="flex justify-between items-start mb-5">
                    <span className="px-3 py-1 bg-violet-500/10 text-violet-300 text-xs font-bold rounded-md">Chủ đề {item.id}</span>
                    <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-blue-300 transition-colors">{item.title}</h4>
                  
                  {/* Tách và hiển thị nội dung sạch + Tags */}
                  {(() => {
                    const tagMatch = item.description?.match(/^\[TAGS:(.*?)\]/);
                    const cleanDesc = item.description?.replace(/^\[TAGS:.*?\]/, '') || "Tài liệu học tập trên hệ thống QuizVibe AI.";
                    const tagList = tagMatch ? tagMatch[1].split(',') : [];
                    
                    return (
                      <>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">{cleanDesc}</p>
                        {tagList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {tagList.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 active:scale-95 transition-transform">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-auto flex items-center justify-between border-t border-slate-700/60 pt-5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1.5 rounded-md">
                      <User className="w-3.5 h-3.5" /> {item.creator_name || "Hệ thống"}
                    </span>
                    <Link to={`/learn/${item.id}`} className="text-blue-400 text-sm font-bold flex items-center gap-1.5 group-hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg">
                      Vào học <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-lg mb-1">
                      Không tìm thấy kết quả nào cho <span className="text-blue-400">"{searchQuery}"</span>
                    </p>
                    <p className="text-slate-500 text-sm">
                      {(searchQuery.startsWith('@') || searchQuery.startsWith('#'))
                        ? 'Thử tìm tag khác hoặc kiểm tra lại tên tag.'
                        : 'Thử tìm theo tag bằng cách gõ @tên_tag hoặc #tên_tag'}
                    </p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors flex items-center gap-1.5 mx-auto">
                      <X className="w-4 h-4" /> Xóa tìm kiếm
                    </button>
                  </>
                ) : (
                  <p className="text-slate-400 font-medium">Hiện tại chưa có khóa học/bài giảng nào trên hệ thống.</p>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </main>


      {/* Footer */}
      <Footer />

      {/* --- CUSTOM OVERLAY: MODAL XÁC NHẬN XÓA --- */}
      {deletingId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border inset-0 shadow-inner">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Xóa học liệu vĩnh viễn?</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Sau khi xóa, học sinh sẽ không thể truy cập tài liệu này nữa. Bạn chắc chắn muốn tiếp tục chứ?
              </p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Hủy thao tác
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM OVERLAY: TOAST NOTIFICATIONS --- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-110 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl shadow-black/50 border backdrop-blur-md ${
            toast.type === 'error' ? 'bg-red-950/90 border-red-500/50' : 'bg-emerald-950/90 border-emerald-500/50'
          }`}>
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-sm font-bold text-slate-200">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
