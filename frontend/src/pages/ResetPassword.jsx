import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrainCircuit, Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(!token ? 'Đường dẫn thiết lập lại mật khẩu không hợp lệ (Missing token).' : '');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({ 
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token bảo mật bị thiếu. Vui lòng truy cập từ đường dẫn trong email.');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu mới.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await authService.resetPassword(token, formData.password);
      setSuccessMsg(response.message || 'Thiết lập mật khẩu thành công. Đang chuyển hướng...');
      
      // Tự động chuyển về trang đăng nhập sau 2.5s
      setTimeout(() => {
        navigate('/login', { state: { successMessage: 'Mật khẩu đã được cấp lại. Vui lòng đăng nhập với mật khẩu mới.' } });
      }, 2500);

    } catch (err) {
      setError(
        err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại đường dẫn mới.'
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
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-6">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2">Tạo Mật Khẩu Mới</h1>
            <p className="text-slate-400 text-center text-sm font-medium">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
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
            <div className="mb-5 flex items-center gap-2 p-3.5 bg-emerald-950/50 text-emerald-400 text-sm font-bold rounded-xl border border-emerald-900/50 animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="password">
                Mật khẩu mới
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••"
                  disabled={!!successMsg || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-400 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="confirmPassword">
                Nhập lại mật khẩu mới
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-red-400 focus:ring-red-500' 
                      : 'border-slate-700 focus:ring-blue-500'
                  }`}
                  placeholder="••••••••"
                  disabled={!!successMsg || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-400 focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!successMsg || !token}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Đang xử lý...
                </span>
              ) : (
                "Xác Nhận Đổi Mật Khẩu"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-medium text-slate-400">
          <Link to="/login" className="flex items-center justify-center gap-2 font-bold text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
