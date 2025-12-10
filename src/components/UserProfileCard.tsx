import { motion } from 'motion/react';
import { PlanetAvatar } from './PlanetAvatar';
import { AnimalAvatar } from './AnimalAvatar';
import { Wallet, Calendar, Shield, Crown } from 'lucide-react';

interface UserProfileCardProps {
  walletId: string;
  username: string;
  onClose: () => void;
  isOwnProfile?: boolean;
  tokenBalance?: number;
  tokenSymbol?: string;
  profilePicture?: string | null;
}

export function UserProfileCard({ 
  walletId, 
  username, 
  onClose, 
  isOwnProfile = false,
  tokenBalance,
  tokenSymbol,
  profilePicture
}: UserProfileCardProps) {
  const formatWalletId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
  };

  const formatDate = (walletId: string) => {
    // Generate a pseudo-random date based on walletId
    let hash = 0;
    for (let i = 0; i < walletId.length; i++) {
      hash = ((hash << 5) - hash) + walletId.charCodeAt(i);
      hash = hash & hash;
    }
    
    const days = Math.abs(hash % 365);
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const getUserBadge = () => {
    if (isOwnProfile) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
          <Crown className="w-3 h-3" />
          <span>You</span>
        </div>
      );
    }
    
    if (tokenBalance && tokenBalance > 100) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30">
          <Shield className="w-3 h-3" />
          <span>Whale</span>
        </div>
      );
    }
    
    if (tokenBalance && tokenBalance > 10) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30">
          <Shield className="w-3 h-3" />
          <span>Holder</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm z-50"
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative h-24 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>

          {/* Avatar - overlapping header */}
          <div className="relative px-6 -mt-12">
            <div className="inline-block">
              <div className="relative">
                <AnimalAvatar 
                  size="lg" 
                  walletId={walletId} 
                  profilePicture={profilePicture}
                />
                {/* Online indicator */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 pt-3 space-y-4">
            {/* Username and Badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl text-white truncate">
                  {username}
                </h3>
                {getUserBadge()}
              </div>
              
              {/* Bio or status */}
              <p className="text-sm text-slate-400">
                {isOwnProfile ? 'This is you!' : `Member of ${tokenSymbol || 'this'} community`}
              </p>
            </div>

            {/* Info cards */}
            <div className="space-y-2">
              {/* Wallet ID */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Wallet className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Wallet ID</p>
                  <p className="text-sm text-white font-mono truncate">{formatWalletId(walletId)}</p>
                </div>
              </div>

              {/* Member since */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Member since</p>
                  <p className="text-sm text-white">{formatDate(walletId)}</p>
                </div>
              </div>

              {/* Token balance (if provided) */}
              {tokenBalance !== undefined && tokenSymbol && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Token Balance</p>
                    <p className="text-sm text-white">
                      {tokenBalance.toFixed(2)} {tokenSymbol}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action button (optional - for future features) */}
            {!isOwnProfile && (
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
