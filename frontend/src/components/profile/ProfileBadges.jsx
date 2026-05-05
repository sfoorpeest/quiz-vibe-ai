import React, { useEffect, useState, useCallback } from 'react';
import { Award, Lock, TrendingUp, Trophy, Zap, Star, Diamond, Pin, Shield } from 'lucide-react';
import { badgeService } from '../../services/badgeService';

/* ─── Tier Config ─── */
const TIER_CONFIG = {
  DIAMOND: {
    label: 'Kim Cương',
    emoji: '💎',
    icon: Diamond,
    gradient: 'from-cyan-400 via-blue-400 to-purple-500',
    border: 'border-cyan-400/60',
    bg: 'bg-cyan-500/8',
    glow: 'shadow-cyan-500/30',
    text: 'text-cyan-300',
    ring: 'ring-cyan-400/40',
    progressBar: 'bg-gradient-to-r from-cyan-400 to-purple-500',
  },
  GOLD: {
    label: 'Vàng',
    emoji: '🥇',
    icon: Trophy,
    gradient: 'from-yellow-300 via-amber-400 to-orange-500',
    border: 'border-yellow-500/60',
    bg: 'bg-yellow-500/8',
    glow: 'shadow-yellow-500/30',
    text: 'text-yellow-300',
    ring: 'ring-yellow-400/40',
    progressBar: 'bg-gradient-to-r from-yellow-300 to-orange-500',
  },
  SILVER: {
    label: 'Bạc',
    emoji: '🥈',
    icon: Star,
    gradient: 'from-blue-200 via-slate-100 to-indigo-200',
    border: 'border-blue-300/50',
    bg: 'bg-blue-200/8',
    glow: 'shadow-blue-300/25',
    text: 'text-blue-200',
    ring: 'ring-blue-300/40',
    progressBar: 'bg-gradient-to-r from-blue-200 via-slate-200 to-indigo-300',
  },
  BRONZE: {
    label: 'Đồng',
    emoji: '🥉',
    icon: Award,
    gradient: 'from-amber-600 via-orange-500 to-red-500',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/8',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-300',
    ring: 'ring-amber-400/30',
    progressBar: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500',
  },
};

/* ─── Rarity Label ─── */
const RARITY_LABELS = {
  DIAMOND: { label: 'Huyền Thoại', cls: 'text-cyan-200 bg-cyan-500/20 border-cyan-400/40' },
  GOLD: { label: 'Cực Hiếm', cls: 'text-yellow-200 bg-yellow-500/20 border-yellow-400/40' },
  SILVER: { label: 'Hiếm', cls: 'text-blue-200 bg-blue-400/15 border-blue-300/40' },
  BRONZE: { label: 'Thường', cls: 'text-amber-200 bg-amber-500/15 border-amber-400/30' },
};

/* ─── Badge Card ─── */
function BadgeCard({ badge, featuredIds, equippedId, onToggleFeature, onToggleEquip }) {
  const tier = TIER_CONFIG[badge.tier] || TIER_CONFIG.BRONZE;
  const rarity = RARITY_LABELS[badge.tier] || RARITY_LABELS.BRONZE;
  const isUnlocked = badge.unlocked;
  const isDiamond = badge.tier === 'DIAMOND';
  const isGold = badge.tier === 'GOLD';

  const isFeatured = featuredIds.includes(badge.id);
  const isEquipped = equippedId === badge.id;
  const canFeature = featuredIds.length < 3 || isFeatured;
  const isSilver = badge.tier === 'SILVER';
  const isBronze = badge.tier === 'BRONZE';

  // Glow class — now ALL unlocked tiers glow
  const glowClass = isUnlocked
    ? isDiamond ? 'badge-diamond-glow'
    : isGold ? 'badge-gold-glow'
    : isSilver ? 'badge-silver-glow'
    : isBronze ? 'badge-bronze-glow'
    : ''
    : '';

  return (
    <div className="relative">
      {/* ── Holographic Border (Diamond Only — Unlocked) ── */}
      {isUnlocked && isDiamond && (
        <div className="absolute -inset-[2px] rounded-3xl badge-holo-border opacity-70" />
      )}

      <div
        className={`group relative rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300
          ${glowClass}
          ${isUnlocked
            ? `${tier.border} ${tier.bg} hover:shadow-lg ${tier.glow} hover:scale-[1.02]`
            : 'border-slate-700/40 bg-slate-900/30 opacity-55 hover:opacity-75'
          }`}
      >
        {/* ── Shimmer Sweep (ALL unlocked tiers) ── */}
        {isUnlocked && (
          <div className="badge-shimmer-overlay" />
        )}

        {/* ── Background gradient glow ── */}
        {isUnlocked && (
          <div className={`absolute inset-0 rounded-3xl bg-linear-to-br ${tier.gradient} opacity-[0.04] group-hover:opacity-[0.10] transition-opacity`} />
        )}

        {/* ── Sparkle Particles (Diamond & Gold — Unlocked) ── */}
        {isUnlocked && (isDiamond || isGold) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[
              { top: '10%', left: '12%', delay: '0s', size: isDiamond ? 'text-[10px]' : 'text-[7px]' },
              { top: '22%', right: '18%', delay: '0.6s', size: isDiamond ? 'text-[8px]' : 'text-[6px]' },
              { bottom: '18%', left: '28%', delay: '1.2s', size: isDiamond ? 'text-[9px]' : 'text-[5px]' },
              ...(isDiamond ? [{ bottom: '35%', right: '12%', delay: '1.8s', size: 'text-[7px]' }] : []),
            ].map((pos, i) => (
              <span
                key={i}
                className={`absolute ${pos.size} animate-badge-sparkle`}
                style={{ top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom, animationDelay: pos.delay }}
              >
                ✦
              </span>
            ))}
          </div>
        )}

        <div className="relative z-10">
          {/* Header: Icon + Tier + Rarity */}
          <div className="flex items-start justify-between mb-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl
              ${isUnlocked
                ? `bg-linear-to-br ${tier.gradient} shadow-lg ${tier.glow}`
                : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isUnlocked ? (badge.icon_url || tier.emoji) : <Lock className="h-5 w-5" />}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                ${isUnlocked
                  ? `${tier.bg} ${tier.text} ring-1 ${tier.ring}`
                  : 'bg-slate-800/60 text-slate-500 ring-1 ring-slate-700/40'
                }`}
              >
                {tier.emoji} {tier.label}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${rarity.cls}`}>
                {rarity.label}
              </span>
            </div>
          </div>

          {/* Name */}
          <h3 className={`text-sm font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
            {badge.name}
          </h3>

          {/* Description */}
          <p className={`text-xs mb-3 leading-relaxed ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
            {badge.description}
          </p>

          {/* Progress Bar — Energy gradient style */}
          {!isUnlocked && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">Tiến trình</span>
                <span className={`font-bold ${tier.text}`}>{badge.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden ring-1 ring-slate-700/50">
                <div
                  className={`h-full rounded-full ${tier.progressBar} transition-all duration-700 shadow-sm`}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {badge.current_value}/{badge.condition_value}
              </p>
            </div>
          )}

          {/* ── Action Buttons (Unlocked Only) ── */}
          {isUnlocked && (
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Ghim lên Hồ sơ */}
              <button
                type="button"
                onClick={() => onToggleFeature(badge.id)}
                disabled={!canFeature && !isFeatured}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-200
                  ${isFeatured
                    ? `bg-linear-to-r ${tier.gradient} text-white shadow-md ${tier.glow} scale-[1.02]`
                    : canFeature
                      ? 'border border-slate-600 bg-slate-800/60 text-slate-300 hover:border-blue-500/50 hover:text-white hover:bg-slate-700/60'
                      : 'border border-slate-700/30 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                  }`}
              >
                <Pin className="h-3 w-3" />
                {isFeatured ? 'Đã ghim' : 'Ghim hồ sơ'}
              </button>

              {/* Trang bị Đại diện */}
              <button
                type="button"
                onClick={() => onToggleEquip(badge.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-200
                  ${isEquipped
                    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 shadow-md shadow-amber-500/10'
                    : 'border border-slate-600 bg-slate-800/60 text-slate-300 hover:border-amber-500/50 hover:text-amber-200 hover:bg-slate-700/60'
                  }`}
              >
                <Shield className="h-3 w-3" />
                {isEquipped ? '⚔️ Đại diện' : 'Trang bị'}
              </button>
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
export default function ProfileBadges({ profile, onProfileUpdate }) {
  const [badgeData, setBadgeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [featuredIds, setFeaturedIds] = useState([]);
  const [equippedId, setEquippedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync từ profile props
  useEffect(() => {
    if (profile) {
      setFeaturedIds(profile.featuredBadges || []);
      setEquippedId(profile.equippedBadgeId || null);
    }
  }, [profile]);

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

  const handleToggleFeature = useCallback(async (badgeId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const newIds = featuredIds.includes(badgeId)
        ? featuredIds.filter(id => id !== badgeId)
        : [...featuredIds, badgeId].slice(0, 3);
      await badgeService.featureBadges(newIds);
      setFeaturedIds(newIds);

      // Tính toán hạng cao nhất trong số các thẻ đã ghim để đổi màu tên
      const allBadges = badgeData?.all || [];
      const featuredObjects = allBadges.filter(b => newIds.includes(b.id));
      const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'];
      let highestTier = null;
      let maxIdx = -1;

      featuredObjects.forEach(b => {
        const idx = TIER_ORDER.indexOf(b.tier?.toUpperCase());
        if (idx > maxIdx) {
          maxIdx = idx;
          highestTier = b.tier;
        }
      });

      onProfileUpdate?.({ 
        featuredBadges: newIds,
        highestFeaturedTier: highestTier 
      });
    } catch (err) {
      console.error('Feature badge error:', err);
    } finally {
      setActionLoading(false);
    }
  }, [featuredIds, actionLoading, onProfileUpdate]);

  const handleToggleEquip = useCallback(async (badgeId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const newId = equippedId === badgeId ? null : badgeId;
      await badgeService.equipBadge(newId);
      setEquippedId(newId);
      const badgeObj = (badgeData?.all || []).find(b => b.id === badgeId);
      onProfileUpdate?.({ 
        equippedBadgeId: newId,
        equippedBadgeTier: newId && badgeObj ? badgeObj.tier : null,
        equippedBadgeIcon: newId && badgeObj ? badgeObj.icon_url : null
      });
    } catch (err) {
      console.error('Equip badge error:', err);
    } finally {
      setActionLoading(false);
    }
  }, [equippedId, actionLoading, onProfileUpdate]);

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
              <BadgeCard key={badge.id} badge={badge} featuredIds={featuredIds} equippedId={equippedId} onToggleFeature={handleToggleFeature} onToggleEquip={handleToggleEquip} />
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
