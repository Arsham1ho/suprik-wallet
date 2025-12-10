import { ArrowLeft, Info, Github, Twitter, Globe, Mail, Heart, Shield, Zap, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface AboutSuprikProps {
  onBack: () => void;
}

export function AboutSuprik({ onBack }: AboutSuprikProps) {
  const features = [
    {
      icon: Shield,
      title: 'Secure by Design',
      description: 'Your private keys never leave your device. Military-grade encryption.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant swaps and transfers with optimized blockchain interactions.',
    },
    {
      icon: Users,
      title: 'Multi-Chain Support',
      description: 'Manage Solana, Ethereum, Bitcoin and more in one place.',
    },
  ];

  const links = [
    { icon: Globe, label: 'Website', url: 'https://saturn-wallet.app', color: 'text-blue-400' },
    { icon: Github, label: 'GitHub', url: 'https://github.com/saturn-wallet', color: 'text-purple-400' },
    { icon: Twitter, label: 'Twitter', url: 'https://twitter.com/saturn_wallet', color: 'text-sky-400' },
    { icon: Mail, label: 'Contact', url: 'mailto:support@saturn-wallet.app', color: 'text-green-400' },
  ];

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
          <h1 className="text-xl">About Suprik</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-8xl mb-6"
          >
            🪐
          </motion.div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Suprik Wallet
          </h2>
          <p className="text-slate-400 mb-1">Version 1.0.0</p>
          <p className="text-slate-500 text-sm">Your Gateway to the Crypto Universe</p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">About</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Suprik is a modern, secure cryptocurrency wallet designed for the next generation of digital asset management. 
            Built with cutting-edge technology and user experience in mind, Suprik makes it easy to store, send, and swap 
            your favorite cryptocurrencies across multiple blockchains.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Key Features</h3>
          <div className="space-y-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                      <p className="text-slate-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Supported Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4"
        >
          <h3 className="text-white font-medium mb-3">What You Can Do</h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>Store multiple cryptocurrencies securely</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>Send and receive tokens instantly</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>Swap between different cryptocurrencies</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>Track real-time prices and portfolio value</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>View complete transaction history</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>Test features with Developer Mode</span>
            </div>
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Connect With Us</h3>
          <div className="grid grid-cols-2 gap-3">
            {links.map((link, idx) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 flex items-center gap-3 hover:bg-slate-900/80 transition-colors"
                >
                  <Icon className={`w-5 h-5 ${link.color}`} />
                  <span className="text-white text-sm font-medium">{link.label}</span>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Legal & Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2 text-sm">License</h4>
            <p className="text-slate-400 text-xs">
              Suprik Wallet is open source software. Licensed under MIT License.
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              <h4 className="text-white font-medium text-sm">Made with Love</h4>
            </div>
            <p className="text-slate-300 text-xs">
              Built by a passionate team dedicated to making crypto accessible to everyone.
            </p>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center py-6"
        >
          <p className="text-slate-600 text-xs">
            © 2025 Suprik Wallet. All rights reserved.
          </p>
          <p className="text-slate-700 text-xs mt-1">
            Not affiliated with any blockchain or cryptocurrency project.
          </p>
        </motion.div>
      </div>
    </div>
  );
}