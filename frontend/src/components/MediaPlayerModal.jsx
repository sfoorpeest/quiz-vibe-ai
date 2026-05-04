import React, { useEffect } from 'react';
import { Video, Volume2, X } from 'lucide-react';

/**
 * MediaPlayerModal - Popup phát Video/Audio chuyên nghiệp
 * Hỗ trợ: YouTube, MP4, WebM, MOV, MP3, WAV, OGG
 * 
 * @param {boolean} isOpen - Trạng thái đóng/mở modal
 * @param {function} onClose - Hàm đóng modal
 * @param {string} url - Đường dẫn media (YouTube URL hoặc file trực tiếp)
 * @param {string} title - Tiêu đề hiển thị
 */
export default function MediaPlayerModal({ isOpen, onClose, url, title }) {
  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const isYouTube = /youtube\.com|youtu\.be/i.test(url);
  const isAudio = /\.(mp3|wav|ogg)(\?|$)/i.test(url);

  // Chuyển đổi link YouTube sang dạng embed
  let embedUrl = url;
  if (isYouTube) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }

  const playerLabel = isYouTube ? 'YouTube Player' : isAudio ? 'Audio Player' : 'Video Player';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-4xl mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">{playerLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-red-600 rounded-xl transition-all group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* Player Area */}
        <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          {isYouTube ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={title}
              />
            </div>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
                <Volume2 className="w-10 h-10 text-white" />
              </div>
              <p className="text-slate-300 font-semibold text-center">{title}</p>
              <audio
                controls
                autoPlay
                src={url}
                className="w-full max-w-md"
                style={{ filter: 'invert(1) hue-rotate(180deg)', opacity: 0.85 }}
              />
            </div>
          ) : (
            <video
              controls
              autoPlay
              src={url}
              className="w-full"
            />
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-500 mt-3 font-medium">
          Nhấn Esc hoặc vùng tối bên ngoài để đóng
        </p>
      </div>
    </div>
  );
}
