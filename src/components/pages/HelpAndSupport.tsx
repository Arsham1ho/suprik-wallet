import { useState, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Mail,
  ExternalLink,
  Search,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { scrollToTop } from '../../utils/scrollToTop';

interface HelpAndSupportProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create a new wallet?',
    answer: 'When you first open Suprik, you can create a new wallet by choosing "Create New Wallet". You\'ll receive a 12-word recovery phrase - make sure to write it down and store it safely!'
  },
  {
    category: 'Getting Started',
    question: 'How do I import an existing wallet?',
    answer: 'On the welcome screen, select "Import Wallet" and enter your 12-word recovery phrase. Your wallet and all associated accounts will be restored.'
  },
  {
    category: 'Security',
    question: 'What is a recovery phrase?',
    answer: 'A recovery phrase (also called a seed phrase) is a 12-word backup of your wallet. It\'s the ONLY way to recover your wallet if you lose access. Never share it with anyone!'
  },
  {
    category: 'Security',
    question: 'How do I keep my wallet secure?',
    answer: 'Always keep your recovery phrase offline and secure. Enable biometric authentication, never share your private keys, and be cautious of phishing attempts. Suprik will never ask for your recovery phrase.'
  },
  {
    category: 'Accounts',
    question: 'Can I have multiple accounts?',
    answer: 'Yes! You can create multiple accounts within your wallet. Go to Settings > Account Settings and tap "Add Another Account". Each account has its own unique address.'
  },
  {
    category: 'Accounts',
    question: 'How do I switch between accounts?',
    answer: 'Tap on your profile picture or account name at the top of the Home screen to open the account switcher, then select the account you want to use.'
  },
  {
    category: 'Transactions',
    question: 'How do I send crypto?',
    answer: 'Tap "Send" on the Home screen, enter the recipient\'s address (or scan their QR code), enter the amount, and confirm the transaction. Always double-check the address before sending!'
  },
  {
    category: 'Transactions',
    question: 'What is Suprik Pay?',
    answer: 'Suprik Pay is Suprik\'s innovative feature for peer-to-peer offline transactions. You can create transaction files that can be shared via QR code, Bluetooth, or NFC - even without internet!'
  },
  {
    category: 'Transactions',
    question: 'How long do transactions take?',
    answer: 'Transaction times depend on network congestion and fees. On Solana mainnet, transactions typically confirm in seconds. You can track your transaction in the Activity tab.'
  },
  {
    category: 'Tokens & NFTs',
    question: 'How do I add custom tokens?',
    answer: 'Suprik automatically detects tokens in your wallet. For tokens that don\'t appear, you can manually add them by entering the token\'s mint address in the token settings.'
  },
  {
    category: 'Tokens & NFTs',
    question: 'Where can I see my NFTs?',
    answer: 'Your NFTs are displayed on the Home screen below your token list. Tap on any NFT to view details, or go to Settings to access the full NFT Gallery.'
  },
  {
    category: 'Settings',
    question: 'Can I use Testnet?',
    answer: 'Yes! Enable Testnet Mode in Settings > Developer. This is useful for testing without using real funds. You can switch back to Mainnet anytime.'
  }
];

export function HelpAndSupport({ onBack }: HelpAndSupportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Scroll to top when page opens
  useLayoutEffect(() => {
    scrollToTop();
  }, []);

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-6 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-2xl">Help & Support</h1>
        </div>

        {/* Quick Contact Cards */}
        <motion.div
          className="space-y-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-slate-400 text-sm px-2 mb-3">Get in Touch</h3>

          {/* Telegram */}
          <button
            onClick={() => {
              window.open('https://t.me/suprik_wallet', '_blank');
            }}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 transition-all flex items-center justify-between border border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Telegram</p>
                <p className="text-blue-300 text-sm">@suprik_wallet</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-400" />
          </button>

          {/* X (Twitter) */}
          <button
            onClick={() => {
              window.open('https://x.com/Suprik_wallet', '_blank');
            }}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-slate-700">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">X (Twitter)</p>
                <p className="text-slate-400 text-sm">@Suprik_wallet</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </button>

          {/* Instagram */}
          <button
            onClick={() => {
              window.open('https://instagram.com/suprik_wallet', '_blank');
            }}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Instagram</p>
                <p className="text-slate-400 text-sm">@suprik_wallet</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </button>

          {/* YouTube */}
          <button
            onClick={() => {
              window.open('https://youtube.com/@suprik_wallet', '_blank');
            }}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">YouTube</p>
                <p className="text-slate-400 text-sm">@suprik_wallet</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </button>

          {/* Email Support */}
          <button
            onClick={() => {
              window.location.href = 'mailto:support@suprik.com?subject=Suprik Support Request';
            }}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Email Support</p>
                <p className="text-slate-400 text-sm">support@suprik.com</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-slate-400 text-sm px-2 mb-3">Frequently Asked Questions</h3>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800/30 text-white placeholder:text-slate-500"
            />
          </div>

          {/* FAQ List by Category */}
          <div className="space-y-4">
            {categories.map(category => {
              const categoryFAQs = filteredFAQs.filter(faq => faq.category === category);
              
              if (categoryFAQs.length === 0) return null;

              return (
                <div key={category}>
                  <h4 className="text-white font-medium mb-2 px-2">{category}</h4>
                  <div className="space-y-2">
                    {categoryFAQs.map((faq, index) => {
                      const globalIndex = faqs.indexOf(faq);
                      const isExpanded = expandedFAQ === globalIndex;

                      return (
                        <button
                          key={globalIndex}
                          onClick={() => setExpandedFAQ(isExpanded ? null : globalIndex)}
                          className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all border border-slate-800/30 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <HelpCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-white font-medium mb-1">{faq.question}</p>
                                {isExpanded && (
                                  <motion.p 
                                    className="text-slate-400 text-sm mt-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    {faq.answer}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 text-slate-600 transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredFAQs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">No FAQs found matching your search</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Submit Ticket Section */}
        <motion.div
          className="mt-8 p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white font-medium mb-2">Still Need Help?</h3>
          <p className="text-slate-400 text-sm mb-4">
            If you couldn't find an answer to your question, our support team is here to help!
          </p>
          <Button
            onClick={() => {
              window.location.href = 'mailto:support@suprik.com?subject=Support Request - Suprik Wallet';
            }}
            className="w-full bg-[#ad46ff] hover:bg-[#ad46ff]/90 text-white"
          >
            Submit a Support Ticket
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
