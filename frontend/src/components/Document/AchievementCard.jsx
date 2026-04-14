import React from 'react';
import { Trophy, Star, CheckCircle2, PartyPopper } from 'lucide-react';

export default function AchievementCard({ onClose, onContinue }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative bg-[#0f172a] border-2 border-amber-500/50 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_80px_rgba(245,158,11,0.15)] animate-in zoom-in duration-300">
        
        {/* Cup rực rỡ */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative bg-gradient-to-b from-amber-300 to-amber-600 w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-[#0f172a]">
            <Trophy size={60} className="text-slate-900" />
          </div>
          <Star className="absolute -top-2 -right-2 text-amber-300 animate-bounce fill-amber-300" size={24} />
          <PartyPopper className="absolute -bottom-2 -left-2 text-blue-400" size={24} />
        </div>

        <h2 className="text-3xl font-black text-white mb-3 italic tracking-tighter uppercase">Hoàn thành bài học!</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2 font-medium">
          Bạn vừa nạp thêm một lượng kiến thức khổng lồ. Hãy duy trì phong độ này bằng một bài trắc nghiệm nhé!
        </p>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-4 mb-8 flex items-center justify-center gap-3">
          <CheckCircle2 className="text-emerald-400" size={22} />
          <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">+100 ĐIỂM KINH NGHIỆM</span>
        </div>

        <button 
          onClick={onContinue}
          className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs"
        >
          Tiếp tục ôn luyện
        </button>
      </div>
    </div>
  );
}