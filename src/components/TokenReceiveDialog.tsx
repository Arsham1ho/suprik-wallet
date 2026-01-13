import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Check, Copy, Share2, Download, X, Link, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';
import QRCode from 'qrcode';
import type { Token } from './pages/Home';
import { useWallet } from '../utils/WalletContext';
import { TOKEN_BY_ID, TOKEN_BY_SYMBOL } from '../utils/tokenRegistry';
import { AccountManager } from '../utils/accountManager';
import suprikQrLogo from 'figma:asset/5aa4d38c7eec78d8bd26f08104423d0aa0e3b5f4.png';

interface TokenReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: Token;
  walletId: string;
}

interface NetworkInfo {
  name: string;
  symbol: string;
  color: string;
  gradient: string;
  logo: string;
  explorer: string;
  addressUrl?: string;
}

export function TokenReceiveDialog({ open, onOpenChange, token, walletId }: TokenReceiveDialogProps) {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const wallet = useWallet();
  
  // Resolve actual Solana mint if token.mint is a CoinGecko ID
  const resolveActualMint = (): string => {
    if (token.mint && token.mint.length < 30 && !token.mint.includes('1111')) {
      // token.mint might be a CoinGecko ID like "parabolic-ai", try to resolve actual mint
      const registryToken = TOKEN_BY_ID.get(token.mint) || TOKEN_BY_SYMBOL.get(token.symbol.toUpperCase());
      if (registryToken?.mint) {
        console.log(`[TokenReceiveDialog] Resolved mint from registry: ${token.mint} -> ${registryToken.mint}`);
        return registryToken.mint;
      }
    }
    return token.mint;
  };

  const actualMint = resolveActualMint();

  // Detect network from token mint address
  const detectNetwork = (): NetworkInfo => {
    const mint = actualMint.toLowerCase();

    // Solana: base58 encoded, typically 32-44 characters
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(actualMint) && !mint.startsWith('0x')) {
      return {
        name: 'Solana',
        symbol: 'SOL',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 via-purple-600 to-indigo-600',
        logo: '◎',
        explorer: 'https://solscan.io',
        addressUrl: `https://solscan.io/token/${actualMint}`
      };
    }
    
    // Ethereum/Base/Polygon: 0x + 40 hex characters
    if (mint.startsWith('0x') && mint.length === 42) {
      // Check if it's Base (we can add more sophisticated detection later)
      if (token.name.toLowerCase().includes('base')) {
        return {
          name: 'Base',
          symbol: 'BASE',
          color: 'bg-blue-500',
          gradient: 'from-blue-500 via-blue-600 to-indigo-600',
          logo: '⬡',
          explorer: 'https://basescan.org',
          addressUrl: `https://basescan.org/token/${actualMint}`
        };
      }
      
      // Check if it's Polygon
      if (token.name.toLowerCase().includes('polygon') || token.symbol.toLowerCase().includes('matic')) {
        return {
          name: 'Polygon',
          symbol: 'MATIC',
          color: 'bg-purple-600',
          gradient: 'from-purple-600 via-purple-700 to-indigo-700',
          logo: '⬢',
          explorer: 'https://polygonscan.com',
          addressUrl: `https://polygonscan.com/token/${actualMint}`
        };
      }
      
      // Default to Ethereum
      return {
        name: 'Ethereum',
        symbol: 'ETH',
        color: 'bg-slate-500',
        gradient: 'from-slate-400 via-slate-500 to-slate-600',
        logo: 'Ξ',
        explorer: 'https://etherscan.io',
        addressUrl: `https://etherscan.io/token/${actualMint}`
      };
    }
    
    // Default to Solana if unsure
    return {
      name: 'Solana',
      symbol: 'SOL',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      logo: '◎',
      explorer: 'https://solscan.io',
      addressUrl: `https://solscan.io/token/${actualMint}`
    };
  };

  const network = detectNetwork();

  useEffect(() => {
    if (open && walletId) {
      fetchWalletAddress();
    }
  }, [open, walletId]);

  const generateQRCode = async (address: string): Promise<string> => {
    try {
      const dataUrl = await QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction allows logo overlay
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

  const fetchWalletAddress = async () => {
    try {
      setLoading(true);
      console.log('[TokenReceiveDialog] Fetching wallet address for network:', network.name);

      // Get address from AccountManager (same as Receive.tsx page)
      // This ensures we use the active account's address
      const activeAccount = AccountManager.getActiveAccount();
      let address = '';

      // Currently only Solana is supported - use the same pattern as Receive.tsx
      if (activeAccount?.addresses?.solana) {
        address = activeAccount.addresses.solana;
      } else if (wallet.addresses?.solana) {
        address = wallet.addresses.solana;
      }

      if (!address) {
        console.error('[TokenReceiveDialog] No address found for network:', network.symbol);
        toast.error('Wallet address not found');
        return;
      }

      console.log('[TokenReceiveDialog] Using address from active account:', address);
      setWalletAddress(address);
      const qr = await generateQRCode(address);
      setQrCode(qr);
    } catch (error) {
      console.error('[TokenReceiveDialog] Error fetching wallet address:', error);
      toast.error('Failed to load wallet address');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!walletAddress) return;

    const success = await copyToClipboard(walletAddress);
    
    if (success) {
      setCopied(true);
      toast.success('Address copied to clipboard!');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const handleShare = () => {
    setShowShareMenu(true);
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.download = `${token.symbol}_address_qr.png`;
    link.href = qrCode;
    link.click();
    toast.success('QR Code downloaded!');
    setShowShareMenu(false);
  };

  const handleShareSocial = (platform: string) => {
    if (!walletAddress) return;

    const text = `Send ${token.symbol} to my ${network.name} address:\\n${walletAddress}`;
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
            title: `My ${network.name} Address`,
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
    await handleCopy();
    setShowShareMenu(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-slate-800/50 text-white w-full max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40 px-4 py-5 border-b border-slate-800/50">
          <DialogHeader>
            <DialogTitle className="text-xl">Receive {token.symbol}</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              {network.name} Network
            </DialogDescription>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading address...</span>
            </div>
            <div className="h-64 bg-slate-900/50 rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Selected Network Info - Compact */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 bg-black overflow-hidden p-2">
                  <img
                    src={token.logoUrl || token.logo}
                    alt={token.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-lg font-bold">{token.name}</h2>
                <p className="text-slate-400 text-sm">{network.name} Network</p>
              </div>

              {/* QR Code - Smaller */}
              <motion.div
                className="bg-white rounded-2xl p-4 mx-auto w-fit"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {qrCode && (
                  <div className="relative w-[200px] h-[200px]">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                    {/* Suprik Wallet Logo in center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <img
                        src={suprikQrLogo}
                        alt="Suprik Wallet"
                        className="w-12 h-12 rounded-full object-cover shadow-lg"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Address - Compact */}
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                <p className="text-xs text-slate-400 mb-1 text-center">Your {network.name} Address</p>
                <code className="text-sm text-white font-mono text-center block break-all px-2">
                  {walletAddress ? truncateAddress(walletAddress) : ''}
                </code>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-4 pt-2 border-t border-slate-800/50">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleShare}
                  className="h-12 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-xl"
                  size="lg"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleCopy}
                  className="h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl"
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
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Share Menu */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900 rounded-t-3xl p-6 z-[101] border-t border-slate-800"
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
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
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
    </Dialog>
  );
}