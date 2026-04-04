import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Users, BookOpen, BarChart3, Settings, LogOut,
  TrendingUp, Bell, Search, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, FileText, Zap, Eye,
  ChevronRight, Activity, UserCheck, AlertTriangle, Star,
  Home, Database, MessageSquare, PieChart, X, Menu,
  User, CheckCircle, Clock, Filter, Download, RefreshCw,
  ShieldCheck, Layers, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';

/* ─── Animated Background ─── */
function DashboardBg() {
  return (
    <div className="ad-bg" aria-hidden="true">
      <div className="ad-orb ad-orb-1" />
      <div className="ad-orb ad-orb-2" />
      <div className="ad-orb ad-orb-3" />
      <div className="ad-grid" />
    </div>
  );
}

/* ─── Mini Sparkline SVG ─── */
function Sparkline({ data = [], color = '#6366f1', height = 36 }) {
  if (!data || data.length < 2) return <div style={{ height }} />;
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const fillPath = `M${pts[0]} L${pts.slice(1).join(' L')} L${w},${h} L0,${h} Z`;
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${id})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Loading Skeleton ─── */
function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(99,102,241,0.08)', animation: 'adShimmer 1.5s ease-in-out infinite' }} />
  );
}

/* ─── Delete Confirm Modal ─── */
function DeleteModal({ user: target, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 size={22} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>Xoá người dùng?</h3>
        <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5, margin: '0 0 20px' }}>
          Bạn sắp xoá tài khoản <strong style={{ color: '#f87171' }}>{target?.name}</strong> ({target?.email}). Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.07)', color: '#a5b4fc', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Huỷ</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Xác nhận xoá</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Material Confirm Modal ─── */
function DeleteMaterialModal({ material: target, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 size={22} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>Xoá học liệu?</h3>
        <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5, margin: '0 0 20px' }}>
          Bạn sắp xoá học liệu <strong style={{ color: '#f87171' }}>{target?.title}</strong>. Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(99,102,241,.2)', background: 'rgba(99,102,241,.07)', color: '#a5b4fc', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Huỷ</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Xác nhận xoá</button>
        </div>
      </div>
    </div>
  );
}

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  .ad-root { font-family: 'Inter', sans-serif; }
  .ad-bg { position:fixed; inset:0; z-index:0; background:#060612; overflow:hidden; pointer-events:none; }
  .ad-orb { position:absolute; border-radius:50%; filter:blur(80px); }
  .ad-orb-1 { width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%);top:-100px;left:-100px;animation:adFloat1 18s ease-in-out infinite; }
  .ad-orb-2 { width:400px;height:400px;background:radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 70%);bottom:0;right:-80px;animation:adFloat2 22s ease-in-out infinite; }
  .ad-orb-3 { width:300px;height:300px;background:radial-gradient(circle,rgba(34,211,238,.10) 0%,transparent 70%);top:50%;left:40%;animation:adFloat3 16s ease-in-out infinite; }
  .ad-grid { position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.03) 1px,transparent 1px);background-size:40px 40px; }
  @keyframes adFloat1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,40px) scale(1.1)}}
  @keyframes adFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,-60px) scale(1.15)}}
  @keyframes adFloat3{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-30px)}}
  @keyframes adShimmer{0%,100%{opacity:.5}50%{opacity:1}}
  .ad-sidebar{position:fixed;left:0;top:0;bottom:0;width:240px;background:rgba(6,6,18,.88);backdrop-filter:blur(24px);border-right:1px solid rgba(99,102,241,.12);z-index:40;display:flex;flex-direction:column;transition:transform .3s ease;}
  .ad-sidebar.collapsed{transform:translateX(-240px);}
  .ad-sidenav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;cursor:pointer;transition:all .2s;color:#6b7280;font-size:13.5px;font-weight:500;margin:1px 8px;position:relative;}
  .ad-sidenav-item:hover{background:rgba(99,102,241,.08);color:#a5b4fc;}
  .ad-sidenav-item.active{background:rgba(99,102,241,.14);color:#818cf8;}
  .ad-sidenav-item.active::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:3px;background:linear-gradient(to bottom,#6366f1,#8b5cf6);border-radius:0 4px 4px 0;}
  .ad-topbar{height:64px;border-bottom:1px solid rgba(99,102,241,.1);display:flex;align-items:center;padding:0 24px;gap:16px;background:rgba(6,6,18,.7);backdrop-filter:blur(16px);position:sticky;top:0;z-index:30;}
  .ad-stat{border-radius:20px;padding:22px 24px;position:relative;overflow:hidden;transition:all .3s;border:1px solid rgba(255,255,255,.06);}
  .ad-stat:hover{transform:translateY(-3px);border-color:rgba(99,102,241,.25);}
  .ad-stat::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.03) 0%,transparent 100%);}
  .ad-table{width:100%;border-collapse:collapse;}
  .ad-table thead th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:600;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;}
  .ad-table tbody tr{border-bottom:1px solid rgba(255,255,255,.04);transition:background .2s;}
  .ad-table tbody tr:hover{background:rgba(99,102,241,.05);}
  .ad-table tbody td{padding:12px 16px;font-size:13.5px;color:#cbd5e1;}
  .ad-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
  .ad-badge-admin{background:rgba(245,158,11,.12);color:#fbbf24;border:1px solid rgba(245,158,11,.2);}
  .ad-badge-teacher{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.2);}
  .ad-badge-student{background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.15);}
  .ad-donut{transform:rotate(-90deg);}
  .ad-scroll::-webkit-scrollbar{width:4px;}
  .ad-scroll::-webkit-scrollbar-track{background:transparent;}
  .ad-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:4px;}
  .ad-pulse{width:8px;height:8px;border-radius:50%;background:#4ade80;position:relative;}
  .ad-pulse::after{content:'';position:absolute;inset:-3px;border-radius:50%;background:#4ade80;opacity:.3;animation:adPulse 2s ease-in-out infinite;}
  @keyframes adPulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.5);opacity:0}}
  .ad-card{background:rgba(15,15,35,.7);backdrop-filter:blur(20px);border:1px solid rgba(99,102,241,.1);border-radius:20px;}
  .ad-progress-bar{height:6px;border-radius:999px;background:rgba(99,102,241,.12);overflow:hidden;}
  .ad-progress-fill{height:100%;border-radius:999px;transition:width .8s cubic-bezier(.4,0,.2,1);}
  .ad-icon-btn{width:36px;height:36px;border-radius:10px;border:1px solid rgba(99,102,241,.15);background:rgba(99,102,241,.07);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#818cf8;transition:all .2s;}
  .ad-icon-btn:hover{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.3);}
  .ad-toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:14px;font-size:13px;font-weight:600;z-index:300;animation:adToastIn .3s ease;}
  .ad-toast.success{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#4ade80;}
  .ad-toast.error{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;}
  @keyframes adToastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
`;

const NAV_ITEMS = [
  { icon: Home,          label: 'Tổng quan',        id: 'overview' },
  { icon: Users,         label: 'Người dùng',        id: 'users' },
  { icon: BookOpen,      label: 'Quản lý Quiz',      id: 'quiz' },
  { icon: Database,      label: 'Học liệu',          id: 'materials' }
];

const ROLE_MAP = { 1: 'student', 2: 'teacher', 3: 'admin' };
const ROLE_LABEL = { 1: 'Học sinh', 2: 'Giáo viên', 3: 'Admin' };
const ROLE_BADGE = { 1: 'ad-badge-student', 2: 'ad-badge-teacher', 3: 'ad-badge-admin' };
const ROLE_COLORS = { 1: '#6366f1', 2: '#8b5cf6', 3: '#f59e0b' };
const STAT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b'];
const SUBJECT_ICONS = { default: '📚' };

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('user'); // 'user' hoặc 'material'

  // ── Real data ──
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [topQuizzes, setTopQuizzes] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [activity, setActivity]   = useState([]);
  const [adminQuizzes, setAdminQuizzes] = useState([]);
  const [adminMaterials, setAdminMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const notifRef = useRef(null);

  // ── Redirect if not admin ──
  useEffect(() => {
    if (user && user.role_id !== 3) navigate('/');
  }, [user, navigate]);

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, q, sub, act, aq, am] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getTopQuizzes(),
        adminService.getSubjectStats(),
        adminService.getActivity(),
        adminService.getQuizzes(),
        adminService.getMaterials(),
      ]);
      setStats(s);
      setUsers(u);
      setTopQuizzes(q);
      setSubjectStats(sub);
      setActivity(act);
      setAdminQuizzes(aq);
      setAdminMaterials(am);
      setTimeout(() => setStatsAnimated(true), 100);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Close notif on outside click ──
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Toast helper ──
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Delete user ──
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteUser(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast(`Đã xoá người dùng "${deleteTarget.name}"`);
    } catch {
      showToast('Xoá thất bại!', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Delete material ──
  const handleDeleteMaterial = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteMaterial(deleteTarget.id);
      setAdminMaterials(prev => prev.filter(m => m.id !== deleteTarget.id));
      showToast(`Đã xoá học liệu "${deleteTarget.title}"`);
    } catch {
      showToast('Xoá thất bại!', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Filtered users ──
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchVal.toLowerCase())
  );

  // ── Build stat cards from real data ──
  const buildStatCards = () => {
    if (!stats) return [];
    const todayDelta = stats.today_sessions - stats.yesterday_sessions;
    return [
      {
        label: 'Tổng người dùng',
        value: Number(stats.users?.total_users || 0).toLocaleString(),
        delta: `+${stats.users?.total_students || 0} học sinh`,
        up: true, icon: Users, color: STAT_COLORS[0],
        spark: [40,50,44,58,52,65,70,80,74,88,95,Number(stats.users?.total_users||0)%30+80],
      },
      {
        label: 'Bài Quiz',
        value: Number(stats.quizzes?.total_quizzes || 0).toLocaleString(),
        delta: `${stats.materials?.total_materials || 0} học liệu`,
        up: true, icon: BookOpen, color: STAT_COLORS[1],
        spark: [10,14,12,18,15,20,18,24,22,28,30,Number(stats.quizzes?.total_quizzes||0)%10+20],
      },
      {
        label: 'Lượt học hôm nay',
        value: Number(stats.today_sessions || 0).toLocaleString(),
        delta: todayDelta >= 0 ? `+${todayDelta} so hôm qua` : `${todayDelta} so hôm qua`,
        up: todayDelta >= 0, icon: Activity, color: STAT_COLORS[2],
        spark: [5,8,6,10,9,12,10,14,13,15,14,Number(stats.today_sessions||0)%8+10],
      },
      {
        label: 'Giáo viên',
        value: Number(stats.users?.total_teachers || 0).toLocaleString(),
        delta: `${stats.users?.total_admins || 0} admin`,
        up: true, icon: ShieldCheck, color: STAT_COLORS[3],
        spark: [2,3,2,4,3,5,4,5,4,6,5,Number(stats.users?.total_teachers||0)%3+3],
      },
    ];
  };

  // ── Role distribution ──
  const buildRoleDist = () => {
    if (!stats?.users) return [];
    const total = Number(stats.users.total_users) || 1;
    return [
      { label: 'Học sinh',  value: Number(stats.users.total_students),  color: '#6366f1' },
      { label: 'Giáo viên', value: Number(stats.users.total_teachers),  color: '#8b5cf6' },
      { label: 'Admin',     value: Number(stats.users.total_admins),    color: '#f59e0b' },
    ].map(d => ({ ...d, pct: Math.round((d.value / total) * 100) || 0 }));
  };

  // ── Max attempt count for progress bar % ──
  const maxAttempt = topQuizzes.length > 0 ? Math.max(...topQuizzes.map(q => Number(q.attempt_count) || 0), 1) : 1;
  const maxSubAttempt = subjectStats.length > 0 ? Math.max(...subjectStats.map(s => Number(s.attempt_count) || 0), 1) : 1;

  const statCards  = buildStatCards();
  const roleDist   = buildRoleDist();
  const totalUsers = Number(stats?.users?.total_users || 0);

  /* ─── Render ─── */
  return (
    <>
      <style>{CSS}</style>
      <div className="ad-root" style={{ minHeight: '100vh', color: '#e2e8f0', position: 'relative' }}>
        <DashboardBg />

        {/* ══ SIDEBAR ══ */}
        <aside className={`ad-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(99,102,241,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(99,102,241,.5)' }}>
                <BrainCircuit size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#e2e8f0', letterSpacing: '-0.3px' }}>QuizVibe</div>
                <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Admin Portal</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }} className="ad-scroll">
            <div style={{ padding: '4px 16px 8px', fontSize: 10, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Menu chính</div>
            {NAV_ITEMS.map(item => (
              <div key={item.id} className={`ad-sidenav-item ${activeNav === item.id ? 'active' : ''}`} onClick={() => setActiveNav(item.id)}>
                <item.icon size={16} />
                <span>{item.label}</span>
                {activeNav === item.id && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </div>
            ))}
          </nav>

          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(99,102,241,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: 'rgba(99,102,241,.07)', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>Quản trị viên</div>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'transparent', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div style={{ marginLeft: sidebarOpen ? 240 : 0, minHeight: '100vh', position: 'relative', zIndex: 1, transition: 'margin-left .3s ease' }}>

          {/* ── TOP BAR ── */}
          <header className="ad-topbar">
            <button className="ad-icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="text" placeholder="Tìm kiếm người dùng, quiz..."
                value={searchVal} onChange={e => setSearchVal(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(99,102,241,.12)', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              <button className="ad-icon-btn" onClick={fetchAll} title="Làm mới">
                <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>

              {/* Notif */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className="ad-icon-btn" onClick={() => setNotifOpen(!notifOpen)} style={{ position: 'relative' }}>
                  <Bell size={15} />
                  {activity.length > 0 && <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #060612' }} />}
                </button>
                {notifOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 44, width: 310, background: 'rgba(10,10,28,.97)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,.6)', zIndex: 100 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 10, padding: '0 4px' }}>Hoạt động gần đây</div>
                    {activity.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#6b7280', padding: '8px 6px' }}>Chưa có hoạt động nào.</div>
                    ) : activity.slice(0,5).map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 6px', borderRadius: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Activity size={13} color="#818cf8" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 }}>
                            <strong style={{ color: '#a5b4fc' }}>{a.actor}</strong> — {a.action_text}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                            {a.created_at ? new Date(a.created_at).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(99,102,241,.2)', background: 'rgba(99,102,241,.08)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.background='rgba(99,102,241,.15)'; }}
                onMouseOut={e => { e.currentTarget.style.background='rgba(99,102,241,.08)'; }}
              >
                <Home size={13} /> Về trang chính
              </button>
            </div>
          </header>

          {/* ══ PAGE CONTENT ══ */}
          <main style={{ padding: '28px 28px 48px' }}>

            {/* Error Message */}
            {error && (
              <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} /> {error}
                <button onClick={fetchAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Thử lại</button>
              </div>
            )}

            {/* Render Content based on activeNav */}
            {activeNav === 'overview' && (
              <>
                {/* Page title */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div className="ad-pulse" />
                    <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Live Dashboard</span>
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', margin: 0 }}>
                    Xin chào, {user?.name || 'Admin'} 👋
                  </h1>
                  <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
                    Tổng quan hệ thống QuizVibe — Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* ── STAT CARDS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16, marginBottom: 24 }}>
                  {loading
                    ? Array(4).fill(0).map((_, i) => (
                      <div key={i} className="ad-stat" style={{ background: 'rgba(15,15,35,.7)' }}>
                        <Skeleton h={12} w="60%" /><div style={{ marginTop: 10 }}><Skeleton h={36} w="50%" /></div>
                        <div style={{ marginTop: 12 }}><Skeleton h={36} /></div>
                        <div style={{ marginTop: 10 }}><Skeleton h={12} w="70%" /></div>
                      </div>
                    ))
                    : statCards.map((s, i) => (
                      <div key={i} className="ad-stat"
                        style={{ background: `linear-gradient(135deg,${s.color}12 0%,rgba(6,6,18,.8) 100%)`, opacity: statsAnimated ? 1 : 0, transform: statsAnimated ? 'translateY(0)' : 'translateY(20px)', transition: `all .5s cubic-bezier(.4,0,.2,1) ${i*80}ms` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.label}</div>
                            <div style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px', lineHeight: 1.1, marginTop: 6 }}>{s.value}</div>
                          </div>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <s.icon size={20} color={s.color} />
                          </div>
                        </div>
                        <div style={{ height: 36, marginBottom: 10 }}><Sparkline data={s.spark} color={s.color} /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {s.up ? <ArrowUpRight size={13} color="#4ade80" /> : <ArrowDownRight size={13} color="#f87171" />}
                          <span style={{ fontSize: 12, fontWeight: 600, color: s.up ? '#4ade80' : '#f87171' }}>{s.delta}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* ── ROW 2: Activity + Role Dist ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
                  {/* Activity Feed */}
                  <div className="ad-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(99,102,241,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Hoạt động gần đây</div>
                      <button onClick={fetchAll} className="ad-icon-btn" style={{ width: 28, height: 28 }}><RefreshCw size={12} /></button>
                    </div>
                    <div style={{ flex: 1, padding: 12, overflowY: 'auto', maxHeight: 400 }} className="ad-scroll">
                      {loading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} h={40} r={10} />) : 
                        activity.length === 0 ? <div style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>Chưa có hoạt động nào.</div> :
                        activity.map((a, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 8px', borderRadius: 12, marginBottom: 2 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Activity size={13} color="#818cf8" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600, color: '#a5b4fc' }}>{a.actor}</span> — {a.action_text}
                              </div>
                              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, display:'flex', alignItems:'center', gap:4 }}>
                                <Clock size={10} /> {new Date(a.created_at).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Role Distribution */}
                  <div className="ad-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Phân bổ người dùng</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                      {roleDist.map((d, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{d.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{d.value}</span>
                          </div>
                          <div className="ad-progress-bar">
                            <div className="ad-progress-fill" style={{ width: `${d.pct}%`, background: d.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quản lý Người dùng Tab */}
            {activeNav === 'users' && (
              <div className="ad-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(99,102,241,.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Danh sách người dùng</h2>
                    <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Tổng cộng {users.length} tài khoản trong hệ thống</p>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button className="ad-icon-btn"><Download size={16} /></button>
                    <button className="ad-icon-btn"><Filter size={16} /></button>
                  </div>
                </div>
                <div className="ad-scroll" style={{ overflowX:'auto' }}>
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Bài đã làm</th>
                        <th>Ngày gia nhập</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight:600 }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ color:'#6b7280' }}>{u.email}</td>
                          <td>
                            <span className={`ad-badge ${ROLE_BADGE[u.role_id]}`}>
                              {ROLE_LABEL[u.role_id]}
                            </span>
                          </td>
                          <td style={{ fontWeight:700 }}>{u.quiz_count}</td>
                          <td style={{ color:'#6b7280' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <div style={{ display:'flex', gap:8 }}>
                              <button className="ad-icon-btn" style={{ width:30, height:30 }}><Eye size={14} /></button>
                              {u.role_id !== 3 && (
                                <button 
                                  onClick={() => {
                                    setDeleteType('user');
                                    setDeleteTarget(u);
                                  }}
                                  className="ad-icon-btn" 
                                  style={{ width:30, height:30, color:'#f87171' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quản lý Quiz Tab */}
            {activeNav === 'quiz' && (
              <div className="ad-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(99,102,241,.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Quản lý Quiz</h2>
                    <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Tổng cộng {adminQuizzes.length} bộ quiz trong hệ thống</p>
                  </div>
                  <button className="ad-icon-btn" onClick={fetchAll}><RefreshCw size={16} /></button>
                </div>
                <div className="ad-scroll" style={{ overflowX:'auto' }}>
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên Quiz</th>
                        <th>Chủ đề</th>
                        <th>Người tạo</th>
                        <th>Số câu hỏi</th>
                        <th>Lượt làm</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><Skeleton h={20} w="60%" /></td></tr>
                      ) : adminQuizzes.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#6b7280' }}>Chưa có quiz nào.</td></tr>
                      ) : adminQuizzes.map(q => (
                        <tr key={q.id}>
                          <td style={{ fontWeight:700, color:'#818cf8' }}>#{q.id}</td>
                          <td style={{ fontWeight:600, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.title}</td>
                          <td><span className="ad-badge ad-badge-teacher">{q.subject || 'Chung'}</span></td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11 }}>
                                {(q.creator_name || 'S').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize:13 }}>{q.creator_name || 'Hệ thống'}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight:700 }}>{q.question_count}</td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <Eye size={13} color="#6b7280" />
                              <span style={{ fontWeight:600 }}>{q.attempt_count}</span>
                            </div>
                          </td>
                          <td style={{ color:'#6b7280', fontSize:12 }}>{new Date(q.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quản lý Học liệu Tab */}
            {activeNav === 'materials' && (
              <div className="ad-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(99,102,241,.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Quản lý Học liệu</h2>
                    <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Tổng cộng {adminMaterials.length} tài liệu trong hệ thống</p>
                  </div>
                  <button className="ad-icon-btn" onClick={fetchAll}><RefreshCw size={16} /></button>
                </div>
                <div className="ad-scroll" style={{ overflowX:'auto' }}>
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên tài liệu</th>
                        <th>Tags</th>
                        <th>Người tạo</th>
                        <th>Lượt xem</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><Skeleton h={20} w="60%" /></td></tr>
                      ) : adminMaterials.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#6b7280' }}>Chưa có học liệu nào.</td></tr>
                      ) : adminMaterials.map(m => {
                        const tagMatch = m.description?.match(/^\[TAGS:(.*?)\]/);
                        const tags = tagMatch ? tagMatch[1].split(',').map(t => t.trim()) : [];
                        return (
                          <tr key={m.id}>
                            <td style={{ fontWeight:700, color:'#818cf8' }}>#{m.id}</td>
                            <td style={{ fontWeight:600, maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.title}</td>
                            <td>
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                {tags.length > 0 ? tags.slice(0,3).map((tag, i) => (
                                  <span key={i} className="ad-badge ad-badge-student" style={{ fontSize:10 }}>#{tag}</span>
                                )) : <span style={{ color:'#6b7280', fontSize:12 }}>—</span>}
                              </div>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11 }}>
                                  {(m.creator_name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize:13 }}>{m.creator_name || 'Hệ thống'}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <Eye size={13} color="#6b7280" />
                                <span style={{ fontWeight:600 }}>{m.view_count}</span>
                              </div>
                            </td>
                            <td style={{ color:'#6b7280', fontSize:12 }}>{new Date(m.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <div style={{ display:'flex', gap:8 }}>
                                <button className="ad-icon-btn" style={{ width:30, height:30 }}><Eye size={14} /></button>
                                <button 
                                  onClick={() => {
                                    setDeleteType('material');
                                    setDeleteTarget(m);
                                  }}
                                  className="ad-icon-btn" 
                                  style={{ width:30, height:30, color:'#f87171' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* ── Delete confirmation modals ── */}
        {deleteTarget && (
          deleteType === 'user' ? (
            <DeleteModal
              user={deleteTarget}
              onConfirm={handleDeleteUser}
              onCancel={() => setDeleteTarget(null)}
            />
          ) : (
            <DeleteMaterialModal
              material={deleteTarget}
              onConfirm={handleDeleteMaterial}
              onCancel={() => setDeleteTarget(null)}
            />
          )
        )}

        {/* ── Toast ── */}
        {toast && (
          <div className={`ad-toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={14} style={{ display:'inline',marginRight:6 }} /> : <AlertTriangle size={14} style={{ display:'inline',marginRight:6 }} />}
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
