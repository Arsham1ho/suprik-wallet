import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface IntroVideoSimpleProps {
  onComplete: () => void;
}

export function IntroVideoSimple({ onComplete }: IntroVideoSimpleProps) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Show video immediately
    setShowVideo(true);
    
    // Auto-advance after typical intro video duration (adjust based on your video length)
    // For a ~30 second video, we'll wait 35 seconds
    const timer = setTimeout(() => {
      console.log('[IntroVideo] Video finished, advancing...');
      onComplete();
    }, 35000); // 35 seconds - adjust based on your video length

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {showVideo && (
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <iframe
            src="https://streamable.com/e/gvmvzr?autoplay=1"
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </motion.div>
      )}
    </div>
  );
}
