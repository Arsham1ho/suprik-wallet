import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface SendReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'send';
}

export function SendReceiveDialog({ open, onOpenChange }: SendReceiveDialogProps) {
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    toast.success(`Sending ${amount} ${selectedToken}`);
    onOpenChange(false);
    setAmount('');
    setAddress('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Send</DialogTitle>
          <DialogDescription className="text-slate-400">
            Transfer tokens to another wallet
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          className="space-y-4 pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <Label className="text-slate-300 font-semibold">Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="bg-black/50 border-slate-800/50 text-white h-12 font-medium backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 backdrop-blur-xl">
                <SelectItem value="SOL" className="text-white font-medium">Solana (SOL)</SelectItem>
                <SelectItem value="USDC" className="text-white font-medium">USD Coin (USDC)</SelectItem>
                <SelectItem value="ETH" className="text-white font-medium">Ethereum (ETH)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 font-semibold">Send to</Label>
            <Input
              placeholder="Enter wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-black/50 border-slate-800/50 text-white placeholder:text-slate-500 h-12 font-medium backdrop-blur-sm focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 font-semibold">Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-black/50 border-slate-800/50 text-white placeholder:text-slate-500 h-12 font-medium backdrop-blur-sm focus:border-purple-500/50 transition-all"
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSend}
              disabled={!address || !amount}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white disabled:opacity-50 shadow-lg shadow-purple-500/30 transition-all duration-300 font-semibold"
            >
              Send {selectedToken}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
