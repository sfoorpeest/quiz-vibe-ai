import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Search, Download, Filter, X, File, Image, Video, BookOpen, SlidersHorizontal, ChevronDown, Eye, Clock, User } from 'lucide-react';
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

const SUBJECTS = ['Tất cả', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tin học'];
const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];
const FILE_TYPES = ['Tất cả', 'Video', 'Audio', 'Document'];

export default function Materials() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('keyword') || '';
  const selectedSubject = searchParams.get('subject') || 'Tất cả';
  const selectedGrade = searchParams.get('grade') || 'Tất cả';
  const selectedType = searchParams.get('type') || 'Tất cả';

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

  React.useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedType !== 'Tất cả') params.type = selectedType.toLowerCase();
        if (selectedSubject !== 'Tất cả') params.subject = selectedSubject;
        if (selectedGrade !== 'Tất cả') params.grade = selectedGrade;
        
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
  }, [searchQuery, selectedType, selectedSubject, selectedGrade]);

  const getFileIcon = (type) => {
    const config = FILE_TYPE_ICONS[type] || FILE_TYPE_ICONS.document;
    const Icon = config.icon;
    return (
      <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  };

  const hasActiveFilter = selectedSubject !== 'Tất cả' || selectedGrade !== 'Tất cả' || selectedType !== 'Tất cả';

  const clearFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('subject');
      next.delete('grade');
      next.delete('type');
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
            <div className="sticky top-24 bg-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-6 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-400" /> Bộ lọc
                </h3>
                {hasActiveFilter && (
                  <button onClick={clearFilters} className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
                    <X className="w-3 h-3" /> Xóa lọc
                  </button>
                )}
              </div>

              {/* Subject Filter */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Môn học</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => updateParam('subject', subject, 'Tất cả')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedSubject === subject
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Filter */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cấp / Lớp</p>
                <div className="space-y-1.5">
                  {GRADES.map(grade => (
                    <button
                      key={grade}
                      onClick={() => updateParam('grade', grade, 'Tất cả')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedGrade === grade
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Type Filter */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Loại file</p>
                <div className="space-y-1.5">
                  {FILE_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => updateParam('type', type, 'Tất cả')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedType === type
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
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
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/20">
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
