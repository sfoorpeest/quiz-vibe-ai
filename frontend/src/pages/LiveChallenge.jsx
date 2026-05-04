import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Timer, Trophy, Crown, CheckCircle2, XCircle, ChevronRight, User } from 'lucide-react';
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
    s.on('game:question', ({ index, total, question, options, timeLeft }) => {
      setQuestionIndex(index);
      setCurrentQuestion({ question, options });
      setTimeLeft(timeLeft);
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

    // Có người rời phòng
    s.on('game:player_left', ({ players: pList }) => {
      setPlayers(pList);
    });

    return () => {
      // Dọn dẹp: xóa window.gameSocket và ngắt kết nối khi rời trang
      if (window.gameSocket) {
        window.gameSocket.emit('game:leave');
        window.gameSocket.disconnect();
        window.gameSocket = null;
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
      <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-lg w-full bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 p-8 rounded-[32px] text-center shadow-2xl">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(245,158,11,0.4)]">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">TRẬN ĐẤU KẾT THÚC</h1>
          {winner && (
            <p className="text-lg text-slate-300 mb-8">
              Nhà vô địch: <strong className="text-amber-400 text-xl">{winner.name}</strong>
            </p>
          )}

          <div className="space-y-3 mb-8">
            {players.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl ${i === 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 font-black ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>#{i + 1}</span>
                  <span className="font-bold">{p.id === user?.id ? 'Bạn' : p.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-black text-amber-400">{p.score} pts</span>
                  <span className="text-[10px] text-slate-500">{p.correctCount} câu đúng</span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleLeave} className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all border border-slate-600">
            Về Sảnh chờ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col font-sans text-slate-50">
      {/* ═══ PHẦN TRÊN: ĐƯỜNG ĐUA ═══ */}
      <div className="h-[40vh] border-b border-slate-800 bg-[#0f1423] relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-[#0a0e1a] to-transparent">
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiến độ</span>
            <span className="text-sm font-black text-white">{questionIndex + 1} / {totalQuestions || '?'}</span>
          </div>
          <button onClick={handleLeave} className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700 transition-all">
            Thoát
          </button>
        </div>

        {/* Làn đua (Lanes) */}
        <div className="flex-1 mt-16 px-8 flex flex-col justify-center gap-2 overflow-y-auto pb-4">
          {players.map((p, i) => {
            const isMe = p.id === user?.id;
            const progress = Math.min(100, Math.max(2, (p.score / maxPossibleScore) * 100)); // Cố định tối thiểu 2% để thấy avatar
            
            return (
              <div key={p.id} className="relative h-12 flex items-center w-full">
                {/* Lane background */}
                <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  {/* Đường kẻ đứt */}
                  <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:20px_100%]" />
                </div>

                {/* Avatar di chuyển */}
                <div 
                  className="absolute z-10 transition-all duration-1000 ease-out flex items-center gap-3"
                  style={{ left: `calc(${progress}% - 24px)` }}
                >
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 ${isMe ? 'border-amber-400' : 'border-slate-700'} bg-gradient-to-br ${avatarColors[i % avatarColors.length]}`}>
                    <User className="w-5 h-5 text-white" />
                    {isMe && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400 drop-shadow-md" />}
                  </div>
                  {/* Tên và điểm bay trên đầu avatar */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 border border-slate-700">
                    {isMe ? 'Bạn' : p.name}: <span className="text-amber-400">{p.score}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Vạch đích (Finish Line) */}
        <div className="absolute right-8 top-16 bottom-4 w-4 flex flex-col pointer-events-none">
           {/* Checkerboard pattern */}
           {Array.from({ length: 20 }).map((_, i) => (
             <div key={i} className={`flex-1 w-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'} opacity-20`} />
           ))}
        </div>
      </div>

      {/* ═══ PHẦN DƯỚI: CÂU HỎI ═══ */}
      <div className="flex-1 bg-slate-900 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.05),transparent_60%)]" />

        <div className="max-w-4xl w-full w-full relative z-10">
          {!currentQuestion ? (
            <div className="text-center p-12 bg-slate-800/30 rounded-[32px] border border-slate-700/50 animate-pulse">
              <span className="text-xl font-bold text-slate-400">Chuẩn bị vòng đua...</span>
            </div>
          ) : (
            <>
              {/* Question Box */}
              <div className="bg-slate-800/80 backdrop-blur-xl rounded-[32px] border border-slate-700/50 p-8 md:p-10 mb-6 shadow-2xl relative">
                {/* Timer Circle */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full blur-lg animate-pulse ${timeLeft <= 3 ? 'bg-red-500/50' : 'bg-blue-500/30'}`} />
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 ${timeLeft <= 3 ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-blue-500 bg-slate-900 text-blue-400'} shadow-xl`}>
                      <span className="text-2xl font-black">{timeLeft}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-6 md:gap-10">
                  {/* Left: Question Number */}
                  <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-slate-900/50 border border-slate-700/50 shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Câu số</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300">
                      {questionIndex + 1}
                    </span>
                  </div>

                  {/* Right: Question Content */}
                  <div className="flex-1 flex items-center">
                    <p className="text-lg md:text-2xl font-bold text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {currentQuestion.question}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = answerResult?.correctAnswer === option;
                  const isWrong = answerResult && isSelected && !isCorrect;

                  let btnStyle = 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-blue-500/50 text-slate-300';
                  
                  if (isSelected && !answerResult) {
                    btnStyle = 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-[1.02]';
                  } else if (answerResult) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
                    } else if (isWrong) {
                      btnStyle = 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)] opacity-50';
                    } else {
                      btnStyle = 'bg-slate-800/30 border-slate-700/30 text-slate-500 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={!!selectedAnswer || !!answerResult}
                      onClick={() => handleAnswerSelect(option)}
                      className={`relative w-full p-5 rounded-2xl border-2 text-left font-semibold transition-all duration-300 flex items-center gap-4 ${btnStyle}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-lg ${
                        isSelected && !answerResult ? 'bg-white/20' : 
                        isCorrect ? 'bg-emerald-500/20 text-emerald-500' : 
                        isWrong ? 'bg-red-500/20 text-red-500' : 
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1 text-base md:text-lg break-words">{option}</span>
                      
                      {/* Icons for Result */}
                      {answerResult && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                      {answerResult && isWrong && <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
