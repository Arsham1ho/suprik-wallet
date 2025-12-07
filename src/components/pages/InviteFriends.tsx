import { useState } from 'react';
import { ArrowLeft, Users, Copy, Share2, Mail, MessageCircle, Check, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';

interface InviteFriendsProps {
  onBack: () => void;
  walletId: string;
}

export function InviteFriends({ onBack, walletId }: InviteFriendsProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `https://saturn-wallet.app/invite/${walletId.slice(0, 8)}`;
  const inviteCode = walletId.slice(0, 8).toUpperCase();
  
  const inviteMessage = `Join me on Suprik Wallet! 🪐

The best crypto wallet for managing your digital assets across multiple blockchains.`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Suprik Wallet',
          text: inviteMessage,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(inviteMessage);
        }
      }
    } else {
      copyToClipboard(inviteMessage);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join me on Suprik Wallet! 🪐');
    const body = encodeURIComponent(inviteMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(inviteMessage);
    window.open(`sms:?body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Invite Friends</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-7xl mb-6"
          >
            🎁
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Share Suprik with Friends
          </h2>
          <p className="text-slate-400">
            Help us grow the community and make crypto accessible to everyone!
          </p>
        </motion.div>

        {/* Invite Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">Your Invite Code</h3>
          </div>
          
          <div className="bg-black/40 rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">Invite Code</p>
              <p className="text-3xl font-bold text-purple-400 tracking-wider font-mono">
                {inviteCode}
              </p>
            </div>
          </div>

          <Button
            onClick={() => copyToClipboard(inviteCode)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </motion.div>

        {/* Invite Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Invite Link</h3>
          
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <div className="flex gap-2 mb-3">
              <Input
                value={inviteLink}
                readOnly
                className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(inviteLink)}
                variant="outline"
                className="border-slate-700 flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <p className="text-slate-400 text-xs">
              Share this link with your friends to invite them to Suprik
            </p>
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Share Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Share Via</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={shareInvite}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 justify-start"
            >
              <Share2 className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Share Everywhere</p>
                <p className="text-xs text-purple-100">Use system share menu</p>
              </div>
            </Button>

            <button
              onClick={shareViaEmail}
              className="w-full h-14 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/30 rounded-xl flex items-center px-4 transition-colors"
            >
              <Mail className="w-5 h-5 mr-3 text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-white">Email</p>
                <p className="text-xs text-slate-400">Send via email</p>
              </div>
            </button>

            <button
              onClick={shareViaSMS}
              className="w-full h-14 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/30 rounded-xl flex items-center px-4 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-3 text-green-400" />
              <div className="text-left">
                <p className="font-medium text-white">SMS / Message</p>
                <p className="text-xs text-slate-400">Send via text message</p>
              </div>
            </button>

            <button
              disabled
              className="w-full h-14 bg-slate-900/30 border border-slate-800/30 rounded-xl flex items-center px-4 opacity-50 cursor-not-allowed"
            >
              <QrCode className="w-5 h-5 mr-3 text-purple-400" />
              <div className="text-left">
                <p className="font-medium text-white">QR Code</p>
                <p className="text-xs text-slate-400">Coming soon</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Message Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Message Preview</h3>
          
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans">
              {inviteMessage}
            </pre>
            <Button
              onClick={() => copyToClipboard(inviteMessage)}
              variant="outline"
              className="w-full mt-4 border-slate-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4"
        >
          <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
            <span>✨</span>
            Why Share Suprik?
          </h4>
          <ul className="text-blue-200 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Help friends discover a better way to manage crypto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Build a stronger, more secure crypto community</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Support open-source development</span>
            </li>
          </ul>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400 mb-1">0</p>
            <p className="text-slate-400 text-xs">Invited</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400 mb-1">0</p>
            <p className="text-slate-400 text-xs">Joined</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400 mb-1">∞</p>
            <p className="text-slate-400 text-xs">Potential</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}