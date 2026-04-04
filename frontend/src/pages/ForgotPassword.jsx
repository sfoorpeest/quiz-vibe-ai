import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Mail, Loader2, ArrowLeft, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await authService.forgotPassword(email);
      setSuccessMsg(response.message || 'Yêu cầu đặt lại mật khẩu đã được xử lý. Vui lòng kiểm tra màn hình Terminal (Dev) hoặc Email của bạn.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Có lỗi xảy ra. Email có thể không tồn tại trong hệ thống.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      <AnimatedBackground />

      <div className="w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-4xl shadow-2xl shadow-blue-500/10 border border-slate-700/50 p-8 sm:p-10 mb-6 relative z-10">
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> TRỞ LẠI
          </button>

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="w-16 h-16 bg-linear-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 hover:scale-105 transition-transform">
              <BrainCircuit className="text-white w-8 h-8" />
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-50 mb-2">Quên Mật Khẩu</h1>
            <p className="text-slate-400 text-center text-sm font-medium">
              Đừng lo lắng! Nhập email tài khoản của bạn để nhận link đặt lại mật khẩu.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3.5 bg-red-950/50 text-red-400 text-sm font-bold rounded-xl border border-red-900/50 animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 flex items-start gap-2 p-4 bg-emerald-950/50 text-emerald-400 text-sm font-bold rounded-xl border border-emerald-900/50 animate-in fade-in zoom-in duration-200 shadow-inner">
              <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} method="POST" className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="email">
                Email đã đăng ký
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2 group"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Đang gửi yêu cầu...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Gửi Link Đặt Lại
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
