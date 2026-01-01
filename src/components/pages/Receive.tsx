import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Copy, Share2, ChevronRight, Download, X, Link, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { copyToClipboard } from '../../utils/clipboard';
import { useWallet } from '../../utils/WalletContext';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { AccountManager } from '../../utils/accountManager';
import QRCode from 'qrcode';
import solanaLogo from 'figma:asset/90ed735d0a0f9f74ac0addf113dfa3eeef5dd7de.png';
import ethereumLogo from 'figma:asset/6f2fffd9058ccc93fdd4666eb5a5425382f8a89d.png';
import bitcoinLogo from 'figma:asset/70ee52e1200d76dda60fbec2e5e9c9e05ad66a8d.png';
import polygonLogo from 'figma:asset/5835e256cc6e093244a8f14763c69f489d07783d.png';
import suiLogo from 'figma:asset/da030245be42c29c645bce0fe70fead0ffc07d97.png';
import monadLogo from 'figma:asset/2c969460ffd1b3a61f7b1c7e67734b3fb59128c9.png';
import baseLogo from 'figma:asset/3ed7faba6a7643bebb74b6cb6a4d47a3dcbd30e5.png';
import hyperevmLogo from 'figma:asset/c4b44934aadf9ab9a074facc448e4c2bb3784ee5.png';
import suprikQrLogo from 'figma:asset/5aa4d38c7eec78d8bd26f08104423d0aa0e3b5f4.png';

interface ReceiveProps {
  onBack: () => void;
  walletId: string;
}

interface NetworkOption {
  id: string;
  name: string;
  symbol: string;
  color: string;
  gradient: string;
  logo: string;
  logoUrl?: string;
  comingSoon: boolean;
  address?: string;
}

export function Receive({ onBack, walletId }: ReceiveProps) {
  const wallet = useWallet();
  const { t } = useLanguage();
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activeAccountAddress, setActiveAccountAddress] = useState<string>('');

  // Generate QR code function
  const generateQRCode = async (address: string): Promise<string> => {
    try {
      const dataUrl = await QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Get the active account's Solana address from AccountManager and pre-generate QR
  useEffect(() => {
    const loadActiveAccountAddress = async () => {
      const activeAccount = AccountManager.getActiveAccount();
      let address = '';

      if (activeAccount?.addresses?.solana) {
        address = activeAccount.addresses.solana;
      } else if (wallet.addresses?.solana) {
        address = wallet.addresses.solana;
      }

      if (address) {
        setActiveAccountAddress(address);
        // Pre-generate QR code so it's ready instantly
        const qr = await generateQRCode(address);
        setQrCode(qr);
        setLoading(false);
      }
    };

    loadActiveAccountAddress();

    // Listen for account switches and wallet imports
    const handleAccountChange = () => {
      loadActiveAccountAddress();
    };

    window.addEventListener('accountSwitched', handleAccountChange);
    window.addEventListener('walletImported', handleAccountChange);

    return () => {
      window.removeEventListener('accountSwitched', handleAccountChange);
      window.removeEventListener('walletImported', handleAccountChange);
    };
  }, [wallet.addresses?.solana]);

  const networks: NetworkOption[] = [
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      logo: '◎',
      logoUrl: solanaLogo,
      comingSoon: false,
      address: activeAccountAddress,
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      logo: 'Ξ',
      logoUrl: ethereumLogo,
      comingSoon: true,
    },
    {
      id: 'base',
      name: 'Base',
      symbol: 'BASE',
      color: 'bg-gradient-to-r from-blue-600 to-blue-400',
      gradient: 'from-blue-600 via-blue-500 to-blue-400',
      logo: '🔵',
      logoUrl: baseLogo,
      comingSoon: true,
    },
    {
      id: 'monad',
      name: 'Monad',
      symbol: 'MONAD',
      color: 'bg-gradient-to-r from-violet-600 to-purple-500',
      gradient: 'from-violet-600 via-violet-500 to-purple-500',
      logo: '🟣',
      logoUrl: monadLogo,
      comingSoon: true,
    },
    {
      id: 'sui',
      name: 'Sui',
      symbol: 'SUI',
      color: 'bg-gradient-to-r from-sky-500 to-blue-600',
      gradient: 'from-sky-500 via-blue-500 to-blue-600',
      logo: '💧',
      logoUrl: suiLogo,
      comingSoon: true,
    },
    {
      id: 'hyperevm',
      name: 'HyperEVM',
      symbol: 'HYPE',
      color: 'bg-gradient-to-r from-cyan-500 to-teal-500',
      gradient: 'from-cyan-500 via-cyan-600 to-teal-500',
      logo: '⚡',
      logoUrl: hyperevmLogo,
      comingSoon: true,
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      color: 'bg-gradient-to-r from-orange-500 to-yellow-500',
      gradient: 'from-orange-500 via-orange-600 to-yellow-600',
      logo: '₿',
      logoUrl: bitcoinLogo,
      comingSoon: true,
    },
    {
      id: 'polygon',
      name: 'Polygon',
      symbol: 'MATIC',
      color: 'bg-gradient-to-r from-purple-600 to-pink-500',
      gradient: 'from-purple-600 via-purple-700 to-pink-500',
      logo: '⬡',
      logoUrl: polygonLogo,
      comingSoon: true,
    },
  ];

  const handleNetworkSelect = (network: NetworkOption) => {
    if (network.comingSoon) {
      toast.info(`${network.name} coming soon! 🚀`);
      return;
    }

    // QR code is already pre-generated, just select the network
    setSelectedNetwork(network);
  };

  const handleCopyAddress = async () => {
    if (!selectedNetwork?.address) return;

    const success = await copyToClipboard(selectedNetwork.address);
    if (success) {
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    setShowShareMenu(true);
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.download = `${selectedNetwork?.name || 'wallet'}_address_qr.png`;
    link.href = qrCode;
    link.click();
    toast.success('QR Code downloaded!');
    setShowShareMenu(false);
  };

  const handleShareSocial = (platform: string) => {
    if (!selectedNetwork?.address) return;

    const text = `Send ${selectedNetwork.symbol} to my ${selectedNetwork.name} address:\n${selectedNetwork.address}`;
    const encodedText = encodeURIComponent(text);
    
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: `My ${selectedNetwork.name} Address`,
            text: text,
          }).then(() => {
            toast.success('Shared successfully!');
          }).catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Error sharing:', error);
            }
          });
          setShowShareMenu(false);
          return;
        }
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      toast.success('Opening share dialog...');
      setShowShareMenu(false);
    }
  };

  const handleCopyLink = async () => {
    await handleCopyAddress();
    setShowShareMenu(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="receive-page bg-black text-white w-full" style={{ minHeight: '100vh', display: 'block' }}>
      <div className="px-6 py-6 pb-24" style={{ display: 'block' }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={selectedNetwork ? () => setSelectedNetwork(null) : onBack}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Receive Crypto</h1>
        </div>

        {/* Network Selection or QR Display */}
        <AnimatePresence mode="wait">
          {!selectedNetwork ? (
            <div className="receive-networks-container">
              <p className="text-slate-400 mb-4">Select a network to receive crypto</p>

              {networks.map((network) => (
                <div key={network.id} className="mb-3">
                  <button
                    onClick={() => handleNetworkSelect(network)}
                    className={`receive-network-btn w-full p-4 rounded-xl border transition-all ${
                      network.comingSoon
                        ? 'border-slate-800 bg-slate-900/30 opacity-50'
                        : 'border-purple-500/50 hover:border-purple-500 bg-gradient-to-r from-purple-500/10 to-blue-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black overflow-hidden p-1.5 flex-shrink-0">
                          {network.logoUrl ? (
                            <img
                              src={network.logoUrl}
                              alt={network.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xl">{network.logo}</span>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{network.name}</h3>
                            {network.comingSoon && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{network.symbol}</p>
                        </div>
                      </div>

                      {!network.comingSoon && (
                        <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              key="qr-display"
              className="receive-qr-display flex flex-col items-center space-y-2"
            >
              {/* Selected Network Info */}
              <div className="text-center mb-2 w-full">
                <h2 className="text-lg font-bold">{selectedNetwork.name}</h2>
                <p className="text-slate-400 text-xs">{selectedNetwork.symbol} Network</p>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-3xl p-6 mx-auto w-fit">
                {qrCode ? (
                  <div className="relative w-[280px] h-[280px]">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-full h-full"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {/* Suprik Wallet Logo in center - sized to work with QR error correction */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <img
                        src={suprikQrLogo}
                        alt="Suprik Wallet"
                        className="w-14 h-14 rounded-full object-cover shadow-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 w-full">
                <p className="text-xs text-slate-400 mb-2 text-center">Your {selectedNetwork.name} Address</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-sm text-white font-mono text-center break-all px-2">
                    {selectedNetwork.address ? truncateAddress(selectedNetwork.address) : ''}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 w-full">
                <Button
                  onClick={handleShare}
                  className="h-14 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-xl"
                  size="lg"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleCopyAddress}
                  className="h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl"
                  size="lg"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Address
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Menu Modal */}
      <AnimatePresence>
        {showShareMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Share Menu */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900 rounded-t-3xl p-6 z-50 border-t border-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Share Address</h3>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Download QR */}
                <motion.button
                  onClick={handleDownloadQR}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <Download className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm">Download QR</span>
                </motion.button>

                {/* Copy Link */}
                <motion.button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Link className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm">Copy Address</span>
                </motion.button>

                {/* Twitter */}
                <motion.button
                  onClick={() => handleShareSocial('twitter')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-sm">Twitter</span>
                </motion.button>

                {/* Telegram */}
                <motion.button
                  onClick={() => handleShareSocial('telegram')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </div>
                  <span className="text-sm">Telegram</span>
                </motion.button>

                {/* WhatsApp */}
                <motion.button
                  onClick={() => handleShareSocial('whatsapp')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm">WhatsApp</span>
                </motion.button>

                {/* More Options (Native Share) */}
                <motion.button
                  onClick={() => handleShareSocial('native')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-600/20 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-sm">More</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}