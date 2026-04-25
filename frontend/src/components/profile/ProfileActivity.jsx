import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

const actionConfig = {
  VIEWED_MATERIAL: {
    label: 'Đã xem học liệu',
    icon: BookOpen,
    accent: 'text-cyan-300 bg-cyan-500/10',
  },
  STARTED_QUIZ: {
    label: 'Bắt đầu bài kiểm tra',
    icon: Activity,
    accent: 'text-amber-300 bg-amber-500/10',
  },
  COMPLETED_QUIZ: {
    label: 'Hoàn thành bài kiểm tra',
    icon: CheckCircle2,
    accent: 'text-emerald-300 bg-emerald-500/10',
  },
  QUIZ_ATTEMPT: {
    label: 'Đã làm bài kiểm tra',
    icon: CheckCircle2,
    accent: 'text-violet-300 bg-violet-500/10',
  },
};

const formatTimestamp = (value) => {
  if (!value) {
    return 'Không rõ thời gian';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function ProfileActivity({
  title,
  description,
  items,
  isLoading,
  emptyMessage,
  onNavigateItem,
}) {
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [items, isLoading]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [items]);

  const visibleItems = sortedItems.slice(0, visibleCount);

  const handleScroll = (event) => {
    const el = event.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (nearBottom) {
      setVisibleCount((prev) => Math.min(prev + 10, sortedItems.length));
    }
  };

  return (
    <section className="rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl border border-slate-700/60 bg-slate-950/40" />
          ))}
        </div>
      ) : sortedItems.length ? (
        <div className="max-h-[760px] overflow-y-auto pr-1 space-y-4" onScroll={handleScroll}>
          {visibleItems.map((item, index) => {
            const config = actionConfig[item.action] || actionConfig.COMPLETED_QUIZ;
            const Icon = config.icon;
            const isNavigable = typeof onNavigateItem === 'function' && Number.isInteger(Number(item?.materialId)) && Number(item.materialId) > 0;
            const detail = item.score != null
              ? `Điểm ${Number(item.score).toFixed(1)}`
              : item.progress != null
                ? `Tiến độ ${item.progress}%`
                : 'Đã cập nhật';

            return (
              <article
                key={`${item.createdAt}-${item.title}-${index}`}
                className={`rounded-3xl border border-slate-700/60 bg-slate-950/40 p-4 transition hover:border-blue-500/30 hover:bg-slate-900/80 ${isNavigable ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (isNavigable) {
                    onNavigateItem(item);
                  }
                }}
                onKeyDown={(event) => {
                  if (isNavigable && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onNavigateItem(item);
                  }
                }}
                role={isNavigable ? 'button' : undefined}
                tabIndex={isNavigable ? 0 : undefined}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title || 'Hoạt động học tập'}</p>
                      <p className="mt-1 text-sm text-slate-400">{config.label}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500">{formatTimestamp(item.createdAt)}</p>
                    {isNavigable && (
                      <p className="mt-2 text-xs font-bold text-blue-300">Mở bài học</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {visibleCount < sortedItems.length && (
            <p className="text-center text-xs font-semibold text-slate-500 py-1">Cuộn để xem thêm hoạt động</p>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/30 px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-white">Chưa có hoạt động nổi bật</p>
          <p className="mt-2 text-sm text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}
