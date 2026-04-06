import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, User, ChevronDown, Key, ShieldCheck, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/70 backdrop-blur-xl border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-blue-700 to-violet-600 bg-clip-text text-transparent drop-shadow-sm">
              QuizVibe
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-200 hidden sm:block max-w-[120px] truncate">
                    {user.name || user.fullName || 'Người dùng'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-md shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-base font-extrabold text-white truncate">
                            {user.name || user.fullName || 'Người dùng'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5 uppercase tracking-wider">
                            {user.role_id === 3 ? 'Quản trị viên' : user.role_id === 2 ? 'Giáo viên' : 'Học sinh'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group focus:outline-none"
                      >
                        <User className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        Hồ sơ cá nhân
                      </button>

                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/change-password');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group focus:outline-none"
                      >
                        <Key className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        Đổi mật khẩu
                      </button>

                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/profile?tab=settings');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all group focus:outline-none"
                      >
                        <Settings className="w-4 h-4 text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
                        Cài đặt hệ thống
                      </button>
                      {user.role_id === 3 && (
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 rounded-xl transition-all group focus:outline-none border border-transparent hover:border-amber-500/20"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          Bảng điều khiển Admin
                        </button>
                      )}
                    </div>
                    
                    <div className="p-2 border-t border-slate-700 bg-slate-900/30">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group focus:outline-none"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Đăng xuất ngay
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-200 hover:text-blue-400 transition-colors px-2 py-1">
                  Đăng nhập
                </Link>
                <Link to="/register" className="text-sm font-bold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 shadow-lg shadow-blue-600/20">
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
  );
}
