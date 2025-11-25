import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Check, Copy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/clipboard';
import { useWallet } from '../utils/WalletContext';
import { useNetwork } from '../utils/NetworkContext';
import QRCode from 'qrcode';

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
}

interface ChainAddress {
  name: string;
  symbol: string;
  address: string;
  color: string;
  gradient: string;
  logo: string;
  description: string;
  imageUrl?: string;
  qrCode?: string;
  comingSoon?: boolean;
}

export function ReceiveDialog({ open, onOpenChange, walletId }: ReceiveDialogProps) {
  const wallet = useWallet();
  const network = useNetwork();
  const [addresses, setAddresses] = useState<ChainAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<ChainAddress | null>(null);

  useEffect(() => {
    if (open && wallet.addresses) {
      loadAddressesFromWallet();
    } else if (open && walletId) {
      // Fallback to fetching from server (legacy mode)
      fetchAddresses();
    }
  }, [open, wallet.addresses, walletId]);

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

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      console.log('Fetching addresses for wallet:', walletId);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/generate-addresses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      console.log('Addresses received:', data);

      const chainAddresses: ChainAddress[] = [
        {
          name: 'Solana',
          symbol: 'SOL',
          address: data.solana,
          color: 'bg-purple-500',
          gradient: 'from-purple-500 via-purple-600 to-indigo-600',
          logo: '◎',
          description: 'Fast, low-cost blockchain',
          imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: data.ethereum,
          color: 'bg-slate-500',
          gradient: 'from-slate-400 via-slate-500 to-slate-600',
          logo: 'Ξ',
          description: 'Leading smart contract platform',
          imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        },
        {
          name: 'Base',
          symbol: 'BASE',
          address: data.base,
          color: 'bg-blue-500',
          gradient: 'from-blue-500 via-blue-600 to-indigo-600',
          logo: '⬡',
          description: 'Ethereum L2 by Coinbase',
          imageUrl: 'https://cryptologos.cc/logos/versions/base-base-logo-full.svg',
        },
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          address: data.bitcoin,
          color: 'bg-orange-500',
          gradient: 'from-orange-400 via-orange-500 to-yellow-600',
          logo: '₿',
          description: 'Digital gold, store of value',
          imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        },
        {
          name: 'Polygon',
          symbol: 'MATIC',
          address: data.polygon,
          color: 'bg-purple-600',
          gradient: 'from-purple-600 via-purple-700 to-indigo-700',
          logo: '⬢',
          description: 'Ethereum scaling solution',
          imageUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        },
        {
          name: 'Sui',
          symbol: 'SUI',
          address: data.sui,
          color: 'bg-cyan-500',
          gradient: 'from-cyan-500 via-cyan-600 to-blue-600',
          logo: '~',
          description: 'Next-gen blockchain',
          imageUrl: 'https://cryptologos.cc/logos/sui-sui-logo.png',
        },
      ];

      // Generate QR codes for all addresses in parallel
      const qrPromises = chainAddresses.map(async (chain) => {
        const qrCode = await generateQRCode(chain.address);
        return { ...chain, qrCode };
      });

      const addressesWithQR = await Promise.all(qrPromises);
      setAddresses(addressesWithQR);
      
      // Auto-select first chain (Solana)
      setSelectedChain(addressesWithQR[0]);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const loadAddressesFromWallet = async () => {
    try {
      setLoading(true);
      console.log('[ReceiveDialog] Loading addresses from WalletContext');
      console.log('[ReceiveDialog] Wallet addresses:', wallet.addresses);
      
      if (!wallet.addresses) {
        console.error('[ReceiveDialog] No addresses in wallet context');
        toast.error('Please unlock wallet first');
        setLoading(false);
        return;
      }

      const chainAddresses: ChainAddress[] = [
        {
          name: 'Solana',
          symbol: 'SOL',
          address: wallet.addresses.solana,
          color: 'bg-purple-500',
          gradient: 'from-purple-500 via-purple-600 to-indigo-600',
          logo: '◎',
          description: 'Fast, low-cost blockchain',
          imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: wallet.addresses.ethereum,
          color: 'bg-slate-500',
          gradient: 'from-slate-400 via-slate-500 to-slate-600',
          logo: 'Ξ',
          description: 'Leading smart contract platform',
          imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
          comingSoon: true,
        },
        {
          name: 'Base',
          symbol: 'BASE',
          address: wallet.addresses.base,
          color: 'bg-blue-500',
          gradient: 'from-blue-500 via-blue-600 to-indigo-600',
          logo: '⬡',
          description: 'Ethereum L2 by Coinbase',
          imageUrl: 'https://cryptologos.cc/logos/versions/base-base-logo-full.svg',
          comingSoon: true,
        },
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          address: wallet.addresses.bitcoin,
          color: 'bg-orange-500',
          gradient: 'from-orange-400 via-orange-500 to-yellow-600',
          logo: '₿',
          description: 'Digital gold, store of value',
          imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
          comingSoon: true,
        },
        {
          name: 'Polygon',
          symbol: 'MATIC',
          address: wallet.addresses.polygon,
          color: 'bg-purple-600',
          gradient: 'from-purple-600 via-purple-700 to-indigo-700',
          logo: '⬢',
          description: 'Ethereum scaling solution',
          imageUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
          comingSoon: true,
        },
        {
          name: 'Sui',
          symbol: 'SUI',
          address: wallet.addresses.sui,
          color: 'bg-cyan-500',
          gradient: 'from-cyan-500 via-cyan-600 to-blue-600',
          logo: '~',
          description: 'Next-gen blockchain',
          imageUrl: 'https://cryptologos.cc/logos/sui-sui-logo.png',
          comingSoon: true,
        },
      ];

      // Generate QR codes for all addresses in parallel
      const qrPromises = chainAddresses.map(async (chain) => {
        const qrCode = await generateQRCode(chain.address);
        return { ...chain, qrCode };
      });

      const addressesWithQR = await Promise.all(qrPromises);
      setAddresses(addressesWithQR);
      
      // Auto-select first chain (Solana)
      setSelectedChain(addressesWithQR[0]);
      
      console.log('[ReceiveDialog] ✅ Loaded addresses from client-side wallet');
    } catch (error) {
      console.error('[ReceiveDialog] Error loading addresses from wallet:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = async (address: string, chainName: string) => {
    console.log(`[ReceiveDialog] Copy button clicked for ${chainName}`);
    console.log(`[ReceiveDialog] Address to copy:`, address);
    
    try {
      const success = await copyToClipboard(address);
      
      if (success) {
        console.log(`[ReceiveDialog] Copy successful for ${chainName}`);
        setCopiedAddress(address);
        toast.success(`${chainName} address copied!`);
        
        setTimeout(() => {
          setCopiedAddress(null);
        }, 2000);
      } else {
        console.warn(`[ReceiveDialog] Copy failed for ${chainName}, showing manual copy toast`);
        // Show a more helpful error with an option to manually select
        toast.error(`Tap the address box above to select and copy manually`, {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error(`[ReceiveDialog] Error during copy operation:`, error);
      toast.error(`Tap the address box above to select and copy manually`, {
        duration: 4000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-slate-800/50 text-white w-full max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[95vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40 px-4 py-5 border-b border-slate-800/50">
          <DialogHeader>
            <DialogTitle className="text-xl">Receive Crypto</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Select a network to receive funds
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Testnet Mode Banner */}
        {network.isTestnet && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="text-blue-400 text-xl">🧪</div>
              <div className="flex-1">
                <p className="text-sm text-blue-200 font-medium">Testnet Mode Active</p>
                <p className="text-xs text-blue-300/70 mt-0.5">
                  These are real addresses. You can receive testnet tokens for testing purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading addresses...</span>
            </div>
            <div className="h-64 bg-slate-900/50 rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(95vh-100px)]">
            {/* Network Pills Selector */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex flex-wrap gap-2 justify-center">
                {addresses.map((chain, index) => (
                  <motion.button
                    key={chain.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (chain.comingSoon) {
                        toast.info(`${chain.name} - Coming Soon! 🚀`, { duration: 2000 });
                      } else {
                        setSelectedChain(chain);
                      }
                    }}
                    className={`relative px-4 py-2.5 rounded-full transition-all flex items-center gap-2 ${
                      selectedChain?.name === chain.name
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50 scale-105'
                        : chain.comingSoon
                        ? 'bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 opacity-60'
                        : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${chain.gradient} p-0.5 shrink-0`}>
                      <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center">
                        {chain.imageUrl ? (
                          <img 
                            src={chain.imageUrl} 
                            alt={chain.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const sibling = (e.target as HTMLImageElement).nextElementSibling;
                              if (sibling) sibling.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`text-xs ${chain.imageUrl ? 'hidden' : ''}`}>{chain.logo}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{chain.symbol}</span>
                    
                    {/* Coming Soon Badge */}
                    {chain.comingSoon && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    )}
                    
                    {/* Active indicator */}
                    {selectedChain?.name === chain.name && (
                      <motion.div
                        layoutId="activeNetwork"
                        className="absolute inset-0 rounded-full border-2 border-white/20"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Selected Chain Details */}
            <AnimatePresence mode="wait">
              {selectedChain && (
                <motion.div
                  key={selectedChain.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 space-y-4"
                >
                  {/* QR Code - Move to top for better mobile UX */}
                  <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700/50">
                    {/* Chain badge at top */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedChain.gradient} p-0.5`}>
                        <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center">
                          {selectedChain.imageUrl ? (
                            <img 
                              src={selectedChain.imageUrl} 
                              alt={selectedChain.name}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const sibling = (e.target as HTMLImageElement).nextElementSibling;
                                if (sibling) sibling.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={`${selectedChain.imageUrl ? 'hidden' : ''}`}>{selectedChain.logo}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">{selectedChain.name}</p>
                        <p className="text-xs text-slate-400">{selectedChain.description}</p>
                      </div>
                    </div>

                    {/* QR Code with gradient border */}
                    <div className={`bg-gradient-to-br ${selectedChain.gradient} p-1 rounded-2xl mx-auto w-fit`}>
                      <div className="bg-white p-4 rounded-xl">
                        {selectedChain.qrCode ? (
                          <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={selectedChain.qrCode} 
                            alt="QR Code"
                            className="w-48 h-48 object-contain"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-xs text-slate-600">Generating...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-center text-slate-400 mt-3">
                      Scan to receive {selectedChain.symbol}
                    </p>
                  </div>

                  {/* Address Card - Compact design */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4">
                      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                        Your {selectedChain.symbol} Address
                      </label>
                      
                      {/* Address with tap to copy */}
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={async (e) => {
                          console.log('[ReceiveDialog] Address box clicked');
                          const codeElement = e.currentTarget.querySelector('code');
                          if (codeElement) {
                            try {
                              const range = document.createRange();
                              range.selectNodeContents(codeElement);
                              const selection = window.getSelection();
                              selection?.removeAllRanges();
                              selection?.addRange(range);
                              
                              if (selectedChain) {
                                const success = await copyToClipboard(selectedChain.address);
                                if (success) {
                                  setCopiedAddress(selectedChain.address);
                                  toast.success('Address copied!');
                                  setTimeout(() => setCopiedAddress(null), 2000);
                                }
                              }
                            } catch (err) {
                              console.error('[ReceiveDialog] Error during selection:', err);
                            }
                          }
                        }}
                        className="relative bg-black/40 rounded-xl p-4 cursor-pointer border border-slate-700/50 hover:border-purple-500/50 transition-all group"
                      >
                        <code className="text-xs text-white font-mono break-all select-all block pr-10">
                          {selectedChain.address}
                        </code>
                        
                        {/* Copy button overlay */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <motion.div
                            animate={copiedAddress === selectedChain.address ? { scale: [1, 1.2, 1] } : {}}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              copiedAddress === selectedChain.address
                                ? 'bg-green-500'
                                : 'bg-purple-600 group-hover:bg-purple-500'
                            }`}
                          >
                            {copiedAddress === selectedChain.address ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <Copy className="w-4 h-4 text-white" />
                            )}
                          </motion.div>
                        </div>
                        
                        {/* Tap hint */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-xs text-purple-400 bg-black/60 px-3 py-1 rounded-full">
                            Tap to copy
                          </span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Copy button as card footer */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyAddress(selectedChain.address, selectedChain.name);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 border-t border-slate-700/50"
                    >
                      {copiedAddress === selectedChain.address ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm font-medium">Copy Address</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Compact Warning */}
                  <div className="space-y-2">
                    {selectedChain.symbol === 'SOL' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
                      >
                        <div className="flex gap-2.5">
                          <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-orange-200 leading-relaxed">
                            Match network settings with sender, then refresh on Home.
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
                    >
                      <div className="flex gap-2.5">
                        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-200 leading-relaxed">
                          Only send <strong>{selectedChain.symbol}</strong> tokens to this address. Wrong network = permanent loss.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}