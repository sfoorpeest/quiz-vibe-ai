import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Flame, Zap, Clock, Shield, Skull, ArrowRight, Home, RotateCcw, Trophy, Sparkles, BrainCircuit, Target, Swords } from 'lucide-react';
import api from '../api/axiosClient';
import Footer from '../components/Footer';

const TIME_PER_Q = 20;
const MAX_LIVES = 3;

const playSound = (type) => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC(), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    if (type === 'correct') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'combo') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(784, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1568, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) { /* silent */ }
};

export default function SoloAdventure() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState('setup'); // setup | playing | gameover
  const [topic, setTopic] = useState(location.state?.topic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [shake, setShake] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const startTimeRef = useRef(null);
  const answersRef = useRef([]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || answered || questions.length === 0) return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, answered, phase, questions.length]);

  const handleTimeout = () => {
    playSound('wrong');
    setAnswered(true);
    setCombo(0);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    const newLives = lives - 1;
    setLives(newLives);
    setTotalAnswered(p => p + 1);
    answersRef.current.push(null);
    if (newLives <= 0) setTimeout(() => setPhase('gameover'), 1200);
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.post('/api/quiz/generate-random', { limit: 10 });
      const data = res.data?.data || [];
      if (data.length > 0) {
        setQuestions(data);
        startTimeRef.current = Date.now();
        setPhase('playing');
      } else {
        alert('Không nhận được dữ liệu từ AI.');
      }
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelect = (option) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    answersRef.current.push(option);
    const q = questions[idx];
    const isCorrect = option === q.correct_answer;

    if (isCorrect) {
      playSound('correct');
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(p => Math.max(p, newCombo));
      if (newCombo >= 3) playSound('combo');
      const multiplier = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
      setScore(p => p + (100 * multiplier));
      setCorrectTotal(p => p + 1);
    } else {
      playSound('wrong');
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setPhase('gameover'), 1200);
      }
    }
    setTotalAnswered(p => p + 1);
  };

  const handleNext = () => {
    if (lives <= 0) { setPhase('gameover'); return; }
    
    if (idx >= questions.length - 1) {
      setPhase('gameover');
      return;
    }

    setIdx(p => p + 1);
    setSelected(null);
    setAnswered(false);
    setTimeLeft(TIME_PER_Q);
  };

  // Submit score on game over
  useEffect(() => {
    if (phase !== 'gameover') return;
    const submit = async () => {
      try {
        const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
        const res = await api.post('/api/quiz/submit', {
          score: score,
          total: totalAnswered,
          correctCount: correctTotal,
          wrongCount: totalAnswered - correctTotal,
          time_taken: timeTaken
        });
        if (res.data?.newBadges?.length > 0) {
          window.dispatchEvent(new CustomEvent('badge:unlocked', { detail: { badges: res.data.newBadges } }));
        }
      } catch (e) { console.error('Submit error:', e); }
    };
    submit();
  }, [phase, score, totalAnswered, correctTotal]);

  const comboLabel = combo >= 5 ? 'LEGENDARY' : combo >= 3 ? 'ON FIRE' : combo >= 2 ? 'GOOD' : '';
  const comboColor = combo >= 5 ? 'text-purple-300' : combo >= 3 ? 'text-orange-300' : 'text-cyan-300';
  const multiplier = combo >= 5 ? 'x3' : combo >= 3 ? 'x2' : 'x1';

  // ═══ SETUP VIEW ═══
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-50">
        {/* Animated BG layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.10),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(59,130,246,0.08),transparent_40%)]" />
        <div className="absolute top-[15%] left-[20%] w-80 h-80 bg-cyan-500/8 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[10%] right-[15%] w-96 h-96 bg-violet-600/6 rounded-full blur-[140px] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        <div className="relative z-10 w-full max-w-xl bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/10 p-10 rounded-[32px] shadow-[0_0_80px_rgba(6,182,212,0.06),0_30px_60px_rgba(0,0,0,0.4)]">
          {/* Glow ring */}
          <div className="absolute -inset-px rounded-[32px] bg-linear-to-b from-cyan-500/20 via-transparent to-violet-500/10 pointer-events-none" />

          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-2xl blur-xl animate-pulse" />
                <div className="relative w-18 h-18 bg-linear-to-br from-cyan-500 via-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
                  <Shield className="w-9 h-9 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-black text-center mb-2 bg-linear-to-r from-cyan-300 via-blue-200 to-violet-300 bg-clip-text text-transparent">Thử Thách Sinh Tồn</h1>
            <p className="text-slate-400 text-center text-sm mb-8">Kiến thức vô tận. Sai 1 lần = Game Over!</p>

            <div className="flex items-center justify-center gap-5 mb-8">
              {[
                { icon: Shield, label: '3 Mạng (Survival)', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                { icon: Clock, label: `${TIME_PER_Q}s/câu`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { icon: Zap, label: 'Kiến thức Vô cực', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
              ].map((r, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border ${r.bg}`}>
                  <r.icon className={`w-5 h-5 ${r.color}`} />
                  <span className="text-[11px] font-bold text-slate-300">{r.label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="w-full bg-slate-800/40 border border-slate-600/30 text-slate-300 rounded-2xl p-5 text-center text-sm shadow-inner">
                Hệ thống sẽ đặt ra 10 câu hỏi ngẫu nhiên từ mọi lĩnh vực. Hãy xem bạn có thể trả lời đúng bao nhiêu câu!
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate(-1)}
                  className="flex-1 px-5 py-3.5 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 font-bold rounded-xl transition-all border border-slate-600/30 text-sm">
                  Quay lại
                </button>
                <button type="submit" disabled={isGenerating}
                  className="flex-2 flex items-center justify-center gap-2 bg-linear-to-r from-cyan-600 via-blue-600 to-violet-600 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-70 text-white px-5 py-3.5 rounded-xl font-extrabold transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none text-sm active:scale-95 hover:shadow-cyan-500/30">
                  {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tạo...</> : <><Flame className="w-4 h-4" /> Bắt đầu Sinh Tồn</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══ GAME OVER VIEW ═══
  if (phase === 'gameover') {
    const pct = totalAnswered > 0 ? Math.round((correctTotal / totalAnswered) * 100) : 0;
    const isWin = lives > 0;
    return (
      <div className="min-h-screen bg-[#0a0e1a] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-50">
        <div className={`absolute inset-0 ${isWin ? 'bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.10),transparent_50%)]' : 'bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.10),transparent_50%)]'}`} />
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[180px] pointer-events-none ${isWin ? 'bg-cyan-600/8' : 'bg-red-600/8'}`} />
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        <div className={`relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border ${isWin ? 'border-cyan-500/15' : 'border-red-500/15'} p-10 rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.4)] text-center`}>
          <div className={`absolute -inset-px rounded-[32px] bg-linear-to-b ${isWin ? 'from-cyan-500/20 via-transparent to-blue-500/10' : 'from-red-500/20 via-transparent to-orange-500/10'} pointer-events-none`} />
          <div className="relative">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${isWin ? 'bg-amber-500/20' : 'bg-red-500/20'}`} />
                {isWin ? <Trophy className="relative w-20 h-20 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" /> : <Skull className="relative w-20 h-20 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" />}
              </div>
            </div>
            <h1 className="text-3xl font-black mb-1">{isWin ? '🏆 Hoàn thành!' : '💀 Game Over'}</h1>
            <p className="text-slate-400 text-sm mb-6">{isWin ? 'Bạn đã vượt qua tất cả câu hỏi!' : 'Bạn đã hết mạng sống!'}</p>

            {/* Score highlight */}
            <div className={`mb-5 rounded-2xl border p-5 ${isWin ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <p className="text-4xl font-black bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{score.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tổng điểm</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Chính xác', value: `${pct}%`, color: pct >= 70 ? 'text-emerald-300' : 'text-red-300' },
                { label: 'Max Combo', value: `x${maxCombo}`, color: 'text-orange-300' },
                { label: 'Câu đúng', value: `${correctTotal}/${totalAnswered}`, color: 'text-blue-300' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-3">
                  <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/games')}
                className="flex items-center justify-center gap-2 w-full bg-linear-to-r from-cyan-600 via-blue-600 to-violet-600 text-white px-5 py-3.5 rounded-xl font-extrabold shadow-lg shadow-cyan-500/20 text-sm active:scale-95 transition-all hover:shadow-cyan-500/30">
                <Home className="w-4 h-4" /> Về sảnh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ PLAYING VIEW ═══
  const q = questions[idx];
  let opts = q?.options || [];
  if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch { opts = []; } }
  const questionText = q?.content?.split('\n\n[EXPLAIN]')[0] || '';
  const explanation = q?.content?.split('\n\n[EXPLAIN]')[1]?.split('\n\n[REF]')[0]?.trim() || '';
  const timeRatio = timeLeft / TIME_PER_Q;
  const timerColor = timeRatio <= 0.25 ? 'from-red-500 to-red-600' : timeRatio <= 0.5 ? 'from-amber-500 to-orange-500' : 'from-cyan-500 to-blue-500';

  return (
    <div className={`min-h-screen bg-[#0a0e1a] font-sans flex flex-col relative overflow-hidden text-slate-50 ${shake ? 'animate-[shakeX_0.4s_ease-in-out]' : ''}`}>
      {/* Multi-layer BG */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.10),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_40%)]" />
      <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'32px 32px'}} />
      {/* Floating glow orbs */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-cyan-500/6 rounded-full blur-[100px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[15%] right-[8%] w-80 h-80 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite_2s]" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-[150px] pointer-events-none" />
      {/* Decorative floating shapes */}
      <div className="absolute top-[20%] right-[12%] w-20 h-20 border border-cyan-500/8 rounded-2xl rotate-45 pointer-events-none" />
      <div className="absolute bottom-[25%] left-[8%] w-16 h-16 border border-violet-500/8 rounded-full pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-12 h-12 border border-blue-500/6 rounded-lg rotate-12 pointer-events-none" />
      <div className="absolute top-[35%] left-[3%] w-8 h-8 bg-cyan-500/4 rounded-full pointer-events-none" />
      {combo >= 3 && <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${combo >= 5 ? 'bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.10),transparent_60%)]' : 'bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.08),transparent_60%)]'}`} />}

      {/* Top Bar */}
      <header className="relative z-20 px-4 py-3 border-b border-slate-700/20 bg-[#0a0e1a]/80 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Lives */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart key={i} className={`w-6 h-6 transition-all duration-300 ${i < lives ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'text-slate-700'}`} />
            ))}
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(6,182,212,0.08)]">
            <Zap className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]" />
            <span className="text-sm font-black text-cyan-200">{score.toLocaleString()}</span>
          </div>

          {/* Question counter */}
          <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Câu số</span>
            <span className="text-xs font-bold text-white">{idx + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Time Bar */}
        <div className="max-w-4xl mx-auto mt-2">
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full bg-linear-to-r ${timerColor} transition-all duration-1000 ease-linear`}
              style={{ width: `${timeRatio * 100}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <Clock className={`w-3 h-3 ${timeRatio <= 0.25 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
              <span className={`text-xs font-bold ${timeRatio <= 0.25 ? 'text-red-400' : 'text-slate-500'}`}>{timeLeft}s</span>
            </div>
            {comboLabel && (
              <span className={`text-xs font-extrabold ${comboColor} animate-pulse`}>
                🔥 {comboLabel} {multiplier}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Combo Meter Sidebar */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-3">
        <div className={`text-[10px] font-black uppercase tracking-widest ${combo >= 5 ? 'text-purple-400' : combo >= 3 ? 'text-orange-400' : 'text-slate-600'}`}>COMBO</div>
        <div className="relative w-4 h-56 rounded-full bg-slate-800/80 border border-slate-700/30 overflow-hidden shadow-inner">
          {/* Base subtle glow when empty */}
          <div className="absolute bottom-0 w-full h-full bg-linear-to-t from-slate-700/20 to-transparent rounded-full" />
          <div className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${combo >= 5 ? 'bg-linear-to-t from-purple-500 via-pink-500 to-fuchsia-400 shadow-[0_0_16px_rgba(168,85,247,0.6)]' : combo >= 3 ? 'bg-linear-to-t from-orange-600 via-amber-500 to-yellow-400 shadow-[0_0_14px_rgba(251,146,60,0.5)]' : combo >= 1 ? 'bg-linear-to-t from-cyan-600 via-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-linear-to-t from-cyan-700/40 to-cyan-600/20 shadow-[0_0_6px_rgba(6,182,212,0.15)]'}`}
            style={{ height: `${combo === 0 ? 8 : Math.min((combo / 5) * 100, 100)}%` }} />
        </div>
        <div className={`text-sm font-black ${combo >= 5 ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]' : combo >= 3 ? 'text-orange-300 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]' : combo >= 1 ? 'text-cyan-400' : 'text-slate-600'}`}>
          {combo > 0 ? `x${combo}` : '—'}
        </div>
        {combo >= 3 && <Flame className={`w-6 h-6 animate-bounce ${combo >= 5 ? 'text-purple-400' : 'text-orange-400'}`} />}
      </div>

      {/* Main Content - 3 column layout */}
      <main className="flex-1 relative z-10 flex items-start justify-center px-4 py-6 gap-6">

        {/* Left sidebar - Game Info */}
        <aside className="hidden xl:flex flex-col gap-4 w-64 shrink-0 sticky top-6 pt-2">
          <div className="rounded-2xl border border-slate-700/20 bg-slate-900/30 backdrop-blur-sm p-5 space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Trạng thái</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/30 pb-2">
                <span className="text-xs text-slate-400">Tiến độ</span>
                <span className="text-sm font-bold text-white">{idx + 1}/{questions.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/30 pb-2">
                <span className="text-xs text-slate-400">Đúng</span>
                <span className="text-sm font-bold text-emerald-400">{correctTotal}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/30 pb-2">
                <span className="text-xs text-slate-400">Sai</span>
                <span className="text-sm font-bold text-red-400">{totalAnswered - correctTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Combo</span>
                <span className={`text-sm font-bold ${combo >= 3 ? 'text-orange-400' : 'text-slate-300'}`}>x{combo}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/4 p-[22px] text-center relative overflow-hidden group scale-[0.99]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-3xl font-black bg-linear-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent relative z-10">{score.toLocaleString()}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 relative z-10">Score</p>
          </div>
        </aside>

        {/* Center - Question */}
        <div className="w-full max-w-3xl" key={idx}>
          {/* Question card */}
          <div className="mb-6 rounded-3xl border border-slate-700/15 bg-linear-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-10 lg:p-14 shadow-[0_0_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
            <div className="absolute -inset-px rounded-3xl bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-center leading-tight tracking-tight text-slate-100 relative z-10">
              {questionText}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {opts.map((opt, i) => {
              const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
              let cls = 'bg-slate-800/40 border-slate-600/20 hover:border-cyan-500/30 hover:bg-slate-800/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] text-slate-200';
              let labelCls = 'bg-slate-700/40 text-slate-400 border border-slate-600/30';
              let icon = null;
              if (answered) {
                if (opt === q.correct_answer) {
                  cls = 'bg-emerald-500/8 border-emerald-500/30 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.08)]';
                  labelCls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  icon = '✓';
                } else if (opt === selected) {
                  cls = 'bg-red-500/8 border-red-500/30 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.08)]';
                  labelCls = 'bg-red-500/20 text-red-300 border-red-500/30';
                  icon = '✗';
                } else {
                  cls = 'bg-slate-900/30 border-slate-800/20 text-slate-600 opacity-35';
                  labelCls = 'bg-slate-800/30 text-slate-600 border-slate-700/20';
                }
              }
              return (
                <button key={i} onClick={() => handleSelect(opt)} disabled={answered}
                  className={`w-full text-left px-5 py-4 rounded-2xl border backdrop-blur-sm font-bold text-sm transition-all duration-200 flex items-center gap-3 ${cls} ${!answered ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}>
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${labelCls}`}>
                    {icon || labels[i]}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && explanation && (
            <div className="mt-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/3 backdrop-blur-sm p-5 text-sm text-slate-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-cyan-400 font-bold mr-1">💡</span> {explanation}
            </div>
          )}

          {/* Next Button - inline */}
          {answered && lives > 0 && (
            <div className="mt-6 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button onClick={handleNext}
                className="group flex items-center gap-3 bg-linear-to-r from-cyan-600 via-blue-600 to-violet-600 text-white px-7 py-4 rounded-2xl font-black shadow-[0_0_30px_rgba(6,182,212,0.25)] text-sm active:scale-95 transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(6,182,212,0.35)]">
                {idx < questions.length - 1 ? 'Tiếp tục' : 'Xem kết quả'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
