import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle, 
  BrainCircuit, 
  Tag as TagIcon, 
  ArrowLeft, 
  Loader2, 
  Save, 
  Sparkles, 
  X,
  FileQuestion
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

export default function UploadCenter() {
  const navigate = useNavigate();
  
  // States: IDLE -> UPLOADING -> PROCESSING -> PREVIEW
  const [status, setStatus] = useState('IDLE'); 
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'link'
  
  // Drag drop
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [linkInput, setLinkInput] = useState('');

  // Fake AI Processing States
  const [aiStages, setAiStages] = useState({
    extract: false,
    summary: false,
    tagging: false
  });

  // Giả lập Dữ liệu trả về từ AI (Mock Data)
  const [previewData, setPreviewData] = useState({
    title: '',
    summary: '',
    tags: []
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Giả lập luồng gọi API và Animation
  const startProcessing = () => {
    if (!file && !linkInput) return;
    setStatus('PROCESSING');
    
    // Đặt tên tạm
    const tempTitle = file ? file.name.split('.')[0] : "Tài liệu trực tuyến";
    
    // Mock Delay 1: Đọc PDF / Text
    setTimeout(() => {
      setAiStages(prev => ({ ...prev, extract: true }));
    }, 1500);

    // Mock Delay 2: AI Tóm tắt
    setTimeout(() => {
      setAiStages(prev => ({ ...prev, summary: true }));
    }, 3500);

    // Mock Delay 3: AI Tagging
    setTimeout(() => {
      setAiStages(prev => ({ ...prev, tagging: true }));
      
      // Hoàn tất -> Đẩy data vào Preview
      setTimeout(() => {
        setPreviewData({
          title: tempTitle,
          summary: "Đây là bản tóm tắt mẫu được AI sinh ra. Tài liệu này cung cấp cái nhìn tổng quan về sự phát triển của công nghệ ứng dụng trong thập kỷ qua, đặc biệt nhấn mạnh vào Trí tuệ Nhân tạo và Dữ liệu lớn. Học sinh cần nắm rõ 3 nguyên lý cốt lõi được đề cập trong chương 2.",
          tags: ["Công nghệ", "AI", "Cơ bản", "2024"]
        });
        setStatus('PREVIEW');
      }, 800);
    }, 5500);
  };

  // Xóa Tag bị click
  const removeTag = (tagToRemove) => {
    setPreviewData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSaveToDB = () => {
    // Sẽ gọi API thật tại đây. Giả lập Success:
    alert("Lưu Học Liệu thành công! AI đã tạo xong 5 câu hỏi Quiz tuỳ chọn đính kèm.");
    navigate('/');
  };

  return (
    <div className="relative min-h-screen text-slate-50 font-sans">
      <AnimatedBackground />

      {/* Navbar Minimalist */}
      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-blue-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm hidden sm:inline">Trở về Trang chủ</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-bold bg-linear-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
              AI Workspace
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* ======================================= */}
        {/* STATE 1: IDLE (CHỌN FILE/LINK) */}
        {/* ======================================= */}
        {status === 'IDLE' && (
          <div className="space-y-6">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-white mb-3 drop-shadow-sm">Cung cấp Học liệu cho AI</h1>
              <p className="text-slate-400">Tải lên định dạng PDF, Word, hoặc dán liên kết. AI sẽ tự động phân tích và trích xuất lượng tri thức tinh túy nhất cho học sinh.</p>
            </div>

            {/* View Switcher */}
            <div className="flex p-1 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl mx-auto max-w-sm mb-8 shadow-inner">
              <button 
                onClick={() => setActiveTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'file' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'}`}
              >
                <UploadCloud className="w-4 h-4" /> Tải File Tệp
              </button>
              <button 
                onClick={() => setActiveTab('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'link' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'}`}
              >
                <LinkIcon className="w-4 h-4" /> Liên kết Web
              </button>
            </div>

            {/* File Dropzone */}
            {activeTab === 'file' && (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group bg-slate-900/40 backdrop-blur-md border-2 border-dashed rounded-3xl p-10 mt-8 flex flex-col items-center justify-center transition-all duration-300 min-h-[300px] cursor-pointer
                  ${isDragging ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-800/60'}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-b from-blue-500/5 to-transparent rounded-3xl transition-opacity pointer-events-none"></div>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-blue-500/30">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-bold text-slate-200">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-6 px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                    >
                      Bỏ chọn file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:scale-110 transition-all shadow-xl shadow-black/20 duration-300">
                      <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Kéo thả file vào đây</h3>
                    <p className="text-sm text-slate-400 mb-6">hoặc click để chọn từ thiết bị (Tối đa 20MB)</p>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-800/80 px-4 py-2 rounded-lg">
                      <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">PDF</span>
                      <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">DOCX</span>
                      <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">TXT</span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* Link Input */}
            {activeTab === 'link' && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700 rounded-3xl p-8 min-h-[300px] flex flex-col justify-center animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <LinkIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-200 mb-6">Dán đường dẫn bài giảng</h3>
                <div className="relative max-w-md mx-auto w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://vicky.com/bai-giang-ai" 
                    className="block w-full pl-11 pr-4 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-0 focus:border-blue-500 transition-colors shadow-inner font-medium"
                  />
                </div>
              </div>
            )}

            {/* Button Analyze */}
            <div className="flex justify-center mt-10">
              <button 
                onClick={startProcessing}
                disabled={!file && !linkInput}
                className="flex items-center gap-3 bg-linear-to-r from-blue-600 to-violet-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:hover:shadow-none hover:scale-105 transition-all duration-300"
              >
                <BrainCircuit className="w-5 h-5" />
                Tiến hành Phân tích AI
              </button>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STATE 2: PROCESSING (AI LOADING MOCK) */}
        {/* ======================================= */}
        {status === 'PROCESSING' && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-10 text-center animate-in zoom-in-95 duration-500 max-w-lg mx-auto shadow-2xl shadow-blue-900/20">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="relative w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-2 border-blue-500/50 shadow-[0_0_15px_theme(colors.blue.500)]">
                <BrainCircuit className="w-10 h-10 text-blue-400 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-2xl font-extrabold text-white mb-2">AI đang tư duy...</h2>
            <p className="text-slate-400 mb-10 text-sm">Vui lòng chờ vài giây để hệ thống cấu trúc lại tri thức</p>

            <div className="space-y-4 text-left bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
              {/* Stage 1 */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${aiStages.extract ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {aiStages.extract ? <CheckCircle className="w-4 h-4" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                </div>
                <span className={`text-sm font-semibold ${aiStages.extract ? 'text-slate-200' : 'text-slate-400'}`}>
                  1. Đọc và bóc tách văn bản (Extracting)
                </span>
              </div>
              {/* Stage 2 */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${aiStages.summary ? 'bg-emerald-500/20 text-emerald-400' : aiStages.extract ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/50 text-slate-600'}`}>
                  {aiStages.summary ? <CheckCircle className="w-4 h-4" /> : aiStages.extract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-slate-600"></div>}
                </div>
                <span className={`text-sm font-semibold ${aiStages.summary ? 'text-slate-200' : aiStages.extract ? 'text-blue-300' : 'text-slate-500'}`}>
                  2. Khái quát hóa nội dung (Summarizing)
                </span>
              </div>
              {/* Stage 3 */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${aiStages.tagging ? 'bg-emerald-500/20 text-emerald-400' : aiStages.summary ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/50 text-slate-600'}`}>
                   {aiStages.tagging ? <CheckCircle className="w-4 h-4" /> : aiStages.summary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-slate-600"></div>}
                </div>
                <span className={`text-sm font-semibold ${aiStages.tagging ? 'text-slate-200' : aiStages.summary ? 'text-blue-300' : 'text-slate-500'}`}>
                  3. Phân loại và Gắn thẻ (Auto-Tagging)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STATE 3: PREVIEW (XÁC NHẬN KẾT QUẢ AI) */}
        {/* ======================================= */}
        {status === 'PREVIEW' && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="mb-8 flex items-end justify-between border-b border-slate-700/50 pb-5">
              <div>
                <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold tracking-widest uppercase mb-2">
                  <CheckCircle className="w-4 h-4" /> Phân tích hoàn tất
                </span>
                <h1 className="text-3xl font-extrabold text-white">Kiểm tra & Xuất bản</h1>
              </div>
            </div>

            <div className="space-y-6">
              {/* Editable Title */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-md">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tên Bài Giảng / Học liệu</label>
                <div className="relative">
                  <FileQuestion className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={previewData.title}
                    onChange={(e) => setPreviewData({...previewData, title: e.target.value})}
                    className="w-full bg-slate-800/80 border-2 border-slate-700 font-bold text-white text-lg rounded-xl pl-12 pr-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Editable Summary */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <BrainCircuit className="w-32 h-32" />
                 </div>
                 
                 <div className="flex items-center gap-2 mb-4 relative z-10">
                    <div className="p-1.5 bg-violet-500/20 rounded text-violet-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <label className="text-sm font-bold text-slate-200">AI Tóm tắt nội dung chính</label>
                 </div>
                 <textarea
                    value={previewData.summary}
                    onChange={(e) => setPreviewData({...previewData, summary: e.target.value})}
                    rows="4"
                    className="w-full relative z-10 bg-slate-800/80 border border-slate-700 font-medium text-slate-300 text-sm leading-relaxed rounded-xl px-4 py-4 focus:border-violet-500 focus:outline-none transition-all resize-none shadow-inner"
                 />
                 <p className="text-xs text-slate-500 mt-3 font-medium relative z-10">* Hãy chỉnh sửa nếu AI tóm tắt chưa đúng ý Thầy/Cô</p>
              </div>

              {/* Tags Area */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-md">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-500/20 rounded text-blue-400">
                      <TagIcon className="w-4 h-4" />
                    </div>
                    <label className="text-sm font-bold text-slate-200">Nhãn dán (Tags)</label>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {previewData.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 text-slate-200 text-sm font-semibold px-3 py-1.5 rounded-lg group">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full p-0.5 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    <button className="flex items-center gap-1 border-2 border-dashed border-slate-600 text-slate-400 hover:text-blue-400 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-sm font-semibold px-3 py-1.5 rounded-lg">
                      <Plus className="w-4 h-4" /> Thêm Tag
                    </button>
                 </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10 p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50 justify-between items-center">
              <button 
                onClick={() => setStatus('IDLE')}
                className="text-slate-400 font-semibold text-sm hover:text-white transition-colors py-2 px-4 w-full sm:w-auto text-center"
              >
                Hủy / Làm lại
              </button>
              
              <button 
                onClick={handleSaveToDB}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95 w-full sm:w-auto group"
              >
                <Save className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                Lưu vào kho & Công khai
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
