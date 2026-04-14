import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, Link as LinkIcon, FileText, CheckCircle, 
  BrainCircuit, Tag as TagIcon, ArrowLeft, Loader2, 
  Save, Sparkles, X, FileQuestion, Plus, AlertTriangle
} from 'lucide-react';
import api from '../api/axiosClient';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';

export default function UploadCenter() {
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('IDLE'); 
  const [activeTab, setActiveTab] = useState('file'); 
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [linkInput, setLinkInput] = useState('');

  const [aiStages, setAiStages] = useState({
    extract: false,
    summary: false,
    tagging: false
  });

  const [previewData, setPreviewData] = useState({
    title: '',
    summary: '',
    tags: []
  });

  const [displayedSummary, setDisplayedSummary] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const startProcessing = async () => {
    if (!file && !linkInput.trim()) return;
    setStatus('PROCESSING');
    setAiStages({ extract: false, summary: false, tagging: false });

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Mock tiến trình bóc tách
        setTimeout(() => setAiStages(p => ({ ...p, extract: true })), 800);
        response = await api.post('/api/edu/extract-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        setTimeout(() => setAiStages(p => ({ ...p, extract: true })), 800);
        response = await api.post('/api/edu/extract-file', { url: linkInput.trim() });
      }

      setAiStages({ extract: true, summary: true, tagging: true });

      const { title, summary, tags, lessonContent } = response.data.data;

      setPreviewData({
        title: title || file?.name || "Tài liệu mới",
        summary: summary || "Tóm tắt không có sẵn.",
        tags: tags || ["Học liệu"],
        lessonContent: lessonContent || ""
      });

      setStatus('PREVIEW');
    } catch (error) {
      console.error("Lỗi xử lý:", error);
      showToast(error.response?.data?.message || "Hệ thống AI hiện đang bận.", "error");
      setStatus('IDLE');
    }
  };

  const handleSaveToDB = async () => {
    try {
      // Logic gộp Tag vào description để giữ nguyên cấu trúc DB
      const tagString = previewData.tags?.length > 0 ? `[TAGS:${previewData.tags.join(',')}]` : "";
      const combinedDescription = tagString + (previewData.summary || "");

      await api.post('/api/edu/materials', {
        title: previewData.title,
        description: combinedDescription,
        content_url: file ? `uploads/${file.name}` : linkInput,
        content: previewData.lessonContent || previewData.summary
      });

      showToast("Đã lưu học liệu thành công vào thư viện!", "success");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      showToast("Lỗi khi lưu học liệu vào máy chủ", "error");
    }
  };

  useEffect(() => {
    if (status === 'PREVIEW' && previewData.summary) {
      let index = 0;
      setDisplayedSummary('');
      const typingInterval = setInterval(() => {
        setDisplayedSummary((old) => old + previewData.summary.charAt(index));
        index++;
        if (index >= previewData.summary.length) clearInterval(typingInterval);
      }, 10);
      return () => clearInterval(typingInterval);
    }
  }, [status, previewData.summary]);

  return (
    <div className="relative min-h-screen text-slate-50 flex flex-col overflow-x-hidden">
      <AnimatedBackground />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-slate-900/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group transition-all">
            <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-200">Quay lại Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-blue-300 uppercase">AI Processor</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center py-12">
        <main className="max-w-3xl mx-auto px-6 w-full relative z-10">
          
          {/* TRẠNG THÁI: CHỜ (IDLE) */}
          {status === 'IDLE' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">Nạp dữ liệu cho <span className="text-blue-500">AI</span></h1>
                <p className="text-slate-400 text-lg font-medium">Chọn tài liệu tốt nhất để AI giúp bạn soạn bài giảng thần tốc</p>
              </div>

              <div className="flex p-1.5 bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-[1.5rem] max-w-sm mx-auto mb-10 shadow-2xl">
                {['file', 'link'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab === 'file' ? <UploadCloud size={18}/> : <LinkIcon size={18}/>}
                    {tab === 'file' ? 'Tải Tệp Tin' : 'Dán URL'}
                  </button>
                ))}
              </div>

              {activeTab === 'file' ? (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); setFile(e.dataTransfer.files[0]); }}
                  className={`bg-slate-900/50 border-2 border-dashed rounded-[3rem] p-16 text-center transition-all duration-300
                    ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-700 hover:border-slate-500'}`}
                >
                   {file ? (
                     <div className="animate-in zoom-in">
                       <div className="w-20 h-20 bg-blue-600/20 text-blue-400 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-inner"><FileText size={40} /></div>
                       <h3 className="text-xl font-black text-white">{file.name}</h3>
                       <button onClick={() => setFile(null)} className="mt-6 text-red-400 font-bold hover:underline">Thay đổi file khác</button>
                     </div>
                   ) : (
                     <label htmlFor="file-up" className="cursor-pointer">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform shadow-xl"><UploadCloud size={40} className="text-blue-500" /></div>
                        <h3 className="text-2xl font-black mb-2">Kéo thả file vào đây</h3>
                        <p className="text-slate-500 font-medium">Hỗ trợ PDF, Word, TXT (Max 20MB)</p>
                        <input type="file" id="file-up" className="hidden" onChange={handleFileSelect} />
                     </label>
                   )}
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-700 rounded-[3rem] p-12 animate-in fade-in">
                   <h3 className="text-xl font-black text-center mb-8">Nhập liên kết bài giảng/website</h3>
                   <input 
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com/bai-hoc..."
                    className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all font-bold shadow-inner"
                   />
                </div>
              )}

              <div className="flex justify-center mt-12">
                <button 
                  onClick={startProcessing}
                  disabled={!file && !linkInput}
                  className="bg-white text-slate-900 px-12 py-5 rounded-full font-black text-xl hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 disabled:opacity-30 active:scale-95 flex items-center gap-4"
                >
                  <BrainCircuit /> Bắt đầu Phân tích AI
                </button>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: ĐANG XỬ LÝ (PROCESSING) */}
          {status === 'PROCESSING' && (
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-12 text-center animate-in zoom-in-95 shadow-2xl max-w-md mx-auto">
              <div className="relative w-32 h-32 mx-auto mb-10">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                <div className="relative w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-4 border-blue-500 shadow-lg shadow-blue-500/20">
                  <BrainCircuit className="w-14 h-14 text-blue-400 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-black mb-10">AI đang "đọc" tài liệu...</h2>
              <div className="space-y-4 text-left">
                {[
                  { key: 'extract', label: 'Bóc tách văn bản' },
                  { key: 'summary', label: 'Tóm tắt nội dung' },
                  { key: 'tagging', label: 'Phân loại chủ đề' }
                ].map((stage, i) => (
                  <div key={stage.key} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${aiStages[stage.key] ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}>
                    {aiStages[stage.key] ? <CheckCircle className="text-emerald-400" size={20}/> : <Loader2 className="animate-spin text-blue-400" size={20}/>}
                    <span className={`font-bold ${aiStages[stage.key] ? 'text-emerald-400' : 'text-slate-400'}`}>{i+1}. {stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: XEM TRƯỚC (PREVIEW) */}
          {status === 'PREVIEW' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-black italic">Preview <span className="text-blue-500">AI</span></h1>
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 font-black text-sm flex items-center gap-2">
                  <CheckCircle size={16}/> Sẵn sàng lưu
                </div>
              </div>

              <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-sm">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Tiêu đề học liệu</label>
                  <input 
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-2xl font-black text-white focus:border-blue-500 outline-none"
                    value={previewData.title}
                    onChange={(e) => setPreviewData({...previewData, title: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Tóm tắt bởi AI</label>
                  <textarea 
                    rows="6"
                    className="w-full bg-slate-800/50 border border-white/5 rounded-[2rem] px-8 py-6 text-slate-300 font-medium leading-relaxed focus:border-blue-500 outline-none resize-none"
                    value={displayedSummary}
                    onChange={(e) => setDisplayedSummary(e.target.value)}
                  />
                  <div className="absolute top-2 right-4 text-blue-500/20"><Sparkles size={40}/></div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 block ml-2">Chủ đề (AI Tags)</label>
                  <div className="flex flex-wrap gap-3">
                    {previewData.tags.map((tag, idx) => (
                      <span key={idx} className="bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                        #{tag} <X size={14} className="cursor-pointer hover:text-white" onClick={() => setPreviewData({...previewData, tags: previewData.tags.filter(t => t !== tag)})}/>
                      </span>
                    ))}
                    <button className="px-4 py-2 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-blue-500 hover:border-blue-500 transition-all font-bold text-sm flex items-center gap-2">
                      <Plus size={16}/> Thêm tag
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStatus('IDLE')} className="flex-1 py-5 rounded-[1.5rem] font-black text-slate-400 hover:text-white hover:bg-white/5 transition-all">Làm lại</button>
                <button onClick={handleSaveToDB} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  <Save /> Xuất bản học liệu
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-10">
          <div className={`px-8 py-5 rounded-[2rem] shadow-2xl border backdrop-blur-xl flex items-center gap-4 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'}`}>
            {toast.type === 'error' ? <AlertTriangle /> : <CheckCircle />}
            <span className="font-black">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}