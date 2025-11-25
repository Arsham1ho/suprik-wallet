import { Globe } from 'lucide-react';

interface PlanetAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xs';
  className?: string;
  walletId?: string;
}

export function PlanetAvatar({ size = 'md', className = '', walletId }: PlanetAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-11 h-11',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
  };

  const borderSizes = {
    xs: 'border',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-4',
  };

  // Random planet gradients for variety
  const gradients = [
    'from-purple-500 via-pink-500 to-blue-500',
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-orange-500 via-red-500 to-pink-500',
    'from-green-500 via-emerald-500 to-cyan-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-yellow-500 via-orange-500 to-red-500',
  ];

  // Generate a consistent gradient based on walletId
  const getGradientFromWalletId = (id?: string) => {
    if (!id) return gradients[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const gradient = getGradientFromWalletId(walletId);

  return (
    <div className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-purple-500/30 relative overflow-hidden ${className}`}>
      {/* Planet texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      
      {/* Shine effect */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-sm"></div>
      
      {/* Globe icon */}
      <Globe className={`${iconSizes[size]} text-white relative z-10`} />
    </div>
  );
}
