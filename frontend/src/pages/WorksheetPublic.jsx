import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Printer, BookOpen, Save, Sparkles, Bookmark, Heart, Loader2, AlertCircle, Search } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import { eduService } from '../services/eduService';
import {
  HeaderBlock,
  TableBlock,
  TwoColumnTableBlock,
  OpenQuestionBlock,
  FillInBlankBlock,
} from '../components/worksheet/WorksheetBlocks';
import '../components/worksheet/worksheet.css';
import { useAuth } from '../context/AuthContext';
import { useItemPreference } from '../context/ItemPreferenceContext';

export default function WorksheetPublic() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ensureStates, getState, toggleSaved: toggleSavedGlobal, toggleFavorite: toggleFavoriteGlobal, isPending } = useItemPreference();

  const [worksheet, setWorksheet] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  React.useEffect(() => {
    const fetchWorksheet = async () => {
      try {
        setLoading(true);
        const ws = await eduService.getPublicWorksheet(id);
        
        // Transform backend data to frontend structure
        let blocks = [];
        try {
          const content = typeof ws.content === 'string' ? JSON.parse(ws.content) : ws.content;
          
          if (Array.isArray(content) && content.length > 0 && content[0].type) {
            blocks = content;
          } else {
            blocks = [
              { id: `blk-h-${ws.id}`, type: 'header', data: { schoolName: '', className: '', studentName: '', phone: '' } },
              ...(Array.isArray(content) ? content : []).map((q, idx) => ({
                id: `blk-q-${ws.id}-${idx}`,
                type: 'open_question',
                data: { question: q.question, lines: 4 }
              }))
            ];
          }
        } catch (e) {
          console.error("Failed to parse worksheet content:", e);
          blocks = [];
        }

        setWorksheet({
          ...ws,
          subtitle: 'Phiếu học tập AI sinh',
          blocks
        });

        // Fetch my submission if logged in
        if (user) {
          try {
            const submission = await eduService.getMySubmission(id);
            if (submission) {
              setMySubmission(submission);
              setIsReadOnly(true);
              const answers = typeof submission.answers === 'string' ? JSON.parse(submission.answers) : submission.answers;
              const answerMap = {};
              if (Array.isArray(answers)) {
                answers.forEach(a => {
                  answerMap[a.question_id] = a.answer;
                });
              }
              setStudentAnswers(answerMap);
            }
          } catch (err) {
            console.warn("No submission found or error fetching it:", err);
          }
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWorksheet();
  }, [id, user]);

  useEffect(() => {
    const loadState = async () => {
      if (!user || !id) return;
      try {
        await ensureStates('assignment', [String(id)]);
      } catch (error) {
        console.error('Không thể tải trạng thái phiếu chia sẻ:', error);
      }
    };
    loadState();
  }, [user, id, ensureStates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AnimatedBackground />
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold animate-pulse">Đang tải tri thức...</p>
      </div>
    );
  }

  if (error || !worksheet) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AnimatedBackground />
        <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500/50 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-200 mb-2">Không tìm thấy phiếu học tập</h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">Đường dẫn có thể đã hết hạn hoặc không tồn tại. Vui lòng kiểm tra lại liên kết.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3 rounded-xl transition-colors">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const toggleSaved = async () => {
    try {
      await toggleSavedGlobal('assignment', String(id));
    } catch (error) {
      console.error('Toggle save worksheet public failed:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await toggleFavoriteGlobal('assignment', String(id));
    } catch (error) {
      console.error('Toggle favorite worksheet public failed:', error);
    }
  };

  const worksheetPreference = getState('assignment', String(id));
  const isSaved = worksheetPreference.isSaved;
  const isFavorite = worksheetPreference.isFavorite;
  const isLoadingAction = isPending('assignment', String(id), 'save') || isPending('assignment', String(id), 'favorite');

  const onAnswerChange = (blockId, data) => {
    if (isReadOnly) return;
    setStudentAnswers(prev => ({
      ...prev,
      [blockId]: data
    }));
  };

  const handleSubmission = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      const payload = Object.entries(studentAnswers).map(([blockId, ans]) => ({
        question_id: blockId,
        answer: ans
      }));
      await eduService.submitWorksheet(id, payload);
      setSubmitted(true);
      setIsReadOnly(true);
    } catch (error) {
      console.error('Submission Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen font-sans text-slate-50 flex flex-col bg-slate-950 print:bg-white">
        <div className="no-print fixed inset-0 z-0 pointer-events-none">
          <AnimatedBackground />
        </div>

        <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 pt-10 flex-1">
          {/* Actions Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 mb-8 no-print shadow-xl gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                {isReadOnly ? 'Xem Lại Bài Làm' : user ? 'Làm Phiếu Học Tập' : 'Phiếu Học Tập Chia Sẻ'}
              </h1>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {user && (
                <>
                  <button
                    type="button"
                    disabled={isLoadingAction}
                    onClick={toggleSaved}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 border px-3.5 py-2 rounded-xl font-bold transition-colors text-sm \${isSaved ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'}`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 \${isSaved ? 'fill-amber-300' : ''}`} />
                    {isSaved ? 'Đã lưu' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    disabled={isLoadingAction}
                    onClick={toggleFavorite}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 border px-3.5 py-2 rounded-xl font-bold transition-colors text-sm \${isFavorite ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 \${isFavorite ? 'fill-rose-300' : ''}`} />
                    {isFavorite ? 'Đã thích' : 'Yêu thích'}
                  </button>
                </>
              )}
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <Printer className="w-4 h-4" /> In / Tải PDF
              </button>
            </div>
          </div>

          {/* Paper Container */}
          <div className="ws-paper shadow-[0_20px_50px_rgba(0,0,0,0.3)] print:shadow-none bg-white rounded-lg p-8">
            {/* Feedback section if graded */}
            {mySubmission && mySubmission.score !== null && (
              <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-200 rounded-3xl relative overflow-hidden no-print">
                <div className="absolute top-0 right-0 p-4 bg-emerald-500 text-white font-black text-2xl rounded-bl-3xl shadow-lg">
                  {mySubmission.score}/10
                </div>
                <h3 className="text-emerald-700 font-bold flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" /> Phản hồi từ Giáo viên
                </h3>
                <p className="text-slate-600 italic">"{mySubmission.feedback || 'Bài làm rất tốt!'}"</p>
              </div>
            )}

            {mySubmission && mySubmission.score === null && isReadOnly && !submitted && (
              <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl no-print">
                <h3 className="text-amber-700 font-bold flex items-center gap-2 mb-1">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Đã nộp bài
                </h3>
                <p className="text-slate-600 text-sm">Bài làm của bạn đang chờ giáo viên chấm điểm. Bạn có thể xem lại nội dung đã nộp bên dưới.</p>
              </div>
            )}

            <div className="ws-title-section mb-10 text-center">
              <h2 className="ws-title text-slate-900 text-3xl font-black mb-2">{worksheet.title}</h2>
              <p className="ws-subtitle text-slate-500 font-medium uppercase tracking-widest">{worksheet.subtitle}</p>
            </div>

            <div className="space-y-6">
              {worksheet.blocks.map((block) => {
                const BlockComponent = {
                  header: HeaderBlock,
                  table: TableBlock,
                  two_column_table: TwoColumnTableBlock,
                  open_question: OpenQuestionBlock,
                  fill_in_blank: FillInBlankBlock,
                }[block.type];

                if (!BlockComponent) return null;

                return (
                  <div key={block.id} className="worksheet-block">
                    <BlockComponent
                      data={block.data}
                      answers={studentAnswers[block.id] || {}}
                      onAnswerChange={(data) => onAnswerChange(block.id, data)}
                      readOnly={isReadOnly}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {user && !isReadOnly && (
            <div className="max-w-4xl mx-auto mt-8 flex justify-center no-print">
              <button
                onClick={handleSubmission}
                disabled={submitting}
                className="group relative flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-12 py-4 rounded-2xl shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ĐANG NỘP BÀI...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    NỘP BÀI TẬP
                  </>
                )}
              </button>
            </div>
          )}

          {isReadOnly && (
            <div className="max-w-4xl mx-auto mt-8 flex justify-center no-print">
              <button
                onClick={() => navigate('/my-lessons')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-8 py-3 rounded-xl transition-all"
              >
                Quay lại Bài học của tôi
              </button>
            </div>
          )}

          <div className="no-print text-center mt-12 mb-16">
            <p className="text-sm text-slate-500 font-medium">Được tạo bởi <span className="font-bold text-slate-400">QuizVibe AI Copilot</span></p>
          </div>
        </div>
        
        <div className="no-print">
          <Footer />
        </div>

        {/* ═══ SUCCESS MODAL ═══ */}
        {submitted && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 no-print">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"></div>
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Sparkles className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Tuyệt vời! 🎉</h3>
              <p className="text-slate-400 text-sm font-medium mb-8">Bài làm của bạn đã được gửi thành công. Giáo viên sẽ sớm nhận xét và chấm điểm cho bạn.</p>
              <button 
                onClick={() => navigate('/my-lessons')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all"
              >
                Quay lại bài học của tôi
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
