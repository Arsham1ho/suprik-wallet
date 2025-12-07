import { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { useWallet } from '../../utils/WalletContext';
import { useNetwork } from '../../utils/NetworkContext';
import { fetchSolanaBalance, fetchEthereumBalance, fetchBitcoinBalance } from '../../utils/blockchain';
import { copyToClipboard } from '../../utils/clipboard';
import { toast } from 'sonner@2.0.3';

interface BalanceCheckerProps {
  onBack: () => void;
}

interface ChainBalanceResult {
  chain: string;
  address: string;
  balance: number;
  tokens: any[];
  status: 'loading' | 'success' | 'error';
  error?: string;
  explorer?: string;
}

export function BalanceChecker({ onBack }: BalanceCheckerProps) {
  const wallet = useWallet();
  const network = useNetwork();
  const [results, setResults] = useState<ChainBalanceResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const checkAllBalances = async () => {
    if (!wallet.addresses) {
      toast.error('والت باز نیست. لطفاً ابتدا والت را باز کنید.');
      return;
    }

    setChecking(true);
    
    const chains: ChainBalanceResult[] = [
      {
        chain: 'Solana',
        address: wallet.addresses.solana,
        balance: 0,
        tokens: [],
        status: 'loading',
        explorer: `https://explorer.solana.com/address/${wallet.addresses.solana}${network.isTestnet ? '?cluster=devnet' : ''}`
      },
      {
        chain: 'Ethereum',
        address: wallet.addresses.ethereum,
        balance: 0,
        tokens: [],
        status: 'loading',
        explorer: `https://${network.isTestnet ? 'sepolia.' : ''}etherscan.io/address/${wallet.addresses.ethereum}`
      },
      {
        chain: 'Bitcoin',
        address: wallet.addresses.bitcoin,
        balance: 0,
        tokens: [],
        status: 'loading',
        explorer: `https://blockstream.info${network.isTestnet ? '/testnet' : ''}/address/${wallet.addresses.bitcoin}`
      }
    ];

    setResults(chains);

    // Check Solana
    try {
      console.log('[BalanceChecker] 🔍 Checking Solana balance...');
      console.log('[BalanceChecker] Network mode:', network.networkMode);
      console.log('[BalanceChecker] Is testnet:', network.isTestnet);
      console.log('[BalanceChecker] Address:', wallet.addresses.solana);
      
      const solBalance = await fetchSolanaBalance(wallet.addresses.solana, network.networkMode);
      
      console.log('[BalanceChecker] ✅ Solana result:', solBalance);
      
      setResults(prev => prev.map(r => 
        r.chain === 'Solana' 
          ? { ...r, balance: solBalance.native, tokens: solBalance.tokens, status: 'success' }
          : r
      ));
    } catch (error: any) {
      console.error('[BalanceChecker] ❌ Solana error:', error);
      setResults(prev => prev.map(r => 
        r.chain === 'Solana' 
          ? { ...r, status: 'error', error: error.message }
          : r
      ));
    }

    // Check Ethereum
    try {
      console.log('[BalanceChecker] 🔍 Checking Ethereum balance...');
      const ethBalance = await fetchEthereumBalance(wallet.addresses.ethereum, network.networkMode);
      console.log('[BalanceChecker] ✅ Ethereum result:', ethBalance);
      
      setResults(prev => prev.map(r => 
        r.chain === 'Ethereum' 
          ? { ...r, balance: ethBalance.native, tokens: ethBalance.tokens, status: 'success' }
          : r
      ));
    } catch (error: any) {
      console.error('[BalanceChecker] ❌ Ethereum error:', error);
      setResults(prev => prev.map(r => 
        r.chain === 'Ethereum' 
          ? { ...r, status: 'error', error: error.message }
          : r
      ));
    }

    // Check Bitcoin
    try {
      console.log('[BalanceChecker] 🔍 Checking Bitcoin balance...');
      const btcBalance = await fetchBitcoinBalance(wallet.addresses.bitcoin);
      console.log('[BalanceChecker] ✅ Bitcoin result:', btcBalance);
      
      setResults(prev => prev.map(r => 
        r.chain === 'Bitcoin' 
          ? { ...r, balance: btcBalance.native, tokens: btcBalance.tokens, status: 'success' }
          : r
      ));
    } catch (error: any) {
      console.error('[BalanceChecker] ❌ Bitcoin error:', error);
      setResults(prev => prev.map(r => 
        r.chain === 'Bitcoin' 
          ? { ...r, status: 'error', error: error.message }
          : r
      ));
    }

    setChecking(false);
  };

  const handleCopy = async (address: string) => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopiedAddress(address);
      toast.success('آدرس کپی شد!');
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-black via-black to-transparent border-b border-slate-800/50 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">بررسی موجودی</h1>
              <p className="text-sm text-slate-400">
                چک کردن دستی موجودی والت از بلاکچین
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Network Info Banner */}
        <div className={`p-4 rounded-2xl ${
          network.isTestnet 
            ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30'
            : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${network.isTestnet ? '🧪' : '🔗'}`}>
              {network.isTestnet ? '🧪' : '🔗'}
            </div>
            <div>
              <p className={`font-semibold ${network.isTestnet ? 'text-blue-200' : 'text-green-200'}`}>
                {network.isTestnet ? 'حالت تستنت فعال' : 'حالت مینت فعال'}
              </p>
              <p className={`text-xs mt-1 ${network.isTestnet ? 'text-blue-300/70' : 'text-green-300/70'}`}>
                {network.isTestnet 
                  ? 'آدرس‌های زیر برای دریافت توکن‌های تستی است'
                  : 'آدرس‌های زیر برای دریافت ارز واقعی است'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Check Button */}
        <Button
          onClick={checkAllBalances}
          disabled={checking}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12 rounded-xl"
        >
          <RefreshCw className={`w-5 h-5 ml-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'در حال بررسی...' : 'بررسی موجودی همه شبکه‌ها'}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={result.chain}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden"
              >
                {/* Chain Header */}
                <div className="p-4 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        result.chain === 'Solana' ? 'bg-purple-500/20' :
                        result.chain === 'Ethereum' ? 'bg-slate-500/20' :
                        'bg-orange-500/20'
                      }`}>
                        <span className="text-xl">
                          {result.chain === 'Solana' ? '◎' :
                           result.chain === 'Ethereum' ? 'Ξ' :
                           '₿'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{result.chain}</h3>
                        <p className="text-xs text-slate-400">
                          {network.isTestnet 
                            ? result.chain === 'Solana' ? 'Devnet' : 
                              result.chain === 'Ethereum' ? 'Sepolia' : 
                              'Testnet'
                            : 'Mainnet'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div>
                      {result.status === 'loading' && (
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {result.status === 'success' && (
                        <Check className="w-6 h-6 text-green-500" />
                      )}
                      {result.status === 'error' && (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                      آدرس
                    </label>
                    <div className="bg-black/40 rounded-xl p-3 border border-slate-700/50 relative">
                      <code className="text-xs text-white font-mono break-all block pr-10">
                        {result.address}
                      </code>
                      <button
                        onClick={() => handleCopy(result.address)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
                      >
                        {copiedAddress === result.address ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  {result.status === 'success' && (
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                        موجودی
                      </label>
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
                        <p className="text-2xl font-bold text-white">
                          {result.balance.toFixed(result.chain === 'Bitcoin' ? 8 : 6)}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {result.chain === 'Solana' ? 'SOL' :
                           result.chain === 'Ethereum' ? 'ETH' :
                           'BTC'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tokens */}
                  {result.status === 'success' && result.tokens.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                        توکن‌ها ({result.tokens.length})
                      </label>
                      <div className="space-y-2">
                        {result.tokens.map((token, i) => (
                          <div 
                            key={i}
                            className="bg-black/40 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium">{token.symbol}</p>
                              <p className="text-xs text-slate-400">{token.name}</p>
                            </div>
                            <p className="text-sm font-mono">{token.amount}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {result.status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <p className="text-sm text-red-200">{result.error}</p>
                    </div>
                  )}

                  {/* Explorer Link */}
                  {result.explorer && (
                    <a
                      href={result.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>مشاهده در اکسپلورر</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>📋</span>
            راهنمای استفاده
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>۱. روی دکمه "بررسی موجودی" کلیک کنید</p>
            <p>۲. منتظر بمانید تا موجودی از بلاکچین خوانده شود</p>
            <p>۳. اگر موجودی صفر است:</p>
            <ul className="mr-6 space-y-1 text-xs text-slate-400">
              <li>• اطمینان حاصل کنید که به آدرس درست ارسال کرده‌اید</li>
              <li>• تنظیمات شبکه (Mainnet/Testnet) را بررسی کنید</li>
              <li>• روی "مشاهده در اکسپلورر" کلیک کنید تا تراکنش را ببینید</li>
              <li>• اگر تراکنش هنوز در انتظار است، چند دقیقه صبر کنید</li>
            </ul>
          </div>
        </div>

        {/* Faucet Links for Testnet */}
        {network.isTestnet && (
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-2xl border border-blue-500/30 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>🚰</span>
              دریافت توکن تستی رایگان
            </h3>
            <div className="space-y-2">
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">Solana Devnet Faucet</p>
                  <p className="text-xs text-slate-400">دریافت SOL تستی</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="https://sepoliafaucet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-500/10 border border-slate-500/30 hover:bg-slate-500/20 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">Ethereum Sepolia Faucet</p>
                  <p className="text-xs text-slate-400">دریافت ETH تستی</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
