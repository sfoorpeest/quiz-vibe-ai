import React, { useEffect, useState, useCallback } from 'react';
import { Award, X } from 'lucide-react';

/**
 * BadgeToast — Component thông báo toàn cục khi user nhận được thẻ thành tích mới.
 * Được render ở cấp App.jsx, lắng nghe event 'badge:unlocked' từ window.
 * 
 * Cách dùng từ bất kỳ đâu:
 *   window.dispatchEvent(new CustomEvent('badge:unlocked', { detail: { badges: [...] } }));
 */

const TIER_COLORS = {
  DIAMOND: {
    bg: 'from-cyan-500/20 to-purple-500/20',
    border: 'border-cyan-400/60',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-500/30',
    emoji: '💎',
  },
  GOLD: {
    bg: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-400/60',
    text: 'text-yellow-300',
    glow: 'shadow-yellow-500/30',
    emoji: '🥇',
  },
  SILVER: {
    bg: 'from-slate-400/20 to-gray-400/20',
    border: 'border-slate-400/50',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/20',
    emoji: '🥈',
  },
  BRONZE: {
    bg: 'from-orange-500/20 to-amber-600/20',
    border: 'border-orange-400/50',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/20',
    emoji: '🥉',
  },
};

function BadgeToastItem({ badge, onDismiss }) {
  const tier = TIER_COLORS[badge.tier] || TIER_COLORS.BRONZE;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`relative flex items-center gap-4 rounded-2xl border ${tier.border} bg-linear-to-r ${tier.bg} 
        px-5 py-4 shadow-xl ${tier.glow} backdrop-blur-xl
        animate-[slideInRight_0.5s_ease-out]`}
      style={{ minWidth: 320 }}
    >
      {/* Icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
        {badge.icon_url || tier.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          🎉 Thẻ thành tích mới!
        </p>
        <p className="text-sm font-bold text-white truncate">{badge.name}</p>
        <p className={`text-xs font-medium ${tier.text}`}>
          {tier.emoji} Hạng {TIER_COLORS[badge.tier]?.emoji === '💎' ? 'Kim Cương' : badge.tier === 'GOLD' ? 'Vàng' : badge.tier === 'SILVER' ? 'Bạc' : 'Đồng'}
        </p>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BadgeToast() {
  const [toasts, setToasts] = useState([]);

  const handleBadgeEvent = useCallback((event) => {
    const badges = event.detail?.badges || [];
    if (badges.length === 0) return;

    const newToasts = badges.map((badge, idx) => ({
      ...badge,
      _toastId: `${Date.now()}-${idx}`,
    }));

    setToasts((prev) => [...prev, ...newToasts]);
  }, []);

  useEffect(() => {
    window.addEventListener('badge:unlocked', handleBadgeEvent);
    return () => window.removeEventListener('badge:unlocked', handleBadgeEvent);
  }, [handleBadgeEvent]);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t._toastId !== toastId));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
      {toasts.map((toast) => (
        <BadgeToastItem
          key={toast._toastId}
          badge={toast}
          onDismiss={() => dismissToast(toast._toastId)}
        />
      ))}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
