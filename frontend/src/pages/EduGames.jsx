import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Star, Play, Users, Swords, Target, Crown, Medal, Lock, Sparkles, ArrowRight, Zap, Shield, Flame } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════
// MOCK DATA — Sẽ thay bằng API thực khi backend sẵn sàng
// ═══════════════════════════════════════════════════════════
const MOCK_PLAYER_STATS = {
  rank: 14,
  totalMatches: 87,
  winRate: 72,
  bestScore: 12450,
  currentStreak: 5,
};

const GAME_MODES = [
  {
    id: 'live',
    title: 'Live Challenge',
    subtitle: 'Thi đấu trực tiếp với học sinh khác theo thời gian thực',
    icon: Swords,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.25)]',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    tag: 'HOT',
    tagColor: 'bg-red-500 text-white',
    playersOnline: 124,
  },
  {
    id: 'solo',
    title: 'Solo Practice',
    subtitle: 'Tự luyện tập với AI, không giới hạn thời gian — chinh phục bản thân',
    icon: Target,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.20)]',
    borderColor: 'border-blue-500/30 hover:border-blue-500/60',
    tag: 'MỌILÚC',
    tagColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    playersOnline: null,
  },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Minh Anh', score: 15200, avatar: 'https://i.pravatar.cc/150?u=rank1', badge: '🥇' },
  { rank: 2, name: 'Hoàng Long', score: 14800, avatar: 'https://i.pravatar.cc/150?u=rank2', badge: '🥈' },
  { rank: 3, name: 'Thu Hà', score: 13900, avatar: 'https://i.pravatar.cc/150?u=rank3', badge: '🥉' },
  { rank: 4, name: 'Đức Anh', score: 13100, avatar: 'https://i.pravatar.cc/150?u=rank4', badge: '' },
  { rank: 5, name: 'Thanh Tâm', score: 12800, avatar: 'https://i.pravatar.cc/150?u=rank5', badge: '' },
  { rank: 6, name: 'Quốc Bảo', score: 12650, avatar: 'https://i.pravatar.cc/150?u=rank6', badge: '' },
  { rank: 7, name: 'Lan Phương', score: 12400, avatar: 'https://i.pravatar.cc/150?u=rank7', badge: '' },
];

const MOCK_STUDY_CARDS = [
  { id: 1, title: 'BẬC THẦY TOÁN HỌC', icon: '📐', description: 'Đạt 100 điểm tuyệt đối 3 lần liên tiếp trong quiz Toán', rarity: 'Hiếm — 5% học sinh', achieved: true, date: '10/03/2026', stats: { matches: 47, bestScore: 100 } },
  { id: 2, title: 'TOP 1 TUẦN', icon: '👑', description: 'Xếp hạng #1 trong bảng kiến thức tuần', rarity: 'Cực hiếm — 1% học sinh', achieved: true, date: '05/03/2026', stats: { matches: 87, bestScore: 12450 } },
  { id: 3, title: 'CHIẾN BINH VẬT LÝ', icon: '⚡', description: 'Giải đúng 50 câu hỏi Vật lý liên tiếp không sai lần nào', rarity: 'Hiếm — 8% học sinh', achieved: false, progress: { current: 32, total: 50 } },
  { id: 4, title: 'CHUỖI 7 NGÀY', icon: '🔥', description: 'Luyện tập liên tục 7 ngày không gián đoạn', rarity: 'Thường — 25% học sinh', achieved: true, date: '01/03/2026', stats: { matches: 21, bestScore: 95 } },
  { id: 5, title: 'POLYGLOT', icon: '🌍', description: 'Hoàn thành quiz ở 5 môn học khác nhau trong 1 tuần', rarity: 'Hiếm — 12% học sinh', achieved: false, progress: { current: 3, total: 5 } },
  { id: 6, title: 'CHỚP NHOÁNG', icon: '⏱️', description: 'Hoàn thành quiz 20 câu dưới 3 phút', rarity: 'Cực hiếm — 2% học sinh', achieved: false, progress: { current: 0, total: 1 } },
];

export default function EduGames() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState(null);

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
                <span className="text-sm font-extrabold text-white">Rank #{MOCK_PLAYER_STATS.rank}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-200">{MOCK_PLAYER_STATS.bestScore.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-200">{MOCK_PLAYER_STATS.winRate}% WR</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">{MOCK_PLAYER_STATS.currentStreak} streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 2-COLUMN: Game Modes (65%) + Sidebar (35%) ═══ */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Game Modes (65%) */}
          <div className="flex-[2] space-y-6">
            {GAME_MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className={`group relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-2xl border ${mode.borderColor} transition-all duration-500 ${mode.glow} hover:scale-[1.01] cursor-pointer`}
                  onClick={() => navigate('/quiz/start')}
                >
                  {/* Ambient Glow */}
                  <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${mode.gradient} opacity-[0.04] blur-[100px] rounded-full pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700`}></div>

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
                        <button className={`flex items-center gap-2 bg-gradient-to-r ${mode.gradient} text-slate-950 px-6 py-3 rounded-xl font-extrabold transition-all active:scale-95 shadow-lg text-sm`}>
                          <Play className="w-4 h-4 fill-current" /> Vào chơi
                        </button>
                        {mode.playersOnline && (
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
                        <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center shadow-2xl rotate-12`}>
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
          <div className="flex-[1] min-w-[320px] space-y-6">

            {/* Leaderboard Widget */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-6 shadow-2xl shadow-black/20">
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-amber-400" /> Bảng xếp hạng tuần
              </h3>
              <div className="space-y-2.5">
                {MOCK_LEADERBOARD.map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-800/60 ${
                      player.rank <= 3 ? 'bg-amber-500/5 border border-amber-500/10' : ''
                    }`}
                  >
                    <span className={`w-7 text-center text-sm font-extrabold ${
                      player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {player.badge || `#${player.rank}`}
                    </span>
                    <img src={player.avatar} className="w-8 h-8 rounded-full border-2 border-slate-700 shadow-sm" alt={player.name} />
                    <span className="flex-1 text-sm font-bold text-slate-200 truncate">{player.name}</span>
                    <span className="text-xs font-bold text-slate-400">{player.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Cards / Thẻ Thành Tích */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-6 shadow-2xl shadow-black/20">
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-purple-400" /> Phiếu học tập
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_STUDY_CARDS.map(card => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                    className={`relative group/card rounded-2xl p-4 text-center transition-all duration-300 cursor-pointer border ${
                      card.achieved
                        ? 'bg-gradient-to-b from-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 opacity-60 hover:opacity-80'
                    }`}
                  >
                    {/* Lock Overlay if not achieved */}
                    {!card.achieved && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-3 h-3 text-slate-600" />
                      </div>
                    )}
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <p className={`text-[10px] font-black uppercase tracking-wider leading-tight ${card.achieved ? 'text-amber-300' : 'text-slate-500'}`}>
                      {card.title}
                    </p>
                    {/* Progress if not achieved */}
                    {!card.achieved && card.progress && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${(card.progress.current / card.progress.total) * 100}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-600 mt-1 font-bold">{card.progress.current}/{card.progress.total}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ═══ MODAL: Expanded Study Card ═══ */}
        {selectedCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedCard(null)}>
            <div
              className={`relative w-full max-w-sm rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300 ${
                selectedCard.achieved
                  ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-900 border border-slate-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Holographic Shimmer */}
              {selectedCard.achieved && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-400/5 via-transparent to-purple-400/5 pointer-events-none"></div>
              )}

              <div className="relative z-10">
                <div className="text-5xl mb-4">{selectedCard.icon}</div>
                <h3 className={`text-lg font-black uppercase tracking-wider mb-2 ${selectedCard.achieved ? 'text-amber-300' : 'text-slate-400'}`}>
                  {selectedCard.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{selectedCard.description}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${selectedCard.achieved ? 'text-purple-400' : 'text-slate-600'}`}>
                  {selectedCard.rarity}
                </p>

                {selectedCard.achieved ? (
                  <div className="space-y-2 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                    <p className="text-xs text-emerald-400 font-bold">✓ Đã nhận — {selectedCard.date}</p>
                    {selectedCard.stats && (
                      <div className="flex justify-center gap-6 mt-2">
                        <div><p className="text-lg font-extrabold text-white">{selectedCard.stats.matches}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Trận</p></div>
                        <div><p className="text-lg font-extrabold text-white">{selectedCard.stats.bestScore}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Best</p></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCard.progress && (
                      <>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full transition-all" style={{ width: `${(selectedCard.progress.current / selectedCard.progress.total) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 font-bold">{selectedCard.progress.current} / {selectedCard.progress.total}</p>
                      </>
                    )}
                    <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3" /> Tiếp tục luyện tập để mở khóa
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
