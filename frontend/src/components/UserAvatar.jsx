import React from 'react';
import { User, ShieldCheck } from 'lucide-react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;

  const avatarUrl = user.avatar;
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const getAvatarSrc = () => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('/uploads')) {
      return `${VITE_API_URL}${avatarUrl}`;
    }
    return avatarUrl;
  };

  const src = getAvatarSrc();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentIconSizeClass = iconSizes[size] || iconSizes.md;

  const fallbackIcon = user.role_id === 3 ? (
    <ShieldCheck className={currentIconSizeClass} />
  ) : (
    <User className={currentIconSizeClass} />
  );

  return (
    <div className={`relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-slate-700 border-2 border-slate-600 ${currentSizeClass} ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={user.name || 'User'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="w-full h-full flex items-center justify-center text-slate-400"
        style={{ display: src ? 'none' : 'flex' }}
      >
        {fallbackIcon}
      </div>
    </div>
  );
};

export default UserAvatar;
