import React from 'react';
import { BellRing, LockKeyhole, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../Button';

const settingRows = [
  {
    key: 'notificationEmail',
    label: 'Thông báo qua email',
    description: 'Nhận cập nhật quan trọng về tài khoản và lớp học qua email.',
    icon: BellRing,
  },
  {
    key: 'notificationLearning',
    label: 'Nhắc tiến độ học tập',
    description: 'Hiển thị nhắc nhở khi bạn bỏ dở khóa học hoặc bài kiểm tra.',
    icon: BellRing,
  },
  {
    key: 'isProfilePrivate',
    label: 'Hồ sơ riêng tư',
    description: 'Ẩn bớt thông tin hồ sơ khỏi người dùng khác trong hệ thống.',
    icon: Shield,
  },
];

function Toggle({ enabled, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${enabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-300'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
      {enabled ? 'Bật' : 'Tắt'}
    </button>
  );
}

export default function ProfileSettings({
  settings,
  isEditing,
  isSaving,
  onToggle,
  onSave,
  onCancel,
  onStartEdit,
  onChangePassword,
}) {
  return (
    <section className="rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white">Cài đặt</h2>
          <p className="mt-1 text-sm text-slate-400">Quản lý thông báo, quyền riêng tư và bảo mật cơ bản.</p>
        </div>
        {!isEditing && (
          <Button variant="secondary" size="sm" onClick={onStartEdit}>
            Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {settingRows.map((item) => {
          const Icon = item.icon;
          const enabled = settings[item.key];

          return (
            <article key={item.key} className="flex flex-col gap-4 rounded-3xl border border-slate-700/60 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
              <Toggle enabled={enabled} onClick={() => onToggle(item.key)} disabled={!isEditing || isSaving} />
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-700/60 bg-slate-950/40 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Đổi mật khẩu</p>
              <p className="mt-1 text-sm text-slate-400">Chuyển đến màn hình đổi mật khẩu hiện có của hệ thống.</p>
            </div>
          </div>
          <Button variant="ghost" size="md" onClick={onChangePassword} className="bg-slate-800/70 text-slate-100 hover:bg-slate-700/70">
            Đi đến đổi mật khẩu
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" size="md" onClick={onCancel} className="bg-slate-800/70 text-slate-100 hover:bg-slate-700/70">
            Hủy thay đổi
          </Button>
          <Button variant="primary" size="md" onClick={onSave} loading={isSaving}>
            Lưu cài đặt
          </Button>
        </div>
      )}
    </section>
  );
}
