import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Loader2, User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, token } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Retrieve initial messages from Register redirect if any
  const [error, setError] = useState(location.state?.message || '');
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || '');

  const [formData, setFormData] = useState({ 
    name: '', 
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear errors when typing
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Quick validation
    if (!formData.name || !formData.password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const response = await authService.login(formData.name, formData.password);
      
      // Save user and token to context/LocalStorage (implemented in AuthContext)
      login(response.user, response.token);

      // Redirect to home or requested previous page (can be handled via location.state?.from)
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Đăng nhập thất bại. Email hoặc mật khẩu không chính xác.'
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
            <Link to="/" className="w-16 h-16 bg-linear-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 hover:scale-105 transition-transform">
              <BrainCircuit className="text-white w-8 h-8" />
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50 mb-2">Chào mừng trở lại!</h1>
            <p className="text-slate-400 text-center text-sm font-medium">
              Đăng nhập để vào không gian học tập của bạn
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
          <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5" htmlFor="name">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="nhập tên đăng nhập của bạn..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-200" htmlFor="password">
                  Mật khẩu
                </label>
                <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Đang xử lý...
                </span>
              ) : (
                "Đăng nhập ngay"
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm font-medium text-slate-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors">
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </div>
  );
}
