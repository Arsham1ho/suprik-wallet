import { useRef } from 'react';
import { Button } from './ui/button';
import { Download, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface TransactionReceiptProps {
  transaction: {
    type: 'send' | 'receive' | 'swap';
    amount: number;
    token: string;
    to?: string;
    from?: string;
    signature: string;
    timestamp: string;
    fee?: number;
    status: string;
    // For swap
    toToken?: string;
    toAmount?: number;
    fromToken?: string;
    fromAmount?: number;
  };
}

export function TransactionReceipt({ transaction }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      // Use html2canvas to capture the receipt
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `saturn-receipt-${transaction.signature.slice(0, 8)}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success('Receipt downloaded successfully!');
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `saturn-receipt-${transaction.signature.slice(0, 8)}.png`, {
          type: 'image/png',
        });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Suprik Transaction Receipt',
            text: `Transaction ${transaction.signature.slice(0, 8)}`,
            files: [file],
          });
        } else {
          // Fallback to download
          downloadReceipt();
        }
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      toast.error('Failed to share receipt');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      {/* Receipt Preview */}
      <div
        ref={receiptRef}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b border-slate-700/50">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl">🪐</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Suprik Wallet</h3>
          <p className="text-slate-400 text-sm">Transaction Receipt</p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 mb-6">
          {/* Status */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
            <span className="text-slate-400">Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              transaction.status === 'confirmed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {transaction.status}
            </span>
          </div>

          {/* Type */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
            <span className="text-slate-400">Type</span>
            <span className="text-white font-semibold capitalize">{transaction.type}</span>
          </div>

          {/* Amount */}
          {transaction.type !== 'swap' ? (
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">Amount</span>
              <span className="text-white font-bold text-lg">
                {transaction.type === 'receive' ? '+' : '-'}
                {transaction.amount} {transaction.token}
              </span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
                <span className="text-slate-400">You Sent</span>
                <span className="text-white font-semibold">
                  {transaction.fromAmount} {transaction.fromToken}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
                <span className="text-slate-400">You Received</span>
                <span className="text-green-400 font-semibold">
                  {transaction.toAmount} {transaction.toToken}
                </span>
              </div>
            </>
          )}

          {/* Fee */}
          {transaction.fee !== undefined && (
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">Fee</span>
              <span className="text-purple-400 font-semibold">${transaction.fee}</span>
            </div>
          )}

          {/* From/To */}
          {transaction.from && transaction.type !== 'swap' && (
            <div className="flex justify-between items-start pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">From</span>
              <code className="text-white text-sm font-mono text-right">
                {transaction.from === 'Blockchain' || transaction.from === 'Dev Mode Simulation'
                  ? transaction.from
                  : truncateAddress(transaction.from)}
              </code>
            </div>
          )}

          {transaction.to && transaction.type !== 'swap' && (
            <div className="flex justify-between items-start pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">To</span>
              <code className="text-white text-sm font-mono text-right">
                {truncateAddress(transaction.to)}
              </code>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-white">{formatDate(transaction.timestamp)}</span>
          </div>

          {/* Signature */}
          <div className="pb-3">
            <p className="text-slate-400 text-sm mb-2">Transaction Hash</p>
            <code className="text-purple-300 text-xs font-mono break-all bg-slate-950/50 p-2 rounded block">
              {transaction.signature}
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs">
            Powered by Suplet Wallet • {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={downloadReceipt}
          variant="outline"
          className="border-slate-800 text-white hover:bg-slate-800/50 h-12"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          onClick={shareReceipt}
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white h-12"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      <p className="text-slate-500 text-xs text-center">
        Receipt will be saved as a PNG image
      </p>
    </div>
  );
}