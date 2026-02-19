import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Swap } from './pages/Swap';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { Search, CoinGeckoToken } from './pages/Search';
import { CoinDetail } from './pages/CoinDetail';
import { StockMarket } from './pages/StockMarket';
import { TokenChat } from './pages/TokenChat';
import { VoiceAssistant } from './VoiceAssistant';
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
  const [currentPage, setCurrentPage] = useState<'home' | 'swap' | 'activity' | 'settings' | 'stocks' | 'send' | 'receive' | 'search' | 'coinDetail' | 'chat'>('home');
  const [coinDetailBackPage, setCoinDetailBackPage] = useState<string>('search');
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  // Scroll to top when page changes
  useEffect(() => {
    scrollToTop();
  }, [currentPage]);
  
  const handleNavigate = (page: 'home' | 'swap' | 'activity' | 'settings' | 'stocks') => {
    console.log('[MainApp] Navigating to:', page);
    setCurrentPage(page);
    // Reset hideBottomNav when navigating to a different main page
    if (page !== 'settings') {
      setHideBottomNav(false);
    }
  };
  const [tokensData, setTokensData] = useState<any[]>([]);
  const [selectedCoinForDetail, setSelectedCoinForDetail] = useState<Token | null>(null);
  const [selectedTokenForChat, setSelectedTokenForChat] = useState<Token | null>(null);
  const [chatBackPage, setChatBackPage] = useState<string>('home');
  
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
    setCoinDetailBackPage('search');
    setCurrentPage('coinDetail');
  };

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div style={{ display: currentPage === 'home' ? 'block' : 'none' }}>
        <Home onNavigate={setCurrentPage} walletId={accessToken || ''} onTokensLoaded={setTokensData} isActive={currentPage === 'home'} onOpenVoiceAssistant={() => setShowVoiceAssistant(true)} onNavigateToChat={(token) => { setSelectedTokenForChat(token); setChatBackPage('home'); setCurrentPage('chat'); }} />
      </div>
      {currentPage === 'swap' && <Swap tokens={tokensData} walletId={accessToken || ''} />}
      {currentPage === 'activity' && <Activity walletId={accessToken || ''} />}
      {currentPage === 'settings' && <Settings onSignOut={onSignOut} walletId={accessToken || ''} onLockWallet={onLockWallet} onSwitchAccount={onSwitchAccount} onSubpageChange={setHideBottomNav} />}
      {currentPage === 'stocks' && <StockMarket walletId={accessToken || ''} tokensData={tokensData} onOpenVoiceAssistant={() => setShowVoiceAssistant(true)} />}
      {currentPage === 'send' && <Send onNavigate={setCurrentPage} tokens={tokensData} walletId={accessToken || ''} />}
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
          onBack={() => setCurrentPage(coinDetailBackPage as any)}
          walletId={accessToken || ''}
          onNavigateToSend={(token) => {
            setCurrentPage('send');
            // Store selected token for Send page
            localStorage.setItem('saturn_send_selected_token', JSON.stringify(token));
          }}
          onNavigateToChat={(token) => {
            setSelectedTokenForChat(token);
            setChatBackPage('coinDetail');
            setCurrentPage('chat');
          }}
        />
      )}
      {currentPage === 'chat' && selectedTokenForChat && (
        <TokenChat
          token={selectedTokenForChat}
          onBack={() => setCurrentPage(chatBackPage as any)}
          walletId={accessToken || ''}
        />
      )}

      {currentPage !== 'send' && currentPage !== 'receive' && currentPage !== 'search' && currentPage !== 'coinDetail' && currentPage !== 'chat' && !hideBottomNav && <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />}

      {/* Voice AI Assistant Overlay */}
      <VoiceAssistant
        open={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        walletId={accessToken || ''}
        tokensData={tokensData}
      />
    </div>
  );
}