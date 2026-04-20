import React from 'react';
import { Camera, PencilLine, RefreshCcw, ShieldCheck, UserCircle2 } from 'lucide-react';
import Button from '../Button';

const roleLabelMap = {
  1: 'Học viên',
  2: 'Giảng viên',
  3: 'Quản trị viên',
};

export default function ProfileHeader({
  profile,
  summary,
  isEditing,
  isUploadingAvatar,
  onAvatarSelect,
  onToggleEdit,
  onRefresh,
}) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  let avatarSource = profile?.avatar || '';
  if (avatarSource && avatarSource.startsWith('/uploads')) {
    avatarSource = `${baseURL}${avatarSource}`;
  }
  
  const roleLabel = roleLabelMap[profile?.role_id] || 'Thành viên';
  const username = profile?.username || 'chua-cap-nhat';

  return (
    <section className="relative overflow-hidden rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl sm:p-8">
      <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-transparent to-violet-600/10" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative mx-auto sm:mx-0">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-4xl border border-slate-700 bg-slate-800 shadow-lg shadow-blue-950/30 sm:h-32 sm:w-32">
              {avatarSource ? (
                <img src={avatarSource} alt={profile?.name || 'Ảnh đại diện'} className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-16 w-16 text-slate-500" />
              )}
            </div>
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
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              {roleLabel}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {profile?.name || 'Người dùng EduApp'}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-300 sm:text-base">@{username}</p>
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
