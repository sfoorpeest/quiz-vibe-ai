import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Printer, Eye, Edit3, Plus, Trash2,
  FileText, GraduationCap, ChevronDown, Save, Sparkles,
  ClipboardList, Search, X, Users, FolderOpen, Share2, Check, Download, Bookmark, Heart
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
import { useItemPreference } from '../context/ItemPreferenceContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { eduService } from '../services/eduService';
import { toast } from 'react-hot-toast';
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
  const { ensureStates, getState, toggleSaved, toggleFavorite, isPending, revision } = useItemPreference();

  // ─── State ───
  const [worksheets, setWorksheets] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || id || null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignGroup, setShowAssignGroup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [worksheetFilter, setWorksheetFilter] = useState('all');
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');

  // ─── Fetch Data ───
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [wsRes, groupsRes] = await Promise.all([
        eduService.getAllWorksheets(),
        eduService.getGroups()
      ]);
      
      // Transform backend data to frontend structure if needed
      const transformedWs = wsRes.map(ws => {
        let blocks = [];
        try {
          const content = typeof ws.content === 'string' ? JSON.parse(ws.content) : ws.content;
          
          // Kiểm tra xem content đã là mảng các blocks chưa (có trường 'type')
          if (Array.isArray(content) && content.length > 0 && content[0].type) {
            blocks = content;
          } else {
            // Nếu là dạng cũ (chỉ có mảng câu hỏi AI sinh), chuyển sang blocks
            blocks = [
              { id: `blk-h-${ws.id}`, type: 'header', data: { schoolName: '', className: '', studentName: '', phone: '' } },
              ...(Array.isArray(content) ? content : []).map((q, idx) => ({
                id: `blk-q-${ws.id}-${idx}`,
                type: 'open_question',
                data: { question: q.question, lines: 4 }
              }))
            ];
          }
        } catch (e) {
          console.error("Failed to parse worksheet content:", e);
          blocks = [];
        }
        return {
          ...ws,
          subtitle: ws.subtitle || 'Phiếu học tập AI sinh',
          subject: ws.subject || 'AI Generated',
          grade: ws.grade || 'Tất cả',
          blocks
        };
      });

      setWorksheets(transformedWs);
  setGroups(groupsRes);

      if (user && transformedWs.length > 0) {
        try {
          const ids = transformedWs.map((ws) => String(ws.id));
          await ensureStates('assignment', ids);
        } catch (error) {
          console.error('Không thể tải trạng thái phiếu học tập:', error);
        }
      }
      
      // If we came from a redirect with an ID, select it
      const queryId = searchParams.get('id');
      if (queryId) setSelectedId(Number(queryId));
      
    } catch (error) {
      console.error('WorksheetBuilder fetchData error:', error);
      setLoadError('Không thể tải danh sách phiếu học tập.');
      toast.error('Không thể tải danh sách phiếu học tập');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorksheet = async (wsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu học tập này không?')) return;
    
    try {
      await eduService.deleteWorksheet(wsId);
      toast.success('Đã xóa phiếu học tập');
      if (String(selectedId) === String(wsId)) setSelectedId(null);
      fetchData();
    } catch (error) {
      console.error('Delete Worksheet Error:', error);
      toast.error('Không thể xóa phiếu học tập');
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const shareUrl = `${window.location.origin}/shared/worksheet/${selectedId}`;

  // ─── Share Handler ───
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(selectedId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchSubmissions = async (wsId) => {
    try {
      setLoadingSubmissions(true);
      const data = await eduService.getWorksheetSubmissions(wsId);
      setSubmissions(data);
    } catch (error) {
      console.error('Fetch Submissions Error:', error);
      toast.error('Không thể tải danh sách bài nộp');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleUpdateFeedback = async () => {
    if (!selectedSubmission) return;
    try {
      await eduService.updateSubmissionFeedback(selectedSubmission.id, { feedback, score });
      toast.success('Đã lưu nhận xét');
      fetchSubmissions(selectedId);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Update Feedback Error:', error);
      toast.error('Không thể lưu nhận xét');
    }
  };

  // ─── Group helpers ───
  const filterGroup = filterGroupId ? groups.find(g => g.id === filterGroupId) : null;
  const getGroupName = (gId) => groups.find(g => g.id === gId)?.name || gId;
  const getGroupColor = (gId) => groups.find(g => g.id === gId)?.color || '#64748b';

  // ─── Current worksheet ───
  const currentWorksheet = useMemo(
    () => worksheets.find(w => String(w.id) === String(selectedId)),
    [worksheets, selectedId]
  );
  const currentWorksheetState = currentWorksheet
    ? getState('assignment', currentWorksheet.id)
    : { isSaved: false, isFavorite: false };

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

    if (worksheetFilter === 'saved') {
      list = list.filter((w) => getState('assignment', w.id).isSaved);
    }

    if (worksheetFilter === 'favorite') {
      list = list.filter((w) => getState('assignment', w.id).isFavorite);
    }

    return list;
  }, [worksheets, searchQuery, filterGroupId, worksheetFilter, getState, revision]);

  const toggleWorksheetSaved = async (worksheetId, currentState) => {
    try {
      await toggleSaved('assignment', String(worksheetId));
    } catch (error) {
      console.error('Toggle save worksheet failed:', error);
    }
  };

  const toggleWorksheetFavorite = async (worksheetId, currentState) => {
    try {
      await toggleFavorite('assignment', String(worksheetId));
    } catch (error) {
      console.error('Toggle favorite worksheet failed:', error);
    }
  };

  // ─── Toggle group assignment ───
  const toggleGroupAssignment = async (groupId) => {
    if (!currentWorksheet) return;
    
    const current = currentWorksheet.assignedTo || [];
    const newAssigned = current.includes(groupId)
      ? current.filter(id => id !== groupId)
      : [...current, groupId];

    try {
      // Nếu là phiếu đã lưu trong DB thì gọi API cập nhật luôn
      if (!String(currentWorksheet.id).startsWith('ws-')) {
        await eduService.assignWorksheetToGroups(currentWorksheet.id, newAssigned);
        toast.success('Đã cập nhật gán nhóm');
      }
      
      setWorksheets(prev => prev.map(ws => {
        if (ws.id !== selectedId) return ws;
        return { ...ws, assignedTo: newAssigned };
      }));
    } catch (error) {
      console.error('Assign Group Error:', error);
      toast.error('Không thể cập nhật gán nhóm');
    }
  };

  // ─── Save Worksheet to Backend ───
  const handleSaveWorksheet = async () => {
    if (!currentWorksheet) return;
    
    try {
      setLoading(true);
      const payload = {
        title: currentWorksheet.title,
        material_id: currentWorksheet.material_id,
        content: currentWorksheet.blocks
      };

      if (String(currentWorksheet.id).startsWith('ws-')) {
        // Tạo mới
        const result = await eduService.createWorksheet(payload);
        toast.success('Đã tạo phiếu học tập mới');
        
        // Nếu có gán nhóm sẵn, hãy gán luôn
        if (currentWorksheet.assignedTo?.length > 0) {
          await eduService.assignWorksheetToGroups(result.id, currentWorksheet.assignedTo);
        }
        
        setSelectedId(result.id);
      } else {
        // Cập nhật
        await eduService.updateWorksheet(currentWorksheet.id, payload);
        toast.success('Đã lưu thay đổi');
      }
      await fetchData();
    } catch (error) {
      console.error('Save Worksheet Error:', error);
      toast.error('Không thể lưu phiếu học tập');
    } finally {
      setLoading(false);
    }
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
      <div className="no-print">
        <AnimatedBackground />
        <Navbar />
      </div>

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
                <div className="flex items-center gap-2 pb-2">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'saved', label: 'Đã lưu' },
                    { id: 'favorite', label: 'Yêu thích' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setWorksheetFilter(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${worksheetFilter === opt.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-slate-900/60 border-slate-700/40 text-slate-400 hover:text-slate-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {filteredWorksheets.map(ws => (
                  (() => {
                    const wsState = getState('assignment', ws.id);
                    const wsIsSaved = wsState.isSaved;
                    const wsIsFavorite = wsState.isFavorite;
                    return (
                  <div
                    key={ws.id}
                    onClick={() => { setSelectedId(ws.id); setEditMode(false); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(ws.id);
                        setEditMode(false);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                      String(selectedId) === String(ws.id)
                        ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-lg'
                        : 'bg-slate-900/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${String(selectedId) === String(ws.id) ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {ws.title}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isPending('assignment', ws.id, 'save')}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorksheetSaved(ws.id, wsIsSaved);
                          }}
                          className={`h-6 w-6 rounded-md border flex items-center justify-center ${wsIsSaved ? 'border-amber-400/50 bg-amber-500/10 text-amber-300' : 'border-slate-700 text-slate-400 hover:text-amber-300'}`}
                          title={wsIsSaved ? 'Bỏ lưu' : 'Lưu'}
                        >
                          <Bookmark className={`w-3 h-3 ${wsIsSaved ? 'fill-amber-300' : ''}`} />
                        </button>
                        <button
                          type="button"
                          disabled={isPending('assignment', ws.id, 'favorite')}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorksheetFavorite(ws.id, wsIsFavorite);
                          }}
                          className={`h-6 w-6 rounded-md border flex items-center justify-center ${wsIsFavorite ? 'border-rose-400/50 bg-rose-500/10 text-rose-300' : 'border-slate-700 text-slate-400 hover:text-rose-300'}`}
                          title={wsIsFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                        >
                          <Heart className={`w-3 h-3 ${wsIsFavorite ? 'fill-rose-300' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorksheet(ws.id);
                          }}
                          className="h-6 w-6 rounded-md border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all"
                          title="Xóa phiếu"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
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
                  </div>
                    );
                  })()
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
                    material_id: null,
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
            {loadError && !loading ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center mb-6">
                <p className="text-red-300 font-bold mb-2">Không thể tải phiếu học tập</p>
                <p className="text-slate-400 text-sm mb-4">{loadError}</p>
                <button onClick={fetchData} className="ws-toolbar-btn ws-toolbar-btn-secondary mx-auto">
                  Thử lại
                </button>
              </div>
            ) : null}

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
                      type="button"
                      disabled={isPending('assignment', currentWorksheet.id, 'save')}
                      onClick={() => toggleWorksheetSaved(currentWorksheet.id, currentWorksheetState.isSaved)}
                      className={`ws-toolbar-btn ws-toolbar-btn-secondary ${currentWorksheetState.isSaved ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : ''}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${currentWorksheetState.isSaved ? 'fill-amber-300' : ''}`} />
                      {currentWorksheetState.isSaved ? 'Đã lưu' : 'Lưu'}
                    </button>

                    <button
                      type="button"
                      disabled={isPending('assignment', currentWorksheet.id, 'favorite')}
                      onClick={() => toggleWorksheetFavorite(currentWorksheet.id, currentWorksheetState.isFavorite)}
                      className={`ws-toolbar-btn ws-toolbar-btn-secondary ${currentWorksheetState.isFavorite ? 'text-rose-300 border-rose-500/30 bg-rose-500/10' : ''}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${currentWorksheetState.isFavorite ? 'fill-rose-300' : ''}`} />
                      {currentWorksheetState.isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                    </button>

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
                            {groups.map(g => {
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
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: `${g.color || '#64748b'}20`, color: g.color || '#64748b' }}>
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

                    <button onClick={() => handleDeleteWorksheet(currentWorksheet.id)} className="ws-toolbar-btn ws-toolbar-btn-secondary text-red-400 hover:bg-red-500/10 hover:border-red-500/30" title="Xóa phiếu">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={handleSaveWorksheet} 
                      disabled={loading}
                      className="ws-toolbar-btn ws-toolbar-btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                    >
                      <Save className="w-4 h-4" /> 
                      {loading ? 'Đang lưu...' : (String(currentWorksheet.id).startsWith('ws-') ? 'Tạo phiếu' : 'Lưu thay đổi')}
                    </button>

                    <button onClick={() => { setShowSubmissions(true); fetchSubmissions(selectedId); }} className="ws-toolbar-btn ws-toolbar-btn-secondary">
                      <GraduationCap className="w-4 h-4" /> Kết quả
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

      <div className="no-print">
        <Footer />
      </div>

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

      {/* ═══ SUBMISSIONS MODAL ═══ */}
      {showSubmissions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 no-print">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowSubmissions(false)}></div>
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/50 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                  <GraduationCap className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Kết quả bài làm học sinh</h3>
                  <p className="text-slate-400 text-sm font-medium">Phiếu: {currentWorksheet?.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSubmissions(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left: Submission List */}
              <div className="w-full lg:w-1/3 border-r border-slate-700/50 overflow-y-auto p-6 bg-slate-900/30">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Danh sách bài nộp ({submissions.length})</h4>
                {loadingSubmissions ? (
                  <div className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm font-bold">Đang tải...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="py-20 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-bold">Chưa có bài nộp nào</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSubmission(s);
                          setFeedback(s.feedback || '');
                          setScore(s.score || '');
                        }}
                        className={`w-full text-left p-4 rounded-2xl transition-all border ${
                          selectedSubmission?.id === s.id
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-white text-sm truncate">{s.student_name}</p>
                          {s.score !== null && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                              {s.score}đ
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mb-2">{s.student_email}</p>
                        <p className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3 text-emerald-500" /> {new Date(s.submitted_at).toLocaleString('vi-VN')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Submission Detail & Feedback */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-900/10">
                {!selectedSubmission ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                    <Eye className="w-16 h-16 text-slate-800 mb-4" />
                    <h4 className="text-slate-400 font-bold">Chọn một học sinh để xem chi tiết</h4>
                    <p className="text-slate-600 text-sm mt-2">Nội dung bài làm và phần nhận xét sẽ hiện ở đây.</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Student Info Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-2xl font-black text-white">{selectedSubmission.student_name}</h4>
                        <p className="text-slate-400 text-sm font-medium">{selectedSubmission.student_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Nộp bài lúc</p>
                        <p className="text-sm text-slate-300 font-bold">{new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>

                    {/* Answers Display */}
                    <div className="space-y-6">
                      <h5 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Nội dung trả lời
                      </h5>
                      <div className="space-y-4">
                        {(() => {
                          try {
                            const answers = typeof selectedSubmission.answers === 'string' 
                              ? JSON.parse(selectedSubmission.answers) 
                              : selectedSubmission.answers;
                            
                            return answers.map((ans, idx) => {
                              const block = currentWorksheet?.blocks?.find(b => b.id === ans.question_id);
                              const answerData = ans.answer || {};
                              
                              let content;
                              if (typeof answerData === 'string') {
                                content = answerData;
                              } else if (block?.type === 'header') {
                                content = `Họ tên: ${answerData.studentName || '...'} | Lớp: ${answerData.className || '...'} | SĐT: ${answerData.phone || '...'}`;
                              } else if (block?.type === 'open_question') {
                                content = (answerData.lines || []).join('\n');
                              } else if (block?.type === 'fill_in_blank') {
                                content = (answerData.items || []).map((it, i) => `${i+1}. ${it}`).join('\n');
                              } else if (block?.type === 'table') {
                                content = (answerData.rows || []).map((rowLines, i) => {
                                  const rowLabel = block.data.rows[i]?.label || `Mục ${i+1}`;
                                  return `${rowLabel}: ${rowLines.join(', ')}`;
                                }).join('\n');
                              } else if (block?.type === 'two_column_table') {
                                content = (answerData.cells || []).map((row, i) => row.join(' | ')).join('\n');
                              } else {
                                content = JSON.stringify(answerData);
                              }

                              return (
                                <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 shadow-sm">
                                  <p className="text-slate-400 text-xs font-black uppercase mb-2">
                                    Câu {idx + 1}: {block?.data?.question || (block?.type === 'header' ? 'Thông tin học sinh' : 'Câu hỏi')}
                                  </p>
                                  <div className="text-slate-100 text-base whitespace-pre-wrap font-medium">
                                    {content || <span className="italic text-slate-600">(Không có câu trả lời)</span>}
                                  </div>
                                </div>
                              );
                            });
                          } catch (e) {
                            return <p className="text-red-400">Lỗi hiển thị câu trả lời: {e.message}</p>;
                          }
                        })()}
                      </div>
                    </div>

                    {/* Feedback Form */}
                    <div className="pt-8 border-t border-slate-700/50 space-y-6">
                      <h5 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Edit3 className="w-4 h-4" /> Nhận xét & Chấm điểm
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Nhận xét của giáo viên</label>
                          <textarea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Nhập nhận xét của bạn về bài làm..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 min-h-[120px] transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Điểm số</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={score}
                            onChange={e => setScore(e.target.value)}
                            placeholder="10"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl p-4 text-white text-center font-black text-2xl focus:outline-none focus:border-cyan-500/50 transition-all"
                          />
                          <p className="text-[10px] text-center text-slate-600 mt-2 font-bold">Thang điểm 10</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setSelectedSubmission(null)}
                          className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all"
                        >
                          Hủy
                        </button>
                        <button 
                          onClick={handleUpdateFeedback}
                          className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Lưu nhận xét
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
