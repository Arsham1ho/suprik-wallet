import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useLanguage } from '../../utils/i18n/LanguageContext';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  mint: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  floorPrice?: number;
  network?: string;
}

interface NFTGalleryProps {
  walletId: string;
  onBack: () => void;
}

export function NFTGallery({ walletId, onBack }: NFTGalleryProps) {
  const { t } = useLanguage();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    fetchNFTs();
  }, [walletId]);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/nfts`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      setNfts(data || []);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      // Don't show error toast, just show empty state
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (nft: NFT) => {
    const network = nft.network || 'solana';
    if (network === 'solana') {
      return `https://solscan.io/token/${nft.mint}`;
    } else if (network === 'ethereum') {
      return `https://opensea.io/assets/${nft.mint}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-6 w-full">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t.nft.nftGallery}</h1>
        </div>

        {/* NFT Grid */}
        {nfts.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.nft.noNFTs}</h3>
            <p className="text-slate-400 max-w-xs mx-auto">{t.nft.noNFTsDesc}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {nfts.map((nft, idx) => (
              <motion.button
                key={nft.id}
                onClick={() => setSelectedNFT(nft)}
                className="relative rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/30 hover:border-purple-500/50 transition-all group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* NFT Image */}
                <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative overflow-hidden">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* NFT Info */}
                <div className="p-3">
                  <p className="text-white font-semibold text-sm truncate">{nft.name}</p>
                  <p className="text-slate-400 text-xs truncate">{nft.collection}</p>
                  {nft.floorPrice && (
                    <p className="text-purple-400 text-xs mt-1">
                      Floor: {nft.floorPrice.toFixed(2)} SOL
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* NFT Detail Dialog */}
      <Dialog open={!!selectedNFT} onOpenChange={(open) => !open && setSelectedNFT(null)}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          {selectedNFT && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedNFT.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* NFT Image */}
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full aspect-square object-cover"
                  />
                </div>

                {/* Collection & Floor Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">{t.nft.collection}</p>
                    <p className="text-white font-semibold text-sm">{selectedNFT.collection}</p>
                  </div>
                  {selectedNFT.floorPrice && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">{t.nft.floorPrice}</p>
                      <p className="text-purple-400 font-semibold text-sm">
                        {selectedNFT.floorPrice.toFixed(2)} SOL
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedNFT.description && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-2">{t.nft.description}</p>
                    <p className="text-white text-sm leading-relaxed">{selectedNFT.description}</p>
                  </div>
                )}

                {/* Attributes */}
                {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-3">{t.nft.attributes}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedNFT.attributes.map((attr, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/30"
                        >
                          <p className="text-slate-500 text-[10px] mb-1">{attr.trait_type}</p>
                          <p className="text-white text-xs font-medium">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explorer Link */}
                {getExplorerUrl(selectedNFT) && (
                  <Button
                    onClick={() => {
                      const url = getExplorerUrl(selectedNFT);
                      if (url) window.open(url, '_blank');
                    }}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t.nft.viewOnExplorer}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
