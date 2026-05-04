import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Loader2, ArrowLeft, Swords, Crown, User, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * WaitingRoom — Sảnh chờ tìm đối thủ Live Challenge
 *
 * Flow:
 * 1. Kết nối tới Socket namespace /game
 * 2. Emit 'game:find_match' để tìm phòng
 * 3. Hiển thị danh sách người chơi đang chờ
 * 4. Khi đủ người → nhận 'game:countdown' → hiệu ứng đếm ngược
 * 5. Nhận 'game:start' → chuyển sang LiveChallenge
 */
export default function WaitingRoom() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  const [phase, setPhase] = useState('connecting'); // connecting | waiting | countdown | loading
  const [players, setPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const serverUrl = API_URL.replace('/api', '');

    // Kết nối tới namespace /game
    const socket = io(`${serverUrl}/game`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🎮 Connected to game server');
      setPhase('waiting');
      // Tự động tìm trận
      socket.emit('game:find_match');
    });

    socket.on('connect_error', (err) => {
      console.error('Game connection error:', err.message);
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
      setPhase('connecting');
    });

    // Đang chờ trong phòng
    socket.on('game:waiting', ({ roomId: rid, players: pList }) => {
      setRoomId(rid);
      setPlayers(pList);
      setPhase('waiting');
    });

    // Có người mới vào
    socket.on('game:player_joined', ({ players: pList }) => {
      setPlayers(pList);
    });

    // Có người rời
    socket.on('game:player_left', ({ players: pList }) => {
      setPlayers(pList);
      // Nếu đang countdown mà người rời khiến không đủ → quay lại waiting
      if (pList.length < 2) {
        setPhase('waiting');
        setCountdown(null);
      }
    });

    // Đếm ngược bắt đầu
    socket.on('game:countdown', ({ seconds }) => {
      setPhase('countdown');
      setCountdown(seconds);
    });

    // Trận đấu bắt đầu → chuyển trang
    socket.on('game:start', ({ totalQuestions, players: pList }) => {
      setPhase('loading');
      window.gameSocket = socket; // Lưu lại socket để dùng ở trang sau
      // Chuyển sang LiveChallenge kèm dữ liệu
      navigate('/games/live', {
        state: {
          roomId,
          players: pList,
          totalQuestions
        }
      });
    });

    socket.on('game:error', ({ message }) => {
      setError(message);
    });

    return () => {
      if (socketRef.current && window.gameSocket !== socketRef.current) {
        socketRef.current.emit('game:leave');
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const handleLeave = () => {
    if (socketRef.current) {
      socketRef.current.emit('game:leave');
      socketRef.current.disconnect();
    }
    navigate('/games');
  };

  // ═══ AVATAR COLORS ═══
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

  return (
    <div className="min-h-screen bg-[#0a0e1a] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-50">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.10),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(251,146,60,0.06),transparent_40%)]" />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[20%] w-80 h-80 bg-amber-500/6 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] w-96 h-96 bg-orange-600/5 rounded-full blur-[140px] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/60 backdrop-blur-2xl border border-amber-500/10 p-10 rounded-[32px] shadow-[0_0_80px_rgba(245,158,11,0.06),0_30px_60px_rgba(0,0,0,0.4)]">
        {/* Glow ring */}
        <div className="absolute -inset-px rounded-[32px] bg-linear-to-b from-amber-500/20 via-transparent to-orange-500/10 pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-18 h-18 bg-linear-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/25">
                <Swords className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black text-center mb-1 bg-linear-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
            Live Challenge
          </h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            {phase === 'connecting' && 'Đang kết nối đến server...'}
            {phase === 'waiting' && 'Đang tìm đối thủ xứng tầm...'}
            {phase === 'countdown' && 'Trận đấu sắp bắt đầu!'}
            {phase === 'loading' && 'Đang tải câu hỏi...'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Countdown */}
          {phase === 'countdown' && countdown !== null && (
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl">
                  <span className="text-4xl font-black text-white animate-bounce">{countdown}</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Spinner (connecting / loading) */}
          {(phase === 'connecting' || phase === 'loading') && (
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                {phase === 'connecting' ? (
                  <WifiOff className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-amber-400" />
                ) : (
                  <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-amber-400 animate-spin" />
                )}
              </div>
            </div>
          )}

          {/* Searching pulse (waiting) */}
          {phase === 'waiting' && (
            <div className="flex justify-center mb-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full border-2 border-amber-500/30 animate-ping" />
                <div className="absolute w-14 h-14 rounded-full border-2 border-amber-500/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </div>
          )}

          {/* Players List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Người chơi
              </h3>
              <span className="text-[10px] font-bold text-amber-400">{players.length} / 8</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* Hiển thị các slot (tối đa 8) */}
              {Array.from({ length: 8 }).map((_, i) => {
                const player = players[i];
                const isMe = player?.id === user?.id;
                return (
                  <div
                    key={i}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-500 ${
                      player
                        ? isMe
                          ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                          : 'bg-slate-800/40 border-slate-700/30'
                        : 'bg-slate-800/20 border-slate-700/10 border-dashed opacity-40'
                    }`}
                  >
                    {player ? (
                      <>
                        <div className={`w-10 h-10 rounded-full bg-linear-to-br ${avatarColors[i]} flex items-center justify-center shadow-lg`}>
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                          {isMe ? 'Bạn' : player.name}
                        </span>
                        {isMe && <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-400" />}
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-800/40 border border-dashed border-slate-700/30 flex items-center justify-center">
                          <span className="text-slate-600 text-lg">?</span>
                        </div>
                        <span className="text-[10px] text-slate-600">Trống</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room ID */}
          {roomId && (
            <div className="text-center mb-6">
              <span className="text-[10px] text-slate-600 font-mono">Room: {roomId}</span>
            </div>
          )}

          {/* Leave Button */}
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-5 py-3.5 rounded-xl font-bold border border-slate-600/30 text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Rời phòng chờ
          </button>
        </div>
      </div>
    </div>
  );
}
