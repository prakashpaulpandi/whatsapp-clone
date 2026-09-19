import React from 'react';

const COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-pink-600',
];

const getColorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
};

export const Avatar = ({ name = '', avatarUrl, isOnline, size = 'md', isGroup = false }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const badgeSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const initials = getInitials(name);
  const colorClass = getColorForName(name);

  return (
    <div className="relative inline-flex flex-shrink-0 items-center justify-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover ring-2 ring-slate-800`}
        />
      ) : (
        <div
          className={`${sizeClasses[size] || sizeClasses.md} ${colorClass} rounded-full flex items-center justify-center font-semibold text-white tracking-wider shadow-inner ring-2 ring-slate-800`}
        >
          {isGroup ? (
            <svg className="w-5 h-5 opacity-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          ) : (
            initials
          )}
        </div>
      )}

      {isOnline !== undefined && !isGroup && (
        <span
          className={`absolute bottom-0 right-0 ${badgeSizes[size] || badgeSizes.md} rounded-full ring-2 ring-slate-900 ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
export default Avatar;
