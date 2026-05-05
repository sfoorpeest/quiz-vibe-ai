import React, { useEffect, useState } from 'react';
import { Camera, PencilLine, RefreshCcw, ShieldCheck } from 'lucide-react';
import Button from '../Button';
import UserAvatar from '../UserAvatar';
import { badgeService } from '../../services/badgeService';

const roleLabelMap = {
  1: 'Học viên',
  2: 'Giảng viên',
  3: 'Quản trị viên',
};

/* ─── Tier-based styles for Profile Header ─── */
const TIER_ROLE_STYLES = {
  DIAMOND: {
    // Role label — Neon cyan
    roleBorder: 'border-cyan-400/50',
    roleBg: 'bg-cyan-500/20',
    roleText: 'text-cyan-200',
    roleNeon: 'role-neon-diamond',
    roleShadow: 'shadow-[0_0_12px_rgba(34,211,238,0.25)]',
    // Username — gradient text
    nameClass: 'name-gradient-diamond drop-shadow-[0_0_16px_rgba(34,211,238,0.5)]',
    // Featured badge pill
    pillBg: 'bg-cyan-950/60 border-cyan-400/40',
    pillText: 'text-cyan-200',
    pillRing: 'ring-2 ring-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]',
    // Tier icon
    tierEmoji: '💎',
  },
  GOLD: {
    roleBorder: 'border-yellow-400/50',
    roleBg: 'bg-yellow-500/20',
    roleText: 'text-yellow-200',
    roleNeon: 'role-neon-gold',
    roleShadow: 'shadow-[0_0_12px_rgba(234,179,8,0.25)]',
    nameClass: 'name-gradient-gold drop-shadow-[0_0_14px_rgba(234,179,8,0.4)]',
    pillBg: 'bg-yellow-950/60 border-yellow-400/40',
    pillText: 'text-yellow-200',
    pillRing: 'ring-2 ring-yellow-400/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    tierEmoji: '🥇',
  },
  SILVER: {
    roleBorder: 'border-slate-300/40',
    roleBg: 'bg-slate-400/15',
    roleText: 'text-slate-200',
    roleNeon: 'role-neon-silver',
    roleShadow: 'shadow-[0_0_8px_rgba(203,213,225,0.15)]',
    nameClass: 'name-gradient-silver',
    pillBg: 'bg-slate-800/70 border-slate-400/30',
    pillText: 'text-slate-200',
    pillRing: 'ring-1 ring-slate-400/40 shadow-[0_0_6px_rgba(203,213,225,0.15)]',
    tierEmoji: '🥈',
  },
  BRONZE: {
    roleBorder: 'border-orange-400/40',
    roleBg: 'bg-orange-500/15',
    roleText: 'text-orange-200',
    roleNeon: 'role-neon-bronze',
    roleShadow: 'shadow-[0_0_8px_rgba(251,146,60,0.15)]',
    nameClass: 'name-gradient-bronze',
    pillBg: 'bg-orange-950/60 border-orange-400/30',
    pillText: 'text-orange-200',
    pillRing: 'ring-1 ring-orange-400/30 shadow-[0_0_6px_rgba(251,146,60,0.15)]',
    tierEmoji: '🥉',
  },
};

const DEFAULT_ROLE_STYLE = {
  roleBorder: 'border-emerald-500/20',
  roleBg: 'bg-emerald-500/10',
  roleText: 'text-emerald-300',
  roleNeon: '',
  roleShadow: '',
  nameClass: '',
  pillBg: '',
  pillText: '',
  pillRing: '',
  tierEmoji: '',
};

/* ─── Determine highest tier from featured badges ─── */
const TIER_PRIORITY = ['DIAMOND', 'GOLD', 'SILVER', 'BRONZE'];
function getHighestTier(badges) {
  if (!badges || badges.length === 0) return null;
  for (const tier of TIER_PRIORITY) {
    if (badges.some(b => b.tier === tier)) return tier;
  }
  return null;
}

export default function ProfileHeader({
  profile,
  summary,
  isEditing,
  isUploadingAvatar,
  onAvatarSelect,
  onToggleEdit,
  onRefresh,
}) {
  const roleLabel = roleLabelMap[profile?.role_id] || 'Thành viên';
  const username = profile?.username || 'chua-cap-nhat';

  const [featuredBadgeDetails, setFeaturedBadgeDetails] = useState([]);

  // Fetch full badge details for featured badges
  useEffect(() => {
    const featuredIds = profile?.featuredBadges || [];
    if (featuredIds.length === 0) {
      setFeaturedBadgeDetails([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await badgeService.getAllBadges();
        const allBadges = res?.all || [];
        const details = featuredIds
          .map(id => allBadges.find(b => b.id === id))
          .filter(Boolean);
        setFeaturedBadgeDetails(details);
      } catch (err) {
        console.error('Failed to load featured badge details:', err);
      }
    };
    fetchDetails();
  }, [profile?.featuredBadges]);

  const highestTier = getHighestTier(featuredBadgeDetails);
  const roleStyle = highestTier ? TIER_ROLE_STYLES[highestTier] : DEFAULT_ROLE_STYLE;
  const hasPinnedBadges = featuredBadgeDetails.length > 0;

  return (
    <section className="relative overflow-hidden rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl sm:p-8">
      <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-transparent to-violet-600/10" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative mx-auto sm:mx-0">
            <UserAvatar 
              user={profile} 
              size="2xl" 
              className="h-28 w-28 rounded-4xl border-slate-700 bg-slate-800 shadow-lg shadow-blue-950/30 sm:h-32 sm:w-32" 
            />
            <label className="absolute -bottom-2 right-0 flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs font-bold text-slate-200 shadow-lg transition hover:border-blue-500/50 hover:text-white">
              <Camera className="h-4 w-4 text-blue-400" />
              {isUploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarSelect}
                disabled={isUploadingAvatar}
              />
            </label>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            {/* ── Role Label — Neon glow based on highest featured badge tier ── */}
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] transition-all ${roleStyle.roleBorder} ${roleStyle.roleBg} ${roleStyle.roleText} ${roleStyle.roleNeon} ${roleStyle.roleShadow}`}>
              <ShieldCheck className="h-4 w-4" />
              {roleLabel}
            </div>

            <div>
              {/* ── Username — Gradient text color for premium tiers ── */}
              <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${hasPinnedBadges && roleStyle.nameClass ? roleStyle.nameClass : 'text-white'}`}>
                {profile?.name || 'Người dùng EduApp'}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-300 sm:text-base">@{username}</p>

              {/* ── Featured Badges Showcase — larger, with shimmer pill ── */}
              {hasPinnedBadges && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {featuredBadgeDetails.map((badge) => {
                    const badgeTierStyle = TIER_ROLE_STYLES[badge.tier] || TIER_ROLE_STYLES.BRONZE;
                    return (
                      <div
                        key={badge.id}
                        className={`featured-badge-pill group/badge flex items-center gap-2 rounded-2xl border px-3 py-1.5 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${badgeTierStyle.pillBg} ${badgeTierStyle.pillRing}`}
                        title={badge.name}
                      >
                        <span className="text-lg leading-none">{badge.icon_url || badgeTierStyle.tierEmoji}</span>
                        <span className={`text-[11px] font-bold ${badgeTierStyle.pillText} max-w-[90px] truncate`}>
                          {badge.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {profile?.bio || 'Cập nhật thông tin cá nhân để người học và giảng viên khác hiểu hơn về bạn.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:min-w-[280px]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-400">{item.helper}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="md" onClick={onRefresh} className="bg-slate-800/70 text-slate-100 hover:bg-slate-700/70">
              <RefreshCcw className="h-4 w-4" />
              Làm mới
            </Button>
            <Button variant={isEditing ? 'secondary' : 'primary'} size="md" onClick={onToggleEdit}>
              <PencilLine className="h-4 w-4" />
              {isEditing ? 'Đang chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
