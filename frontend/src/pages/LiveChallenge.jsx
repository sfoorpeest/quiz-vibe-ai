import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, User, Trophy, Star, Target, Zap, Clock, Shield, 
  MessageSquare, Send, Sparkles, Brain, Rocket, Lightbulb, 
  XCircle, Crown, Swords, BrainCircuit, Compass, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * LiveChallenge — Giao diện thi đấu chính
 *
 * Màn hình được chia làm 2 phần:
 * 1. Phần trên (Đường đua): Avatar di chuyển dựa trên điểm số (width percentage)
 * 2. Phần dưới (Câu hỏi): Hiển thị câu hỏi, đáp án, và thời gian
 */
export default function LiveChallenge() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State từ router (được truyền từ WaitingRoom)
  const { roomId, totalQuestions, players: initialPlayers } = location.state || {};

  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState(initialPlayers || []);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null); // { correctAnswer, standings }
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState(null);

  // Khởi tạo socket từ window.gameSocket
  useEffect(() => {
    if (!window.gameSocket) {
      console.error("Không tìm thấy kết nối game!");
      navigate('/games');
      return;
    }

    const s = window.gameSocket;
    setSocket(s);

    // ═══ LẮNG NGHE SỰ KIỆN TỪ SERVER ═══

    // Câu hỏi mới
    s.on('game:question', ({ index, total, question, options, timeLeft: initialTime }) => {
      setQuestionIndex(index);
      setCurrentQuestion({ question, options });
      setTimeLimit(initialTime);
      setTimeLeft(initialTime);
      setSelectedAnswer(null);
      setAnswerResult(null);
    });

    // Cập nhật thời gian
    s.on('game:tick', ({ timeLeft: tl }) => {
      setTimeLeft(tl);
    });

    // Kết quả câu trả lời
    s.on('game:answer_result', ({ correctAnswer, standings, questionIndex: qIdx }) => {
      setAnswerResult({ correctAnswer, standings });
      // Cập nhật luôn players để đường đua di chuyển
      setPlayers(standings);
    });

    // Trận đấu kết thúc
    s.on('game:finished', ({ standings, winner: win }) => {
      setPlayers(standings);
      setWinner(win);
      setIsFinished(true);
    });

    // Nhận huy hiệu mới từ Live Challenge
    s.on('game:badge_unlocked', ({ badges }) => {
      if (badges && badges.length > 0) {
        window.dispatchEvent(new CustomEvent('badge:unlocked', { detail: { badges } }));
      }
    });

    // Có người rời phòng
    s.on('game:player_left', ({ players: pList }) => {
      setPlayers(pList);
    });

    // Thông báo cho server là client đã sẵn sàng nhận câu hỏi
    s.emit('game:client_ready', { roomId });

    return () => {
      // Chỉ gỡ bỏ các listener khi component unmount
      // Không disconnect ở đây vì React 18 StrictMode sẽ mount/unmount/mount ngay lập tức làm mất kết nối
      if (s) {
        s.off('game:question');
        s.off('game:tick');
        s.off('game:answer_result');
        s.off('game:finished');
        s.off('game:player_left');
      }
    };
  }, [navigate]);

  // Gửi đáp án
  const handleAnswerSelect = (option) => {
    if (selectedAnswer || answerResult || !socket) return;
    setSelectedAnswer(option);
    socket.emit('game:answer', { questionIndex, answer: option });
  };

  // Rời phòng
  const handleLeave = () => {
    if (socket) {
      socket.emit('game:leave');
      socket.disconnect();
      window.gameSocket = null;
    }
    navigate('/games');
  };

  // ═══ AVATAR COLORS (Trùng với WaitingRoom) ═══
  const avatarColors = [
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-lime-500 to-green-600',
    'from-sky-500 to-indigo-600',
    'from-fuchsia-500 to-pink-600',
  ];

  // Tính toán % quãng đường (giả sử MAX_SCORE = tổng số câu * 150 điểm tối đa/câu)
  const maxPossibleScore = (totalQuestions || 10) * 150;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#06090f] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Multi-layer arena background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.10),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
        <div className="relative z-10 max-w-md w-full bg-slate-900/60 backdrop-blur-2xl border border-slate-700/15 p-8 md:p-10 rounded-3xl text-center shadow-[0_0_60px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Top light reflection */}
          <div className="absolute -inset-px rounded-3xl bg-linear-to-b from-white/4 via-transparent to-transparent pointer-events-none" />

          <div className="w-24 h-24 bg-linear-to-br from-amber-400 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
            <Trophy className="w-12 h-12 text-white drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-amber-400 to-orange-500 tracking-tight">TRẬN ĐẤU KẾT THÚC</h1>
          {winner && (
            <p className="text-base text-slate-400 mb-8 font-medium">
              Nhà vô địch: <strong className="text-amber-400 text-xl font-black ml-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">{winner.name}</strong>
            </p>
          )}

          <div className="space-y-3 mb-8 text-left">
            {players.map((p, i) => {
              const isWinner = i === 0;
              const isMe = p.id === user?.id;
              return (
                <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border-[1.5px] backdrop-blur-sm transition-all duration-300 ${isWinner ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : isMe ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800/40 border-slate-700/20'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-sm font-black ${isWinner ? 'text-amber-400' : isMe ? 'text-cyan-400' : 'text-slate-500'}`}>#{i + 1}</span>
                    <span className={`font-bold ${isWinner ? 'text-amber-100' : isMe ? 'text-cyan-100' : 'text-slate-300'}`}>{isMe ? 'Bạn' : p.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-black ${isWinner ? 'text-amber-400' : isMe ? 'text-cyan-400' : 'text-slate-300'}`}>{p.score} <span className="text-xs font-semibold opacity-70">pts</span></span>
                    <span className="text-[10px] text-slate-500 font-medium">{p.correctCount} câu đúng</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleLeave} className="w-full py-4 bg-slate-800/80 hover:bg-slate-700 hover:-translate-y-0.5 rounded-xl font-bold text-slate-300 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600 shadow-lg relative overflow-hidden group">
            <span className="relative z-10">Về Sảnh chờ</span>
            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-slate-50 font-sans relative overflow-x-hidden flex flex-col"
    >
      {/* ═══ THE ADVANCED ANIMATED BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#0a0e14]">
        <style>{`
          @keyframes slideGrid {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
          @keyframes float-1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(15px, -20px) rotate(8deg); }
            66% { transform: translate(-15px, 20px) rotate(-8deg); }
          }
          @keyframes float-2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-20px, -15px) rotate(-12deg); }
          }
          @keyframes float-3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 25px) scale(1.15); }
          }
          @keyframes pulse-neon {
            0%, 100% { opacity: 0.4; transform: scale(1); filter: blur(120px); }
            50% { opacity: 0.7; transform: scale(1.2); filter: blur(150px); }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
        `}</style>

        {/* Moving Grid */}
        <div 
          className="absolute inset-0 opacity-[0.15]" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'slideGrid 20s linear infinite'
          }} 
        />

        {/* Scanline */}
        <div className="absolute inset-0 w-full h-[2px] bg-linear-to-r from-transparent via-cyan-500/10 to-transparent opacity-20" style={{ animation: 'scanline 10s linear infinite' }} />

        {/* Massive Neon Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/20 rounded-full blur-[120px] animate-[pulse-neon_12s_infinite]" />
        <div className="absolute top-[-5%] right-[-15%] w-[55%] h-[55%] bg-fuchsia-600/15 rounded-full blur-[130px] animate-[pulse-neon_15s_infinite_reverse]" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[65%] h-[65%] bg-blue-600/15 rounded-full blur-[140px] animate-[pulse-neon_18s_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/15 rounded-full blur-[120px] animate-[pulse-neon_14s_infinite_reverse]" />
        <div className="absolute top-[30%] left-[25%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[150px] animate-[pulse-neon_20s_infinite]" />

        {/* Floating Icons */}
        <Brain className="absolute top-[12%] left-[10%] text-cyan-400/25 w-16 h-16" style={{ animation: 'float-1 10s ease-in-out infinite' }} />
        <Target className="absolute top-[15%] right-[18%] text-fuchsia-400/25 w-14 h-14" style={{ animation: 'float-2 12s ease-in-out infinite' }} />
        <Rocket className="absolute top-[42%] left-[5%] text-amber-400/25 w-18 h-18" style={{ animation: 'float-3 15s ease-in-out infinite' }} />
        <Lightbulb className="absolute bottom-[28%] right-[10%] text-emerald-400/25 w-16 h-16" style={{ animation: 'float-1 11s ease-in-out infinite' }} />
        <Sparkles className="absolute bottom-[18%] left-[22%] text-blue-400/25 w-14 h-14" style={{ animation: 'float-2 13s ease-in-out infinite' }} />
        <Compass className="absolute top-[60%] right-[30%] text-rose-400/20 w-12 h-12" style={{ animation: 'float-3 14s ease-in-out infinite' }} />
        <BrainCircuit className="absolute bottom-[45%] left-[35%] text-indigo-400/20 w-14 h-14" style={{ animation: 'float-1 16s ease-in-out infinite' }} />
        
        {/* Geometric Decals */}
        <div className="absolute top-[20%] left-[45%] w-32 h-32 border border-white/5 rounded-full" style={{ animation: 'spin-slow 40s linear infinite' }}></div>
        <div className="absolute bottom-[35%] left-[10%] w-24 h-24 border border-cyan-400/10 rotate-12" style={{ animation: 'float-2 18s ease-in-out infinite' }}></div>
        <div className="absolute top-[70%] right-[15%] w-40 h-40 border-2 border-dashed border-fuchsia-500/10 rounded-full" style={{ animation: 'spin-slow 60s linear infinite reverse' }}></div>
      </div>

      {/* ═══ Top Navigation Shell ═══ */}
      <header className="flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 backdrop-blur-xl bg-transparent border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
            <span className="font-black text-cyan-400 text-lg">Q</span>
          </div>
          <span className="font-space-grotesk text-xl font-bold tracking-widest text-cyan-400">QuizVibe</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLeave} 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-bold tracking-widest uppercase">Thoát</span>
          </button>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-12">
        
        {/* ═══ The Pulse Track Section ═══ */}
        <section className="relative w-full py-8">
          <div className="relative bg-[#1b1b20]/40 backdrop-blur-xl rounded-xl overflow-hidden p-6 border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-space-grotesk text-sm tracking-widest uppercase text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Live Race Status
              </h3>
              <span className="font-space-grotesk text-xs text-cyan-400/80">
                Thử thách {questionIndex + 1} / {totalQuestions}
              </span>
            </div>
            
            {/* Race Track Area */}
            <div className="relative h-24 w-full bg-[#0e0e13]/50 rounded-full flex items-center px-4 overflow-hidden">
              {/* Track Grid lines */}
              <div className="absolute inset-0 opacity-10 flex justify-between px-12 pointer-events-none">
                {[...Array(5)].map((_, i) => <div key={i} className="w-px h-full bg-white" />)}
              </div>
              
              {/* Finish Line (Portal) */}
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-cyan-400/40 to-transparent flex items-center justify-end pr-4 pointer-events-none">
                <div className="w-2 h-full bg-cyan-400/80 shadow-[0_0_30px_#00f5ff] rounded-full animate-pulse" />
              </div>

              {/* Competitors */}
              <div className="relative w-full flex items-center">
                {players.map((p, i) => {
                  const isMe = p.id === user?.id;
                  // Ensure minimum position so they appear on track
                  const progress = Math.min(94, Math.max(2, (p.score / maxPossibleScore) * 100));
                  
                  const colors = [
                    { from: 'from-cyan-400', to: 'to-blue-600', shadow: 'shadow-[0_0_15px_#00f5ff]', text: 'text-cyan-400' },
                    { from: 'from-fuchsia-400', to: 'to-purple-600', shadow: 'shadow-[0_0_15px_#d946ef]', text: 'text-fuchsia-400' },
                    { from: 'from-amber-400', to: 'to-orange-600', shadow: 'shadow-[0_0_15px_#fbbf24]', text: 'text-amber-400' },
                    { from: 'from-emerald-400', to: 'to-teal-600', shadow: 'shadow-[0_0_15px_#34d399]', text: 'text-emerald-400' },
                  ];
                  const theme = isMe ? colors[0] : colors[(i % 3) + 1];

                  return (
                    <div 
                      key={p.id} 
                      className={`absolute flex flex-col items-center transition-all duration-700 ${isMe ? 'z-20' : 'z-10 opacity-70'}`}
                      style={{ left: `calc(${progress}% - 20px)` }}
                    >
                      <div className={`p-1 rounded-full bg-linear-to-br ${theme.from} ${theme.to} ${theme.shadow}`}>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#131318] flex items-center justify-center border-2 border-transparent">
                          <User className={`w-4 h-4 md:w-5 md:h-5 ${theme.text}`} />
                        </div>
                      </div>
                      <span className={`mt-1 font-space-grotesk text-[8px] md:text-[10px] font-bold uppercase ${isMe ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {isMe ? 'Bạn' : p.name.split(' ')[0]} ({p.score})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Main Challenge Arena ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Stats & Chrono Ring */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <div className="bg-[#1b1b20]/40 backdrop-blur-[24px] border-t border-white/10 p-8 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
              <div className="relative w-40 h-40 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-[#35343a]" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8" />
                  {currentQuestion && (
                    <circle 
                      className={`transition-all duration-1000 linear ${timeLeft <= 3 ? 'text-rose-500 shadow-[0_0_20px_#f43f5e]' : timeLeft <= 5 ? 'text-amber-400 shadow-[0_0_20px_#fbbf24]' : 'text-cyan-400 shadow-[0_0_20px_#00f5ff]'}`}
                      cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeLinecap="round" strokeWidth="8"
                      style={{
                        strokeDasharray: 440,
                        strokeDashoffset: 440 - (440 * (timeLeft / Math.max(timeLimit, 1)))
                      }}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {!currentQuestion ? (
                    <div className="flex flex-col items-center animate-pulse">
                      {timeLeft > 0 ? (
                        <>
                          <span className="font-space-grotesk text-4xl font-bold text-cyan-400">{timeLeft}</span>
                          <span className="font-space-grotesk text-[8px] uppercase tracking-widest text-cyan-400/60 font-bold mt-1">Sắp bắt đầu</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                          <span className="font-space-grotesk text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Đang tải</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className={`font-space-grotesk text-4xl font-bold ${timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]'}`}>
                        {timeLeft}
                      </span>
                      <span className="font-space-grotesk text-[10px] uppercase tracking-tighter text-slate-400 mt-1">Giây</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-space-grotesk text-xs uppercase tracking-widest text-slate-400">Điểm của bạn</p>
                <p className="font-space-grotesk text-2xl font-bold text-fuchsia-400">{user?.score || 0}</p>
              </div>
            </div>

            <div className="bg-[#1b1b20]/40 backdrop-blur-[24px] border-t border-white/10 p-6 rounded-xl space-y-4 shadow-lg">
              <h4 className="font-space-grotesk text-xs tracking-widest uppercase text-slate-400">Thống Kê Trận</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/70">Người tham gia</span>
                  <span className="text-cyan-400 font-bold">{players.length} Users</span>
                </div>
                <div className="w-full h-1 bg-[#35343a] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-full" />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/70">Top 1 Điểm</span>
                  <span className="text-fuchsia-400 font-bold">{players[0]?.score || 0}</span>
                </div>
                <div className="w-full h-1 bg-[#35343a] rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-400" style={{ width: players[0] ? `${(players[0].score / maxPossibleScore) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Center: The Question Sanctuary */}
          <div className="lg:col-span-9 space-y-8 order-1 lg:order-2">
            {!currentQuestion ? (
               <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-20 rounded-xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                 <div className="w-12 h-12 border-[3px] border-white/10 border-t-cyan-400 rounded-full animate-spin" />
               </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">
                {/* Question Card */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border-t border-white/10 p-10 md:p-16 rounded-xl border-l-4 border-l-cyan-400 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                  <div className="absolute -top-4 -left-4 bg-cyan-400 text-[#003739] px-6 py-2 rounded-lg font-space-grotesk font-bold text-sm shadow-xl tracking-widest uppercase">
                    THỬ THÁCH {String(questionIndex + 1).padStart(2, '0')}
                  </div>
                  <div className="space-y-6 mt-4">
                    <h2 className="font-space-grotesk text-2xl md:text-4xl leading-tight text-white font-medium drop-shadow-sm">
                      {currentQuestion.question}
                    </h2>
                    <div className="h-px w-full bg-linear-to-r from-cyan-400/30 to-transparent" />
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed uppercase tracking-widest font-space-grotesk">
                      Hãy chọn đáp án chính xác nhất
                    </p>
                  </div>
                </div>

                {/* Answer Interaction Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = answerResult?.correctAnswer === option;
                    const isWrong = answerResult && isSelected && !isCorrect;
                    const labels = ['A', 'B', 'C', 'D'];
                    
                    const themes = [
                      { color: 'cyan', hex: '#00f5ff', text: 'text-cyan-400', bg: 'bg-cyan-400', border: 'border-cyan-400' },
                      { color: 'fuchsia', hex: '#d0bcff', text: 'text-fuchsia-400', bg: 'bg-fuchsia-400', border: 'border-fuchsia-400' },
                      { color: 'amber', hex: '#ffdb3f', text: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-400' },
                      { color: 'emerald', hex: '#34d399', text: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-400' }
                    ];
                    const theme = themes[idx];

                    // Base Style
                    let btnClass = `group relative flex items-center p-6 bg-[#1b1b20]/40 backdrop-blur-xl border-t border-white/10 rounded-xl transition-all duration-300 text-left border-l-4 border-l-transparent hover:!border-l-${theme.color}-400 hover:bg-white/5`;
                    let iconClass = `w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-space-grotesk font-bold ${theme.text} mr-4 transition-transform group-hover:scale-110`;
                    let textClass = `${theme.text} font-medium transition-colors text-lg md:text-xl`;
                    let shadowStyle = {};

                    // Selected State
                    if (isSelected && !answerResult) {
                      btnClass = `group relative flex items-center p-6 bg-${theme.color}-400/10 backdrop-blur-xl rounded-xl transition-all duration-300 text-left border-l-4 border-l-${theme.color}-400 border-t border-white/10 scale-[1.02]`;
                      iconClass = `w-10 h-10 rounded-lg ${theme.bg} flex items-center justify-center font-space-grotesk font-bold text-[#0a0e14] mr-4`;
                      textClass = `${theme.text} font-bold text-lg md:text-xl`;
                      shadowStyle = { boxShadow: `0 0 30px rgba(${theme.hex === '#00f5ff' ? '0,245,255' : theme.hex === '#d0bcff' ? '208,188,255' : theme.hex === '#ffdb3f' ? '255,219,63' : '52,211,153'}, 0.15)` };
                    } 
                    // Result State
                    else if (answerResult) {
                      if (isCorrect) {
                        btnClass = `group relative flex items-center p-6 bg-emerald-400/20 backdrop-blur-xl rounded-xl transition-all duration-300 text-left border-l-4 border-l-emerald-400 border-t border-white/10 scale-[1.02]`;
                        iconClass = `w-10 h-10 rounded-lg bg-emerald-400 flex items-center justify-center font-space-grotesk font-bold text-[#0a0e14] mr-4`;
                        textClass = `text-emerald-400 font-bold text-lg md:text-xl`;
                        shadowStyle = { boxShadow: `0 0 30px rgba(52,211,153, 0.2)` };
                      } else if (isWrong) {
                        btnClass = `group relative flex items-center p-6 bg-rose-500/20 backdrop-blur-xl rounded-xl transition-all duration-300 text-left border-l-4 border-l-rose-500 border-t border-white/10 opacity-80`;
                        iconClass = `w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center font-space-grotesk font-bold text-white mr-4`;
                        textClass = `text-rose-400 font-medium text-lg md:text-xl line-through`;
                      } else {
                        btnClass = `group relative flex items-center p-6 bg-[#1b1b20]/40 backdrop-blur-xl rounded-xl transition-all duration-300 text-left border-l-4 border-l-transparent border-t border-white/5 opacity-50 grayscale`;
                        iconClass = `w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-space-grotesk font-bold text-slate-500 mr-4`;
                        textClass = `text-slate-500 font-medium text-lg md:text-xl`;
                      }
                    }

                    const cleanOptionText = option.replace(/^[A-D][\.\:]\s*/i, '');

                    return (
                      <button
                        key={idx}
                        disabled={!!selectedAnswer || !!answerResult}
                        onClick={() => handleAnswerSelect(option)}
                        className={btnClass}
                        style={shadowStyle}
                      >
                        <span className={iconClass}>
                          {answerResult && isCorrect ? '✓' : answerResult && isWrong ? '✗' : labels[idx]}
                        </span>
                        <span className={textClass}>{cleanOptionText}</span>
                        
                        {!selectedAnswer && !answerResult && (
                          <div 
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" 
                            style={{ boxShadow: `0 0 30px ${theme.hex}25` }} 
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ═══ CRITICAL TIME OVERLAY (High Tension) ═══ */}
      <div 
        className={`fixed inset-0 pointer-events-none z-100 transition-all duration-700 ${
          timeLeft <= 3 && !answerResult ? 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(244,63,94,0.3)_100%)] opacity-100 animate-[pulse_0.5s_infinite]' : 'opacity-0'
        }`} 
      />
    </div>
  );
}
