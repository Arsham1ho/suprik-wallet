import { useState } from 'react';
import { Home } from './pages/Home';
import { Swap } from './pages/Swap';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { Send } from './pages/Send';
import { Search, CoinGeckoToken } from './pages/Search';
import { CoinDetail } from './pages/CoinDetail';
import { P2PTransfer } from './pages/P2PTransfer';
import { BottomNav } from './BottomNav';
import type { Token } from './pages/Home';

interface MainAppProps {
  accessToken: string | null;
  onSignOut: () => void;
  onSwitchAccount?: (walletId: string) => void;
}

export function MainApp({ accessToken, onSignOut, onSwitchAccount }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<'home' | 'swap' | 'activity' | 'settings' | 'p2p' | 'send' | 'search' | 'coinDetail'>('home');
  const [tokensData, setTokensData] = useState<any[]>([]);
  const [selectedCoinForDetail, setSelectedCoinForDetail] = useState<Token | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleViewCoinDetailFromSearch = (coin: CoinGeckoToken) => {
    // Convert CoinGecko token to our Token format
    const token: Token = {
      id: 0,
      mint: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      amount: coin.amount || 0,
      value: coin.value || 0,
      price: coin.current_price,
      change: coin.price_change_percentage_24h,
      logo: coin.symbol.charAt(0),
      logoUrl: coin.image,
      color: 'from-purple-500 to-purple-600',
      network: 'solana' // Default to solana for search results
    };
    
    setSelectedCoinForDetail(token);
    setCurrentPage('coinDetail');
  };

  const handleRefreshTokens = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white w-full">
      {currentPage === 'home' && <Home onNavigate={setCurrentPage} walletId={accessToken || ''} onTokensLoaded={setTokensData} key={refreshTrigger} />}
      {currentPage === 'swap' && <Swap tokens={tokensData} walletId={accessToken || ''} onSwapComplete={handleRefreshTokens} />}
      {currentPage === 'activity' && <Activity walletId={accessToken || ''} />}
      {currentPage === 'settings' && <Settings onSignOut={onSignOut} walletId={accessToken || ''} onSwitchAccount={onSwitchAccount} />}
      {currentPage === 'p2p' && <P2PTransfer onBack={() => setCurrentPage('home')} />}
      {currentPage === 'send' && <Send onNavigate={setCurrentPage} tokens={tokensData} walletId={accessToken || ''} onSendComplete={handleRefreshTokens} />}
      {currentPage === 'search' && (
        <Search 
          onBack={() => setCurrentPage('home')} 
          walletId={accessToken || ''} 
          onViewCoinDetail={handleViewCoinDetailFromSearch}
        />
      )}
      {currentPage === 'coinDetail' && selectedCoinForDetail && (
        <CoinDetail 
          token={selectedCoinForDetail} 
          onBack={() => setCurrentPage('search')} 
          walletId={accessToken || ''}
          onNavigateToSend={(token) => {
            setCurrentPage('send');
            // Store selected token for Send page
            localStorage.setItem('saturn_send_selected_token', JSON.stringify(token));
          }}
        />
      )}
      
      {currentPage !== 'send' && currentPage !== 'search' && currentPage !== 'coinDetail' && <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />}
    </div>
  );
}