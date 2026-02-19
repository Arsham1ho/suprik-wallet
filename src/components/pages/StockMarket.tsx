import { motion } from 'motion/react';
import { BotMessageSquare } from 'lucide-react';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { StockAIChat } from './StockAIChat';
import type { Token } from './Home';

interface StockMarketProps {
  walletId: string;
  tokensData?: Token[];
  onOpenVoiceAssistant?: () => void;
}

export function StockMarket({ walletId, tokensData, onOpenVoiceAssistant }: StockMarketProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div className="px-4 pt-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">{t.nav.stocks}</h1>
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(139, 92, 246, 0.2)' }}
            >
              <BotMessageSquare className="w-5 h-5 text-purple-400" />
            </button>
          )}
        </motion.div>
      </div>

      {/* AI Chat - Full Page */}
      <StockAIChat walletId={walletId} tokensData={tokensData} />
    </div>
  );
}
