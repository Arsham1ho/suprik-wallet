import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Streamable video URL - using embed format with autoplay
  const STREAMABLE_VIDEO_ID = '57eu80';
  const STREAMABLE_EMBED_URL = `https://streamable.com/o/${STREAMABLE_VIDEO_ID}?autoplay=1&nocontrols=1&loop=0&muted=0`;

  // Force body background color while video is playing
  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#0f1729';
    document.documentElement.style.backgroundColor = '#0f1729';
    
    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, []);

  // Listen for Streamable video events
  useEffect(() => {
    console.log('[IntroVideo] Setting up Streamable iframe with 6-second timer');
    
    // Hide loading after a short delay to show iframe
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Automatically navigate after 6 seconds
    const navigationTimer = setTimeout(() => {
      console.log('[IntroVideo] ⏱️ 6 seconds completed - advancing to Create Account page');
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(navigationTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#0f1729' }}>
      {/* Mobile Container */}
      <div
        className="w-full md:max-w-[430px] h-full flex flex-col relative"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      >
        {/* Cosmic background matching the video colors - Dark blue space theme */}
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(180deg, #0a0e1a 0%, #1a1f3a 25%, #0f1729 50%, #1a1f3a 75%, #0a0e1a 100%)'
        }}>
          <motion.div 
            className="absolute inset-0"
            style={{ 
              background: 'radial-gradient(ellipse at center, rgba(88, 28, 135, 0.15) 0%, transparent 70%)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Animated cosmic glow overlays */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.2) 0%, transparent 40%, rgba(236, 72, 153, 0.15) 100%)'
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top left, rgba(59, 130, 246, 0.15) 0%, transparent 40%, rgba(6, 182, 212, 0.1) 100%)'
            }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Top and Bottom fade frames to blend with video */}
          <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none z-30" style={{
            background: 'linear-gradient(to bottom, #0a0e1a 0%, #0f1729 40%, rgba(15, 23, 41, 0.8) 70%, transparent 100%)'
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-30" style={{
            background: 'linear-gradient(to top, #0a0e1a 0%, #0f1729 40%, rgba(15, 23, 41, 0.8) 70%, transparent 100%)'
          }} />
        </div>

        {/* Streamable Iframe */}
        <motion.div
          className="relative w-full h-full z-10 flex items-center justify-center"
          style={{ backgroundColor: '#0f1729' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <iframe
            ref={iframeRef}
            src={STREAMABLE_EMBED_URL}
            className="w-full h-full border-0 pointer-events-none"
            allow="autoplay"
            allowFullScreen
            style={{
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}