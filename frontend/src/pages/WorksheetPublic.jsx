import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Download, BookOpen } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import { eduService } from '../services/eduService';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  HeaderBlock,
  TableBlock,
  TwoColumnTableBlock,
  OpenQuestionBlock,
  FillInBlankBlock,
} from '../components/worksheet/WorksheetBlocks';
import '../components/worksheet/worksheet.css';

export default function WorksheetPublic() {
  const { id } = useParams();

  const [worksheet, setWorksheet] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const fetchWorksheet = async () => {
      try {
        setLoading(true);
        const res = await eduService.getPublicWorksheet(id);
        const ws = res.data;
        
        // Transform backend data to frontend structure
        let blocks = [];
        try {
          const content = JSON.parse(ws.content);
          blocks = [
            { id: `blk-h-${ws.id}`, type: 'header', data: { schoolName: '', className: '', studentName: '', phone: '' } },
            ...content.map(q => ({
              id: `blk-q-${q.id}`,
              type: 'open_question',
              data: { question: q.question, lines: 4 }
            }))
          ];
        } catch (e) {
          blocks = [];
        }

        setWorksheet({
          ...ws,
          subtitle: 'Phiếu học tập AI sinh',
          blocks
        });
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWorksheet();
  }, [id]);

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

  const renderBlock = (block) => {
    const props = {
      data: block.data,
      onChange: () => {}, // read-only
      editable: false,
    };

    let blockComponent;
    switch (block.type) {
      case 'header':
        blockComponent = <HeaderBlock {...props} />;
        break;
      case 'table':
        blockComponent = <TableBlock {...props} />;
        break;
      case 'two_column_table':
        blockComponent = <TwoColumnTableBlock {...props} />;
        break;
      case 'open_question':
        blockComponent = <OpenQuestionBlock {...props} />;
        break;
      case 'fill_in_blank':
        blockComponent = <FillInBlankBlock {...props} />;
        break;
      default:
        blockComponent = null;
    }

    return (
      <div key={block.id} className="relative">
        {blockComponent}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen font-sans text-slate-50 flex flex-col bg-slate-100 print:bg-white pb-24">
      <div className="no-print absolute inset-0 bg-slate-950">
        <AnimatedBackground />
      </div>

      <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 pt-10 flex-1">
        {/* Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 mb-8 no-print shadow-xl gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Chế độ xem Phiếu Học Tập
            </h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-colors text-sm"
            >
              <Printer className="w-4 h-4" /> In / Tải PDF
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="ws-paper shadow-[0_20px_50px_rgba(0,0,0,0.3)] print:shadow-none bg-white rounded-lg">
          <div className="ws-title-section">
            <h2 className="ws-title">{worksheet.title}</h2>
            <p className="ws-subtitle">{worksheet.subtitle}</p>
          </div>
          <div className="space-y-1">
            {worksheet.blocks.map(block => renderBlock(block))}
          </div>
        </div>

        <div className="no-print text-center mt-12 mb-6">
          <p className="text-sm text-slate-500 font-medium">Được tạo bởi <span className="font-bold text-slate-400">QuizVibe AI Copilot</span></p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
