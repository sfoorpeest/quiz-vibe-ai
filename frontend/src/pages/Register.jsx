import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    agreeTerms: false 
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Map input name 'username' back to 'email' state key
    const fieldName = name === 'username' ? 'email' : name;
    setFormData(prev => ({
      ...prev,
      [fieldName]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return "Vui lòng điền đầy đủ thông tin.";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Mật khẩu không khớp.";
    }
    if (formData.password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (!formData.agreeTerms) {
      return "Bạn cần đồng ý với các Điều khoản & Chính sách.";
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

    try {
      await authService.register(formData.name, formData.email, formData.password);
      
      // Redirect to login page and pass a success message
      navigate('/login', { 
        state: { successMessage: 'Đăng ký thành công! Vui lòng đăng nhập.' } 
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Đăng ký thất bại. Xin thử lại hoặc email đã tồn tại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden py-12">
      <AnimatedBackground />

      <div className="w-full max-w-lg">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-4xl shadow-2xl shadow-blue-500/10 border border-slate-700/50 p-8 sm:p-10 mb-6 relative z-10">
          
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 hover:scale-105 transition-transform">
              <BrainCircuit className="text-white w-8 h-8" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2 tracking-tight">Tạo tài khoản mới</h1>
            <p className="text-slate-400 text-center text-sm font-medium">
              Đăng ký để trải nghiệm lộ trình học tập tối ưu nhất
            </p>
          </div>

          <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-red-950/50 text-red-400 text-sm font-bold rounded-xl border border-red-900/50 animate-in fade-in zoom-in duration-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="name">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-sm"
                  placeholder="nhập tên tài khoản..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="username"
                  type="email"
                  required
                  autoComplete="username"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="password">
                  Mật khẩu
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-sm"
                    placeholder="••••••••"
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
                  Xác nhận lại
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
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-slate-700'
                    }`}
                    placeholder="••••••••"
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
            </div>

            <div className="flex items-start mt-2">
              <div className="flex items-center h-5">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="agreeTerms" className="text-slate-400 cursor-pointer select-none font-medium">
                  Tôi đồng ý với{' '}
                  <a href="#" className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2">Điều khoản</a>
                  {' '}và{' '}
                  <a href="#" className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2">Chính sách bảo mật</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 flex justify-center py-3.5 px-4 rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Đang khởi tạo...
                </span>
              ) : (
                "Đăng ký ngay"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-medium text-slate-400 mt-2">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
