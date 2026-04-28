import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, UserPlus, Search, X, Plus, Trash2, Edit3, ChevronDown,
  ChevronUp, Check, UserMinus, FolderOpen, GraduationCap,
  Sparkles, ArrowLeft, MoreHorizontal, Mail, ClipboardList
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { eduService } from '../services/eduService';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';

// ═══════════════════════════════════════════════════════════════
// TEACHER GROUP MANAGEMENT — Giai đoạn 1
// ═══════════════════════════════════════════════════════════════

const GROUP_COLORS = [
  '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444',
  '#10b981', '#ec4899', '#3b82f6', '#f97316',
];

export default function TeacherGroupManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ─── State ───
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState({}); // { groupId: { students: [], materials: [] } }
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // groupId to assign to
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // ─── Fetch Data ───
  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, studentsRes] = await Promise.all([
        eduService.getGroups(),
        eduService.getStudents()
      ]);
      setGroups(groupsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      toast.error('Không thể tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchGroupDetails = async (groupId) => {
    if (groupDetails[groupId]) return;
    try {
      const res = await eduService.getGroupDetails(groupId);
      setGroupDetails(prev => ({ ...prev, [groupId]: res.data }));
    } catch (error) {
      toast.error('Không thể tải chi tiết nhóm');
    }
  };

  // ─── Derived data ───
  const freeStudents = useMemo(
    () => students.filter(s => !s.group_id),
    [students]
  );

  const filteredFreeStudents = useMemo(
    () => freeStudents.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [freeStudents, searchQuery]
  );

  const getGroupStudents = (groupId) => students.filter(s => s.group_id === groupId);

  // ─── Handlers ───
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllFree = () => {
    const allFreeIds = filteredFreeStudents.map(s => s.id);
    const allSelected = allFreeIds.every(id => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !allFreeIds.includes(id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...allFreeIds])]);
    }
  };

  const assignStudentsToGroup = async (groupId) => {
    try {
      await eduService.addMembers(groupId, selectedStudents);
      toast.success('Đã thêm học sinh vào nhóm');
      setSelectedStudents([]);
      setShowAssignModal(false);
      setAssignTarget(null);
      fetchData(); // Reload
      // Clear group details to force refresh
      setGroupDetails(prev => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    } catch (error) {
      toast.error('Lỗi khi thêm học sinh');
    }
  };

  const removeStudentFromGroup = async (groupId, studentId) => {
    try {
      await eduService.removeMember(groupId, studentId);
      toast.success('Đã xóa học sinh khỏi lớp');
      fetchData();
      // Update local state without waiting for full refetch
      setGroupDetails(prev => {
        if (!prev[groupId]) return prev;
        return {
          ...prev,
          [groupId]: {
            ...prev[groupId],
            students: prev[groupId].students.filter(s => s.id !== studentId)
          }
        };
      });
    } catch (error) {
      toast.error('Lỗi khi xóa học sinh');
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await eduService.deleteGroup(groupId);
      toast.success('Đã xóa nhóm thành công');
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa nhóm');
    }
  };

  const createGroup = async (formData) => {
    try {
      await eduService.createGroup(formData);
      toast.success('Đã tạo nhóm học tập mới');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      toast.error('Không thể tạo nhóm');
    }
  };

  const updateGroup = async (formData) => {
    try {
      await eduService.updateGroup(editingGroup.id, formData);
      toast.success('Đã cập nhật thông tin nhóm');
      setEditingGroup(null);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi cập nhật nhóm');
    }
  };

  // ═══════════════════════════════════
  // RENDER
  // ═══════════════════════════════════
  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-8 relative z-10 pt-10 pb-24 flex-[1_0_auto]">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm font-bold mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Quản lý Lớp Học
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">
              Nhóm & Học Sinh 📚
            </h1>
            <p className="text-slate-400 mt-2 text-base">Phân chia học sinh vào các lớp hoặc nhóm để giao bài riêng biệt.</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-lg">
              <FolderOpen className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{groups.length}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Nhóm/Lớp</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-lg">
              <Users className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{students.length}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Học sinh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-lg">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{freeStudents.length}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Tự do</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT: 2-Column Layout ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ─── LEFT: Groups (3 cols) ─── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                Danh sách Nhóm / Lớp
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold text-sm hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" /> Tạo nhóm mới
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl p-16 text-center">
                <FolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-lg mb-1">Chưa có nhóm nào</p>
                <p className="text-slate-500 text-sm">Hãy tạo nhóm đầu tiên để bắt đầu quản lý học sinh.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group, index) => {
                  const groupStudents = getGroupStudents(group.id);
                  const isExpanded = expandedGroup === group.id;
                  return (
                    <div
                      key={group.id}
                      className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/30 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-600/50 shadow-lg group"
                      style={{ borderLeft: `6px solid ${group.color}` }}
                    >
                      {/* Group Header */}
                      <div
                        className="flex items-center justify-between p-5 cursor-pointer select-none"
                        onClick={() => {
                          const nextState = !isExpanded;
                          setExpandedGroup(nextState ? group.id : null);
                          if (nextState) fetchGroupDetails(group.id);
                        }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-lg transition-all border-2 group-hover:scale-105"
                            style={{ 
                              background: `linear-gradient(135deg, ${group.color}30, ${group.color}10)`,
                              color: group.color,
                              borderColor: `${group.color}40`,
                              boxShadow: `0 8px 20px -5px ${group.color}30`
                            }}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-extrabold text-slate-100 truncate">{group.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{group.description}</p>
                              
                              {/* Sĩ số lớp (Tạm định mức 50) */}
                              <div className="flex-1 max-w-[100px] h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block shadow-inner">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000" 
                                  style={{ 
                                    width: `${Math.min(100, (groupStudents.length / 50) * 100)}%`,
                                    background: group.color 
                                  }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-bold hidden sm:block" style={{ color: group.color }}>
                                Sĩ số: {groupStudents.length} / 50
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                            style={{ background: `${group.color}15`, color: group.color }}>
                            {groupStudents.length} học sinh
                          </span>
                          {/* Actions */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingGroup(group); }}
                            className="p-2 text-slate-500 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-800/60"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(group.id); }}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800/60"
                            title="Xóa nhóm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                      </div>

                      {/* Expanded: Student list */}
                      {isExpanded && (
                        <div className="border-t border-slate-700/30 bg-slate-950/30">
                          {!groupDetails[group.id] ? (
                            <div className="py-8 text-center animate-pulse">
                              <p className="text-slate-500 text-sm font-medium">Đang tải danh sách...</p>
                            </div>
                          ) : groupDetails[group.id].students?.length === 0 ? (
                            <div className="py-8 text-center">
                              <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                              <p className="text-slate-500 text-sm font-medium">Nhóm này chưa có học sinh nào.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-800/40">
                              {groupDetails[group.id].students.map(student => (
                                <div key={student.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <UserAvatar 
                                      user={{ ...student, avatar: student.avatar }} 
                                      size="sm" 
                                      className="w-9 h-9 border-slate-700 group-hover:border-cyan-500/40" 
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-200 truncate">{student.name}</p>
                                      <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {student.email}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeStudentFromGroup(group.id, student.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Xóa khỏi nhóm"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" /> Xóa
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Nút kết nối sang Phiếu Học Tập */}
                          <div className="px-5 py-3 border-t border-slate-700/20 flex items-center justify-end">
                            <Link
                              to={`/teacher/worksheets?group=${group.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 hover:border-amber-500/40 transition-all active:scale-[0.97]"
                              onClick={e => e.stopPropagation()}
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              Tạo / Xem phiếu cho nhóm này
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── RIGHT: Free Students (2 cols) ─── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  Học sinh tự do
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-violet-500/15 text-violet-400">
                    {freeStudents.length}
                  </span>
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-cyan-400' : 'text-slate-500'} transition-colors`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 font-medium rounded-xl pl-10 pr-9 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Select all + Assign action */}
              {filteredFreeStudents.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={selectAllFree}
                    className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {filteredFreeStudents.every(s => selectedStudents.includes(s.id))
                      ? '✓ Bỏ chọn tất cả'
                      : '☐ Chọn tất cả'}
                  </button>
                  {selectedStudents.length > 0 && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="flex items-center gap-1.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-500/25 transition-all active:scale-[0.97]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Thêm {selectedStudents.length} vào nhóm
                    </button>
                  )}
                </div>
              )}

              {/* Student List */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-2xl overflow-hidden shadow-xl max-h-[600px] overflow-y-auto">
                {filteredFreeStudents.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-sm">
                      {searchQuery ? 'Không tìm thấy học sinh nào' : 'Tất cả học sinh đã có nhóm!'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/30">
                    {filteredFreeStudents.map(student => {
                      const isSelected = selectedStudents.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => toggleStudentSelection(student.id)}
                          className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 group ${
                            isSelected
                              ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                              : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                              : 'border-slate-600 group-hover:border-slate-400'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <UserAvatar 
                            user={{ ...student, avatar: student.avatar }} 
                            size="sm" 
                            className="w-9 h-9 border-slate-700" 
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">{student.name}</p>
                            <p className="text-xs text-slate-500 font-medium truncate">{student.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL: Create / Edit Group ═══ */}
      {(showCreateModal || editingGroup) && (
        <GroupFormModal
          group={editingGroup}
          onClose={() => { setShowCreateModal(false); setEditingGroup(null); }}
          onSubmit={editingGroup ? updateGroup : createGroup}
        />
      )}

      {/* ═══ MODAL: Assign students to group ═══ */}
      {showAssignModal && (
        <AssignModal
          groups={groups}
          selectedCount={selectedStudents.length}
          onAssign={assignStudentsToGroup}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {/* ═══ MODAL: Delete Confirm ═══ */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          groupName={groups.find(g => g.id === showDeleteConfirm)?.name}
          onConfirm={() => deleteGroup(showDeleteConfirm)}
          onClose={() => setShowDeleteConfirm(null)}
        />
      )}

      <Footer />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS: Modals
// ═══════════════════════════════════════════════════════════════

function GroupFormModal({ group, onClose, onSubmit }) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [color, setColor] = useState(group?.color || GROUP_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div
        className="relative bg-slate-900 border border-slate-700/50 rounded-3xl p-8 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-extrabold text-slate-100 mb-6">
          {group ? '✏️ Chỉnh sửa nhóm' : '✨ Tạo nhóm mới'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tên nhóm / lớp</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Lớp 10A1, Nhóm Toán B..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm font-medium"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mô tả (tuỳ chọn)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú về nhóm/lớp này..."
              rows={3}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm font-medium resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Màu nhận diện</label>
            <div className="flex items-center gap-3">
              {GROUP_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg disabled:opacity-40 disabled:pointer-events-none"
            >
              {group ? 'Cập nhật' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ groups, selectedCount, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div
        className="relative bg-slate-900 border border-slate-700/50 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-slate-100 mb-2">
          📂 Chọn nhóm đích
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Thêm <span className="text-cyan-400 font-bold">{selectedCount}</span> học sinh vào nhóm:
        </p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => onAssign(g.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all text-left group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                style={{ background: `${g.color}20`, color: g.color }}
              >
                {g.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">{g.name}</p>
                <p className="text-xs text-slate-500 truncate">{g.description}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-slate-400 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
        >
          Huỷ bỏ
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ groupName, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div
        className="relative bg-slate-900 border border-red-500/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-slate-100 mb-3">
          ⚠️ Xác nhận xóa nhóm
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Bạn có chắc muốn xóa nhóm <span className="text-red-400 font-bold">"{groupName}"</span>?
          <br />Tất cả học sinh trong nhóm sẽ chuyển thành <span className="text-violet-400 font-bold">Học sinh tự do</span>.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
          >
            Giữ lại
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all"
          >
            Xóa nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
