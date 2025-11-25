import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Check, Copy, Info, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/clipboard';
import QRCode from 'qrcode';
import type { Token } from './pages/Home';
import { useWallet } from '../utils/WalletContext';

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
  const [copiedItem, setCopiedItem] = useState<'wallet' | 'contract' | null>(null);
  const { mnemonic } = useWallet();
  
  // Detect network from token mint address
  const detectNetwork = (): NetworkInfo => {
    const mint = token.mint.toLowerCase();
    
    // Solana: base58 encoded, typically 32-44 characters
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token.mint) && !mint.startsWith('0x')) {
      return {
        name: 'Solana',
        symbol: 'SOL',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 via-purple-600 to-indigo-600',
        logo: '◎',
        explorer: 'https://solscan.io',
        addressUrl: `https://solscan.io/token/${token.mint}`
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
          addressUrl: `https://basescan.org/token/${token.mint}`
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
          addressUrl: `https://polygonscan.com/token/${token.mint}`
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
        addressUrl: `https://etherscan.io/token/${token.mint}`
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
      addressUrl: `https://solscan.io/token/${token.mint}`
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
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
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
      console.log('Fetching wallet address for network:', network.name);
      
      if (!mnemonic) {
        console.error('Mnemonic not found in local storage');
        toast.error('Mnemonic not found. Please sign in again.');
        return;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/generate-addresses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            walletId,
            seedPhrase: mnemonic 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching wallet address:', errorData);
        throw new Error(errorData.error || 'Failed to fetch wallet address');
      }

      const data = await response.json();
      console.log('Addresses received:', data);

      // Get the appropriate address based on network
      let address = '';
      switch (network.symbol) {
        case 'SOL':
          address = data.solana;
          break;
        case 'ETH':
          address = data.ethereum;
          break;
        case 'BASE':
          address = data.base;
          break;
        case 'MATIC':
          address = data.polygon;
          break;
        case 'BTC':
          address = data.bitcoin;
          break;
        default:
          address = data.solana;
      }

      setWalletAddress(address);
      const qr = await generateQRCode(address);
      setQrCode(qr);
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      toast.error('Failed to load wallet address');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, type: 'wallet' | 'contract') => {
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopiedItem(type);
      toast.success(`${type === 'wallet' ? 'Wallet address' : 'Contract address'} copied!`);
      
      setTimeout(() => {
        setCopiedItem(null);
      }, 2000);
    } else {
      toast.error(`Please copy manually: ${text.slice(0, 20)}...`, {
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-slate-800/50 text-white w-full max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[95vh]">
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
          <div className="overflow-y-auto max-h-[calc(95vh-100px)] p-4 space-y-4">
            {/* Token Info */}
            <div className={`p-4 rounded-xl bg-gradient-to-br ${network.gradient} bg-opacity-20 border border-slate-800/50`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-900/50 p-2">
                  <img 
                    src={token.logoUrl || token.logo} 
                    alt={token.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white">{token.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-br ${network.gradient} text-white`}>
                      {network.logo} {network.name}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Wallet Address */}
              <div className="space-y-2 mb-4">
                <label className="text-xs text-slate-300 uppercase tracking-wider">Your Wallet Address</label>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 p-3 bg-black/40 rounded-lg border border-slate-700/50 overflow-x-auto cursor-pointer hover:bg-black/60 transition-colors"
                    onClick={(e) => {
                      const codeElement = e.currentTarget.querySelector('code');
                      if (codeElement) {
                        const range = document.createRange();
                        range.selectNodeContents(codeElement);
                        const selection = window.getSelection();
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                    }}
                  >
                    <code className="text-xs text-white font-mono break-all select-all">
                      {walletAddress}
                    </code>
                  </div>
                  <Button
                    onClick={() => handleCopy(walletAddress, 'wallet')}
                    size="sm"
                    className={`shrink-0 h-auto px-3 transition-all ${
                      copiedItem === 'wallet'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {copiedItem === 'wallet' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Token Contract Address */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 uppercase tracking-wider">Token Contract Address</label>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 p-3 bg-black/40 rounded-lg border border-slate-700/50 overflow-x-auto cursor-pointer hover:bg-black/60 transition-colors"
                    onClick={(e) => {
                      const codeElement = e.currentTarget.querySelector('code');
                      if (codeElement) {
                        const range = document.createRange();
                        range.selectNodeContents(codeElement);
                        const selection = window.getSelection();
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                    }}
                  >
                    <code className="text-xs text-slate-400 font-mono break-all select-all">
                      {token.mint}
                    </code>
                  </div>
                  <Button
                    onClick={() => handleCopy(token.mint, 'contract')}
                    size="sm"
                    variant="outline"
                    className={`shrink-0 h-auto px-3 transition-all border-slate-700 ${
                      copiedItem === 'contract'
                        ? 'bg-green-500 hover:bg-green-600 border-green-500'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    {copiedItem === 'contract' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {network.addressUrl && (
                  <a
                    href={network.addressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on {network.explorer.replace('https://', '').split('.')[0]}
                  </a>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-5 rounded-2xl">
              <div className="flex justify-center">
                {qrCode ? (
                  <motion.img 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={qrCode} 
                    alt="QR Code"
                    className="w-60 h-60 object-contain"
                  />
                ) : (
                  <div className="w-60 h-60 flex items-center justify-center bg-slate-100 rounded-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-600">Generating QR...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Cards */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-200">
                    <strong>Important:</strong> Only send <strong>{token.symbol}</strong> tokens to this address. Sending other tokens or using wrong network will result in permanent loss.
                  </p>
                </div>
              </div>
              
              {network.symbol === 'SOL' && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-orange-200">
                        <strong>Solana Network:</strong> Make sure sender and receiver are on the same network (Mainnet/Devnet). After receiving, tap Refresh (↻) on Home page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}