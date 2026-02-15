import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { GradientButton } from '../GradientButton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronLeft, Send as SendIcon, Check, AlertCircle, Loader2, Search, X, Camera, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { getUserSettings } from '../../utils/userSettings';
import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { BiometricConfirmDialog } from '../BiometricConfirmDialog';
import type { BiometricSettings } from '../../utils/biometric';
import { useWallet } from '../../utils/WalletContext';
import { useNetwork } from '../../utils/NetworkContext';
import { useTheme } from '../../utils/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import {
  sendSolanaTransaction,
  sendEthereumTransaction,
  sendSPLTokenTransaction,
  sendERC20TokenTransaction,
} from '../../utils/transactions';
import { AccountManager } from '../../utils/accountManager';
import { decryptWithPassword, decryptImportedSecret } from '../../utils/wallet';
import { TOKEN_REGISTRY, TOKEN_BY_MINT } from '../../utils/tokenRegistry';
import { playSendWhoosh } from '../../utils/sounds';
import cosmicBackground from 'figma:asset/4c2d67025139ca6ca7ae0065c97386bd40e32baa.png';

interface Token {
  id: number;
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change: number;
  logo: string;
  color: string;
  logoUrl: string;
  network: string;
}

interface SendProps {
  onNavigate: (page: 'home' | 'swap' | 'activity' | 'settings' | 'send') => void;
  tokens?: Token[];
  walletId: string;
  onSendComplete?: () => void;
}


interface SendToken {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change: number;
  logo: string;
  color: string;
  logoUrl: string;
  network: string;
  hasBalance: boolean;
}

type Step = 'select-token' | 'enter-address' | 'enter-amount' | 'review';
type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';

export function Send({ onNavigate, tokens = [], walletId, onSendComplete }: SendProps) {
  const wallet = useWallet();
  const network = useNetwork();
  const { colors, gradient } = useTheme();
  const [step, setStep] = useState<Step>('select-token');
  const [selectedToken, setSelectedToken] = useState<SendToken | null>(null);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressValid, setAddressValid] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionDetails, setTransactionDetails] = useState<{
    signature?: string;
    errorMessage?: string;
    errorDescription?: string;
  }>({});
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings | null>(null);
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);
  
  // New states for all coins
  const [allCoins, setAllCoins] = useState<SendToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>('all');
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'qr-reader';

  // Check wallet session on mount
  useEffect(() => {
    console.log('[Send] 🔐 Component mounted, checking wallet session...');
    console.log('[Send] 🔐 isUnlocked:', wallet.isUnlocked);
    console.log('[Send] 🔐 mnemonic exists:', !!wallet.mnemonic);
    console.log('[Send] 🔐 addresses:', wallet.addresses?.solana?.slice(0, 8) + '...');

    if (!wallet.isUnlocked || !wallet.mnemonic) {
      console.warn('[Send] ⚠️ Wallet session not valid on mount!');
      toast.error('Please unlock your wallet first');
      onNavigate('home');
    }
  }, [wallet.isUnlocked]);

  // Load biometric settings and all coins - run once on mount
  useEffect(() => {
    loadBiometricSettings();
    fetchAllCoins();

    // Check if a token was pre-selected from CoinDetail
    const preSelectedToken = localStorage.getItem('saturn_send_selected_token');
    if (preSelectedToken) {
      try {
        const token = JSON.parse(preSelectedToken);
        console.log('[Send] Pre-selected token from CoinDetail:', token);
        
        // Convert to SendToken format
        const sendToken: SendToken = {
          id: token.symbol.toLowerCase(),
          mint: token.mint,
          symbol: token.symbol,
          name: token.name,
          amount: token.amount,
          value: token.value,
          price: token.price,
          change: token.change,
          logo: token.logo,
          color: token.color,
          logoUrl: token.logoUrl,
          network: token.network,
          hasBalance: true,
        };
        
        setSelectedToken(sendToken);
        setStep('enter-address');
        
        // Clear the stored token
        localStorage.removeItem('saturn_send_selected_token');
      } catch (error) {
        console.error('[Send] Error parsing pre-selected token:', error);
        localStorage.removeItem('saturn_send_selected_token');
      }
    }
  }, [walletId]); // FIXED: Removed 'tokens' to prevent infinite loop

  // Scanner lifecycle - cleanup only
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScanner();
    };
  }, []);

  const loadBiometricSettings = () => {
    try {
      // Load from localStorage (instant, no server call)
      const settings = getUserSettings(walletId);

      if (settings.biometricEnabled) {
        setBiometricSettings({
          enabled: true,
          autoLockMinutes: settings.autoLockMinutes || 5,
          requireForTransactions: true,
        });
      } else {
        setBiometricSettings(null);
      }
    } catch (error) {
      console.error('[Send] Error loading biometric settings:', error);
    }
  };

  const fetchAllCoins = async () => {
    try {
      setLoading(true);
      console.log('[Send] Loading coins from TOKEN_REGISTRY (client-side)...');

      // STEP 1: Get all wallet tokens with balance
      const walletTokensWithBalance = tokens.filter(t => t.amount > 0);
      console.log('[Send] Wallet tokens with balance:', walletTokensWithBalance.map(t => ({
        symbol: t.symbol,
        name: t.name,
        amount: t.amount
      })));

      // Create maps for fast lookup
      const walletTokensBySymbol = new Map<string, typeof tokens[0]>();
      const walletTokensByName = new Map<string, typeof tokens[0]>();

      walletTokensWithBalance.forEach(t => {
        // Only add to symbol map if it looks like a real symbol (not a mint address)
        if (t.symbol && t.symbol.length < 20) {
          walletTokensBySymbol.set(t.symbol.toUpperCase(), t);
        }
        if (t.name) {
          walletTokensByName.set(t.name.toLowerCase(), t);
        }
      });

      // STEP 2: Merge TOKEN_REGISTRY with wallet tokens
      const mergedCoins: SendToken[] = [];
      const seenSymbols = new Set<string>();
      const matchedWalletMints = new Set<string>();

      TOKEN_REGISTRY.forEach(registryToken => {
        const symbolUpper = registryToken.symbol.toUpperCase();

        // Skip duplicates - only add first occurrence of each symbol
        if (seenSymbols.has(symbolUpper)) {
          return;
        }
        seenSymbols.add(symbolUpper);

        // Find matching token in wallet using multiple methods
        let walletToken = walletTokensBySymbol.get(symbolUpper);

        // Try name match
        if (!walletToken) {
          walletToken = walletTokensByName.get(registryToken.name.toLowerCase());
        }

        // Track matched wallet tokens
        if (walletToken?.mint) {
          matchedWalletMints.add(walletToken.mint);
        }

        mergedCoins.push({
          id: registryToken.id,
          mint: walletToken?.mint || registryToken.mint || '',
          symbol: symbolUpper,
          name: registryToken.name,
          amount: walletToken?.amount || 0,
          value: walletToken?.value || 0,
          price: walletToken?.price || 0,
          change: walletToken?.change || 0,
          logo: symbolUpper.charAt(0),
          color: walletToken?.color || 'from-purple-600 to-purple-400',
          logoUrl: registryToken.image,
          network: 'solana',
          hasBalance: walletToken ? walletToken.amount > 0 : false
        });
      });

      // STEP 3: Add wallet tokens that weren't matched to TOKEN_REGISTRY
      walletTokensWithBalance.forEach(walletToken => {
        const alreadyMatched = walletToken.mint && matchedWalletMints.has(walletToken.mint);

        if (!alreadyMatched) {
          console.log('[Send] Adding unmatched wallet token:', walletToken.symbol, walletToken.name);

          // Use proper symbol - if it looks like a mint address, use name instead
          let displaySymbol = walletToken.symbol.toUpperCase();
          if (displaySymbol.length > 10) {
            displaySymbol = walletToken.name?.toUpperCase().substring(0, 6) || displaySymbol.substring(0, 4);
          }

          mergedCoins.push({
            id: walletToken.mint || walletToken.symbol.toLowerCase(),
            mint: walletToken.mint,
            symbol: displaySymbol,
            name: walletToken.name || 'Unknown Token',
            amount: walletToken.amount,
            value: walletToken.value || 0,
            price: walletToken.price || 0,
            change: 0,
            logo: displaySymbol.charAt(0),
            color: walletToken.color || 'from-purple-600 to-purple-400',
            logoUrl: walletToken.logoUrl || '',
            network: walletToken.network || 'solana',
            hasBalance: true
          });

          if (walletToken.mint) matchedWalletMints.add(walletToken.mint);
        }
      });

      // Log final tokens with balance
      const tokensWithBalance = mergedCoins.filter(t => t.hasBalance);
      console.log('[Send] Final tokens with balance:', tokensWithBalance.length,
        tokensWithBalance.map(t => ({ symbol: t.symbol, name: t.name })));

      // Sort: tokens with balance first, then by network, then by price
      mergedCoins.sort((a, b) => {
        // First priority: tokens with balance
        if (a.hasBalance && !b.hasBalance) return -1;
        if (!a.hasBalance && b.hasBalance) return 1;

        // Second priority: sort by network alphabetically
        const networkCompare = a.network.localeCompare(b.network);
        if (networkCompare !== 0) return networkCompare;

        // Third priority: sort by price (highest first)
        return b.price - a.price;
      });

      setAllCoins(mergedCoins);
      console.log('[Send] Loaded coins:', mergedCoins.length);

    } catch (error) {
      console.error('[Send] Error loading coins:', error);
      // Fallback to user tokens only
      setAllCoins(tokens.map(t => ({ ...t, id: t.symbol.toLowerCase(), hasBalance: true })));
      toast.error('Failed to load coins. Showing your tokens only.');
    } finally {
      setLoading(false);
    }
  };

  // Filter tokens based on search and network - now uses allCoins instead of tokens
  const filteredTokens = allCoins.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNetwork = selectedNetworkFilter === 'all' || token.network === selectedNetworkFilter;
    return matchesSearch && matchesNetwork;
  });

  // Validate Solana address using @solana/web3.js
  const validateSolanaAddress = (addr: string): boolean => {
    try {
      const trimmedAddr = addr.trim();
      // Try to create a PublicKey - this validates the base58 encoding and length
      new PublicKey(trimmedAddr);
      return true;
    } catch (error) {
      console.log('Solana address validation error:', error);
      return false;
    }
  };

  // Validate Ethereum address using ethers.js
  const validateEthereumAddress = (addr: string): boolean => {
    try {
      const trimmedAddr = addr.trim();
      // isAddress checks format and checksum
      return ethers.isAddress(trimmedAddr);
    } catch (error) {
      console.log('Ethereum address validation error:', error);
      return false;
    }
  };

  // Validate Bitcoin address
  const validateBitcoinAddress = (addr: string): boolean => {
    try {
      const trimmedAddr = addr.trim();
      // Bitcoin addresses: Legacy (1), SegWit (3), or Bech32 (bc1)
      // Using regex since we don't have bitcoinjs-lib in browser
      const btcRegex = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
      
      if (!btcRegex.test(trimmedAddr)) {
        return false;
      }
      
      // Additional validation: check base58 characters for legacy/segwit
      if (trimmedAddr[0] === '1' || trimmedAddr[0] === '3') {
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
        return base58Regex.test(trimmedAddr);
      }
      
      return true;
    } catch (error) {
      console.log('Bitcoin address validation error:', error);
      return false;
    }
  };

  // Get network name for display
  const getNetworkName = (network: string): string => {
    const networkNames: { [key: string]: string } = {
      'solana': 'Solana',
      'ethereum': 'Ethereum',
      'bitcoin': 'Bitcoin',
    };
    return networkNames[network] || network.charAt(0).toUpperCase() + network.slice(1);
  };

  // Validate address based on selected token's network
  const validateAddress = (addr: string, network: string): { valid: boolean; error: string } => {
    if (!addr) {
      return { valid: false, error: '' };
    }

    const trimmedAddress = addr.trim();

    try {
      switch (network) {
        case 'solana':
          if (trimmedAddress.length < 32) {
            return { valid: false, error: 'Solana address is too short (min 32 chars)' };
          }
          if (trimmedAddress.length > 44) {
            return { valid: false, error: 'Solana address is too long (max 44 chars)' };
          }
          
          // Use library validation
          if (!validateSolanaAddress(trimmedAddress)) {
            return { valid: false, error: 'Invalid Solana address format or checksum' };
          }
          return { valid: true, error: '' };

        case 'ethereum':
          if (!trimmedAddress.startsWith('0x')) {
            return { valid: false, error: 'Ethereum address must start with 0x' };
          }
          if (trimmedAddress.length !== 42) {
            return { valid: false, error: `Ethereum address must be 42 characters (currently ${trimmedAddress.length})` };
          }
          
          // Use ethers.js validation (checks checksum)
          if (!validateEthereumAddress(trimmedAddress)) {
            return { valid: false, error: 'Invalid Ethereum address or checksum failed' };
          }
          return { valid: true, error: '' };

        case 'bitcoin':
          if (trimmedAddress.length < 26) {
            return { valid: false, error: 'Bitcoin address is too short' };
          }
          if (trimmedAddress.length > 62) {
            return { valid: false, error: 'Bitcoin address is too long' };
          }
          
          // Validate format
          if (!validateBitcoinAddress(trimmedAddress)) {
            return { valid: false, error: 'Invalid Bitcoin address format' };
          }
          return { valid: true, error: '' };

        default:
          // Generic validation for unknown networks
          if (trimmedAddress.length < 20) {
            return { valid: false, error: 'Address is too short' };
          }
          return { valid: true, error: '' };
      }
    } catch (error: any) {
      console.error('Address validation error:', error);
      return { valid: false, error: `Validation error: ${error.message || 'Unknown error'}` };
    }
  };

  // Validate address whenever it changes or token changes
  useEffect(() => {
    if (!address || !selectedToken) {
      setAddressError('');
      setAddressValid(false);
      return;
    }

    const validation = validateAddress(address, selectedToken.network);
    console.log(`[Address Validation] Network: ${selectedToken.network}, Address: ${address.slice(0, 10)}..., Valid: ${validation.valid}, Error: ${validation.error}`);
    setAddressError(validation.error);
    setAddressValid(validation.valid);
  }, [address, selectedToken]);

  // Calculate fee whenever amount changes
  // No app fee - removed
  useEffect(() => {
    setCalculatedFee(0);
  }, [amount, selectedToken]);

  const handleTokenSelect = (token: SendToken) => {
    // Check if user has balance
    if (!token.hasBalance) {
      toast.error(`You don't have any ${token.symbol} to send. Buy or receive ${token.symbol} first.`);
      return;
    }

    // Only Solana network tokens are supported for now - other networks are "Coming Soon"
    if (token.network !== 'solana') {
      toast.error(`Sending ${token.symbol} is coming soon! Only Solana network tokens are currently supported.`);
      return;
    }

    setSelectedToken(token);
    setStep('enter-address');
  };

  const handleAddressContinue = () => {
    if (!addressValid) {
      toast.error('Please enter a valid address');
      return;
    }
    setStep('enter-amount');
  };

  // QR Scanner handlers
  const requestCameraPermission = async () => {
    setRequestingPermission(true);
    setScannerError('');
    
    try {
      // Request camera permission via getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Permission granted! Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermissionGranted(true);
      toast.success('Camera access granted!');
      
      // Wait for React to render the scanner element before starting
      setTimeout(() => {
        startScanner();
      }, 100);
    } catch (error) {
      console.error('[QR Scanner] Permission denied:', error);
      setScannerError('Camera permission denied. Please allow camera access to scan QR codes.');
      toast.error('Camera access denied');
    } finally {
      setRequestingPermission(false);
    }
  };

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          handleQRScan(decodedText);
        },
        (errorMessage) => {
          // Error callback (not critical, happens when no QR is in view)
          // We don't need to show these errors
        }
      );
    } catch (error) {
      console.error('[QR Scanner] Error starting scanner:', error);
      setScannerError('Unable to access camera. Please check permissions.');
      setCameraPermissionGranted(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('[QR Scanner] Error stopping scanner:', error);
      }
    }
  };

  const handleQRScan = async (result: string) => {
    try {
      // Stop the scanner first
      await stopScanner();
      
      // Extract address from QR code (could be just address or a URI)
      let scannedAddress = result;
      
      // Handle Solana Pay URI format: solana:ADDRESS or solana:ADDRESS?amount=...
      if (result.toLowerCase().startsWith('solana:')) {
        const addressPart = result.substring(7).split('?')[0];
        scannedAddress = addressPart;
      }
      
      // Handle Ethereum URI format: ethereum:ADDRESS
      if (result.toLowerCase().startsWith('ethereum:')) {
        scannedAddress = result.substring(9).split('?')[0];
      }
      
      // Validate the scanned address before setting
      const validation = validateAddress(scannedAddress, network.isTestnet ? 'testnet' : 'mainnet');
      if (!validation.valid) {
        setScannerError(validation.error || 'Invalid address in QR code');
        toast.error(validation.error || 'Invalid address in QR code');
        return;
      }

      setAddress(scannedAddress);
      setShowQRScanner(false);
      setScannerError('');
      toast.success('Address scanned successfully!');
    } catch (error) {
      console.error('[QR Scanner] Error parsing QR code:', error);
      setScannerError('Invalid QR code format');
      toast.error('Invalid QR code');
    }
  };

  const handleCloseScanner = async () => {
    await stopScanner();
    setShowQRScanner(false);
    setScannerError('');
    setCameraPermissionGranted(false);
  };

  const handleAmountContinue = () => {
    // Check if wallet session is still valid before proceeding to review
    if (!wallet.mnemonic) {
      toast.error('Session expired. Please unlock your wallet to continue.');
      onNavigate('home');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const sendAmount = parseFloat(amount);
    
    // Skip balance validation in testnet mode
    if (network.isTestnet) {
      console.log('[Send] Testnet mode: Skipping balance validation');
      // Check if biometric confirmation is required
      if (biometricSettings?.enabled && biometricSettings?.requireForTransactions) {
        setShowBiometricConfirm(true);
      } else {
        setStep('review');
      }
      return;
    }
    
    // MAINNET ONLY: Validate balances
    // For SOL, calculate total including fees and rent-exempt reserve
    if (selectedToken!.symbol === 'SOL') {
      // Use consistent reserve across the app (same as Max button)
      const SOL_RESERVE = 0.001; // Covers rent-exempt + network fee + safety buffer

      const totalRequired = sendAmount;
      const maxSendable = Math.max(0, selectedToken!.amount - SOL_RESERVE);

      // Check if user has enough balance
      if (totalRequired > selectedToken!.amount) {
        toast.error(`Insufficient balance. Need ${totalRequired.toFixed(6)} SOL but have ${selectedToken!.amount.toFixed(6)} SOL`);
        return;
      }

      // Auto-fix amount if it exceeds max sendable (instead of just showing error)
      if (sendAmount > maxSendable) {
        setAmount(maxSendable.toFixed(6));
        toast.info(`Amount adjusted to ${maxSendable.toFixed(6)} SOL to keep account active`, {
          description: 'Reserved 0.001 SOL for fees and rent'
        });
        return;
      }
    } else {
      // For other tokens, simple balance check
      if (sendAmount > selectedToken!.amount) {
        toast.error('Insufficient balance');
        return;
      }
    }

    // Check if biometric confirmation is required
    if (biometricSettings?.enabled && biometricSettings?.requireForTransactions) {
      setShowBiometricConfirm(true);
    } else {
      setStep('review');
    }
  };

  const handleBiometricConfirm = () => {
    setShowBiometricConfirm(false);
    setStep('review');
  };

  const handleSend = async () => {
    console.log('[Send] 🎯 handleSend called');
    console.log('[Send] 🎯 network object:', network);
    console.log('[Send] 🎯 network.isTestnet:', network.isTestnet);
    console.log('[Send] 🎯 typeof network.isTestnet:', typeof network.isTestnet);
    console.log('[Send] 🎯 wallet.isUnlocked:', wallet.isUnlocked);
    console.log('[Send] 🎯 wallet.mnemonic exists:', !!wallet.mnemonic);

    if (!wallet.mnemonic) {
      console.error('[Send] ❌ No mnemonic found in wallet context!');
      console.error('[Send] ❌ isUnlocked:', wallet.isUnlocked);
      console.error('[Send] ❌ addresses:', wallet.addresses);
      toast.error('Wallet session not found. Please lock and unlock your wallet.');
      // Navigate back to home which will show the unlock screen
      onNavigate('home');
      return;
    }

    setSending(true);
    setTransactionStatus('processing');

    try {
      // Check if active account is an imported account with its own mnemonic
      const activeAccount = AccountManager.getActiveAccount();
      // Security: Only log non-sensitive account info
      console.log('[Send] 📋 Active account:', activeAccount?.name, 'isImported:', activeAccount?.isImportedSeedPhrase, 'accountIndex:', activeAccount?.accountIndex);
      let mnemonicToUse = wallet.mnemonic;

      // Check if this is a private key import - those don't have mnemonics!
      // Private keys are stored as "PRIVKEY:xxxx..." in the wallet
      const isPrivateKeyWallet = wallet.mnemonic?.startsWith('PRIVKEY:');

      // Check if active account is a secondary private key import (different from main wallet)
      const isSecondaryPrivateKeyAccount = activeAccount?.isPrivateKeyImport ||
        (activeAccount?.id?.startsWith('pk_') && !isPrivateKeyWallet);

      // Also check if the account's address is in the imported private keys storage
      const storedPrivateKeys = JSON.parse(localStorage.getItem('saturn_imported_private_keys') || '{}');
      const accountAddress = activeAccount?.addresses?.solana;
      const hasStoredPrivateKey = accountAddress && storedPrivateKeys[accountAddress];

      console.log('[Send] 🔑 Private key check - isPrivateKeyWallet:', isPrivateKeyWallet,
        'isSecondaryPrivateKeyAccount:', isSecondaryPrivateKeyAccount,
        'hasStoredPrivateKey:', !!hasStoredPrivateKey,
        'accountAddress:', accountAddress);

      if (hasStoredPrivateKey || isSecondaryPrivateKeyAccount) {
        // This account has its own private key in storage - use it
        console.log('[Send] ⚠️ Using stored private key for secondary account');

        let privateKeyBase58: string | undefined;
        const storedKey = storedPrivateKeys[accountAddress!];

        if (storedKey) {
          const decrypted = await decryptImportedSecret(storedKey, wallet.password);
          if (decrypted) {
            privateKeyBase58 = decrypted;
          } else {
            toast.error('Failed to decrypt private key. Please delete and re-import this account.');
            setSending(false);
            setTransactionStatus('idle');
            return;
          }
        }

        if (!privateKeyBase58) {
          toast.error('Private key not found for this account. Please delete and re-import it.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }

        // For private key imports, we can only send SOL/SPL tokens on Solana
        if (selectedToken!.symbol === 'ETH' || selectedToken!.network === 'ethereum') {
          toast.error('Private key imports only support Solana transactions.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }

        // Handle private key transaction
        const { sendSolanaTransactionWithPrivateKey, sendSPLTokenTransactionWithPrivateKey } = await import('../../utils/transactions');

        let result;
        if (selectedToken!.symbol === 'SOL') {
          result = await sendSolanaTransactionWithPrivateKey({
            privateKeyBase58,
            toAddress: address,
            amount: parseFloat(amount),
            isTestnet: network.isTestnet,
          });
        } else if (selectedToken!.network === 'solana') {
          // SPL token
          let decimals = 9;
          const registryToken = selectedToken!.mint ? TOKEN_BY_MINT.get(selectedToken!.mint) : null;
          if (registryToken?.decimals !== undefined) {
            decimals = registryToken.decimals;
          } else if (selectedToken!.symbol === 'USDC' || selectedToken!.symbol === 'USDT') {
            decimals = 6;
          }

          result = await sendSPLTokenTransactionWithPrivateKey({
            privateKeyBase58,
            toAddress: address,
            amount: parseFloat(amount),
            tokenMint: selectedToken!.mint || '',
            decimals,
            isTestnet: network.isTestnet,
          });
        } else {
          toast.error('Unsupported token for private key wallet.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }

        if (!result || !result.success) {
          throw new Error(result?.error || 'Transaction failed');
        }

        console.log('[Send] ✅ Private key transaction successful!');
        playSendWhoosh();
        setTransactionStatus('success');
        setTransactionDetails({ signature: result.signature });
        window.dispatchEvent(new Event('walletBalanceUpdated'));
        onSendComplete?.();
        setSending(false);
        return;
      } else if (isPrivateKeyWallet) {
        console.log('[Send] ⚠️ Detected main private key wallet, using direct private key for transaction');

        let privateKeyBase58: string | undefined;
        // Main wallet is a private key import - extract from wallet.mnemonic
        privateKeyBase58 = wallet.mnemonic?.replace('PRIVKEY:', '');

        if (!privateKeyBase58) {
          toast.error('Private key not found. Please delete and re-import this account.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }

        // For private key imports, we can only send SOL/SPL tokens on Solana
        if (selectedToken!.symbol === 'ETH' || selectedToken!.network === 'ethereum') {
          toast.error('Private key imports only support Solana transactions.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }

        // Handle private key transaction
        const { sendSolanaTransactionWithPrivateKey, sendSPLTokenTransactionWithPrivateKey } = await import('../../utils/transactions');

        let result;
        if (selectedToken!.symbol === 'SOL') {
          result = await sendSolanaTransactionWithPrivateKey({
            privateKeyBase58,
            toAddress: address,
            amount: parseFloat(amount),
            isTestnet: network.isTestnet,
          });
        } else if (selectedToken!.network === 'solana') {
          // SPL token
          let decimals = 9;
          const registryToken = selectedToken!.mint ? TOKEN_BY_MINT.get(selectedToken!.mint) : null;
          if (registryToken?.decimals !== undefined) {
            decimals = registryToken.decimals;
          } else if (selectedToken!.symbol === 'USDC' || selectedToken!.symbol === 'USDT') {
            decimals = 6;
          }

          result = await sendSPLTokenTransactionWithPrivateKey({
            privateKeyBase58,
            toAddress: address,
            amount: parseFloat(amount),
            tokenMint: selectedToken!.mint || '',
            decimals,
            isTestnet: network.isTestnet,
          });
        } else {
          toast.error('Unsupported token for private key wallet.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }

        if (!result || !result.success) {
          throw new Error(result?.error || 'Transaction failed');
        }

        console.log('[Send] ✅ Private key transaction successful!');
        playSendWhoosh();
        setTransactionStatus('success');
        setTransactionDetails({ signature: result.signature });
        window.dispatchEvent(new Event('walletBalanceUpdated'));
        onSendComplete?.();
        setSending(false);
        return;
      }

      if (activeAccount?.isImportedSeedPhrase) {
        // Check if this imported account has an encrypted mnemonic stored
        if (activeAccount?.encryptedMnemonic) {
          // We need the password to decrypt - get it from wallet context
          if (!wallet.password) {
            toast.error('Wallet password not available. Please unlock the wallet again.');
            setSending(false);
            setTransactionStatus('idle');
            return;
          }

          const decryptedMnemonic = await decryptWithPassword(activeAccount.encryptedMnemonic, wallet.password);
          if (!decryptedMnemonic) {
            toast.error('Failed to decrypt imported account mnemonic. Please delete and re-import this account.');
            setSending(false);
            setTransactionStatus('idle');
            return;
          }

          mnemonicToUse = decryptedMnemonic;
        } else if (activeAccount?.importedWalletId) {
          // Check for mnemonic stored in saturn_imported_mnemonics (encrypted or legacy base64)
          const storedMnemonics = JSON.parse(localStorage.getItem('saturn_imported_mnemonics') || '{}');
          const storedMnemonic = storedMnemonics[activeAccount.importedWalletId];
          if (storedMnemonic) {
            const decrypted = await decryptImportedSecret(storedMnemonic, wallet.password);
            if (decrypted) {
              mnemonicToUse = decrypted;
            } else {
              toast.error('Failed to decrypt imported account mnemonic. Please delete and re-import this account.');
              setSending(false);
              setTransactionStatus('idle');
              return;
            }
          } else {
            toast.error('Imported account mnemonic not found. Please delete and re-import this account.');
            setSending(false);
            setTransactionStatus('idle');
            return;
          }
        } else {
          // This is an old imported account without encrypted mnemonic
          // User needs to re-import it with the new system
          toast.error('This imported account needs to be re-imported. Please delete it and import again using Settings > Add Account.');
          setSending(false);
          setTransactionStatus('idle');
          return;
        }
      }

      // Get the account index for derivation
      // For imported accounts, use their stored accountIndex
      const accountIndexToUse = activeAccount?.accountIndex ?? 0;

      let result;

      // Native token transfers
      if (selectedToken!.symbol === 'SOL') {
        // Send SOL
        result = await sendSolanaTransaction({
          mnemonic: mnemonicToUse,
          toAddress: address,
          amount: parseFloat(amount),
          accountIndex: accountIndexToUse,
          isTestnet: network.isTestnet, // Pass testnet mode
        });
      } else if (selectedToken!.symbol === 'ETH') {
        // Send ETH
        result = await sendEthereumTransaction({
          mnemonic: mnemonicToUse,
          toAddress: address,
          amount: parseFloat(amount),
          accountIndex: accountIndexToUse,
          isTestnet: network.isTestnet, // Pass testnet mode
        });
      }
      // SPL tokens
      else if (selectedToken!.network === 'solana') {

        // Check if we have a valid mint address (needed for mainnet)
        if (!network.isTestnet && !selectedToken!.mint) {
          throw new Error(`No mint address found for ${selectedToken!.symbol}. This token may not be in your wallet.`);
        }

        // Get correct decimals from token registry or use known defaults
        // This is CRITICAL - wrong decimals will cause "insufficient funds" errors
        let decimals = 9; // Default for most SPL tokens

        // First try to get decimals from TOKEN_BY_MINT registry
        const registryToken = selectedToken!.mint ? TOKEN_BY_MINT.get(selectedToken!.mint) : null;
        if (registryToken?.decimals !== undefined) {
          decimals = registryToken.decimals;
          console.log(`[Send] Using registry decimals for ${selectedToken!.symbol}: ${decimals}`);
        } else if (selectedToken!.symbol === 'USDC' || selectedToken!.symbol === 'USDT') {
          decimals = 6;
        } else if (selectedToken!.symbol === 'BONK' || selectedToken!.symbol === 'MEW' || selectedToken!.symbol === 'GIGA') {
          decimals = 5;
        } else if (['JUP', 'RAY', 'WIF', 'PYTH', 'ORCA', 'W', 'BOME', 'TRUMP', 'PENGU', 'PNUT', 'GOAT', 'MOODENG', 'CHILLGUY', 'SEI', 'TIA', 'AKT', 'ALGO'].includes(selectedToken!.symbol)) {
          decimals = 6;
        }

        console.log(`[Send] Sending ${selectedToken!.symbol} with ${decimals} decimals (mint: ${selectedToken!.mint})`);

        // Validate balance before sending
        const sendAmount = parseFloat(amount);
        if (sendAmount > selectedToken!.amount) {
          throw new Error(`Insufficient balance. You have ${selectedToken!.amount.toFixed(6)} ${selectedToken!.symbol} but tried to send ${sendAmount.toFixed(6)}`);
        }

        result = await sendSPLTokenTransaction({
          mnemonic: mnemonicToUse,
          toAddress: address,
          amount: sendAmount,
          tokenMint: selectedToken!.mint || 'mock-mint-testnet', // Use mock mint for testnet
          decimals,
          accountIndex: accountIndexToUse,
          isTestnet: network.isTestnet, // Pass testnet mode
        });
      }
      // ERC20 tokens
      else if (selectedToken!.network === 'ethereum') {
        console.log('[Send] 🪙 Sending ERC20 token');
        console.log('[Send] Token address:', selectedToken!.mint);

        // Check if we have a valid token address (needed for mainnet)
        if (!network.isTestnet && !selectedToken!.mint) {
          throw new Error(`No contract address found for ${selectedToken!.symbol}. This token may not be in your wallet.`);
        }

        // Send ERC20 token
        const decimals = selectedToken!.symbol === 'USDC' ? 6 : 18;
        result = await sendERC20TokenTransaction({
          mnemonic: mnemonicToUse,
          toAddress: address,
          amount: parseFloat(amount),
          tokenAddress: selectedToken!.mint || '0xmocktestnet', // Use mock address for testnet
          decimals,
          accountIndex: accountIndexToUse,
          isTestnet: network.isTestnet, // Pass testnet mode
        });
      } else {
        throw new Error(`Unsupported network: ${selectedToken!.network}`);
      }

      if (!result || !result.success) {
        throw new Error(result?.error || 'Transaction failed');
      }

      console.log('[Send] ✅ Transaction successful!');
      console.log('[Send] Signature/Hash:', result.signature || result.hash);

      // Play success sound
      playSendWhoosh();

      // REMOVED TESTNET BACKEND UPDATE - Now using real blockchain!
      // Testnet mode now works exactly like mainnet:
      // - Real transactions to Devnet/Sepolia
      // - Balances fetched from blockchain (not backend)
      // - No need for manual balance updates

      // Set success state
      setTransactionStatus('success');
      setTransactionDetails({
        signature: result.signature || (result as any).hash,
      });

      // 🚀 OPTIMISTIC UPDATE: Immediately dispatch event for fast UI update
      console.log('[Send] ⚡ Dispatching immediate balance update (optimistic)...');
      window.dispatchEvent(new Event('walletBalanceUpdated'));
      onSendComplete?.();
      
      // 🚀 FAST POLLING: Poll blockchain every 2 seconds for 30 seconds (like Phantom)
      let pollCount = 0;
      const maxPolls = 15; // 15 polls × 2 seconds = 30 seconds
      const pollInterval = setInterval(() => {
        pollCount++;
        console.log(`[Send] 🔄 Fast poll ${pollCount}/${maxPolls} - Checking blockchain...`);
        window.dispatchEvent(new Event('walletBalanceUpdated'));
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.log('[Send] ✅ Fast polling completed');
        }
      }, 2000); // Poll every 2 seconds (like Phantom)
      
      // Clean up polling after 30 seconds (user will click Done to navigate)
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 30000);
      
    } catch (error: any) {
      console.error('[Send] ❌ Transaction error:', error);
      
      // Parse error message
      let errorMessage = error.message || 'Failed to send transaction';
      let errorDescription = 'Please try again or contact support if the issue persists.';
      
      if (errorMessage.includes('Insufficient balance')) {
        errorDescription = 'You don\'t have enough balance to complete this transaction.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds';
        errorDescription = 'Make sure you have enough balance for the amount + network fees.';
      }
      
      // Set error state
      setTransactionStatus('error');
      setTransactionDetails({
        errorMessage,
        errorDescription,
      });
    } finally {
      setSending(false);
    }
  };

  const handleMaxAmount = () => {
    if (selectedToken) {
      // For SOL, subtract network cost and rent-exempt reserve
      if (selectedToken.symbol === 'SOL') {
        // Reserve calculation:
        // - 0.000005 SOL network fee
        // - 0.00089088 SOL rent-exempt minimum (keep account active)
        // - 0.0002 SOL safety buffer
        // Total reserve: ~0.001 SOL
        const rentExemptReserve = 0.001; // Keep account rent-exempt + fees (no app fee)
        const maxSendable = Math.max(0, selectedToken.amount - rentExemptReserve);
        setAmount(maxSendable.toFixed(6));
      } else {
        setAmount(selectedToken.amount.toString());
      }
    }
  };

  const handleBack = () => {
    if (step === 'enter-address') {
      setStep('select-token');
      setSelectedToken(null);
      setAddress('');
      setAddressError('');
      setAddressValid(false);
    } else if (step === 'enter-amount') {
      setStep('enter-address');
      setAmount('');
    } else if (step === 'review') {
      setStep('enter-amount');
    } else {
      onNavigate('home');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'select-token': return 'Select Token';
      case 'enter-address': return 'Enter Address';
      case 'enter-amount': return 'Enter Amount';
      case 'review': return 'Review & Send';
      default: return 'Send';
    }
  };

  return (
    <>
      {/* Biometric Confirmation Dialog */}
      <BiometricConfirmDialog
        open={showBiometricConfirm}
        onOpenChange={setShowBiometricConfirm}
        onConfirm={handleBiometricConfirm}
        walletId={walletId}
        title="Confirm Send"
        amount={amount}
        token={selectedToken?.symbol}
        recipient={address}
      />

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={handleCloseScanner}>
        <DialogContent className="max-w-md bg-slate-950/95 border-slate-800/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: colors.primary }} />
              Scan QR Code
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {!cameraPermissionGranted 
                ? "Grant camera access to scan wallet address QR codes" 
                : "Point your camera at a QR code to scan the wallet address"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!cameraPermissionGranted ? (
              // Permission Request Screen
              <>
                <div className="py-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}
                  >
                    <Camera className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg text-white">Camera Access Required</h3>
                    <p className="text-sm text-slate-400">
                      We need access to your camera to scan QR codes
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: `${colors.primary}1A`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}33`,
                  }}
                >
                  <div style={{ color: colors.primary }} className="text-xl">🔒</div>
                  <div className="flex-1 text-sm" style={{ color: `${colors.accent}CC` }}>
                    Your camera will only be used for scanning QR codes. We don't store or transmit any images.
                  </div>
                </div>

                {scannerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-300">{scannerError}</p>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <GradientButton
                    onClick={requestCameraPermission}
                    disabled={requestingPermission}
                    className="w-full h-12"
                  >
                    {requestingPermission ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Requesting Permission...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Allow Camera Access
                      </>
                    )}
                  </GradientButton>

                  <Button
                    onClick={handleCloseScanner}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              // Scanner Active Screen
              <>
                {/* QR Scanner Container */}
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <div 
                    id={scannerElementId}
                    className="w-full"
                    style={{ minHeight: '300px' }}
                  />
                </div>
                
                {scannerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-300">{scannerError}</p>
                  </motion.div>
                )}

                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: `${colors.primary}1A`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}33`,
                  }}
                >
                  <div style={{ color: colors.primary }} className="text-xl">📷</div>
                  <div className="flex-1 text-sm" style={{ color: `${colors.accent}CC` }}>
                    Point your camera at a wallet address QR code. The address will be automatically detected and filled in.
                  </div>
                </div>

                <Button
                  onClick={handleCloseScanner}
                  variant="outline"
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Status Overlay */}
      <AnimatePresence>
        {transactionStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/50 shadow-2xl"
            >
              {transactionStatus === 'processing' && (
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 mx-auto relative"
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-20 blur-xl"
                      style={{ background: `linear-gradient(to top right, ${colors.primary}, ${colors.accent})` }}
                    />
                    <div
                      className="absolute inset-0 rounded-full border-4"
                      style={{ borderColor: `${colors.primary}4D`, borderTopColor: colors.primary }}
                    />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl text-white mb-2">Processing Transaction</h3>
                    <p className="text-slate-400">Please wait while we process your transaction...</p>
                  </div>
                </div>
              )}

              {transactionStatus === 'success' && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="w-28 h-28 mx-auto rounded-full overflow-hidden flex items-center justify-center">
                      <video
                        src="/send.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-2xl text-white mb-2">
                      {network.isTestnet ? 'Transaction Simulated!' : 'Transaction Successful!'}
                    </h3>
                    <p className="text-slate-400 mb-4">
                      {network.isTestnet ? 'Simulated sending' : 'Successfully sent'} {amount} {selectedToken?.symbol}
                    </p>
                    {network.isTestnet && (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-4">
                        <p className="text-sm text-blue-200/90">
                          <strong>Testnet Mode:</strong> Your balance has been updated locally. No real funds were transferred.
                        </p>
                      </div>
                    )}
                    {transactionDetails.signature && (
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-4">
                        <p className="text-xs text-slate-400 mb-1">
                          {network.isTestnet ? 'Mock Signature' : 'Transaction Signature'}
                        </p>
                        <p className="text-sm break-all" style={{ color: colors.accent }}>
                          {transactionDetails.signature.slice(0, 12)}...{transactionDetails.signature.slice(-12)}
                        </p>
                      </div>
                    )}
                    {/* View on Solscan button */}
                    {transactionDetails.signature && !network.isTestnet && selectedToken?.network === 'solana' && (
                      <a
                        href={`https://solscan.io/tx/${transactionDetails.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm transition-all rounded-lg py-2.5 border group mb-4"
                        style={{
                          color: colors.accent,
                          background: `linear-gradient(to right, ${colors.primary}1A, ${colors.secondary}1A)`,
                          borderColor: `${colors.primary}33`
                        }}
                      >
                        <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        View on Solscan
                      </a>
                    )}
                  </motion.div>

                  {/* Done button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <GradientButton
                      onClick={() => {
                        onNavigate('home');
                        setTransactionStatus('idle');
                        setTransactionDetails({});
                        setStep('select-token');
                        setSelectedToken(null);
                        setAddress('');
                        setAmount('');
                      }}
                      className="w-full py-3.5"
                    >
                      Done
                    </GradientButton>
                  </motion.div>
                </div>
              )}

              {transactionStatus === 'error' && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="w-28 h-28 mx-auto rounded-full overflow-hidden flex items-center justify-center">
                      <video
                        src="/failed_send.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-2xl text-white mb-2">Transaction Failed</h3>
                    <p className="text-red-400 mb-2">{transactionDetails.errorMessage}</p>
                    {transactionDetails.errorDescription && (
                      <p className="text-slate-400 text-sm">{transactionDetails.errorDescription}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <GradientButton
                      onClick={() => {
                        setTransactionStatus('idle');
                        setTransactionDetails({});
                      }}
                      className="w-full"
                    >
                      Try Again
                    </GradientButton>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-24 relative overflow-hidden" style={{ backgroundColor: '#000' }}>
        {/* Cosmic Background Image */}
        <div 
          className="fixed inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${cosmicBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(1px)'
          }}
        />
        
        {/* Dark overlay for readability */}
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
        
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-20">
        <div className="w-full md:max-w-[430px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">{getStepTitle()}</h1>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full md:max-w-[430px] mx-auto px-4 sm:px-6 py-4 relative z-10">
        <div className="flex items-center gap-2">
          {['select-token', 'enter-address', 'enter-amount', 'review'].map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  ['select-token', 'enter-address', 'enter-amount', 'review'].indexOf(step) >= idx
                    ? `bg-gradient-to-r ${gradient}`
                    : 'bg-slate-800'
                }`}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:max-w-[430px] mx-auto px-4 sm:px-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Token */}
          {step === 'select-token' && (
            <motion.div
              key="select-token"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Search */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens..."
                    className="bg-transparent border-0 text-white h-12 pl-12 pr-12 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Network Filter Buttons */}
              <motion.div 
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.button
                  onClick={() => setSelectedNetworkFilter('all')}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedNetworkFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  All Networks
                </motion.button>
                <motion.button
                  onClick={() => setSelectedNetworkFilter('solana')}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedNetworkFilter === 'solana'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🟣 Solana
                </motion.button>
                <motion.button
                  onClick={() => setSelectedNetworkFilter('ethereum')}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedNetworkFilter === 'ethereum'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚪ Ethereum
                </motion.button>
                <motion.button
                  onClick={() => setSelectedNetworkFilter('bitcoin')}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedNetworkFilter === 'bitcoin'
                      ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🟡 Bitcoin
                </motion.button>
              </motion.div>

              {/* Loading State */}
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                  <div className="text-slate-400 text-sm">Loading tokens...</div>
                </div>
              ) : (
                <>
                  {/* Token List */}
                  <div className="space-y-2">
                    {filteredTokens.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-slate-400 text-sm">No tokens found</div>
                      </div>
                    ) : (
                      filteredTokens.map((token) => (
                        <motion.button
                          key={token.id}
                          onClick={() => handleTokenSelect(token)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 group ${
                            token.hasBalance
                              ? 'bg-slate-900/80 border-slate-700/50 hover:bg-slate-800/80 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10'
                              : 'bg-slate-900/30 border-slate-800/30 opacity-60 hover:opacity-80'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative bg-slate-800/50">
                            {token.logoUrl ? (
                              <img 
                                src={token.logoUrl}
                                alt={token.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  // On error, show gradient with emoji
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) {
                                    (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-white text-xl shadow-inner absolute inset-0`}
                              style={{ display: token.logoUrl ? 'none' : 'flex' }}
                            >
                              {token.logo}
                            </div>
                          </div>
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-white font-semibold">{token.name}</div>
                              {!token.hasBalance && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">
                                  No Balance
                                </span>
                              )}
                              {token.network !== 'solana' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {token.hasBalance 
                                ? `${token.amount.toFixed(token.symbol === 'SOL' ? 4 : 2)} ${token.symbol}`
                                : `0.00 ${token.symbol}`
                              }
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">
                              ${token.hasBalance ? token.value.toFixed(2) : '0.00'}
                            </div>
                            <div className={`text-sm ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Enter Address */}
          {step === 'enter-address' && selectedToken && (
            <motion.div
              key="enter-address"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {/* Selected Token Display */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/30">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative bg-slate-800/50">
                  {selectedToken.logoUrl ? (
                    <img 
                      src={selectedToken.logoUrl}
                      alt={selectedToken.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        // On error, show gradient with emoji
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full rounded-full bg-gradient-to-br ${selectedToken.color} flex items-center justify-center text-white text-xl shadow-inner absolute inset-0`}
                    style={{ display: selectedToken.logoUrl ? 'none' : 'flex' }}
                  >
                    {selectedToken.logo}
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold">{selectedToken.name}</div>
                  <div className="text-slate-400 text-sm">
                    {selectedToken.amount.toFixed(selectedToken.symbol === 'SOL' ? 4 : 2)} {selectedToken.symbol} available
                  </div>
                </div>
              </div>

              {/* Address Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Recipient Address ({getNetworkName(selectedToken.network)})</Label>
                  <Button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="h-8 px-3 text-sm"
                    style={{
                      backgroundColor: `${colors.primary}33`,
                      borderColor: `${colors.primary}4D`,
                      color: colors.accent,
                    }}
                  >
                    <Camera className="w-4 h-4 mr-1.5" />
                    Scan QR
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={`Enter ${getNetworkName(selectedToken.network)} wallet address`}
                    className={`bg-slate-900/50 border-slate-800/30 text-white h-14 pr-12 placeholder:text-slate-500 ${
                      addressError ? 'border-red-500/50' : addressValid ? 'border-green-500/50' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {address && (
                      addressValid ? (
                        <div className="p-1.5 bg-green-500/20 rounded-full">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-red-500/20 rounded-full">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                      )
                    )}
                  </div>
                </div>
                {addressError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {addressError}
                  </motion.p>
                )}
                {addressValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Valid {getNetworkName(selectedToken.network)} address
                  </motion.p>
                )}
              </div>

              {/* Continue Button */}
              <GradientButton
                onClick={handleAddressContinue}
                disabled={!addressValid}
                className="w-full h-14"
              >
                Continue
              </GradientButton>

              {/* Info */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: `${colors.primary}1A`,
                  borderWidth: 1,
                  borderColor: `${colors.primary}33`,
                }}
              >
                <div style={{ color: colors.primary }} className="text-xl">💡</div>
                <div className="flex-1 text-sm" style={{ color: `${colors.accent}CC` }}>
                  Address validation uses cryptographic verification to ensure the {getNetworkName(selectedToken.network)} address is properly formatted and checksummed. Double-check before proceeding.
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Enter Amount */}
          {step === 'enter-amount' && selectedToken && (
            <motion.div
              key="enter-amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {/* Selected Token Display */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/30">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative bg-slate-800/50">
                  {selectedToken.logoUrl ? (
                    <img 
                      src={selectedToken.logoUrl}
                      alt={selectedToken.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        // On error, show gradient with emoji
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full rounded-full bg-gradient-to-br ${selectedToken.color} flex items-center justify-center text-white text-xl shadow-inner absolute inset-0`}
                    style={{ display: selectedToken.logoUrl ? 'none' : 'flex' }}
                  >
                    {selectedToken.logo}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold">{selectedToken.name}</div>
                  <div className="text-slate-400 text-sm">
                    To: {address.slice(0, 4)}...{address.slice(-4)}
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Amount</Label>
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-sm px-2 py-1 rounded-lg transition-all font-medium active:scale-95"
                    style={{ color: colors.primary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.accent;
                      e.currentTarget.style.backgroundColor = `${colors.primary}1A`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.primary;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Max: {selectedToken.symbol === 'SOL'
                      ? Math.max(0, selectedToken.amount - 0.001).toFixed(6)
                      : selectedToken.amount.toFixed(2)} {selectedToken.symbol}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-900/50 border-slate-800/30 text-white h-16 text-2xl placeholder:text-slate-500 text-center"
                    step="any"
                  />
                </div>
                {selectedToken && amount && !isNaN(parseFloat(amount)) && (
                  <div className="text-center text-slate-400">
                    ≈ ${(parseFloat(amount) * selectedToken.price).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Fee Breakdown */}
              {amount && parseFloat(amount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Amount to send</span>
                    <span className="text-white">{parseFloat(amount).toFixed(6)} {selectedToken.symbol}</span>
                  </div>
                  
                  {selectedToken.symbol === 'SOL' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Network Fee</span>
                        <span className="text-slate-400">~0.000005 SOL</span>
                      </div>
                      <div className="h-px bg-slate-800"></div>
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total Cost</span>
                        <span className="text-white font-semibold">
                          {(parseFloat(amount) + 0.000005).toFixed(6)} SOL
                        </span>
                      </div>
                    </>
                  )}
                  
                  {selectedToken.symbol !== 'SOL' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Network Fee (in SOL)</span>
                      <span className="text-white">~0.000005 SOL</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleAmountContinue}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full h-14 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                  boxShadow: `0 10px 15px -3px ${colors.primary}33`,
                }}
              >
                Review Transaction
              </Button>
            </motion.div>
          )}

          {/* Step 4: Review & Send */}
          {step === 'review' && selectedToken && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {/* Transaction Summary */}
              <div className="relative py-6">
                {/* Decorative background glow */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl"
                  style={{ backgroundColor: `${colors.primary}33` }}
                />

                {/* Content */}
                <div className="relative z-10 space-y-3">
                  {/* Token Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center mb-2"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative bg-slate-800/50"
                      style={{
                        boxShadow: `0 10px 25px -5px ${colors.primary}80`,
                      }}
                    >
                      {selectedToken.logoUrl ? (
                        <img
                          src={selectedToken.logoUrl}
                          alt={selectedToken.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full rounded-full bg-gradient-to-br ${selectedToken.color} flex items-center justify-center text-white text-2xl shadow-inner absolute inset-0`}
                        style={{ display: selectedToken.logoUrl ? 'none' : 'flex' }}
                      >
                        {selectedToken.logo}
                      </div>
                    </div>
                  </motion.div>

                  {/* Label */}
                  <div className="text-center">
                    <p className="text-slate-400 text-sm tracking-wide uppercase text-[12px]">You're sending</p>
                  </div>

                  {/* Amount with Token Symbol */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-center space-y-1"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-slate-100 to-white bg-clip-text text-transparent leading-tight">
                        {parseFloat(amount).toFixed(selectedToken.symbol === 'SOL' ? 6 : 2)}
                      </div>
                    </div>
                    <div
                      className="text-xl font-semibold"
                      style={{ color: colors.accent }}
                    >
                      {selectedToken.symbol}
                    </div>
                  </motion.div>

                  {/* USD Value */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-center pt-1"
                  >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                      <p className="text-slate-300 font-medium text-sm">
                        ≈ ${(parseFloat(amount) * selectedToken.price).toFixed(2)} <span className="text-slate-500">USD</span>
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
                <div className="flex justify-between">
                  <span className="text-slate-400">From</span>
                  <span className="text-white">Your Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">To</span>
                  <span className="text-white font-mono text-sm">
                    {address.slice(0, 6)}...{address.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network</span>
                  <span className="text-white">
                    {getNetworkName(selectedToken.network)} {network.isTestnet ? 'Testnet' : 'Mainnet'}
                  </span>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white">{parseFloat(amount).toFixed(selectedToken.symbol === 'SOL' ? 4 : 2)} {selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network Fee</span>
                  <span className="text-slate-400">~0.000005 SOL</span>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total Cost</span>
                  <span className="text-white font-semibold">
                    {selectedToken.symbol === 'SOL'
                      ? `${(parseFloat(amount) + 0.000005).toFixed(4)} SOL`
                      : `${parseFloat(amount).toFixed(2)} ${selectedToken.symbol} + ~0.000005 SOL`
                    }
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-amber-400 text-lg">⚠️</div>
                <div className="flex-1 text-xs text-amber-200/80">
                  <strong>This action cannot be undone.</strong> Please verify all details before confirming.
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full h-14 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                  boxShadow: `0 10px 15px -3px ${colors.primary}33`,
                }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending Transaction...
                  </>
                ) : (
                  <>
                    <SendIcon className="w-5 h-5 mr-2" />
                    Confirm & Send
                  </>
                )}
              </Button>

              {/* Testnet Mode Banner */}
              {network.isTestnet && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-5 rounded-xl bg-gradient-to-r from-blue-500/20 via-blue-400/20 to-cyan-500/20 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20"
                >
                  <div className="text-4xl">🧪</div>
                  <div className="flex-1">
                    <div className="text-blue-300 font-bold text-base mb-1">Testnet Mode - Simulation Only</div>
                    <div className="text-sm text-blue-200/80">
                      Your balance will be updated locally. No real blockchain transaction will occur.
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </>
  );
}