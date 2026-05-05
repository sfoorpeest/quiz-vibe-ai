import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Gamepad2, Trophy, Star, Play, Users, Swords, Target, Clock, Crown, Medal, Lock, Sparkles, ArrowRight, Zap, Shield, Flame } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';

// ═══════════════════════════════════════════════════════════
// CẤU HÌNH GAME MODES
// ═══════════════════════════════════════════════════════════

const GAME_MODES = [
  {
    id: 'live',
    title: 'Đấu Trường Trực Tuyến',
    subtitle: 'Cuộc đua tri thức thời gian thực. Trả lời đúng để bứt phá và về đích đầu tiên!',
    icon: Swords,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.25)]',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    tag: 'SÔI NỔI',
    tagColor: 'bg-red-500 text-white',
    playersOnline: 0,
  },
  {
    id: 'solo',
    title: 'Thử Thách Sinh Tồn',
    subtitle: 'Chế độ vượt ải đơn độc. Hãy bảo vệ mạng sống của bạn trước những câu hỏi hóc búa!',
    icon: Shield,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.20)]',
    borderColor: 'border-blue-500/30 hover:border-blue-500/60',
    tag: 'KỊCH TÍNH',
    tagColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    playersOnline: null,
  },
];

// MOCK_LEADERBOARD has been removed, using real data from DB

// MOCK_STUDY_CARDS has been removed, using real data from DB

export default function EduGames() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState(null);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  
  const [userStats, setUserStats] = useState(null);
  const [studyCards, setStudyCards] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  
  // State tính toán cho Banner
  const [playerRank, setPlayerRank] = useState('N/A');
  const [playerTotalScore, setPlayerTotalScore] = useState(0);

  // Lấy dữ liệu Leaderboard, User Stats và Badges từ server
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy Leaderboard và Rank của tôi
        const resLeaderboard = await api.get('/api/quiz/leaderboard');
        if (resLeaderboard.data && resLeaderboard.data.status === 'success') {
          setLeaderboard(resLeaderboard.data.data);
          
          // Sử dụng dữ liệu currentUser từ backend trả về (chính xác hơn vì backend tính rank toàn hệ thống)
          const myStats = resLeaderboard.data.currentUser;
          if (myStats) {
            setPlayerRank(myStats.rank);
            setPlayerTotalScore(myStats.high_score || 0);
          }
        }
        
        // 2. Lấy User Stats
        const resStats = await api.get('/api/badges/user-stats');
        if (resStats.data && resStats.data.data) {
          setUserStats(resStats.data.data);
        }
        
        // 3. Lấy Badges (Study Cards)
        const resBadges = await api.get('/api/badges');
        if (resBadges.data && resBadges.data.data && resBadges.data.data.all) {
          setStudyCards(resBadges.data.data.all);
        }

        // 4. Lấy số lượng người dùng online thực tế qua API (dự phòng)
        const resOnline = await api.get('/api/stats/online-count');
        if (resOnline.data && resOnline.data.status === 'success') {
          // Chỉ set nếu chưa có giá trị từ socket (socket sẽ realtime hơn)
          setOnlineCount(prev => prev > 0 ? prev : resOnline.data.count);
        }
      } catch (error) {
        console.error("Error fetching EduGames data:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Kết nối socket để lấy số người online cho Live Challenge (Real-time từ L-frontend)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverUrl = API_URL.replace('/api', '');

    const socket = io(`${serverUrl}/game`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('game:online_count', (count) => {
      setOnlineCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const displayGameModes = GAME_MODES.map(mode => {
    if (mode.id === 'live') {
      return { ...mode, playersOnline: onlineCount > 0 ? onlineCount : 0 };
    }
    return mode;
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverUrl = API_URL.replace('/api', '');

  // Tính Win Rate an toàn
  const calculateWinRate = () => {
    if (!userStats || userStats.total_live_plays === 0) return 0;
    return Math.round((userStats.total_live_wins / userStats.total_live_plays) * 100);
  };

  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10 pt-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 w-full">

        {/* ═══ HEADER: Player Stats Banner ═══ */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" /> Sảnh thi đấu
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50">
                Edu Game Arena
              </h1>
              <p className="text-slate-400 mt-2 text-base">Thử thách kiến thức, leo rank, thu thập thẻ thành tích!</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-extrabold text-white">Rank #{playerRank}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-200">{Number(playerTotalScore).toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-200">{calculateWinRate()}% WR</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">{userStats?.current_streak_days || 0} streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 2-COLUMN: Game Modes (65%) + Sidebar (35%) ═══ */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Game Modes (65%) */}
          <div className="flex-2 space-y-6">
            {displayGameModes.map(mode => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className={`group relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-2xl border ${mode.borderColor} transition-all duration-500 ${mode.glow} hover:scale-[1.01] cursor-pointer`}
                  onClick={() => navigate(mode.id === 'solo' ? '/games/solo' : '/games/waiting')}
                >
                  {/* Ambient Glow */}
                  <div className={`absolute top-0 right-0 w-96 h-96 bg-linear-to-bl ${mode.gradient} opacity-[0.04] blur-[100px] rounded-full pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700`}></div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-stretch p-8 lg:p-10 gap-8">
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl lg:text-3xl font-extrabold text-white">{mode.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase ${mode.tagColor}`}>
                          {mode.tag}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-md">{mode.subtitle}</p>
                      <div className="flex items-center gap-4">
                        <button className={`flex items-center gap-2 bg-linear-to-r ${mode.gradient} text-slate-950 px-6 py-3 rounded-xl font-extrabold transition-all active:scale-95 shadow-lg text-sm`}>
                          <Play className="w-4 h-4 fill-current" /> Vào chơi
                        </button>
                        {mode.playersOnline !== null && (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            {mode.playersOnline} đang online
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Icon Decorative */}
                    <div className="flex items-center justify-center sm:w-48">
                      <div className={`relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <div className={`w-28 h-28 rounded-3xl bg-linear-to-br ${mode.gradient} flex items-center justify-center shadow-2xl rotate-12`}>
                          <Icon className="w-14 h-14 text-white/90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT SIDEBAR (35%): Leaderboard + Study Cards */}
          <div className="flex-1 min-w-[320px] space-y-6">

            {/* Leaderboard Widget */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-6 shadow-2xl shadow-black/20">
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-amber-400" /> Bảng xếp hạng toàn cầu
              </h3>
              <div className="space-y-2.5">
                {isLoadingLeaderboard ? (
                  <div className="flex justify-center p-4">
                    <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-4">Chưa có dữ liệu xếp hạng.</p>
                ) : (
                  leaderboard.map((player) => {
                    const badge = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '';
                    const avatarUrl = player.avatar_url ? `${serverUrl}${player.avatar_url}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random`;

                    // Equipped badge glow ring styles
                    const badgeTierGlow = {
                      DIAMOND: 'ring-2 ring-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
                      GOLD: 'ring-2 ring-yellow-400/60 shadow-[0_0_8px_rgba(234,179,8,0.35)]',
                      SILVER: 'ring-1 ring-slate-300/40 shadow-[0_0_4px_rgba(148,163,184,0.2)]',
                      BRONZE: 'ring-1 ring-orange-400/40 shadow-[0_0_4px_rgba(251,146,60,0.2)]',
                    };
                    
                    return (
                      <div
                        key={player.user_id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-800/60 ${
                          player.rank <= 3 ? 'bg-amber-500/5 border border-amber-500/10' : ''
                        }`}
                      >
                        <span className={`w-7 text-center text-sm font-extrabold ${
                          player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {badge || `#${player.rank}`}
                        </span>
                        <div className="relative shrink-0">
                          <img src={avatarUrl} className="w-8 h-8 rounded-full border-2 border-slate-700 shadow-sm object-cover" alt={player.name} />
                          {/* Equipped Badge Icon with Glow Ring */}
                          {(player.equipped_badge_icon || player.equipped_badge_tier) && (
                            <div
                              className={`absolute -bottom-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-slate-800 text-[10px] transition-all ${badgeTierGlow[player.equipped_badge_tier?.toUpperCase()] || ''}`}
                              title={player.equipped_badge_name || 'Thành tựu'}
                            >
                              {player.equipped_badge_icon || (
                                player.equipped_badge_tier?.toUpperCase() === 'DIAMOND' ? '💎' :
                                player.equipped_badge_tier?.toUpperCase() === 'GOLD' ? '🥇' :
                                player.equipped_badge_tier?.toUpperCase() === 'SILVER' ? '🥈' : '🥉'
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            <span className={
                              player.highest_featured_tier?.toUpperCase() === 'DIAMOND' ? 'name-gradient-diamond' :
                              player.highest_featured_tier?.toUpperCase() === 'GOLD' ? 'name-gradient-gold' :
                              player.highest_featured_tier?.toUpperCase() === 'SILVER' ? 'name-gradient-silver' :
                              player.highest_featured_tier?.toUpperCase() === 'BRONZE' ? 'name-gradient-bronze' :
                              'text-slate-200'
                            }>
                              {player.name}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
                              <Target className="w-2.5 h-2.5" /> {player.attempts} lần
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {player.best_time ? `${player.best_time}s` : '--'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-cyan-400">{Number(player.high_score).toLocaleString()}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Study Cards / Thẻ Thành Tích */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-6 shadow-2xl shadow-black/20 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Thành tựu
                </h3>
                <Link to="/profile?tab=badges" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 py-1 rounded-md transition-colors border border-blue-500/20 bg-blue-500/5">
                  Xem tất cả
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[...studyCards]
                  .sort((a, b) => {
                    if (a.unlocked && !b.unlocked) return -1;
                    if (!a.unlocked && b.unlocked) return 1;
                    if (!a.unlocked && !b.unlocked) {
                      return (b.progress || 0) - (a.progress || 0);
                    }
                    return 0;
                  })
                  .slice(0, 6)
                  .map(card => {
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                      className={`relative group/card rounded-2xl p-4 text-center transition-all duration-300 cursor-pointer border ${
                        card.unlocked
                          ? 'bg-linear-to-b from-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 opacity-60 hover:opacity-80'
                      }`}
                    >
                      {!card.unlocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-3 h-3 text-slate-600" />
                        </div>
                      )}
                      <div className="text-3xl mb-2 flex justify-center text-amber-400">
                         {card.unlocked ? (card.icon_url || (card.tier === 'DIAMOND' ? '💎' : card.tier === 'GOLD' ? '🥇' : card.tier === 'SILVER' ? '🥈' : '🥉')) : <Sparkles className="w-8 h-8 text-slate-500" />}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-wider leading-tight ${card.unlocked ? 'text-amber-300' : 'text-slate-500'}`}>
                        {card.name}
                      </p>
                      {!card.unlocked && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${card.progress || 0}%` }}></div>
                          </div>
                          <p className="text-[9px] text-slate-600 mt-1 font-bold">{card.current_value}/{card.condition_value}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {selectedCard && (() => {
          return (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedCard(null)}>
            <div
              className={`relative w-full max-w-sm rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300 ${
                selectedCard.unlocked
                  ? 'bg-linear-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-900 border border-slate-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedCard.unlocked && (
                <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-amber-400/5 via-transparent to-purple-400/5 pointer-events-none"></div>
              )}

              <div className="relative z-10">
                <div className="text-6xl mb-4 flex justify-center text-amber-400">
                  {selectedCard.unlocked ? (selectedCard.icon_url || (selectedCard.tier === 'DIAMOND' ? '💎' : selectedCard.tier === 'GOLD' ? '🥇' : selectedCard.tier === 'SILVER' ? '🥈' : '🥉')) : <Lock className="w-12 h-12 text-slate-500" />}
                </div>
                <h3 className={`text-lg font-black uppercase tracking-wider mb-2 ${selectedCard.unlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                  {selectedCard.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{selectedCard.description}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${selectedCard.unlocked ? 'text-purple-400' : 'text-slate-600'}`}>
                  {selectedCard.tier}
                </p>

                {selectedCard.unlocked ? (
                  <div className="space-y-2 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                    <p className="text-xs text-emerald-400 font-bold">✓ Đã nhận — {new Date(selectedCard.unlocked_at).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-linear-to-r from-slate-500 to-slate-400 rounded-full transition-all" style={{ width: `${selectedCard.progress || 0}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">{selectedCard.current_value} / {selectedCard.condition_value}</p>
                    <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3" /> Tiếp tục luyện tập để mở khóa
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );})()}

      </div>

      <Footer />
    </div>
  );
}
