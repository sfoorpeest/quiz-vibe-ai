import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Search, Download, Filter, X, File, Image, Video, BookOpen, SlidersHorizontal, ChevronDown, Eye, Clock, User, Tag, Hash, GraduationCap, LayoutGrid, Layers } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

import { materialService } from '../services/materialService';

const FILE_TYPE_ICONS = {
  document: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  video: { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  audio: { icon: Video, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const SCHOOL_SUBJECTS = [
  'Tất cả', 
  'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tin học', 'Giáo dục công dân'
];

const SPECIALIZATIONS = [
  'Công nghệ thông tin', 'Khoa học máy tính', 'Kỹ thuật phần mềm', 'An toàn thông tin',
  'Kinh tế & Tài chính', 'Quản trị kinh doanh', 'Marketing & Truyền thông', 'Kế toán & Kiểm toán',
  'Logistics & Chuỗi cung ứng', 'Ngân hàng & Bảo hiểm', 'Du lịch & Khách sạn',
  'Kỹ thuật & Công nghệ', 'Kiến trúc & Xây dựng', 'Điện - Điện tử', 'Cơ khí & Tự động hóa',
  'Y Dược & Sức khỏe', 'Điều dưỡng', 'Tâm lý học', 'Luật & Pháp lý', 'Sư phạm & Giáo dục',
  'Ngôn ngữ học', 'Công nghệ sinh học', 'Khoa học môi trường', 'Thiết kế đồ họa', 'Nhiếp ảnh & Điện ảnh'
];

const SOCIAL_TOPICS = [
  'Lập trình', 'Tài chính cá nhân', 'Kỹ năng mềm', 'Khởi nghiệp', 'Kinh doanh online', 'Đầu tư chứng khoán'
];

const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học', 'Sau đại học', 'Tự học/Khác'];

const FILE_TYPES = ['Tất cả', 'Video', 'Audio', 'Document'];

// Reusable collapsible filter section with smooth auto-height
function FilterSection({ title, icon, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800/50 last:border-0 pb-2 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 group text-left"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/50 text-slate-500'} group-hover:text-emerald-300`}>
            {icon}
          </div>
          <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${isOpen ? 'text-slate-200' : 'text-slate-300/80'} group-hover:text-slate-200`}>
            {title}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2 pb-2' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Materials() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('keyword') || '';
  const selectedSubject = searchParams.get('subject') || 'Tất cả';
  const selectedGrade = searchParams.get('grade') || 'Tất cả';
  const selectedType = searchParams.get('type') || 'Tất cả';
  const selectedTag = searchParams.get('tag') || '';

  // Fetch popular tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await materialService.getTags();
        setPopularTags(res.data || []);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, []);

  const updateParam = (key, value, emptyValue = '') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!value || value === emptyValue) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedType !== 'Tất cả') params.type = selectedType.toLowerCase();
        if (selectedSubject !== 'Tất cả') params.subject = selectedSubject;
        if (selectedGrade !== 'Tất cả') params.grade = selectedGrade;
        if (selectedTag) params.tag = selectedTag;
        
        const res = await materialService.getMaterials(params);
        setMaterials(res.data || []);
        setPagination(res.pagination || {});
      } catch (err) {
        console.error("Failed to fetch materials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [searchQuery, selectedType, selectedSubject, selectedGrade, selectedTag]);

  const getFileIcon = (type) => {
    const config = FILE_TYPE_ICONS[type] || FILE_TYPE_ICONS.document;
    const Icon = config.icon;
    return (
      <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  };

  const hasActiveFilter = selectedSubject !== 'Tất cả' || selectedGrade !== 'Tất cả' || selectedType !== 'Tất cả' || selectedTag !== '';

  const clearFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('subject');
      next.delete('grade');
      next.delete('type');
      next.delete('tag');
      return next;
    });
  };

  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10 pt-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 w-full">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Thư viện học liệu
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">Kho tài liệu</h1>
            <p className="text-slate-400 mt-2 text-sm">{pagination.total || 0} tài liệu từ giảng viên và hệ thống</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm font-bold text-slate-300 hover:text-emerald-400 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {isSidebarOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>
        </div>

        {/* ═══ 2-COLUMN LAYOUT: Sidebar (25%) + Content (75%) ═══ */}
        <div className="flex gap-6">

          {/* LEFT SIDEBAR — Filter Panel */}
          <div className={`w-72 shrink-0 ${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-24 bg-slate-900/40 backdrop-blur-3xl border border-slate-700/30 rounded-[2.5rem] p-5 shadow-2xl shadow-black/40 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar border-t-white/5">
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                    <Filter className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tighter">Bộ lọc</h3>
                </div>
                {hasActiveFilter && (
                  <button onClick={clearFilters} className="text-[13px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 transition-all hover:bg-red-500/20">
                    Xóa hết
                  </button>
                )}
              </div>

              {/* ─── Môn học phổ thông ─── */}
              <FilterSection title="Phổ thông" icon={<GraduationCap className="w-3.5 h-3.5" />} defaultOpen={true}>
                <div className="grid grid-cols-2 gap-1.5">
                  {SCHOOL_SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => updateParam('subject', subject, 'Tất cả')}
                      className={`px-2 py-1.5 rounded-xl text-[13px] font-bold transition-all text-center border ${
                        selectedSubject === subject
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-800/30 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ─── Chuyên ngành đại học ─── */}
              <FilterSection title="Chuyên ngành" icon={<BookOpen className="w-3.5 h-3.5" />} defaultOpen={true}>
                <div className="flex flex-col gap-1">
                  {SPECIALIZATIONS.map(spec => (
                    <button
                      key={spec}
                      onClick={() => updateParam('subject', spec, 'Tất cả')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all border ${
                        selectedSubject === spec
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ─── Chủ đề xã hội / Kỹ năng ─── */}
              <FilterSection title="Xã hội & Kỹ năng" icon={<LayoutGrid className="w-3.5 h-3.5" />} defaultOpen={false}>
                <div className="flex flex-col gap-1">
                  {SOCIAL_TOPICS.map(topic => (
                    <button
                      key={topic}
                      onClick={() => updateParam('subject', topic, 'Tất cả')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all border ${
                        selectedSubject === topic
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ─── Cấp độ học ─── */}
              <FilterSection title="Cấp học" icon={<Layers className="w-3.5 h-3.5" />} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-1.5">
                  {GRADES.map(grade => (
                    <button
                      key={grade}
                      onClick={() => updateParam('grade', grade, 'Tất cả')}
                      className={`px-2 py-1.5 rounded-xl text-[13px] font-bold transition-all text-center border ${
                        selectedGrade === grade
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-800/30 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* ─── Tag phổ biến ─── */}
              {popularTags.length > 0 && (
                <FilterSection title="Tags" icon={<Hash className="w-3.5 h-3.5" />} defaultOpen={false}>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.slice(0, 10).map(({ tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => updateParam('tag', selectedTag === tag ? '' : tag)}
                        title={`${count} tài liệu`}
                        className={`px-2 py-1 rounded-lg text-[13px] font-bold transition-all ${
                          selectedTag === tag
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800/40 text-slate-400 border border-transparent hover:text-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* ─── Loại file ─── */}
              <FilterSection title="Loại file" icon={<FileText className="w-3.5 h-3.5" />} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-1.5">
                  {FILE_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => updateParam('type', type, 'Tất cả')}
                      className={`px-2 py-1.5 rounded-xl text-[13px] font-bold transition-all text-center border ${
                        selectedType === type
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-800/30 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>

          {/* RIGHT CONTENT — Search + File List */}
          <div className="flex-1 min-w-0">
            {/* Sticky Search */}
            <div className="sticky top-20 z-20 mb-6">
              <div className="relative">
                <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-emerald-400' : 'text-slate-500'} transition-colors`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => updateParam('keyword', e.target.value)}
                  placeholder="Tìm tài liệu, sách giáo khoa, bài giải..."
                  className="w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 font-medium rounded-2xl pl-12 pr-10 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm shadow-lg"
                />
                {searchQuery && (
                  <button onClick={() => updateParam('keyword', '')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Pills (inline) */}
            {hasActiveFilter && (
              <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đang lọc:</span>
                {selectedSubject !== 'Tất cả' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20">
                    {selectedSubject}
                    <button onClick={() => updateParam('subject', 'Tất cả', 'Tất cả')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedGrade !== 'Tất cả' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/20">
                    {selectedGrade}
                    <button onClick={() => updateParam('grade', 'Tất cả', 'Tất cả')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedType !== 'Tất cả' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/20">
                    {selectedType}
                    <button onClick={() => updateParam('type', 'Tất cả', 'Tất cả')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedTag && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/20">
                    #{selectedTag}
                    <button onClick={() => updateParam('tag', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* File List */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-[auto_1fr_80px_140px_100px_80px_auto] items-center gap-4 px-6 py-3 border-b border-slate-700/30 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <span className="w-10"></span>
                <span>Tên tài liệu</span>
                <span className="text-center">Loại</span>
                <span>Người tải lên</span>
                <span className="text-center">Ngày</span>
                <span className="text-center">Lượt xem</span>
                <span className="w-10"></span>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold">Đang tải...</p>
                </div>
              ) : materials.length > 0 ? (
                materials.map((mat, idx) => (
                  <div
                    key={mat.id}
                    className={`group grid grid-cols-1 lg:grid-cols-[auto_1fr_80px_140px_100px_80px_auto] items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-slate-800/60 cursor-pointer ${
                      idx < materials.length - 1 ? 'border-b border-slate-800/30' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="hidden lg:flex">{getFileIcon(mat.type)}</div>

                    {/* Title */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">{mat.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 lg:hidden">{mat.type.toUpperCase()} • {mat.created_by}</p>
                    </div>

                    {/* Type Badge */}
                    <div className="hidden lg:flex justify-center">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {mat.type}
                      </span>
                    </div>

                    {/* Uploader */}
                    <div className="hidden lg:flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium truncate">{mat.created_by || 'Hệ thống'}</span>
                    </div>

                    {/* Date */}
                    <div className="hidden lg:flex justify-center">
                      <span className="text-xs text-slate-500 font-medium">{new Date(mat.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {/* Views (Mocked for now since DB doesn't have it) */}
                    <div className="hidden lg:flex justify-center items-center gap-1.5">
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span className="text-xs text-slate-500 font-medium">---</span>
                    </div>

                    {/* Download */}
                    <div className="flex justify-end">
                      <button className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all active:scale-90">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center">
                  <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-lg mb-1">Không tìm thấy tài liệu</p>
                  <p className="text-slate-500 text-sm">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
              )}
            </div>

            {/* Pagination or count */}
            <div className="mt-4 text-center">
              <p className="text-xs font-bold text-slate-500">Hiển thị {materials.length} / {pagination.total || 0} tài liệu</p>
            </div>
          </div>

        </div>
      </div>

      <Footer />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.6); border-radius: 10px; }
      `}</style>
    </div>
  );
}
