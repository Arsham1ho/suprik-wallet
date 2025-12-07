import { useState } from 'react';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { ChevronRight } from 'lucide-react';

interface VerifyParabolicInfoProps {
  onBack: () => void;
}

export function VerifyParabolicInfo({ onBack }: VerifyParabolicInfoProps) {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchCoinGeckoData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching Parabolic AI info from CoinGecko...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coin-details/parabolic-ai`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const coinData = await response.json();
        console.log('✅ CoinGecko Data:', coinData);
        setData(coinData);
        
        toast.success('Data fetched successfully!');
      } else {
        const error = await response.text();
        console.error('❌ Error:', error);
        toast.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setClearing(true);
    setData(null);
    setClearing(false);
  };

  const clearAllCoinCaches = async () => {
    setClearing(true);
    try {
      console.log('🧹 Clearing all coin caches...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/clear-all-coin-caches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cache cleared:', result);
        toast.success('All coin caches cleared! Refresh your wallet to see updated data.');
      } else {
        const error = await response.text();
        console.error('❌ Error:', error);
        toast.error('Failed to clear caches');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to clear caches');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-6 w-full max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold">🔍 Verify Token Info</h1>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-slate-900 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold">Parabolic AI (PAI)</h3>
            <p className="text-sm text-slate-400">
              Fetch real-time data from CoinGecko to verify token information
            </p>
            
            <Button 
              onClick={fetchCoinGeckoData}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Fetching...' : 'Fetch CoinGecko Data'}
            </Button>

            <Button 
              onClick={clearAllCoinCaches}
              disabled={clearing}
              variant="outline"
              className="w-full border-orange-500/30 bg-orange-950/30 hover:bg-orange-900/40 text-orange-400"
            >
              {clearing ? 'Clearing...' : '🧹 Clear All Coin Caches & Refresh'}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              After clearing cache, go back to Home and pull down to refresh your wallet
            </p>

            {data && (
              <div className="space-y-3 text-sm mt-6">
                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Name</div>
                  <div className="font-semibold">{data.name}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Symbol</div>
                  <div className="font-semibold">{data.symbol}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Logo URL</div>
                  <div className="font-mono text-xs break-all text-purple-400">{data.image}</div>
                  {data.image && (
                    <img src={data.image} alt={data.name} className="w-12 h-12 mt-2 rounded-full" />
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Current Price (USD)</div>
                  <div className="font-semibold">${data.market_data?.current_price_usd?.toFixed(6)}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Market Cap (USD)</div>
                  <div className="font-semibold">${data.market_data?.market_cap_usd?.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Total Supply</div>
                  <div className="font-semibold">{data.market_data?.total_supply?.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Circulating Supply</div>
                  <div className="font-semibold">{data.market_data?.circulating_supply?.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Website</div>
                  <a 
                    href={data.links?.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 break-all text-xs"
                  >
                    {data.links?.homepage}
                  </a>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Twitter</div>
                  <div className="font-semibold">@{data.links?.twitter}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">⚠️ Solana Contract Address</div>
                  <div className="font-mono text-xs break-all text-orange-400">
                    {data.platforms?.solana || 'Not found in CoinGecko'}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Expected: HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 mb-1">Description (First 300 chars)</div>
                  <div className="text-xs text-slate-300">{data.description?.substring(0, 300)}...</div>
                </div>

                <details className="p-3 bg-slate-950 rounded-lg">
                  <summary className="cursor-pointer text-slate-400">Full JSON Data</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-96">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}