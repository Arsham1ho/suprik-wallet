import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DevModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  onTransactionAdded?: () => void;
}

const supportedTokens = [
  { symbol: 'SOL', name: 'Solana', chain: 'solana', logo: '◎', mint: 'solana' },
  { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', logo: 'Ξ', mint: 'ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', logo: '₿', mint: 'bitcoin' },
  { symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', logo: '$', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'BONK', name: 'Bonk', chain: 'solana', logo: '🐕', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { symbol: 'MATIC', name: 'Polygon', chain: 'polygon', logo: '⬢', mint: 'polygon' },
  { symbol: 'PAI', name: 'Parabolic AI', chain: 'solana', logo: '🤖', mint: 'parabolic-ai' },
];

export function DevModeDialog({ open, onOpenChange, walletId, onTransactionAdded }: DevModeDialogProps) {
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSimulateReceive = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      // Simulating receive in dev mode

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/dev-receive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            walletId,
            tokenSymbol: selectedToken,
            amount: parseFloat(amount),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Dev receive error response:', error);
        throw new Error(error.error || 'Failed to simulate transaction');
      }

      const data = await response.json();
      console.log('Simulated transaction successful:', data);

      toast.success(`✅ Dev Mode: Received ${amount} ${selectedToken}!`);
      setAmount('');
      
      // Trigger refresh in Home page
      window.dispatchEvent(new Event('walletBalanceUpdated'));
      
      onTransactionAdded?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error simulating receive:', error);
      
      // Show more helpful error message
      if (error.message.includes('not enabled')) {
        toast.error('Please enable Dev Mode in Settings first');
      } else {
        toast.error(error.message || 'Failed to simulate transaction');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Dev Mode - Simulate Transaction</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add fake tokens to your wallet for testing (no blockchain)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300">
              <strong>ℹ️ Dev Mode vs. Real Blockchain:</strong>
            </p>
            <ul className="text-xs text-blue-200 mt-2 space-y-1 ml-4 list-disc">
              <li><strong>Dev Mode (this)</strong>: Instant fake tokens, no blockchain</li>
              <li><strong>Real devnet faucet</strong>: Use the Network Selector on Home to switch to "Devnet", then get tokens from <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline">faucet.solana.com</a></li>
            </ul>
            <p className="text-xs text-yellow-300 mt-2">
              💡 Note: Dev Mode must be enabled in Settings to use this feature
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token" className="text-slate-300">Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="bg-slate-900/50 border-slate-800/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                {supportedTokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol} className="text-white">
                    <div className="flex items-center gap-2">
                      <span>{token.logo}</span>
                      <span>{token.name} ({token.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-300">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-900/50 border-slate-800/50 text-white"
            />
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-300">
              ⚠️ This is a simulation only - no real blockchain transaction will occur
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSimulateReceive}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              {loading ? 'Simulating...' : 'Simulate Receive'}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
