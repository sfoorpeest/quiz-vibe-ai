import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Clock, CheckCircle2, XCircle, ArrowRight, Home,
  Sparkles, Loader2, Play, BrainCircuit, RotateCcw,
  Trophy, Medal, ArrowLeft, BookOpen, Globe, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axiosClient';

// Helper: Web Audio API mini synth cho âm thanh hiệu ứng (không cần tải file ngoài)
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
      // Âm thanh Ping ting ting (Thành công)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      // Âm thanh Bzz (Thất bại)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Trình duyệt không hỗ trợ Audio hoặc cần tương tác:", e);
  }
};

// Định nghĩa CSS animations tại component level
const BlobStyles = () => (
  <style>
    {`
      @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      .animate-blob {
        animation: blob 7s infinite ease-in-out;
      }
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      .animation-delay-4000 {
        animation-delay: 4s;
      }
    `}
  </style>
);

// Component Element 3D có thể kéo thả tương tác
const Draggable3DItem = ({ children, className, initialY, initialX, initialRotateX, initialRotateY, delay }) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
      whileHover={{ scale: 1.1, cursor: "grab" }}
      whileDrag={{ scale: 1.2, cursor: "grabbing" }}
      dragElastic={0.2}
      initial={{ y: initialY, x: initialX, rotateX: initialRotateX, rotateY: initialRotateY }}
      animate={{
        x: [initialX, initialX + 250, initialX - 150, initialX],
        y: [initialY, initialY - 150, initialY + 200, initialY],
        rotateX: [initialRotateX, initialRotateX - 45, initialRotateX + 60, initialRotateX],
        rotateY: [initialRotateY, initialRotateY + 90, initialRotateY - 90, initialRotateY],
      }}
      transition={{
        duration: 35,
        ease: "linear",
        repeat: Infinity,
        delay: delay,
      }}
      className={`absolute z-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] border border-slate-700/50 p-5 transform-3d pointer-events-auto ${className}`}
      style={{ touchAction: "none" }}
    >
      <div className="filter drop-shadow-md text-inherit" style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </motion.div>
  );
};

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ----- STATE QUẢN LÝ SETUP QUIZ -----
  const [topic, setTopic] = useState(location.state?.topic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);

  // ----- STATE QUẢN LÝ ĐANG CHƠI QUIZ -----
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Chỉnh thời gian mỗi câu
  const TIME_PER_QUESTION = 30;
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  // Bộ đếm ngược (Countdown Timer)
  useEffect(() => {
    // Không chạy đếm ngược nếu chưa có câu hỏi, hoặc đã chọn đáp án, hoặc đã xong
    if (questions.length === 0 || isFinished || isAnswered) return;

    if (timeLeft === 0) {
      // Tự động xử lý là "chưa trả lời / sai" khi hết giờ
      playSound('wrong');
      setIsAnswered(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, questions.length, isFinished]);

  // Sinh câu hỏi từ AI Backend
  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      // Trỏ vào API thật trong backend quizRoutes
      const res = await api.post('/api/quiz/generate', {
        topic: topic,
        limit: 5 // Default sinh 5 câu cho nhanh
      });

      if (res.data && res.data.data && res.data.data.length > 0) {
        setQuestions(res.data.data);
        setQuizId(res.data.quizId); // Lưu quizId từ backend
      } else if (res.data && res.data.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        setQuizId(res.data.quizId);
      } else {
        alert("Không nhận được dữ liệu hợp lệ từ AI. Hãy thử lại chủ đề khác.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi tạo. Backend có thể đang bận: " + (err.response?.data?.message || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  // ----- HANDLERS LÀM BÀI -----
  const currentQuestion = questions[currentIndex];

  // Tách câu hỏi và lời giải chi tiết (được nén trong backend)
  const contentParts = currentQuestion?.content ? currentQuestion.content.split('\n\n[EXPLAIN]') : ["", ""];
  const displayQuestion = contentParts[0];
  const displayExplanation = contentParts.length > 1 ? contentParts[1] : null;

  const handleSelectAnswer = (option) => {
    if (isAnswered) return; // Khoá chọn khi đã chọn

    setSelectedOption(option);
    setIsAnswered(true);

    // Kích hoạt loa check kết quả
    if (option === currentQuestion.correct_answer) {
      playSound('correct');
      setScore(s => s + 1);
    } else {
      playSound('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      // Sang câu kế tiếp
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      // Hết câu => Giao diện kết quả
      setIsFinished(true);
    }
  };

  // Tự động lưu kết quả khi hoàn thành
  useEffect(() => {
    const submitResult = async () => {
      if (isFinished && score > 0) {
        try {
          await api.post('/api/quiz/submit', {
            quizId: quizId,
            score: score,
            total: questions.length
          });
          console.log("Kết quả đã được lưu!");
        } catch (error) {
          console.error("Lỗi khi lưu kết quả:", error);
        }
      }
    };
    submitResult();
  }, [isFinished, score, quizId, questions.length]);

  // -------------------------------------------------------------------------------- //
  //  VIEW 1: SETUP (Nếu chưa có dữ liệu)
  // -------------------------------------------------------------------------------- //
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#8C9EFF] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-50">
        <BlobStyles />

        {/* Animated Background Blobs */}
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-[#9394E6] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob pointer-events-none"></div>
        <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-[#7A7BCB] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[40%] w-96 h-96 bg-[#B1B2FF] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

        {/* 3D Elements Wrapper */}
        <div className="absolute inset-0 pointer-events-none perspective-1000 hidden md:block">
          <Draggable3DItem className="top-[15%] right-[20%] text-amber-300" initialY={20} initialX={-20} initialRotateX={30} initialRotateY={30} delay={0}>
            <Star size={40} />
          </Draggable3DItem>

          <Draggable3DItem className="bottom-[20%] left-[15%] text-cyan-400" initialY={-20} initialX={30} initialRotateX={15} initialRotateY={15} delay={1}>
            <BrainCircuit size={40} />
          </Draggable3DItem>

          <Draggable3DItem className="top-[25%] left-[10%] text-blue-400" initialY={10} initialX={20} initialRotateX={-15} initialRotateY={15} delay={0.5}>
            <Globe size={40} />
          </Draggable3DItem>

          <Draggable3DItem className="bottom-[30%] right-[15%] text-violet-400" initialY={-10} initialX={-30} initialRotateX={15} initialRotateY={-15} delay={2}>
            <Trophy size={40} />
          </Draggable3DItem>

          <Draggable3DItem className="top-[10%] left-[30%] text-amber-400" initialY={0} initialX={0} initialRotateX={20} initialRotateY={-20} delay={1.5}>
            <Sparkles size={36} />
          </Draggable3DItem>
        </div>

        <div className="relative z-10 w-full max-w-xl bg-white/50 backdrop-blur-3xl border-2 border-white/60 p-10 rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-700 text-slate-900">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-linear-to-br from-blue-500/10 to-violet-600/10 rounded-3xl flex items-center justify-center shadow-inner border border-violet-100">
              <BrainCircuit className="w-10 h-10 text-violet-600 drop-shadow-sm" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center mb-2 tracking-tight">Tạo Bài Kiểm Tra AI</h1>
          <p className="text-slate-500 text-center text-base font-bold mb-10 px-4">Thông minh hơn, nhanh hơn - Hãy để AI thiết kế thử thách dành riêng cho bạn.</p>

          <form onSubmit={handleGenerate} className="space-y-8">
            <div>
              <label className="block text-slate-700 text-sm font-black mb-3 ml-2 uppercase tracking-wider">Chủ đề hoặc nội dung cần ôn tập:</label>
              <textarea
                autoFocus
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Định luật Newton, Phản ứng Oxi hoá khử, Lịch sử Việt Nam..."
                rows={4}
                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 font-bold rounded-3xl p-6 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner custom-scrollbar resize-y text-lg placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center px-6 py-4 bg-slate-100 hover:bg-white text-slate-600 font-black rounded-2xl transition-all border-2 border-slate-200/50 shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-95"
              >
                Trở lại
              </button>
              <button
                type="submit"
                disabled={!topic.trim() || isGenerating}
                className="flex-2 flex items-center justify-center gap-3 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl font-black transition-all shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:shadow-blue-500/40 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0 active:scale-95 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang Soạn Đề...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    <span>Bắt đầu Quiz</span>
                  </>
                )}

                {/* Shimmer effect */}
                {!isGenerating && (
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------------- //
  //  VIEW 3: KẾT QUẢ (Sau khi làm xong)
  // -------------------------------------------------------------------------------- //
  if (isFinished) {
    // Tính phần trăm
    const percentage = Math.round((score / questions.length) * 100);
    const isGood = percentage >= 70;

    return (
      <div className="min-h-screen bg-[#8C9EFF] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-50">
        <BlobStyles />

        {/* Animated Background Blobs */}
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-[#9394E6] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob pointer-events-none"></div>
        <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-[#7A7BCB] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[40%] w-96 h-96 bg-[#B1B2FF] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

        {/* 3D Elements Wrapper cho View Kết Quả */}
        <div className="absolute inset-0 pointer-events-none perspective-1000 hidden md:block">
          <Draggable3DItem className="top-[15%] right-[20%] text-amber-400" initialY={10} initialX={-20} initialRotateX={30} initialRotateY={30} delay={0}>
            <Star size={40} />
          </Draggable3DItem>

          <Draggable3DItem className="top-[25%] left-[20%] text-violet-400" initialY={-10} initialX={20} initialRotateX={-15} initialRotateY={15} delay={0.5}>
            <Trophy size={48} />
          </Draggable3DItem>

          <Draggable3DItem className="bottom-[20%] right-[15%] text-amber-300" initialY={0} initialX={-30} initialRotateX={15} initialRotateY={-15} delay={1.5}>
            <Medal size={48} />
          </Draggable3DItem>

          <Draggable3DItem className="bottom-[25%] left-[10%] text-cyan-400" initialY={-20} initialX={30} initialRotateX={15} initialRotateY={15} delay={1}>
            <BrainCircuit size={40} />
          </Draggable3DItem>

          <Draggable3DItem className="top-[10%] left-[10%] text-blue-400" initialY={5} initialX={-10} initialRotateX={10} initialRotateY={20} delay={0.8}>
            <Globe size={44} />
          </Draggable3DItem>
        </div>

        {/* Background Win/Lose Thêm Phụ */}
        <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 mix-blend-color-burn opacity-30 ${isGood ? 'bg-emerald-300' : 'bg-rose-300'}`}></div>

        <div className="relative z-10 w-full max-w-md bg-white/50 backdrop-blur-3xl border-2 border-white/60 p-10 rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.08)] text-center animate-in zoom-in-95 slide-in-from-bottom-5 duration-700">

          <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Kết Quả Bài Làm</h1>

          <div className="flex justify-center my-6 relative">
            {/* Vòng sáng đằng sau điểm */}
            <div className={`absolute inset-0 blur-3xl opacity-20 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

            <div className={`relative z-10 text-5xl font-black py-5 px-10 rounded-[35px] border-4 inline-block shadow-2xl ${isGood ? 'text-emerald-600 border-emerald-500/20 bg-emerald-50/50' : 'text-amber-600 border-amber-500/20 bg-amber-50/50'}`}>
              {score}/{questions.length}
            </div>
          </div>

          <p className="text-slate-600 font-bold text-xl mb-10 leading-relaxed px-4">
            {isGood ? 'Tuyệt đỉnh! Bạn là một bậc thầy kiến thức thực thụ.' : 'Bạn đã hoàn thành bài thi, hãy ôn tập thêm chút nữa nhé!'}
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-full px-8 py-4 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <Home className="w-6 h-6 border-2 border-white/20 rounded-lg p-0.5" /> Quay về trang chủ
            </button>
            <button
              onClick={() => {
                // Chơi lại bộ câu hỏi này
                setCurrentIndex(0);
                setScore(0);
                setIsAnswered(false);
                setSelectedOption(null);
                setTimeLeft(TIME_PER_QUESTION);
                setIsFinished(false);
              }}
              className="w-full px-8 py-4 bg-slate-100 hover:bg-white text-slate-700 font-black rounded-2xl transition-all shadow-md hover:shadow-lg border-2 border-slate-200/50 flex items-center justify-center gap-3 text-lg hover:-translate-y-1 active:translate-y-0 active:scale-95"
            >
              <RotateCcw className="w-6 h-6 border-2 border-slate-300/50 rounded-lg p-0.5" /> Làm lại bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------------- //
  //  VIEW 2: LÀM BÀI (One Slide Per Question)
  // -------------------------------------------------------------------------------- //

  // Tuỳ chỉnh hiển thị thời gian
  const timeRatio = timeLeft / TIME_PER_QUESTION;
  let timerColor = 'bg-blue-500';
  if (timeRatio <= 0.3) timerColor = 'bg-red-500';
  else if (timeRatio <= 0.6) timerColor = 'bg-amber-500';

  // Chuyển mảng options từ chuỗi (nếu bị parse dạng chuỗi) thành mảng array
  let currentOptions = currentQuestion.options;
  if (typeof currentOptions === 'string') {
    try {
      currentOptions = JSON.parse(currentOptions);
    } catch {
      currentOptions = [];
    }
  }

  return (
    <div className="min-h-screen bg-[#8C9EFF] font-sans flex flex-col relative overflow-hidden">
      <BlobStyles />

      {/* Animated Background Blobs */}
      <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-[#9394E6] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-[#7A7BCB] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[40%] w-96 h-96 bg-[#B1B2FF] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* 3D Elements Wrapper cho View 2 */}
      <div className="absolute inset-0 pointer-events-none perspective-1000 hidden md:block">
        <Draggable3DItem className="top-[15%] right-[20%] text-amber-400" initialY={10} initialX={-20} initialRotateX={30} initialRotateY={30} delay={0}>
          <Star size={40} />
        </Draggable3DItem>

        <Draggable3DItem className="top-[25%] left-[20%] text-violet-400" initialY={-10} initialX={20} initialRotateX={-15} initialRotateY={15} delay={0.5}>
          <Trophy size={48} />
        </Draggable3DItem>

        <Draggable3DItem className="bottom-[20%] right-[15%] text-amber-300" initialY={0} initialX={-30} initialRotateX={15} initialRotateY={-15} delay={1.5}>
          <Medal size={48} />
        </Draggable3DItem>

        <Draggable3DItem className="bottom-[25%] left-[10%] text-cyan-400" initialY={-20} initialX={30} initialRotateX={15} initialRotateY={15} delay={1}>
          <BrainCircuit size={40} />
        </Draggable3DItem>

        <Draggable3DItem className="top-[10%] left-[10%] text-blue-400" initialY={5} initialX={-10} initialRotateX={10} initialRotateY={20} delay={0.8}>
          <Globe size={44} />
        </Draggable3DItem>
      </div>

      {/* Header - Navigation & Progress */}
      <header className="px-6 py-4 shrink-0 relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-colors border border-white/30 group flex items-center gap-2 text-sm font-bold text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Bỏ cuộc
        </button>

        <div className="flex items-center gap-2 font-bold text-slate-700 bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
          Câu <span className="text-slate-900 text-lg">{currentIndex + 1}</span> / {questions.length}
        </div>
      </header>

      {/* Progress Bar Top */}
      <div className="w-full bg-white/20 h-1.5 shrink-0">
        <div
          className="h-full bg-linear-to-r from-blue-600 to-violet-500 transition-all duration-500 rounded-r-full"
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto z-10">
        <div className="max-w-3xl mx-auto w-full p-4 sm:p-6 pb-28">
          {/* Câu hỏi Container (Slide Form) */}
          <div key={currentIndex} className="w-full animate-in slide-in-from-right-8 fade-in duration-500">

            {/* Vùng Đếm Ngược Hình Đồng Hồ Nước */}
            <div className="flex justify-center mb-8 relative">
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-mono text-xl font-bold shadow-lg transition-colors duration-300 ${timeRatio <= 0.3 ? 'bg-red-500/15 text-red-600 border-red-400/50' : 'bg-white/30 backdrop-blur-md text-slate-800 border-white/40'}`}>
                <Clock className={`w-5 h-5 ${timeRatio <= 0.3 ? 'animate-pulse' : ''}`} />
                00:{timeLeft.toString().padStart(2, '0')}
              </div>

              {/* The thin glowing bar underneath clock */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
                  style={{ width: `${timeRatio * 100}%` }}
                ></div>
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10 leading-relaxed text-balance">
              {displayQuestion}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {currentOptions.map((option, idx) => {
                // Logic kiểm tra Styles State
                let btnClass = "bg-white/50 backdrop-blur-xl border-white/60 hover:bg-white hover:border-violet-400 hover:shadow-[0_25px_50px_-12px_rgba(124,58,237,0.25)] hover:-translate-y-1 text-slate-800 shadow-sm ring-1 ring-white/20";
                let icon = null;

                if (isAnswered) {
                  // Đã chốt đáp án
                  if (option === currentQuestion.correct_answer) {
                    // Đáp án đúng luôn xanh
                    btnClass = "bg-emerald-100/90 border-emerald-500/50 text-emerald-900 shadow-[0_10px_25px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/20";
                    icon = <CheckCircle2 className="w-7 h-7 text-emerald-600" />;
                  } else if (option === selectedOption) {
                    // Lựa chọn của mình bị sai nên đỏ
                    btnClass = "bg-red-100/90 border-red-500/50 text-red-800 shadow-[0_10px_25px_rgba(239,68,68,0.15)] ring-2 ring-red-500/20";
                    icon = <XCircle className="w-7 h-7 text-red-600" />;
                  } else {
                    // Các ô khác mờ đi
                    btnClass = "bg-white/30 border-white/20 text-slate-400 opacity-40 grayscale-[50%]";
                  }
                }

                // Nếu chưa chọn (trống), hoặc lỡ bấm nhưng style có hover
                const alphaLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isAnswered}
                    className={`relative w-full text-left px-8 py-6 rounded-3xl border-2 font-bold text-lg sm:text-xl transition-all duration-300 flex items-center gap-5 ${btnClass} ${!isAnswered ? 'active:scale-[0.98]' : 'cursor-default'}`}
                  >
                    {/* Circle Letter Marker */}
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${isAnswered ? 'bg-transparent border-0' : 'bg-violet-100/80 border border-violet-200 text-violet-700 shadow-inner'}`}>
                      {icon ? icon : alphaLabels[idx]}
                    </div>

                    <span className="flex-1 leading-normal">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Lời giải thích AI - Hiển inline ngay dưới các đáp án */}
            {isAnswered && (
              <div className="mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                {/* Trạng thái Đúng / Sai */}
                <div className="mb-3 font-bold text-lg">
                  {selectedOption === currentQuestion?.correct_answer ? (
                    <span className="text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> Điểm tuyệt đối!</span>
                  ) : selectedOption ? (
                    <span className="text-red-700 flex items-center gap-2"><XCircle className="w-6 h-6" /> Oh no, sai rồi! Học lại kiến thức này nhé.</span>
                  ) : null}
                </div>

                {displayExplanation && (
                  <div className="text-lg font-medium text-slate-800 leading-relaxed bg-white/60 backdrop-blur-xl p-6 rounded-3xl border-2 border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)]">
                    <span className="text-violet-700 font-bold mr-2 drop-shadow-sm">💡 Giải thích:</span>
                    {displayExplanation}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* FLOATING ACTION BUTTON - Nhẹ nhàng, đồng bộ tông trắng-tím */}
      {isAnswered && (
        <div className="fixed bottom-8 right-8 sm:bottom-12 sm:right-12 z-50 animate-in slide-in-from-right-10 fade-in duration-500">
          <button 
            onClick={handleNext}
            className="group flex items-center gap-4 bg-white/50 hover:bg-white backdrop-blur-xl text-violet-700 pl-8 pr-4 py-4 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-white/60 font-black transition-all hover:-translate-y-2 hover:scale-105 active:translate-y-0 active:scale-95 text-xl"
          >
            <span className="tracking-tight">
              {currentIndex < questions.length - 1 ? 'Tiếp tục' : 'Xem Kết Quả'}
            </span>
            <div className="bg-violet-100 p-3 rounded-2xl group-hover:bg-violet-200 transition-colors shadow-sm">
              <ArrowRight className="w-6 h-6 text-violet-700" strokeWidth={3} />
            </div>
          </button>
        </div>
      )}

    </div>
  );
}
