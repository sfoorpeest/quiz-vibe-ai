import React from 'react';
import { User, ShieldCheck } from 'lucide-react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;

  const avatarUrl = user.avatar;
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const avatarVersion = user.avatarVersion || user.avatarUpdatedAt || null;

  const appendVersion = (url) => {
    if (!avatarVersion) return url;
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('v', String(avatarVersion));
      return parsed.toString();
    } catch {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}v=${encodeURIComponent(String(avatarVersion))}`;
    }
  };
  
  const getAvatarSrc = () => {
    if (!avatarUrl) return null;

    // Full URL (including Supabase public/signed URL)
    if (/^https?:\/\//i.test(avatarUrl)) {
      return appendVersion(avatarUrl);
    }

    // Legacy local path fallback
    if (avatarUrl.startsWith('/uploads')) {
      return appendVersion(`${VITE_API_URL}${avatarUrl}`);
    }

    // Absolute storage path fallback
    if (avatarUrl.startsWith('/storage/v1/') && VITE_SUPABASE_URL) {
      return appendVersion(`${VITE_SUPABASE_URL}${avatarUrl}`);
    }

    // Object path fallback (e.g. "6.jpg")
    if (VITE_SUPABASE_URL) {
      return appendVersion(`${VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`);
    }

    return appendVersion(avatarUrl);
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
