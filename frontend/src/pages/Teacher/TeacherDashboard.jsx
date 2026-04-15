import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileSpreadsheet, Share2, FileText, Globe, 
  Plus, CheckCircle, X, ArrowLeft 
} from 'lucide-react';

// Import Footer và các Widget
import Footer from '../../components/Footer'; // Đảm bảo đường dẫn này đúng với dự án của bạn
import { TeacherGroupCard, WorksheetTable, MaterialCard } from '../../components/Teacher/TeacherWidgets';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);

  // ==================== DỮ LIỆU & STATE (GIỮ NGUYÊN) ====================
  const [materials] = useState([
    { id: 1, title: "Quản lý Đồ án Nhóm 5", date: "8/4/2026", author: "nhann1" },
    { id: 2, title: "Báo cáo Khoa học: Cấu trúc Hệ Mặt Trời", date: "7/4/2026", author: "Nguyễn Văn Lâm" },
    { id: 3, title: "Chuyên đề: Lỗ Đen và Những Bí Ẩn", date: "6/4/2026", author: "Nguyễn Văn Lâm" }
  ]);

  const [groups, setGroups] = useState([
    { id: 1, name: "Lớp 12A1", count: 42, type: "class" },
    { id: 2, name: "Nhóm 5 - Đồ án", count: 5, type: "group" },
  ]);

  const [worksheets, setWorksheets] = useState([
    { id: 1, title: "Kiểm tra Chương 1 - AI cơ bản", submitted: 25, total: 40, deadline: "15/04/2026" },
  ]);

  const [toast, setToast] = useState(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  // ==================== LOGIC XỬ LÝ (GIỮ NGUYÊN) ====================
  const showToast = (title) => {
    const today = new Date().toLocaleDateString('vi-VN');
    setToast({ title, date: today });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = (type, materialId) => {
    if (type === 'share') {
      setIsShareModalOpen(true);
    } else if (type === 'create-worksheet') {
      const material = materials.find(m => m.id === materialId);
      if (material) {
        setWorksheets(prev => [{
          id: Date.now(),
          title: material.title,
          submitted: 0,
          total: 40,
          deadline: new Date().toLocaleDateString('vi-VN')
        }, ...prev]);
        showToast(material.title);
      }
    }
  };

  const copyToClipboard = (id) => {
    const fullLink = `${window.location.origin}/learn/${id}`;
    navigator.clipboard.writeText(fullLink);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return alert("Vui lòng nhập tên nhóm!");
    setGroups([...groups, { id: Date.now(), name: newGroup.name, count: 0, type: 'group' }]);
    setIsCreateGroupModalOpen(false);
    setNewGroup({ name: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans relative overflow-x-hidden flex flex-col">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-sky-600/15 rounded-full blur-[160px]" />
      </div>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-sm font-bold tracking-widest uppercase text-blue-400">Dashboard</span>
               <div className="h-1 w-1 bg-slate-600 rounded-full" />
               <span className="text-sm font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">AI Workspace</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Bảng điều khiển Giáo viên</h1>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsShareModalOpen(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3.5 rounded-[1.25rem] font-bold flex items-center gap-2 hover:bg-white/10 transition-all backdrop-blur-md">
                <Share2 size={18} /> Chia sẻ nhanh
             </button>
          </div>
        </header>

        {/* NÚT QUAY LẠI DASHBOARD - NẰM TRÊN TAB */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20 transition-all font-bold text-sm group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại Dashboard
          </button>
        </div>

        {/* TABS */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-white/5 w-fit rounded-[1.5rem] mb-10 border border-white/10 backdrop-blur-xl">
           {[
             { id: 'all', label: 'Tổng quan', icon: <Globe size={18}/> },
             { id: 'groups', label: 'Nhóm học sinh', icon: <Users size={18}/> },
             { id: 'worksheets', label: 'Phiếu học tập', icon: <FileSpreadsheet size={18}/> },
           ].map((tab) => (
             <button 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id)} 
               className={`flex items-center gap-2 px-6 py-3 rounded-[1.1rem] text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
        </div>

        {/* TAB CONTENT AREAS (GIỮ NGUYÊN CODE CŨ) */}
        <div className="transition-all mb-20">
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <section className="lg:col-span-2 space-y-10">
                <div className="space-y-5">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><FileText size={20}/></div>
                    Học liệu gần đây
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {materials.slice(0, 2).map(item => (
                      <MaterialCard 
                        key={item.id}
                        title={item.title}
                        date={item.date}
                        author={item.author}
                        onShare={() => handleAction('share', item.id)}
                        onCreateWorksheet={() => handleAction('create-worksheet', item.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                      <div className="p-2 bg-violet-500/20 rounded-xl text-violet-400"><FileSpreadsheet size={20}/></div>
                      Phiếu học tập AI
                    </h2>
                    <button onClick={() => setActiveTab('worksheets')} className="text-sm font-bold text-blue-400 hover:underline">Xem tất cả</button>
                  </div>
                  <WorksheetTable />
                </div>
              </section>

              <aside className="space-y-8">
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Users size={20}/></div>
                    Nhóm học sinh
                  </h2>
                  <div className="space-y-4">
                    {groups.map(group => (
                      <div key={group.id} className="cursor-pointer group/card">
                        <TeacherGroupCard name={group.name} count={group.count} color="bg-blue-500/10" textColor="text-blue-400" />
                      </div>
                    ))}
                    <button onClick={() => setIsCreateGroupModalOpen(true)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-blue-400 transition-all flex items-center justify-center gap-2">
                       <Plus size={18}/> Thêm nhóm mới
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
              {groups.map(group => (
                <div key={group.id}>
                  <TeacherGroupCard name={group.name} count={group.count} color="bg-white/5" textColor="text-blue-400" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'worksheets' && (
            <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 animate-in fade-in">
              <WorksheetTable />
            </div>
          )}
        </div>
      </main>

      {/* FOOTER - Đã tích hợp file Footer của bạn */}
      <Footer />

      {/* NOTIFICATIONS & MODALS (GIỮ NGUYÊN) */}
      {toast && (
        <div className="fixed bottom-24 right-8 z-[300] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4">
          <CheckCircle size={28} />
          <div>
            <p className="font-bold">{toast.title}</p>
            <p className="text-sm opacity-90">Đã tạo phiếu thành công vào {toast.date}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 text-white/70 hover:text-white">×</button>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsShareModalOpen(false)} />
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 border border-white/10 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-black text-white">Chia sẻ nhanh</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
              {materials.map(file => (
                <div key={file.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-4">
                    <FileText className="text-blue-400" />
                    <span className="font-bold text-white truncate w-40">{file.title}</span>
                  </div>
                  <button onClick={() => copyToClipboard(file.id)} className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${copySuccess === file.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {copySuccess === file.id ? 'Đã copy' : 'Copy Link'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-black mb-6 text-white">Tạo nhóm mới</h3>
            <input
              type="text"
              placeholder="Tên nhóm học sinh"
              value={newGroup.name}
              onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-6 text-white outline-none focus:border-blue-500 transition-all"
            />
            <button onClick={handleCreateGroup} className="w-full bg-violet-600 hover:bg-violet-500 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95">
              Xác nhận tạo
            </button>
            <button onClick={() => setIsCreateGroupModalOpen(false)} className="w-full py-4 text-slate-400 hover:text-white mt-2">Hủy bỏ</button>
          </div>
        </div>
      )}
    </div>
  );
}