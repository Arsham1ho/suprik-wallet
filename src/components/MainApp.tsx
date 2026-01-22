import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Swap } from './pages/Swap';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { Search, CoinGeckoToken } from './pages/Search';
import { CoinDetail } from './pages/CoinDetail';
import { P2PTransfer } from './pages/P2PTransfer';
import { BottomNav } from './BottomNav';
import { scrollToTop } from '../utils/scrollToTop';
import type { Token } from './pages/Home';

interface MainAppProps {
  accessToken: string | null;
  onSignOut: () => void;
  onLockWallet?: () => void;
  onSwitchAccount?: (walletId: string) => void;
}

export function MainApp({ accessToken, onSignOut, onLockWallet, onSwitchAccount }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<'home' | 'swap' | 'activity' | 'settings' | 'p2p' | 'send' | 'receive' | 'search' | 'coinDetail'>('home');
  const [hideBottomNav, setHideBottomNav] = useState(false);
  
  // Scroll to top when page changes
  useEffect(() => {
    scrollToTop();
  }, [currentPage]);
  
  const handleNavigate = (page: 'home' | 'swap' | 'activity' | 'settings' | 'p2p') => {
    console.log('[MainApp] Navigating to:', page);
    setCurrentPage(page);
    // Reset hideBottomNav when navigating to a different main page
    if (page !== 'settings') {
      setHideBottomNav(false);
    }
  };
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
      {currentPage === 'settings' && <Settings onSignOut={onSignOut} walletId={accessToken || ''} onLockWallet={onLockWallet} onSwitchAccount={onSwitchAccount} onSubpageChange={setHideBottomNav} />}
      {currentPage === 'p2p' && <P2PTransfer onBack={() => setCurrentPage('home')} />}
      {currentPage === 'send' && <Send onNavigate={setCurrentPage} tokens={tokensData} walletId={accessToken || ''} onSendComplete={handleRefreshTokens} />}
      {currentPage === 'receive' && <Receive onBack={() => setCurrentPage('home')} walletId={accessToken || ''} />}
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
      
      {currentPage !== 'send' && currentPage !== 'receive' && currentPage !== 'search' && currentPage !== 'coinDetail' && !hideBottomNav && <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />}
    </div>
  );
}