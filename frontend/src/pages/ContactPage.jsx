import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import StaticContentLayout from '../components/StaticContentLayout';
import { contactService } from '../services/contactService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = {
  name: '',
  email: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Vui lòng nhập họ và tên.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = 'Email không đúng định dạng.';
    }

    if (!form.message.trim()) {
      nextErrors.message = 'Vui lòng nhập nội dung liên hệ.';
    } else if (form.message.trim().length < 10) {
      nextErrors.message = 'Nội dung cần tối thiểu 10 ký tự.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await contactService.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });

      setFeedback({
        type: 'success',
        message: response.message || 'Gửi liên hệ thành công. Đội ngũ hỗ trợ sẽ phản hồi sớm nhất có thể.',
      });
      setForm(initialForm);
      setErrors({});
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Không thể gửi liên hệ. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaticContentLayout
      title="Liên hệ & Trợ giúp"
      subtitle="Sử dụng biểu mẫu này để báo cáo lỗi hệ thống, đóng góp ý kiến hoặc yêu cầu hỗ trợ đặc biệt từ Ban quản trị."
    >
      <section className="rounded-3xl border border-slate-700/60 bg-slate-950/40 p-5 sm:p-6">
        <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-200">
          <p>
            <strong className="text-indigo-100">Lưu ý:</strong> Nếu bạn quên mật khẩu và cần lấy lại quyền truy cập, vui lòng sử dụng tính năng{' '}
            <Link to="/forgot-password" className="font-bold text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
              Quên mật khẩu tự động
            </Link>
            {' '}để được xử lý ngay lập tức thay vì gửi email hỗ trợ.
          </p>
        </div>
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email hỗ trợ</p>
            <p className="mt-2 text-sm font-semibold text-white">quiz.vibe.ai@gmail.com</p>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hotline</p>
            <p className="mt-2 text-sm font-semibold text-white">0383 245 901</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <Input
            label="Họ và tên"
            value={form.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={errors.name}
            labelClassName="text-slate-100 font-bold tracking-wide"
            className="border-slate-700! bg-slate-950! px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:border-blue-500!"
            placeholder="Nhập họ và tên"
          />

          <Input
            type="email"
            label="Email"
            value={form.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={errors.email}
            labelClassName="text-slate-100 font-bold tracking-wide"
            className="border-slate-700! bg-slate-950! px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:border-blue-500!"
            placeholder="Nhập địa chỉ email"
          />

          <div>
            <label className="mb-2 block text-sm font-bold tracking-wide text-slate-100">Nội dung</label>
            <textarea
              value={form.message}
              onChange={(e) => handleFieldChange('message', e.target.value)}
              rows={6}
              placeholder="Nhập nội dung liên hệ"
              className="w-full rounded-2xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 transition-all duration-300 focus:border-blue-500 focus:outline-none"
            />
            {errors.message && <p className="mt-1 text-sm text-red-400">{errors.message}</p>}
          </div>

          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-200'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" loading={isSubmitting} disabled={!canSubmit}>
              Gửi liên hệ
            </Button>
          </div>
        </form>
      </section>
    </StaticContentLayout>
  );
}
