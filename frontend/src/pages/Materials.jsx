import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Download, Filter, X, File, Image, Video, BookOpen, SlidersHorizontal, ChevronDown, Eye, Clock, User } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════
// MOCK DATA — Sẽ thay bằng API thực khi backend sẵn sàng
// ═══════════════════════════════════════════════════════════
const FILE_TYPE_ICONS = {
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  docx: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  pptx: { icon: FileText, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  video: { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  image: { icon: Image, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const SUBJECTS = ['Tất cả', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tin học'];
const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];
const FILE_TYPES = ['Tất cả', 'PDF', 'DOCX', 'PPTX', 'Video'];

const MOCK_MATERIALS = [
  { id: 1, title: 'Công thức Vật Lý 12 — Chương 1: Dao động cơ', type: 'pdf', size: '2.4 MB', uploader: 'Thầy Nguyễn An', date: '15/03/2026', subject: 'Vật lý', grade: 'Lớp 12', views: 1240 },
  { id: 2, title: 'Sổ tay Giải bài tập SGK Toán 12 — Giải tích', type: 'docx', size: '1.1 MB', uploader: 'Cô Trần Mai', date: '12/03/2026', subject: 'Toán học', grade: 'Lớp 12', views: 892 },
  { id: 3, title: 'Slide bài giảng Hóa học 10 — Liên kết hóa học', type: 'pptx', size: '5.8 MB', uploader: 'Cô Nguyễn Hương', date: '10/03/2026', subject: 'Hóa học', grade: 'Lớp 10', views: 673 },
  { id: 4, title: 'Video bài giảng: Phân tích "Chí Phèo" — Nam Cao', type: 'video', size: '120 MB', uploader: 'Cô Phạm Lan', date: '08/03/2026', subject: 'Ngữ văn', grade: 'Lớp 11', views: 2103 },
  { id: 5, title: 'Đề thi thử THPT QG 2026 — Môn Toán (Đề 01)', type: 'pdf', size: '3.2 MB', uploader: 'Hệ thống', date: '05/03/2026', subject: 'Toán học', grade: 'Lớp 12', views: 4521 },
  { id: 6, title: 'Tóm tắt Lịch sử Việt Nam — Thời kỳ Đổi Mới', type: 'docx', size: '0.8 MB', uploader: 'Thầy Đỗ Minh', date: '01/03/2026', subject: 'Lịch sử', grade: 'Lớp 12', views: 345 },
  { id: 7, title: 'IELTS Speaking Part 2 — Sample Answers Collection', type: 'pdf', size: '4.5 MB', uploader: 'Mr. David Lee', date: '28/02/2026', subject: 'Tiếng Anh', grade: 'Đại học', views: 1876 },
  { id: 8, title: 'Hình ảnh minh họa cấu trúc tế bào thực vật', type: 'image', size: '15 MB', uploader: 'Cô Vũ Thảo', date: '25/02/2026', subject: 'Sinh học', grade: 'Lớp 10', views: 512 },
  { id: 9, title: 'Bài tập Tin học đại cương — Lập trình Python cơ bản', type: 'pdf', size: '1.9 MB', uploader: 'Thầy Lê Hoàng', date: '20/02/2026', subject: 'Tin học', grade: 'Đại học', views: 789 },
  { id: 10, title: 'Atlas Địa lý 12 — Bản đồ kinh tế Đông Nam Bộ', type: 'image', size: '8.3 MB', uploader: 'Cô Phạm Lan', date: '15/02/2026', subject: 'Địa lý', grade: 'Lớp 12', views: 234 },
];

export default function Materials() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [selectedType, setSelectedType] = useState('Tất cả');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Filter logic
  const filteredMaterials = MOCK_MATERIALS.filter(mat => {
    const matchSearch = mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.uploader.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === 'Tất cả' || mat.subject === selectedSubject;
    const matchGrade = selectedGrade === 'Tất cả' || mat.grade === selectedGrade;
    const matchType = selectedType === 'Tất cả' || mat.type.toUpperCase() === selectedType.toUpperCase();
    return matchSearch && matchSubject && matchGrade && matchType;
  });

  const getFileIcon = (type) => {
    const config = FILE_TYPE_ICONS[type] || FILE_TYPE_ICONS.pdf;
    const Icon = config.icon;
    return (
      <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  };

  const hasActiveFilter = selectedSubject !== 'Tất cả' || selectedGrade !== 'Tất cả' || selectedType !== 'Tất cả';

  const clearFilters = () => {
    setSelectedSubject('Tất cả');
    setSelectedGrade('Tất cả');
    setSelectedType('Tất cả');
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
            <p className="text-slate-400 mt-2 text-sm">{MOCK_MATERIALS.length} tài liệu từ giảng viên và hệ thống</p>
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
                      onClick={() => setSelectedSubject(subject)}
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
                      onClick={() => setSelectedGrade(grade)}
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
                      onClick={() => setSelectedType(type)}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tài liệu, sách giáo khoa, bài giải..."
                  className="w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 font-medium rounded-2xl pl-12 pr-10 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm shadow-lg"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
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
                    <button onClick={() => setSelectedSubject('Tất cả')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedGrade !== 'Tất cả' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/20">
                    {selectedGrade}
                    <button onClick={() => setSelectedGrade('Tất cả')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedType !== 'Tất cả' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/20">
                    {selectedType}
                    <button onClick={() => setSelectedType('Tất cả')}><X className="w-3 h-3" /></button>
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

              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((mat, idx) => (
                  <div
                    key={mat.id}
                    className={`group grid grid-cols-1 lg:grid-cols-[auto_1fr_80px_140px_100px_80px_auto] items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-slate-800/60 cursor-pointer ${
                      idx < filteredMaterials.length - 1 ? 'border-b border-slate-800/30' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="hidden lg:flex">{getFileIcon(mat.type)}</div>

                    {/* Title */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">{mat.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 lg:hidden">{mat.type.toUpperCase()} • {mat.size} • {mat.uploader}</p>
                    </div>

                    {/* Type Badge */}
                    <div className="hidden lg:flex justify-center">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {mat.type}
                      </span>
                    </div>

                    {/* Uploader */}
                    <div className="hidden lg:flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium truncate">{mat.uploader}</span>
                    </div>

                    {/* Date */}
                    <div className="hidden lg:flex justify-center">
                      <span className="text-xs text-slate-500 font-medium">{mat.date}</span>
                    </div>

                    {/* Views */}
                    <div className="hidden lg:flex justify-center items-center gap-1.5">
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span className="text-xs text-slate-500 font-medium">{mat.views.toLocaleString()}</span>
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
              <p className="text-xs font-bold text-slate-500">Hiển thị {filteredMaterials.length} / {MOCK_MATERIALS.length} tài liệu</p>
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
