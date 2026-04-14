import React from 'react';
import { Video, Music, Download } from 'lucide-react';

export default function MediaBar() {
  const handleAction = (type) => {
    // Bạn có thể thêm logic xử lý riêng cho từng nút ở đây sau này
    console.log(`Đang mở: ${type}`);
  };

  return (
    <div className="flex items-center gap-2 md:gap-6">
      <button 
        onClick={() => handleAction('video')}
        className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 hover:text-blue-400 transition-colors group"
      >
        <div className="p-1.5 bg-slate-800 group-hover:bg-blue-500/10 rounded-lg">
          <Video size={16} />
        </div>
        <span className="hidden sm:inline">Video</span>
      </button>

      <button 
        onClick={() => handleAction('audio')}
        className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 hover:text-pink-400 transition-colors group"
      >
        <div className="p-1.5 bg-slate-800 group-hover:bg-pink-500/10 rounded-lg">
          <Music size={16} />
        </div>
        <span className="hidden sm:inline">Audio</span>
      </button>

      <button 
        onClick={() => handleAction('download')}
        className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors group"
      >
        <div className="p-1.5 bg-slate-800 group-hover:bg-emerald-500/10 rounded-lg">
          <Download size={16} />
        </div>
        <span className="hidden sm:inline">Tải về</span>
      </button>
    </div>
  );
}