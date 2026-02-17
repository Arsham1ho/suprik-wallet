import { motion } from 'motion/react';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { StockAIChat } from './StockAIChat';

interface StockMarketProps {
  walletId: string;
}

export function StockMarket({ walletId }: StockMarketProps) {
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
        </motion.div>
      </div>

      {/* AI Chat - Full Page */}
      <StockAIChat walletId={walletId} />
    </div>
  );
}
