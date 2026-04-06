import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Assume user is always present due to ProtectedRoute

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const validateForm = () => {
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      return "Vui lòng nhập đầy đủ các trường yêu cầu.";
    }
    if (formData.newPassword.length < 6) {
      return "Mật khẩu mới phải có ít nhất 6 ký tự.";
    }
    if (formData.newPassword === formData.oldPassword) {
      return "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return "Mật khẩu xác nhận không khớp.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await authService.changePassword(formData.oldPassword, formData.newPassword);
      setSuccessMsg("Đổi mật khẩu thành công!");
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
      // Auto redirect to home after success (optional)
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-hidden text-slate-50">
      <div className="flex-1 flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-4xl shadow-2xl shadow-purple-500/10 border border-slate-700/50 p-8 sm:p-10 mb-6 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 relative">
            {/* Back Button */}
            <button 
              onClick={() => navigate(-1)} 
              className="absolute left-0 top-0 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none"
              title="Quay lại"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/30 mb-6 hover:scale-105 transition-transform">
              <Key className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 text-center">Đổi Mật Khẩu</h1>
            <p className="text-slate-400 text-center text-sm font-medium">
              Bảo mật tài khoản <span className="text-slate-200 font-bold">{user?.name}</span> của bạn
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-950/60 text-red-300 text-sm font-bold rounded-2xl border border-red-900/50 animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-950/60 text-emerald-300 text-sm font-bold rounded-2xl border border-emerald-900/50 animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg} Đang quay lại trang chủ...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} method="POST" className="space-y-5">
            {/* Mật khẩu cũ */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-200" htmlFor="oldPassword">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-11 py-3.5 border border-slate-700 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium shadow-sm"
                  placeholder="Nhập mật khẩu cũ..."
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-400 focus:outline-none transition-colors"
                >
                  {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
              <label className="block text-sm font-bold text-emerald-400" htmlFor="newPassword">
                Mật khẩu mới
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-emerald-500/70" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-11 py-3.5 border border-emerald-900/50 rounded-xl bg-emerald-950/20 text-white placeholder-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium shadow-sm"
                  placeholder="Nhập mật khẩu mới..."
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-500/70 hover:text-emerald-400 focus:outline-none transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-200" htmlFor="confirmPassword">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <CheckCircle2 className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-11 py-3.5 border rounded-xl bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium shadow-sm ${formData.confirmPassword && formData.newPassword === formData.confirmPassword ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-700'}`}
                  placeholder="Xác nhận lại mật khẩu..."
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== ''}
              className="w-full flex justify-center mt-6 py-4 px-4 rounded-xl shadow-lg text-base font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] border border-emerald-500/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Đang xử lý...
                </span>
              ) : (
                "Xác nhận đổi mật khẩu"
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
