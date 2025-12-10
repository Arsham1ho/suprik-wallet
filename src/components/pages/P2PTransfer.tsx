import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Orbit, ChevronRight, Send, Download, QrCode, Upload, FileText, Copy, Share2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useWallet } from '../../utils/WalletContext';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { fetchAllBalances, fetchTokenPrices } from '../../utils/blockchain';
import { loadAllTokens } from '../../utils/tokenLoader';
import { getCustomTokens, type CustomToken } from '../../utils/customTokens';
import { TokenLogo } from '../TokenLogo';
import {
  createOfflineSolTransaction,
  createOfflineSPLTransaction,
  parseOfflineTransaction,
  submitOfflineTransaction,
  serializeOfflineTransaction,
  downloadOfflineTransaction,
  type OfflineTransaction,
} from '../../utils/cosmoPayTransaction';
import { generateQRCode, downloadQRCode, copyToClipboard } from '../../utils/qrGenerator';
import {
  createNonceAccount,
  getNonceAccountInfo,
  getStoredNonceAccount,
  type NonceAccountInfo,
} from '../../utils/nonceManager';

interface P2PTransferProps {
  onBack: () => void;
}

interface Token {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logo: string;
  logoUrl?: string;
  balance?: string;
  usdValue?: number;
}

interface WalletToken {
  mint: string;
  name: string;
  symbol: string;
  amount: number;
  logo: string;
  logoUrl: string;
  color: string;
  network: string;
  price?: number;
  value?: number;
}

interface TransactionDetails {
  from: string;
  to: string;
  token: {
    symbol: string;
    mint: string;
    logo: string;
  };
  amount: string;
  timestamp: number;
}

const POPULAR_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'native',
    decimals: 9,
    logo: '⚡',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logo: '💵',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logo: '💲',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logo: '🐕',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    logo: '🪐',
  },
];

type Step = 'landing' | 'choice' | 'nonce-setup' | 'address' | 'token' | 'amount' | 'confirm' | 'share' | 'receive-method' | 'receive-import' | 'receive-review' | 'receive-confirm';
type TransferType = 'send' | 'receive' | null;
type ImportMethod = 'qr' | 'file' | 'paste' | null;

export function P2PTransfer({ onBack }: P2PTransferProps) {
  const wallet = useWallet();
  const { t } = useLanguage();
  
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [transferType, setTransferType] = useState<TransferType>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token>(POPULAR_TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Send flow states
  const [offlineTransaction, setOfflineTransaction] = useState<OfflineTransaction | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Receive flow states
  const [importMethod, setImportMethod] = useState<ImportMethod>(null);
  const [receivedTransaction, setReceivedTransaction] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [parsedOfflineTx, setParsedOfflineTx] = useState<OfflineTransaction | null>(null);
  
  // Nonce account states
  const [nonceAccountAddress, setNonceAccountAddress] = useState<string | null>(null);
  const [nonceAccountInfo, setNonceAccountInfo] = useState<NonceAccountInfo | null>(null);
  // Always use durable nonce - no standard mode

  // Check for existing nonce account on mount
  useEffect(() => {
    const checkNonceAccount = async () => {
      const stored = getStoredNonceAccount();
      if (stored) {
        setNonceAccountAddress(stored);
        // Verify it exists on chain
        const info = await getNonceAccountInfo(stored, false);
        setNonceAccountInfo(info);
      }
    };
    checkNonceAccount();
  }, []);

  // Load tokens with balances
  useEffect(() => {
    const fetchTokensWithBalances = async () => {
      if (!wallet.addresses || !wallet.isUnlocked) {
        console.log('[CosmoPay] Wallet not ready');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('[CosmoPay] Loading tokens with balances...');
        
        // Load all tokens from blockchain (same as Home page)
        const allTokens = await loadAllTokens(
          wallet.addresses,
          'mainnet',
          false
        );
        
        console.log('[CosmoPay] Loaded tokens:', allTokens);

        // Map all tokens (including those with 0 balance)
        const formattedTokens = allTokens.map(token => ({
          symbol: token.symbol,
          name: token.name,
          mint: token.mint,
          decimals: 9, // Default, adjust if needed
          logo: token.logo || '🪙',
          logoUrl: token.logoUrl,
          balance: token.amount.toFixed(6),
          usdValue: token.value || 0,
        }));

        console.log('[CosmoPay] All tokens:', formattedTokens);
        setTokens(formattedTokens);

        // Set first token as default
        if (formattedTokens.length > 0) {
          setSelectedToken(formattedTokens[0]);
        }
      } catch (error) {
        console.error('[CosmoPay] Error loading tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokensWithBalances();
  }, [wallet.addresses, wallet.isUnlocked]);

  // Validate Solana address
  const validateSolanaAddress = (address: string): boolean => {
    if (!address) {
      setAddressError('Address is required');
      return false;
    }

    // Solana addresses are base58 encoded and typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    if (!base58Regex.test(address)) {
      setAddressError('Invalid Solana address format');
      return false;
    }

    // Check if it's the same as sender address
    if (wallet.addresses?.solana && address === wallet.addresses.solana) {
      setAddressError('Cannot send to your own address');
      return false;
    }

    setAddressError('');
    return true;
  };

  // Validate amount
  const validateAmount = (value: string): boolean => {
    if (!value) {
      setAmountError('Amount is required');
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }

    const balance = parseFloat(selectedToken.balance || '0');
    if (numValue > balance) {
      setAmountError(`Insufficient balance. Maximum: ${balance} ${selectedToken.symbol}`);
      return false;
    }

    setAmountError('');
    return true;
  };

  // Parse received transaction data
  const parseTransactionData = (data: string): boolean => {
    try {
      const parsed = parseOfflineTransaction(data);
      if (!parsed) {
        return false;
      }

      setParsedOfflineTx(parsed);
      setTransactionDetails({
        from: parsed.from,
        to: parsed.to,
        token: {
          symbol: parsed.token.symbol,
          mint: parsed.token.mint,
          logo: parsed.token.logo,
        },
        amount: parsed.amount,
        timestamp: parsed.timestamp,
      });

      return true;
    } catch (error) {
      console.error('[CosmoPay] Failed to parse transaction:', error);
      return false;
    }
  };

  const handleStartTransfer = () => {
    setCurrentStep('choice');
  };

  const handleChooseSend = () => {
    setTransferType('send');
    
    // Check if nonce account exists
    if (!nonceAccountInfo?.exists) {
      setCurrentStep('nonce-setup');
    } else {
      setCurrentStep('address');
    }
  };

  const handleCreateNonceAccount = async () => {
    if (!wallet.mnemonic) {
      toast.error('Wallet not unlocked');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[CosmoPay] Creating nonce account...');
      
      const result = await createNonceAccount({
        mnemonic: wallet.mnemonic,
        accountIndex: 0,
        isTestnet: false,
      });

      if (result.success && result.nonceAccountAddress) {
        toast.success('Nonce account created! No time limits now! 🎉');
        setNonceAccountAddress(result.nonceAccountAddress);
        
        // Fetch info
        const info = await getNonceAccountInfo(result.nonceAccountAddress, false);
        setNonceAccountInfo(info);
        
        // Continue to address step
        setCurrentStep('address');
      } else {
        toast.error(result.error || 'Failed to create nonce account');
      }
    } catch (error: any) {
      console.error('[CosmoPay] Error creating nonce account:', error);
      toast.error(error.message || 'Failed to create nonce account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChooseReceive = () => {
    setTransferType('receive');
    setCurrentStep('receive-method');
  };

  const handleChooseImportMethod = (method: ImportMethod) => {
    setImportMethod(method);
    setCurrentStep('receive-import');
  };

  const handleImportTransaction = () => {
    if (!receivedTransaction) {
      toast.error('Please provide transaction data');
      return;
    }

    const success = parseTransactionData(receivedTransaction);
    if (!success) {
      toast.error('Invalid transaction format');
      return;
    }

    setCurrentStep('receive-review');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setReceivedTransaction(content);
      
      const success = parseTransactionData(content);
      if (success) {
        setCurrentStep('receive-review');
      } else {
        toast.error('Invalid transaction file');
      }
    };
    reader.readAsText(file);
  };

  const handleContinueFromAddress = () => {
    if (validateSolanaAddress(recipientAddress)) {
      setCurrentStep('token');
    }
  };

  const handleContinueFromToken = () => {
    setCurrentStep('amount');
  };

  const handleContinueFromAmount = () => {
    if (validateAmount(amount)) {
      setCurrentStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (!wallet.mnemonic) {
      toast.error('Wallet not unlocked');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[CosmoPay] Creating offline transaction...');

      let offlineTx: OfflineTransaction;

      // Always use nonce account
      const nonceToUse = nonceAccountAddress || undefined;

      // Create offline transaction based on token type
      if (selectedToken.mint === 'native') {
        // SOL transfer
        offlineTx = await createOfflineSolTransaction({
          mnemonic: wallet.mnemonic,
          toAddress: recipientAddress,
          amount: parseFloat(amount),
          accountIndex: 0,
          isTestnet: false,
          nonceAccount: nonceToUse || undefined,
        });
      } else {
        // SPL token transfer
        offlineTx = await createOfflineSPLTransaction({
          mnemonic: wallet.mnemonic,
          toAddress: recipientAddress,
          amount: parseFloat(amount),
          tokenMint: selectedToken.mint,
          tokenSymbol: selectedToken.symbol,
          tokenLogo: selectedToken.logo,
          decimals: selectedToken.decimals,
          accountIndex: 0,
          isTestnet: false,
          nonceAccount: nonceToUse || undefined,
        });
      }

      setOfflineTransaction(offlineTx);

      // Generate QR code
      const txJson = serializeOfflineTransaction(offlineTx);
      const qrDataUrl = await generateQRCode(txJson);
      setQrCodeDataUrl(qrDataUrl);

      toast.success('Transaction created successfully!');
      setCurrentStep('share');
    } catch (error: any) {
      console.error('[CosmoPay] Error creating transaction:', error);
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      downloadQRCode(qrCodeDataUrl, `cosmopay-qr-${Date.now()}.png`);
      toast.success('QR code downloaded');
    }
  };

  const handleDownloadFile = () => {
    if (offlineTransaction) {
      downloadOfflineTransaction(offlineTransaction);
      toast.success('Transaction file downloaded');
    }
  };

  const handleCopyJSON = async () => {
    if (offlineTransaction) {
      const json = serializeOfflineTransaction(offlineTransaction);
      const success = await copyToClipboard(json);
      if (success) {
        toast.success('Copied to clipboard');
      } else {
        toast.error('Failed to copy');
      }
    }
  };

  const handleShare = async () => {
    if (offlineTransaction) {
      const json = serializeOfflineTransaction(offlineTransaction);
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'CosmoPay Transaction',
            text: json,
          });
          toast.success('Shared successfully');
        } catch (error) {
          console.error('Share failed:', error);
        }
      } else {
        // Fallback to copy
        await handleCopyJSON();
      }
    }
  };

  const handleConfirmReceive = async () => {
    if (!parsedOfflineTx) {
      toast.error('No transaction to submit');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[CosmoPay] Submitting transaction to network...');
      
      const result = await submitOfflineTransaction(parsedOfflineTx);
      
      if (result.success) {
        toast.success(`Transaction confirmed! Signature: ${result.signature?.slice(0, 8)}...`);
        
        // Reset and go back to landing
        setReceivedTransaction('');
        setTransactionDetails(null);
        setParsedOfflineTx(null);
        setImportMethod(null);
        setTransferType(null);
        setCurrentStep('landing');
      } else {
        toast.error(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('[CosmoPay] Error submitting transaction:', error);
      toast.error(error.message || 'Failed to submit transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'landing') {
      onBack();
    } else if (currentStep === 'choice') {
      setCurrentStep('landing');
    } else if (currentStep === 'nonce-setup') {
      setCurrentStep('choice');
    } else if (currentStep === 'address') {
      setCurrentStep('choice');
    } else if (currentStep === 'token') {
      setCurrentStep('address');
    } else if (currentStep === 'amount') {
      setCurrentStep('token');
    } else if (currentStep === 'confirm') {
      setCurrentStep('amount');
    } else if (currentStep === 'share') {
      // Reset send flow
      setRecipientAddress('');
      setAmount('');
      setOfflineTransaction(null);
      setQrCodeDataUrl('');
      setTransferType(null);
      setCurrentStep('landing');
    } else if (currentStep === 'receive-method') {
      setCurrentStep('choice');
    } else if (currentStep === 'receive-import') {
      setCurrentStep('receive-method');
    } else if (currentStep === 'receive-review') {
      setCurrentStep('receive-import');
    } else if (currentStep === 'receive-confirm') {
      setCurrentStep('receive-review');
    }
  };

  const stepProgress = {
    landing: 0,
    choice: 0,
    'nonce-setup': 10,
    address: 25,
    token: 45,
    amount: 65,
    confirm: 85,
    share: 100,
    'receive-method': 25,
    'receive-import': 50,
    'receive-review': 75,
    'receive-confirm': 100,
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-slate-900/50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-400 hover:text-purple-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Orbit className="w-5 h-5 text-purple-500" />
            <h1 className="font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              CosmoPay
            </h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
        
        {/* Progress Bar */}
        {currentStep !== 'landing' && currentStep !== 'choice' && (
          <div className="h-1 bg-slate-900">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${stepProgress[currentStep]}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Landing Page */}
          {currentStep === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center min-h-[70vh] space-y-8"
            >
              {/* Animated Button */}
              <motion.div
                onClick={handleStartTransfer}
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-2xl opacity-50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Main button */}
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-2xl border-4 border-purple-500/20">
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Orbit className="w-24 h-24 text-white drop-shadow-2xl" />
                  </motion.div>
                </div>

                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-500/50"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-pink-500/50"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5
                  }}
                />
              </motion.div>

              {/* Text */}
              <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Start CosmoPay
                </h2>
                <p className="text-slate-400 max-w-sm">
                  Send and receive tokens with offline transaction capabilities
                </p>
                
                {/* Nonce Status Badge */}
                {nonceAccountInfo?.exists && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400 font-semibold">
                      Unlimited Mode Active ⚡
                    </span>
                  </div>
                )}
                
                <motion.div
                  className="flex items-center justify-center gap-2 text-sm text-purple-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span>Tap to begin</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </motion.div>

              {/* Features */}
              <motion.div
                className="grid grid-cols-3 gap-4 w-full max-w-md mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-xs text-slate-400">Secure</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <Orbit className="w-6 h-6 text-pink-500" />
                  </div>
                  <p className="text-xs text-slate-400">Fast</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-400">Easy</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Choice Page - Send or Receive */}
          {currentStep === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
                  <Orbit className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Choose Action</h2>
                <p className="text-slate-400">What would you like to do?</p>
              </div>

              {/* Send Button */}
              <motion.button
                onClick={handleChooseSend}
                className="w-full group relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-r from-purple-600/90 to-pink-600/90 group-hover:from-purple-600 group-hover:to-pink-600 rounded-2xl p-6 flex items-center justify-between transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                      <Send className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white">Send Tokens</h3>
                      <p className="text-sm text-white/70">Create and share offline transaction</p>
                    </div>
                  </div>
                  <motion.div
                    className="text-white text-2xl"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </div>
              </motion.button>

              {/* Receive Button */}
              <motion.button
                onClick={handleChooseReceive}
                className="w-full group relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-r from-blue-600/90 to-cyan-600/90 group-hover:from-blue-600 group-hover:to-cyan-600 rounded-2xl p-6 flex items-center justify-between transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                      <Download className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white">Receive Tokens</h3>
                      <p className="text-sm text-white/70">Import and submit to network</p>
                    </div>
                  </div>
                  <motion.div
                    className="text-white text-2xl"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    →
                  </motion.div>
                </div>
              </motion.button>

              {/* Info */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mt-8">
                <p className="text-sm text-slate-400 text-center">
                  Send or receive crypto offline using QR codes or file sharing
                </p>
              </div>
            </motion.div>
          )}

          {/* Nonce Setup Page (NEW) */}
          {currentStep === 'nonce-setup' && (
            <motion.div
              key="nonce-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Setup Required</h2>
                <p className="text-slate-400">Create a durable nonce account for unlimited time</p>
              </div>

              {/* Explanation */}
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-sm">ℹ</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-blue-400 font-semibold">Why is this needed?</p>
                    <p className="text-blue-400/80 text-sm">
                      CosmoPay uses Durable Nonce to enable true offline P2P transfers without time limits. 
                      Normal Solana transactions expire in 90 seconds, but with a nonce account, your transactions never expire!
                      Create it once and reuse forever. The rent (~0.0015 SOL) is fully refundable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleCreateNonceAccount}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Nonce Account...
                  </div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Create Nonce Account (~0.0015 SOL)
                  </>
                )}
              </Button>

              {/* Already have nonce? */}
              {nonceAccountAddress && !nonceAccountInfo?.exists && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm text-center">
                    ⚠️ Stored nonce account not found on-chain. Create a new one.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Share Page (NEW) */}
          {currentStep === 'share' && offlineTransaction && (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Share Transaction</h2>
                <p className="text-slate-400">Choose how to share with recipient</p>
              </div>

              {/* Transaction Summary */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{offlineTransaction.token.logo}</span>
                    <div>
                      <div className="font-bold text-xl">
                        {offlineTransaction.amount} {offlineTransaction.token.symbol}
                      </div>
                      <div className="text-sm text-slate-400">
                        To: {offlineTransaction.to.slice(0, 8)}...{offlineTransaction.to.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>

              {/* Nonce Status - Always shows since we always use nonce */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-purple-400">No Time Limit! ⚡</p>
                    <p className="text-sm text-slate-400">
                      This transaction can be submitted anytime - no expiration!
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                  <img src={qrCodeDataUrl} alt="Transaction QR Code" className="w-64 h-64" />
                </div>
              )}

              {/* Share Options */}
              <div className="space-y-3">
                <Button
                  onClick={handleDownloadQR}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-14"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Download QR Code
                </Button>

                <Button
                  onClick={handleDownloadFile}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-14"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download as File
                </Button>

                <Button
                  onClick={handleCopyJSON}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 h-14"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Transaction Data
                </Button>

                {navigator.share && (
                  <Button
                    onClick={handleShare}
                    className="w-full bg-pink-600 hover:bg-pink-700 h-14"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                <p className="text-sm text-green-400 text-center">
                  ✅ Transaction signed and ready to broadcast. Share with recipient to complete.
                </p>
              </div>
            </motion.div>
          )}

          {/* Receive Method Selection */}
          {currentStep === 'receive-method' && (
            <motion.div
              key="receive-method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                  <Download className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold">Import Method</h2>
                <p className="text-slate-400">How do you want to receive?</p>
              </div>

              {/* QR Code Scan */}
              <motion.button
                onClick={() => handleChooseImportMethod('qr')}
                className="w-full group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-slate-900/50 border-2 border-slate-800 hover:border-blue-500 rounded-xl p-5 flex items-center gap-4 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold">Scan QR Code</h3>
                    <p className="text-sm text-slate-400">Use camera to scan transaction QR</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-500 transition-colors" />
                </div>
              </motion.button>

              {/* File Upload */}
              <motion.button
                onClick={() => handleChooseImportMethod('file')}
                className="w-full group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-slate-900/50 border-2 border-slate-800 hover:border-cyan-500 rounded-xl p-5 flex items-center gap-4 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold">Upload File</h3>
                    <p className="text-sm text-slate-400">Import transaction from file</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 transition-colors" />
                </div>
              </motion.button>

              {/* Paste Text */}
              <motion.button
                onClick={() => handleChooseImportMethod('paste')}
                className="w-full group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-slate-900/50 border-2 border-slate-800 hover:border-purple-500 rounded-xl p-5 flex items-center gap-4 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold">Paste Text</h3>
                    <p className="text-sm text-slate-400">Manually paste transaction data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-500 transition-colors" />
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Receive Import */}
          {currentStep === 'receive-import' && (
            <motion.div
              key="receive-import"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                  {importMethod === 'qr' && <QrCode className="w-8 h-8 text-blue-500" />}
                  {importMethod === 'file' && <Upload className="w-8 h-8 text-cyan-500" />}
                  {importMethod === 'paste' && <FileText className="w-8 h-8 text-purple-500" />}
                </div>
                <h2 className="text-2xl font-bold">
                  {importMethod === 'qr' && 'Scan QR Code'}
                  {importMethod === 'file' && 'Upload File'}
                  {importMethod === 'paste' && 'Paste Transaction'}
                </h2>
                <p className="text-slate-400">
                  {importMethod === 'qr' && 'Point your camera at the QR code'}
                  {importMethod === 'file' && 'Select the transaction file'}
                  {importMethod === 'paste' && 'Paste the transaction data'}
                </p>
              </div>

              {/* QR Scanner Placeholder */}
              {importMethod === 'qr' && (
                <div className="space-y-4">
                  <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl aspect-square flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <QrCode className="w-16 h-16 text-slate-600 mx-auto" />
                      <p className="text-slate-500">QR Scanner</p>
                      <p className="text-xs text-slate-600">Camera access required</p>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
                    <p className="text-sm text-blue-400 text-center">
                      ℹ️ QR scanning requires camera access. For demo, use the file or paste method.
                    </p>
                  </div>
                </div>
              )}

              {/* File Upload */}
              {importMethod === 'file' && (
                <div className="space-y-4">
                  <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
                    <Upload className="w-16 h-16 text-slate-600" />
                    <div className="text-center space-y-2">
                      <p className="text-slate-400">Drag & drop or click to select</p>
                      <p className="text-xs text-slate-600">Supports .json, .txt files</p>
                    </div>
                    <input
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button
                        as="span"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 cursor-pointer"
                      >
                        Choose File
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              {/* Paste Text */}
              {importMethod === 'paste' && (
                <div className="space-y-4">
                  <Label htmlFor="transaction-data" className="text-slate-300">
                    Transaction Data
                  </Label>
                  <textarea
                    id="transaction-data"
                    placeholder='Paste transaction JSON data here...'
                    value={receivedTransaction}
                    onChange={(e) => setReceivedTransaction(e.target.value)}
                    className="w-full h-48 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button
                    onClick={handleImportTransaction}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Import Transaction
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Receive Review */}
          {currentStep === 'receive-review' && transactionDetails && (
            <motion.div
              key="receive-review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                  <Check className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold">Review Transaction</h2>
                <p className="text-slate-400">Verify the details before submitting</p>
              </div>

              {/* Transaction Details */}
              <div className="bg-slate-900/50 rounded-xl p-6 space-y-4 border border-slate-800">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">From</span>
                  <span className="text-white font-mono text-sm break-all text-right max-w-[200px]">
                    {transactionDetails.from.slice(0, 8)}...{transactionDetails.from.slice(-8)}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex justify-between items-start">
                  <span className="text-slate-400">To (You)</span>
                  <span className="text-white font-mono text-sm break-all text-right max-w-[200px]">
                    {transactionDetails.to.slice(0, 8)}...{transactionDetails.to.slice(-8)}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Token</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{transactionDetails.token.logo}</span>
                    <span className="text-white font-semibold">{transactionDetails.token.symbol}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-bold text-xl">
                    {transactionDetails.amount} {transactionDetails.token.symbol}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="text-white text-sm">
                    {new Date(transactionDetails.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Nonce Status */}
              {parsedOfflineTx?.nonceAccount && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-purple-400" />
                    <div className="flex-1">
                      <p className="font-semibold text-purple-400">Durable Transaction ⚡</p>
                      <p className="text-sm text-slate-400">
                        No time limit - can be submitted anytime!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setCurrentStep('receive-confirm')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-14"
              >
                Continue to Submit
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Receive Confirm */}
          {currentStep === 'receive-confirm' && transactionDetails && (
            <motion.div
              key="receive-confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Submit to Network</h2>
                <p className="text-slate-400">Confirm and broadcast transaction</p>
              </div>

              {/* Warning */}
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-sm">ℹ</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-blue-400 font-semibold">Ready to Submit</p>
                    <p className="text-blue-400/80 text-sm">
                      This will broadcast the transaction to the Solana network. Make sure all details are correct.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{transactionDetails.token.logo}</span>
                    <div>
                      <div className="font-bold text-xl">
                        +{transactionDetails.amount} {transactionDetails.token.symbol}
                      </div>
                      <div className="text-sm text-slate-400">Incoming</div>
                    </div>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <Button
                onClick={handleConfirmReceive}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Transaction'
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 1: Address Input (Send Flow) - REST OF THE CODE CONTINUES... */}
          {currentStep === 'address' && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                  <Orbit className="w-8 h-8 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold">Recipient Address</h2>
                <p className="text-slate-400">Enter the Solana address</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300">
                  Solana Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter Solana address..."
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    setAddressError('');
                  }}
                  className={`bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 ${
                    addressError ? 'border-red-500' : ''
                  }`}
                />
                {addressError && (
                  <p className="text-red-500 text-sm">{addressError}</p>
                )}
              </div>

              <Button
                onClick={handleContinueFromAddress}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Token, Amount, Confirm steps remain the same - continuing from previous code... */}
          {/* I'll add the remaining steps below */}
          
          {/* Step 2: Token Selection (Send Flow) */}
          {currentStep === 'token' && (
            <motion.div
              key="token"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Select Token</h2>
                <p className="text-slate-400">Choose which token to send</p>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {tokens && tokens.length > 0 ? (
                  tokens.map((token) => (
                    <motion.button
                      key={token.mint}
                      onClick={() => setSelectedToken({
                        symbol: token.symbol,
                        name: token.name,
                        mint: token.mint,
                        decimals: token.decimals || 9,
                        logo: token.logo || '🪙',
                        balance: token.balance,
                        usdValue: token.usdValue
                      })}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                        selectedToken.mint === token.mint
                          ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500'
                          : 'bg-slate-900/50 border-2 border-slate-800 hover:border-slate-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <TokenLogo
                          symbol={token.symbol}
                          logo={token.logo}
                          logoUrl={token.logoUrl}
                          size="md"
                        />
                        <div className="text-left">
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-sm text-slate-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">{token.balance || '0'}</div>
                          <div className="text-xs text-slate-400">
                            ${token.usdValue ? token.usdValue.toFixed(2) : '0.00'}
                          </div>
                        </div>
                        {selectedToken.mint === token.mint && (
                          <Check className="w-5 h-5 text-purple-500" />
                        )}
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50">
                      <Orbit className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400">No tokens found in your wallet</p>
                    <p className="text-sm text-slate-500">Add some tokens to get started</p>
                  </div>
                )}
              </div>

              {tokens && tokens.length > 0 && (
                <Button
                  onClick={handleContinueFromToken}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {/* Step 3: Amount Input (Send Flow) */}
          {currentStep === 'amount' && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                  <TokenLogo
                    symbol={selectedToken.symbol}
                    logo={selectedToken.logo}
                    logoUrl={selectedToken.logoUrl}
                    size="lg"
                  />
                </div>
                <h2 className="text-2xl font-bold">Enter Amount</h2>
                <p className="text-slate-400">How much {selectedToken.symbol} to send?</p>
                <div className="text-sm text-slate-500">
                  Balance: <span className="text-white font-semibold">{selectedToken.balance || '0'} {selectedToken.symbol}</span>
                </div>
              </div>

              {/* Zero Balance Warning */}
              {parseFloat(selectedToken.balance || '0') <= 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-500 text-sm">!</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-red-400 font-semibold">Insufficient Balance</p>
                    <p className="text-red-400/80 text-sm">
                      You don't have any {selectedToken.symbol} in your wallet. Please select a different token or add funds to continue.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">
                  Amount ({selectedToken.symbol})
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setAmountError('');
                    }}
                    disabled={parseFloat(selectedToken.balance || '0') <= 0}
                    className={`bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 text-2xl h-16 ${
                      amountError ? 'border-red-500' : ''
                    } ${parseFloat(selectedToken.balance || '0') <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {selectedToken.symbol}
                  </div>
                </div>
                {amountError && (
                  <p className="text-red-500 text-sm">{amountError}</p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const balance = parseFloat(selectedToken.balance || '0');
                    setAmount((balance * 0.25).toFixed(6));
                    setAmountError('');
                  }}
                  disabled={parseFloat(selectedToken.balance || '0') <= 0}
                  className="bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-purple-500 text-[rgb(255,255,255)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const balance = parseFloat(selectedToken.balance || '0');
                    setAmount((balance * 0.5).toFixed(6));
                    setAmountError('');
                  }}
                  disabled={parseFloat(selectedToken.balance || '0') <= 0}
                  className="bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-purple-500 text-[rgb(255,255,255)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const balance = parseFloat(selectedToken.balance || '0');
                    setAmount(balance.toFixed(6));
                    setAmountError('');
                  }}
                  disabled={parseFloat(selectedToken.balance || '0') <= 0}
                  className="bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-purple-500 text-[rgb(255,255,255)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Max
                </Button>
              </div>

              <Button
                onClick={handleContinueFromAmount}
                disabled={parseFloat(selectedToken.balance || '0') <= 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 4: Confirmation (Send Flow) */}
          {currentStep === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Confirm Transfer</h2>
                <p className="text-slate-400">Review your transaction</p>
              </div>

              {/* Transaction Summary */}
              <div className="bg-slate-900/50 rounded-xl p-6 space-y-4 border border-slate-800">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">To</span>
                  <span className="text-white font-mono text-sm break-all text-right max-w-[200px]">
                    {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-8)}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Token</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedToken.logo}</span>
                    <span className="text-white font-semibold">{selectedToken.symbol}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-bold text-xl">
                    {amount} {selectedToken.symbol}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Transaction...
                  </div>
                ) : (
                  'Create Offline Transaction'
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
