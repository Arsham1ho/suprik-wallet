import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  MessageCircle, 
  Mail, 
  Book, 
  ExternalLink,
  Search,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner@2.0.3';

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
    question: 'What is CosmoPay?',
    answer: 'CosmoPay is Suprik\'s innovative feature for peer-to-peer offline transactions. You can create transaction files that can be shared via QR code, Bluetooth, or NFC - even without internet!'
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
          
          <button
            onClick={() => {
              window.open('https://t.me/suprik_support', '_blank');
            }}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 transition-all flex items-center justify-between border border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Community Support</p>
                <p className="text-purple-300 text-sm">Join our Telegram group</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-purple-600" />
          </button>

          <button
            onClick={() => {
              window.location.href = 'mailto:support@suprik.app?subject=Suprik Support Request';
            }}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Email Support</p>
                <p className="text-slate-400 text-sm">support@suprik.app</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => {
              window.open('https://docs.suprik.app', '_blank');
            }}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Documentation</p>
                <p className="text-slate-400 text-sm">Learn how to use Suprik</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-600" />
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
              toast.success('Opening support ticket form...');
              window.open('https://support.suprik.app/new-ticket', '_blank');
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
