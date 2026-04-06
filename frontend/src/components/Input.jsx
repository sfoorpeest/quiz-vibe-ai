import React, { useState } from 'react';

const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  showPasswordToggle = false,
  icon: Icon,
  className = '',
  labelClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="w-full text-left">
      {label && (
        <label className={`mb-2 block text-sm font-bold tracking-wide transition-colors duration-200 ${labelClassName || 'text-slate-300'}`}>
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200">
            <Icon size={18} />
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-11' : 'px-4'} py-3.5 border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-0 text-sm
            ${
              error
                ? 'border-red-500/50 bg-red-500/5 text-red-200 placeholder:text-red-300/40 focus:border-red-500'
                : 'border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-slate-900/80'
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition-colors"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-400 ml-1">{error}</p>}
    </div>
  );
};

export default Input;

