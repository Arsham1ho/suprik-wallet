interface AnimalAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  walletId?: string;
  profilePicture?: string | null;
  selectedEmoji?: string | null;
}

export function AnimalAvatar({ 
  size = 'md', 
  className = '', 
  walletId,
  profilePicture,
  selectedEmoji
}: AnimalAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-sm',
    sm: 'w-10 h-10 text-2xl',
    md: 'w-11 h-11 text-2xl',
    lg: 'w-24 h-24 text-5xl',
  };

  const borderSizes = {
    xs: 'border',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-4',
  };

  // اموجی‌های حیوانات
  const animalEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
    '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐',
    '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋',
    '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘',
    '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃',
  ];

  // تولید یک اموجی رندوم بر اساس walletId
  const getAnimalEmoji = (id?: string) => {
    if (!id) return animalEmojis[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return animalEmojis[Math.abs(hash) % animalEmojis.length];
  };

  // رنگ‌های گرادیانت
  const gradients = [
    'from-purple-500 via-pink-500 to-blue-500',
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-orange-500 via-red-500 to-pink-500',
    'from-green-500 via-emerald-500 to-cyan-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-yellow-500 via-orange-500 to-red-500',
    'from-rose-500 via-pink-500 to-purple-500',
    'from-cyan-500 via-blue-500 to-indigo-500',
  ];

  const getGradientFromWalletId = (id?: string) => {
    if (!id) return gradients[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  // اگر اموجی سفارشی انتخاب شده، از آن استفاده کن، در غیر اینصورت از رندوم استفاده کن
  const animal = selectedEmoji || getAnimalEmoji(walletId);
  const gradient = getGradientFromWalletId(walletId);

  // اگر عکس پروفایل وجود دارد، آن را نمایش بده
  if (profilePicture) {
    return (
      <img 
        src={profilePicture} 
        alt="Profile" 
        className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full object-cover border-purple-500/30 ${className}`}
      />
    );
  }

  // در غیر این صورت اموجی حیوان را نمایش بده
  return (
    <div 
      className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-purple-500/30 relative overflow-hidden ${className}`}
    >
      {/* Shine effect */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-sm"></div>
      
      {/* Animal emoji */}
      <span className="relative z-10 select-none">
        {animal}
      </span>
    </div>
  );
}