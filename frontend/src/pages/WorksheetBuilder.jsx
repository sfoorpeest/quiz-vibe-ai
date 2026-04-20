import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Printer, Eye, Edit3, Plus, Trash2,
  FileText, GraduationCap, ChevronDown, Save, Sparkles,
  ClipboardList, Search, X, Users, FolderOpen, Share2, Check, Download
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { MOCK_WORKSHEETS } from '../data/mockWorksheets';
import { MOCK_GROUPS } from '../data/mockGroups';
import {
  HeaderBlock,
  TableBlock,
  TwoColumnTableBlock,
  OpenQuestionBlock,
  FillInBlankBlock,
} from '../components/worksheet/WorksheetBlocks';
import '../components/worksheet/worksheet.css';

// ═══════════════════════════════════════════════════════════════
// WORKSHEET BUILDER — Giai đoạn 2
// Trình tạo & xem trước phiếu học tập động
// ═══════════════════════════════════════════════════════════════

export default function WorksheetBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const filterGroupId = searchParams.get('group'); // Lọc theo nhóm nếu đến từ trang Groups
  const { user } = useAuth();

  // ─── State ───
  const [worksheets, setWorksheets] = useState(MOCK_WORKSHEETS);
  const [selectedId, setSelectedId] = useState(id || null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignGroup, setShowAssignGroup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const shareUrl = `${window.location.origin}/shared/worksheet/${selectedId}`;

  // ─── Share Handler ───
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(selectedId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Group helpers ───
  const filterGroup = filterGroupId ? MOCK_GROUPS.find(g => g.id === filterGroupId) : null;
  const getGroupName = (gId) => MOCK_GROUPS.find(g => g.id === gId)?.name || gId;
  const getGroupColor = (gId) => MOCK_GROUPS.find(g => g.id === gId)?.color || '#64748b';

  // ─── Current worksheet ───
  const currentWorksheet = useMemo(
    () => worksheets.find(w => w.id === selectedId),
    [worksheets, selectedId]
  );

  const filteredWorksheets = useMemo(() => {
    let list = worksheets;
    // Lọc theo nhóm nếu đến từ trang Groups
    if (filterGroupId) {
      list = list.filter(w => w.assignedTo?.includes(filterGroupId));
    }
    // Lọc theo search
    if (searchQuery) {
      list = list.filter(w =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [worksheets, searchQuery, filterGroupId]);

  // ─── Toggle group assignment ───
  const toggleGroupAssignment = (groupId) => {
    setWorksheets(prev => prev.map(ws => {
      if (ws.id !== selectedId) return ws;
      const current = ws.assignedTo || [];
      const newAssigned = current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId];
      return { ...ws, assignedTo: newAssigned };
    }));
  };

  // ─── Block update handler ───
  const updateBlock = (blockId, newData) => {
    setWorksheets(prev => prev.map(ws => {
      if (ws.id !== selectedId) return ws;
      return {
        ...ws,
        blocks: ws.blocks.map(b =>
          b.id === blockId ? { ...b, data: newData } : b
        ),
      };
    }));
  };

  // ─── Worksheet metadata update ───
  const updateWorksheetMeta = (field, value) => {
    setWorksheets(prev => prev.map(ws =>
      ws.id === selectedId ? { ...ws, [field]: value } : ws
    ));
  };

  // ─── Add new block ───
  const addBlock = (type) => {
    const newBlock = {
      id: `blk-${Date.now()}`,
      type,
      data: getDefaultBlockData(type),
    };
    setWorksheets(prev => prev.map(ws => {
      if (ws.id !== selectedId) return ws;
      return { ...ws, blocks: [...ws.blocks, newBlock] };
    }));
  };

  // ─── Remove block ───
  const removeBlock = (blockId) => {
    setWorksheets(prev => prev.map(ws => {
      if (ws.id !== selectedId) return ws;
      return { ...ws, blocks: ws.blocks.filter(b => b.id !== blockId) };
    }));
  };

  // ─── Print handler ───
  const handlePrint = () => {
    window.print();
  };

  // ─── Download Word handler (Similar to LearningView) ───
  const handleDownloadWord = () => {
    if (!currentWorksheet) return;
    
    // Tạo cấu trúc HTML đơn giản cho Word
    const contentHtml = currentWorksheet.blocks.map(block => {
      if (block.type === 'header') return '';
      if (block.type === 'open_question') {
        return `<p><strong>${block.data.question}</strong></p><p>${Array(block.data.lines).fill('................................................................................').join('<br/>')}</p>`;
      }
      return `<p><strong>${block.data.question || 'Câu hỏi'}</strong> (Trình bày trong bảng...)</p>`;
    }).join('<br/>');

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${currentWorksheet.title}</title></head>
      <body style="font-family: 'Times New Roman', serif;">
        <h1 style="text-align: center;">${currentWorksheet.title}</h1>
        <p style="text-align: center;">${currentWorksheet.subtitle}</p>
        <hr/>
        ${contentHtml}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorksheet.title.replace(/\s+/g, '_')}_QuizVibe.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Render a single block ───
  const renderBlock = (block) => {
    const props = {
      data: block.data,
      onChange: (newData) => updateBlock(block.id, newData),
      editable: editMode,
    };

    let blockComponent;
    switch (block.type) {
      case 'header':
        blockComponent = <HeaderBlock {...props} />;
        break;
      case 'table':
        blockComponent = <TableBlock {...props} />;
        break;
      case 'two_column_table':
        blockComponent = <TwoColumnTableBlock {...props} />;
        break;
      case 'open_question':
        blockComponent = <OpenQuestionBlock {...props} />;
        break;
      case 'fill_in_blank':
        blockComponent = <FillInBlankBlock {...props} />;
        break;
      default:
        blockComponent = <p className="text-slate-500 text-sm">Block không xác định: {block.type}</p>;
    }

    return (
      <div key={block.id} className="relative group/block">
        {blockComponent}
        {editMode && block.type !== 'header' && (
          <button
            onClick={() => removeBlock(block.id)}
            className="no-print absolute -right-3 -top-3 w-7 h-7 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-all hover:bg-red-500/30 text-sm font-bold"
            title="Xóa block"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  // ═══════════════════
  // RENDER
  // ═══════════════════
  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-8 relative z-10 pt-10 pb-24 flex-1">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 no-print">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm font-bold mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Phiếu Học Tập
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">
              Trình Tạo Phiếu Học Tập 📝
            </h1>
            <p className="text-slate-400 mt-2 text-base">Tạo và chỉnh sửa phiếu học tập động, in ấn phát cho học sinh.</p>
            {filterGroup && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-bold text-slate-500">Đang lọc theo:</span>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: `${filterGroup.color}15`, color: filterGroup.color, border: `1px solid ${filterGroup.color}30` }}>
                  <FolderOpen className="w-3.5 h-3.5" /> {filterGroup.name}
                </span>
                <Link to="/teacher/worksheets" className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">× Bỏ lọc</Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-lg">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{worksheets.length}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Phiếu</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN LAYOUT: Sidebar + Editor ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ─── LEFT: Worksheet List (1 col) ─── */}
          <div className="lg:col-span-1 no-print">
            <div className="sticky top-24 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-cyan-400' : 'text-slate-500'} transition-colors`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm phiếu..."
                  className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 font-medium rounded-xl pl-10 pr-9 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Worksheet cards */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredWorksheets.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setSelectedId(ws.id); setEditMode(false); }}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      selectedId === ws.id
                        ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-lg'
                        : 'bg-slate-900/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50'
                    }`}
                  >
                    <p className={`text-sm font-bold truncate ${selectedId === ws.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {ws.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1">{ws.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400">{ws.subject}</span>
                      <span className="text-[10px] text-slate-600">{ws.grade}</span>
                      {ws.assignedTo?.length > 0 && ws.assignedTo.map(gId => (
                        <span key={gId} className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${getGroupColor(gId)}15`, color: getGroupColor(gId) }}>
                          {getGroupName(gId)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Create new worksheet */}
              <button
                onClick={() => {
                  const newWs = {
                    id: `ws-${Date.now()}`,
                    title: 'Phiếu Học Tập Mới',
                    subtitle: 'Bài mới - Chủ đề',
                    subject: 'Môn học',
                    grade: 'Lớp',
                    createdAt: new Date().toISOString().slice(0, 10),
                    assignedTo: [],
                    blocks: [
                      {
                        id: `blk-h-${Date.now()}`,
                        type: 'header',
                        data: { schoolName: '', className: '', studentName: '', phone: '' },
                      },
                    ],
                  };
                  setWorksheets(prev => [...prev, newWs]);
                  setSelectedId(newWs.id);
                  setEditMode(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Tạo phiếu mới
              </button>
            </div>
          </div>

          {/* ─── RIGHT: Worksheet Editor / Preview (3 cols) ─── */}
          <div className="lg:col-span-3">
            {!currentWorksheet ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl p-20 text-center">
                <ClipboardList className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-lg mb-1">Chọn một phiếu học tập</p>
                <p className="text-slate-500 text-sm">Chọn từ danh sách bên trái hoặc tạo phiếu mới để bắt đầu.</p>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="ws-toolbar no-print">
                  <div className="ws-toolbar-left">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`ws-toolbar-btn ws-toolbar-btn-secondary ${editMode ? 'active' : ''}`}
                    >
                      {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      {editMode ? 'Xem trước' : 'Chỉnh sửa'}
                    </button>

                    {editMode && (
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs text-slate-500 font-bold">Thêm:</span>
                        <button onClick={() => addBlock('open_question')} className="ws-toolbar-btn ws-toolbar-btn-secondary text-xs" title="Câu hỏi tự luận">
                          + Câu hỏi
                        </button>
                        <button onClick={() => addBlock('table')} className="ws-toolbar-btn ws-toolbar-btn-secondary text-xs" title="Bảng key-value">
                          + Bảng
                        </button>
                        <button onClick={() => addBlock('two_column_table')} className="ws-toolbar-btn ws-toolbar-btn-secondary text-xs" title="Bảng 2 cột">
                          + Bảng 2 cột
                        </button>
                        <button onClick={() => addBlock('fill_in_blank')} className="ws-toolbar-btn ws-toolbar-btn-secondary text-xs" title="Điền vào chỗ trống">
                          + Điền khuyết
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="ws-toolbar-right">
                    <div className="relative">
                      <button
                        onClick={() => setShowAssignGroup(!showAssignGroup)}
                        className="ws-toolbar-btn ws-toolbar-btn-secondary"
                      >
                        <Users className="w-4 h-4" />
                        Gán nhóm
                        {currentWorksheet.assignedTo?.length > 0 && (
                          <span className="ml-1 text-[10px] font-black bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-md">
                            {currentWorksheet.assignedTo.length}
                          </span>
                        )}
                      </button>
                      {/* Dropdown gán nhóm */}
                      {showAssignGroup && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl z-20 p-3">
                          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Gán phiếu cho nhóm</p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {MOCK_GROUPS.map(g => {
                              const isAssigned = currentWorksheet.assignedTo?.includes(g.id);
                              return (
                                <button
                                  key={g.id}
                                  onClick={() => toggleGroupAssignment(g.id)}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all text-xs font-bold ${
                                    isAssigned
                                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25'
                                      : 'text-slate-400 hover:bg-slate-800/60 border border-transparent'
                                  }`}
                                >
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: `${g.color}20`, color: g.color }}>
                                    {g.name.charAt(0)}
                                  </div>
                                  <span className="flex-1 truncate">{g.name}</span>
                                  {isAssigned && <span className="text-cyan-400">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => setShowShareModal(true)} className="ws-toolbar-btn ws-toolbar-btn-secondary">
                      <Share2 className="w-4 h-4" /> Chia sẻ
                    </button>
                    
                    <button onClick={handleDownloadWord} className="ws-toolbar-btn ws-toolbar-btn-secondary" title="Tải file Word">
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button onClick={handlePrint} className="ws-toolbar-btn ws-toolbar-btn-primary">
                      <Printer className="w-4 h-4" /> In phiếu
                    </button>
                  </div>
                </div>

                {/* Worksheet Paper */}
                <div className="ws-paper">
                  {/* Title Section */}
                  <div className="ws-title-section">
                    {editMode ? (
                      <>
                        <input
                          className="ws-title-input"
                          value={currentWorksheet.title}
                          onChange={e => updateWorksheetMeta('title', e.target.value)}
                        />
                        <input
                          className="ws-subtitle-input"
                          value={currentWorksheet.subtitle}
                          onChange={e => updateWorksheetMeta('subtitle', e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="ws-title">{currentWorksheet.title}</h2>
                        <p className="ws-subtitle">{currentWorksheet.subtitle}</p>
                      </>
                    )}
                  </div>

                  {/* Blocks */}
                  <div className="space-y-1">
                    {currentWorksheet.blocks.map(block => renderBlock(block))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* ═══ SHARE MODAL ═══ */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 no-print">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute right-6 top-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                <Share2 className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-black text-white">Chia sẻ phiếu học tập</h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">Bất kỳ ai có liên kết đều có thể xem và in phiếu này.</p>
            </div>

            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-3xl w-fit mx-auto shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`} 
                  alt="QR Code"
                  className="w-40 h-40"
                />
              </div>

              {/* Link Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Đường dẫn chia sẻ</label>
                <div className="flex gap-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                  <input 
                    readOnly 
                    value={shareUrl}
                    className="flex-1 bg-transparent border-none text-slate-300 text-sm font-medium px-3 focus:outline-none"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      copiedId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    {copiedId ? 'ĐÃ CHÉP' : 'SAO CHÉP'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Phiếu học tập này sẽ được trình bày đẹp mắt, hỗ trợ in ấn tối ưu và không yêu cầu đăng nhập đối với học sinh.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: default data for new blocks ───
function getDefaultBlockData(type) {
  switch (type) {
    case 'header':
      return { schoolName: '', className: '', studentName: '', phone: '' };
    case 'table':
      return {
        question: 'Câu hỏi dạng bảng:',
        rows: [
          { label: 'Mục 1', lines: 2 },
          { label: 'Mục 2', lines: 2 },
        ],
      };
    case 'two_column_table':
      return {
        question: 'So sánh hai khái niệm:',
        columns: [
          { header: 'Cột A', sample: 'Ví dụ A' },
          { header: 'Cột B', sample: 'Ví dụ B' },
        ],
        rows: 4,
      };
    case 'open_question':
      return { question: 'Câu hỏi mới:', lines: 4 };
    case 'fill_in_blank':
      return {
        question: 'Điền vào chỗ trống:',
        items: [
          { prompt: 'Câu 1:', answer: '' },
          { prompt: 'Câu 2:', answer: '' },
        ],
      };
    default:
      return {};
  }
}
