import React from 'react';
import { FilePenLine } from 'lucide-react';
import Button from '../Button';

const textareaClass = 'min-h-32 w-full rounded-2xl border-2 border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-300 focus:border-blue-500/50 focus:bg-slate-900/80 focus:outline-none caret-blue-400 selection:bg-blue-500/30';

export default function ProfileBio({
  bio,
  draftBio,
  isEditing,
  isSaving,
  onChange,
  onStartEdit,
  onCancel,
  onSave,
}) {
  return (
    <section className="rounded-4xl border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white">Giới thiệu</h2>
          <p className="mt-1 text-sm text-slate-400">Chia sẻ ngắn gọn về định hướng học tập hoặc chuyên môn của bạn.</p>
        </div>
        {!isEditing && (
          <Button variant="secondary" size="sm" onClick={onStartEdit}>
            Cập nhật
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={draftBio}
            onChange={(event) => onChange(event.target.value)}
            maxLength={240}
            className={textareaClass}
            placeholder="Viết vài dòng giới thiệu về bạn..."
          />
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>Tối đa 240 ký tự.</span>
            <span>{draftBio.length}/240</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="md" onClick={onCancel} className="bg-slate-800/70 text-slate-100 hover:bg-slate-700/70">
              Hủy thay đổi
            </Button>
            <Button variant="primary" size="md" onClick={onSave} loading={isSaving}>
              Lưu giới thiệu
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-700/60 bg-slate-950/40 p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <FilePenLine className="h-5 w-5" />
          </div>
          <p className="text-sm leading-7 text-slate-300">
            {bio || 'Bạn chưa thêm phần giới thiệu. Hãy cập nhật để hồ sơ trông hoàn chỉnh hơn.'}
          </p>
        </div>
      )}
    </section>
  );
}
