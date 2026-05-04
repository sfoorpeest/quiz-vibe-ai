import React, { useEffect, useState } from 'react';
import { Award, Lock, TrendingUp, Trophy, Zap, Star, Diamond } from 'lucide-react';
import { badgeService } from '../../services/badgeService';

/* ─── Tier Config ─── */
const TIER_CONFIG = {
  DIAMOND: {
    label: 'Kim Cương',
    emoji: '💎',
    icon: Diamond,
    gradient: 'from-cyan-400 via-blue-400 to-purple-500',
    border: 'border-cyan-400/50',
    bg: 'bg-cyan-500/5',
    glow: 'shadow-cyan-500/20',
    text: 'text-cyan-300',
    ring: 'ring-cyan-400/30',
    progressBar: 'bg-gradient-to-r from-cyan-400 to-purple-500',
  },
  GOLD: {
    label: 'Vàng',
    emoji: '🥇',
    icon: Trophy,
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/5',
    glow: 'shadow-yellow-500/20',
    text: 'text-yellow-300',
    ring: 'ring-yellow-400/30',
    progressBar: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
  SILVER: {
    label: 'Bạc',
    emoji: '🥈',
    icon: Star,
    gradient: 'from-slate-300 via-gray-300 to-slate-400',
    border: 'border-slate-400/50',
    bg: 'bg-slate-400/5',
    glow: 'shadow-slate-400/15',
    text: 'text-slate-300',
    ring: 'ring-slate-400/30',
    progressBar: 'bg-gradient-to-r from-slate-300 to-slate-500',
  },
  BRONZE: {
    label: 'Đồng',
    emoji: '🥉',
    icon: Award,
    gradient: 'from-orange-400 via-amber-600 to-yellow-700',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/5',
    glow: 'shadow-orange-500/10',
    text: 'text-orange-300',
    ring: 'ring-orange-400/20',
    progressBar: 'bg-gradient-to-r from-orange-400 to-amber-600',
  },
};

/* ─── Badge Card ─── */
function BadgeCard({ badge }) {
  const tier = TIER_CONFIG[badge.tier] || TIER_CONFIG.BRONZE;
  const isUnlocked = badge.unlocked;

  return (
    <div
      className={`group relative rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300
        ${isUnlocked
          ? `${tier.border} ${tier.bg} hover:shadow-lg ${tier.glow} hover:scale-[1.02]`
          : 'border-slate-700/40 bg-slate-900/30 opacity-55 hover:opacity-75'
        }`}
    >
      {/* Glow effect cho thẻ đã mở */}
      {isUnlocked && (
        <div className={`absolute inset-0 rounded-3xl bg-linear-to-br ${tier.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity`} />
      )}

      <div className="relative z-10">
        {/* Header: Icon + Tier */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl
            ${isUnlocked
              ? `bg-linear-to-br ${tier.gradient} shadow-lg ${tier.glow}`
              : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isUnlocked ? (badge.icon_url || tier.emoji) : <Lock className="h-5 w-5" />}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
            ${isUnlocked
              ? `${tier.bg} ${tier.text} ring-1 ${tier.ring}`
              : 'bg-slate-800/60 text-slate-500 ring-1 ring-slate-700/40'
            }`}
          >
            {tier.emoji} {tier.label}
          </span>
        </div>

        {/* Name */}
        <h3 className={`text-sm font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
          {badge.name}
        </h3>

        {/* Description */}
        <p className={`text-xs mb-3 leading-relaxed ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
          {badge.description}
        </p>

        {/* Progress Bar */}
        {!isUnlocked && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Tiến trình</span>
              <span className={`font-bold ${tier.text}`}>{badge.progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${tier.progressBar} transition-all duration-700`}
                style={{ width: `${badge.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              {badge.current_value}/{badge.condition_value}
            </p>
          </div>
        )}

        {/* Unlocked date */}
        {isUnlocked && badge.unlocked_at && (
          <div className="mt-2 flex items-center gap-1.5">
            <Zap className={`h-3 w-3 ${tier.text}`} />
            <p className="text-[10px] text-slate-400 font-medium">
              Đạt được {new Date(badge.unlocked_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stats Overview Mini Cards ─── */
function StatMiniCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/50 px-4 py-3 backdrop-blur-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-extrabold text-white leading-tight">{value}</p>
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ProfileBadges() {
  const [badgeData, setBadgeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [badgesRes, statsRes] = await Promise.all([
          badgeService.getAllBadges(),
          badgeService.getUserStats(),
        ]);
        setBadgeData(badgesRes);
        setStats(statsRes);
      } catch (error) {
        console.error('Lỗi khi tải badges:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <section className="rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-2xl bg-slate-800" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-800/60" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-slate-800/40" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const allBadges = badgeData?.all || [];
  const summary = badgeData?.summary || { total: 0, unlocked: 0, percentage: 0 };

  const filterTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'unlocked', label: `Đã đạt (${summary.unlocked})` },
    { id: 'locked', label: `Chưa đạt (${summary.total - summary.unlocked})` },
    { id: 'DIAMOND', label: '💎 Kim Cương' },
    { id: 'GOLD', label: '🥇 Vàng' },
    { id: 'SILVER', label: '🥈 Bạc' },
    { id: 'BRONZE', label: '🥉 Đồng' },
  ];

  const filteredBadges = allBadges.filter((badge) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unlocked') return badge.unlocked;
    if (activeFilter === 'locked') return !badge.unlocked;
    return badge.tier === activeFilter;
  });

  return (
    <section className="space-y-6">
      {/* Summary Header */}
      <div className="rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <Award className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white">Thẻ Thành Tích</h2>
          </div>
          <p className="text-sm text-slate-400">
            Bạn đã đạt được <span className="font-bold text-cyan-300">{summary.unlocked}</span> / {summary.total} thẻ ({summary.percentage}%)
          </p>
        </div>

        {/* Progress ring */}
        <div className="mb-5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${summary.percentage}%` }}
          />
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatMiniCard icon={TrendingUp} label="Bài Quiz đã làm" value={stats?.total_quizzes_taken || 0} color="bg-blue-600" />
          <StatMiniCard icon={Trophy} label="Điểm tuyệt đối" value={stats?.total_perfect_scores || 0} color="bg-yellow-600" />
          <StatMiniCard icon={Zap} label="Streak hiện tại" value={`${stats?.current_streak_days || 0} ngày`} color="bg-orange-600" />
          <StatMiniCard icon={Award} label="Streak kỷ lục" value={`${stats?.max_streak_days || 0} ngày`} color="bg-purple-600" />
        </div>
      </div>

      {/* Filter & Badge Grid */}
      <div className="rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
        {/* Filter Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-blue-500/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        {filteredBadges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/30 px-6 py-12 text-center">
            <Lock className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-base font-semibold text-white">Không có thẻ nào</p>
            <p className="mt-2 text-sm text-slate-400">Hãy tiếp tục luyện tập để mở khóa thêm thẻ thành tích!</p>
          </div>
        )}
      </div>
    </section>
  );
}
