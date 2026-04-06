import React from 'react';
import { Mail, MapPin, Phone, UserRound, VenusAndMars } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';

const fieldCardClass = 'rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4';
const editLabelClass = 'text-slate-100 font-bold tracking-wide';
const editInputClass = '!border-slate-700 !bg-slate-950/95 !text-slate-100 placeholder:!text-slate-400 focus:!border-cyan-400 caret-cyan-300 selection:bg-cyan-500/30';
const selectClass = 'profile-gender-select w-full rounded-lg border-2 !border-slate-700 !bg-slate-950/95 px-4 py-3 pr-10 transition-all duration-200 focus:!border-cyan-400 focus:outline-none caret-cyan-300';

const genderLabelMap = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

const infoRows = [
  { label: 'Họ và tên', valueKey: 'name', fallback: 'Chưa cập nhật', icon: UserRound },
  { label: 'Tên đăng nhập', valueKey: 'username', fallback: 'Chưa cập nhật', icon: UserRound },
  { label: 'Email', valueKey: 'email', fallback: 'Chưa cập nhật', icon: Mail },
  { label: 'Số điện thoại', valueKey: 'phone', fallback: 'Chưa cập nhật', icon: Phone },
  { label: 'Ngày sinh', valueKey: 'birthDate', fallback: 'Chưa cập nhật', icon: UserRound },
  { label: 'Giới tính', valueKey: 'gender', fallback: 'Chưa cập nhật', icon: VenusAndMars },
  { label: 'Địa chỉ', valueKey: 'address', fallback: 'Chưa cập nhật', icon: MapPin },
];

export default function ProfileInfo({
  profile,
  formData,
  errors,
  isEditing,
  isSaving,
  onChange,
  onSave,
  onCancel,
  onStartEdit,
}) {
  return (
    <section className="rounded-[2rem] border border-slate-700/50 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white">Thông tin cá nhân</h2>
          <p className="mt-1 text-sm text-slate-400">Hiển thị các thông tin cơ bản của tài khoản.</p>
        </div>
        {!isEditing && (
          <Button variant="secondary" size="sm" onClick={onStartEdit}>
            Chỉnh sửa
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Họ và tên"
              value={formData.name}
              onChange={(event) => onChange('name', event.target.value)}
              error={errors.name}
              icon={UserRound}
              labelClassName={editLabelClass}
              inputClassName={editInputClass}
            />
            <Input
              label="Tên đăng nhập"
              value={formData.username}
              onChange={(event) => onChange('username', event.target.value)}
              error={errors.username}
              icon={UserRound}
              labelClassName={editLabelClass}
              inputClassName={editInputClass}
            />
            <Input
              type="email"
              label="Email"
              value={formData.email}
              onChange={(event) => onChange('email', event.target.value)}
              error={errors.email}
              icon={Mail}
              labelClassName={editLabelClass}
              inputClassName={editInputClass}
            />
            <Input
              label="Số điện thoại"
              value={formData.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              error={errors.phone}
              icon={Phone}
              labelClassName={editLabelClass}
              inputClassName={editInputClass}
            />
            <Input
              type="date"
              label="Ngày sinh"
              value={formData.birthDate}
              onChange={(event) => onChange('birthDate', event.target.value)}
              error={errors.birthDate}
              labelClassName={editLabelClass}
              inputClassName={`${editInputClass} profile-date-input`}
            />
            <div>
              <label className="mb-2 block text-sm font-bold tracking-wide text-slate-100">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(event) => onChange('gender', event.target.value)}
                className={`${selectClass} ${formData.gender ? '!text-slate-100' : '!text-slate-400'}`}
              >
                <option className="bg-slate-950 text-slate-100" value="">Chọn giới tính</option>
                <option className="bg-slate-950 text-slate-100" value="male">Nam</option>
                <option className="bg-slate-950 text-slate-100" value="female">Nữ</option>
                <option className="bg-slate-950 text-slate-100" value="other">Khác</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Địa chỉ"
                value={formData.address}
                onChange={(event) => onChange('address', event.target.value)}
                error={errors.address}
                icon={MapPin}
                labelClassName={editLabelClass}
                inputClassName={editInputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="md" onClick={onCancel} className="bg-slate-800/70 text-slate-100 hover:bg-slate-700/70">
              Hủy thay đổi
            </Button>
            <Button variant="primary" size="md" onClick={onSave} loading={isSaving}>
              Lưu thông tin
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {infoRows.map((item) => {
            const Icon = item.icon;
            const value = item.valueKey === 'gender'
              ? genderLabelMap[profile?.[item.valueKey]] || item.fallback
              : profile?.[item.valueKey] || item.fallback;

            return (
              <article key={item.label} className={fieldCardClass}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
