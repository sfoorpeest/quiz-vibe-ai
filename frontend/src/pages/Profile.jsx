import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, CheckCircle, Trophy, Save, Edit2, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth(); 
  
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalLearned: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await api.get('/api/auth/me');
        if (userRes.data && userRes.data.data) {
          setUser(userRes.data.data);
          setEditName(userRes.data.data.name || '');
        }

        // Fetch stats if available
        if (authUser?.role_id !== 3) {
            const statsRes = await api.get('/api/edu/dashboard/stats');
            if (statsRes.data && statsRes.data.status === 'success') {
                setStats(statsRes.data.data.stats || { totalLearned: 0, avgScore: 0 });
            }
        }
      } catch (err) {
        console.error("Lỗi tải thông tin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await api.put('/api/auth/update-profile', { name: editName });
      if (res.data && res.data.status === 'success') {
        setUser(res.data.data);
        updateUser(res.data.data);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Không thể cập nhật hồ sơ.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const getRoleName = (roleId) => {
    if (roleId === 3) return 'Quản trị viên';
    if (roleId === 2) return 'Giáo viên';
    return 'Học sinh';
  };

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-50">
      <AnimatedBackground />
      <Navbar />

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại Trang chủ</span>
        </button>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-r from-blue-600/20 via-violet-600/20 to-cyan-600/20 opacity-50"></div>
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-transparent to-slate-900/60"></div>
          
          <div className="relative flex flex-col sm:flex-row gap-8 items-start sm:items-center">
            {/* Avatar */}
            <div className="shrink-0 relative">
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-500 to-violet-600 p-1 shadow-xl shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                  <User className="w-16 h-16 text-white/50" />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-semibold text-slate-400 mb-1 block">Tên hiển thị</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 font-medium rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Nhập tên của bạn"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => { setIsEditing(false); setEditName(user?.name || ''); }}
                      className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg font-semibold transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-extrabold text-white">{user?.name}</h1>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-blue-400 rounded-full transition-all"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-emerald-400">{getRoleName(user?.role_id)}</span>
                      {user?.created_at && (
                        <span className="text-sm ml-2 px-2 py-0.5 bg-slate-800 rounded-md">
                          Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gamification / Stats Section */}
          {authUser?.role_id !== 3 && (
          <div className="mt-12 pt-8 border-t border-slate-800/80">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Thống kê học tập
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">{stats.totalLearned}</div>
                  <div className="text-slate-400 text-sm font-medium mt-1">Khóa/Bài đã học</div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">{stats.avgScore} <span className="text-lg text-slate-500 block sm:inline">điểm</span></div>
                  <div className="text-slate-400 text-sm font-medium mt-1">Trung bình Quiz</div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
