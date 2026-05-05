import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, User, ChevronDown, Key, ShieldCheck, LogOut, Settings, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isLight = location.pathname === '/chat';

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
    <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/70 border-blue-900/30'}`}>
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
              <>
              {/* Nút Chat */}
              <button 
                onClick={() => navigate('/chat')}
                className={`relative p-2 rounded-xl border transition-all group shadow-lg ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-blue-600' 
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/50 hover:border-blue-500/50 text-slate-300 hover:text-blue-400'
                }`}
                title="Tin nhắn"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 bg-blue-500 border ${isLight ? 'border-white' : 'border-slate-900'}`}></span>
                </span>
              </button>

              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all focus:outline-none shadow-lg group ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-slate-800/80 hover:bg-slate-700/80'
                  } ${
                    isProfileOpen ? 
                      (user.role_id === 3 ? 'border-amber-400 shadow-amber-500/40 scale-[1.02]' : 
                       user.role_id === 2 ? 'border-emerald-400 shadow-emerald-500/40 scale-[1.02]' : 
                       'border-cyan-400 shadow-cyan-500/50 scale-[1.02]') :
                      (user.role_id === 3 ? 'border-amber-500/50 shadow-amber-500/20' : 
                       user.role_id === 2 ? 'border-emerald-500/50 shadow-emerald-500/20' : 
                       'border-blue-500/50 shadow-blue-500/30')
                  }`}
                >
                  <UserAvatar 
                    user={user} 
                    size="sm" 
                    className={`w-8 h-8 rounded-full border-none shadow-amber-500/20 ${
                      user.role_id === 3 ? 'bg-linear-to-tr from-amber-500 to-orange-500 shadow-amber-500/20' : 
                      user.role_id === 2 ? 'bg-linear-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/20' : 
                      'bg-linear-to-tr from-blue-500 to-violet-500 shadow-blue-500/20'
                    }`}
                  />
                  
                  <div className="hidden sm:flex flex-col items-start leading-tight pr-1">
                    <span className={`text-[13px] font-bold max-w-[100px] truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <span className={
                        user?.highestFeaturedTier?.toUpperCase() === 'DIAMOND' ? 'name-gradient-diamond' :
                        user?.highestFeaturedTier?.toUpperCase() === 'GOLD' ? 'name-gradient-gold' :
                        user?.highestFeaturedTier?.toUpperCase() === 'SILVER' ? 'name-gradient-silver' :
                        user?.highestFeaturedTier?.toUpperCase() === 'BRONZE' ? 'name-gradient-bronze' :
                        ''
                      }>
                        {user.name || user.fullName || 'Người dùng'}
                      </span>
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.25 rounded-md mt-0.5 ${
                      user.role_id === 3 ? 'bg-amber-500/20 text-amber-400' : 
                      user.role_id === 2 ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role_id === 3 ? 'Admin' : user.role_id === 2 ? 'GV' : 'HS'}
                    </span>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          user={user} 
                          size="md" 
                          className={`w-10 h-10 rounded-full border-none ${
                            user.role_id === 3 ? 'bg-linear-to-br from-amber-500 to-orange-500 shadow-amber-500/20' : 
                            user.role_id === 2 ? 'bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' : 
                            'bg-linear-to-br from-blue-500 to-violet-600 shadow-blue-500/20'
                          }`}
                        />
                        <div className="overflow-hidden">
                          <p className="text-base font-extrabold truncate text-white">
                            <span className={
                              user?.highestFeaturedTier?.toUpperCase() === 'DIAMOND' ? 'name-gradient-diamond' :
                              user?.highestFeaturedTier?.toUpperCase() === 'GOLD' ? 'name-gradient-gold' :
                              user?.highestFeaturedTier?.toUpperCase() === 'SILVER' ? 'name-gradient-silver' :
                              user?.highestFeaturedTier?.toUpperCase() === 'BRONZE' ? 'name-gradient-bronze' :
                              ''
                            }>
                              {user.name || user.fullName || 'Người dùng'}
                            </span>
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
              </>
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
