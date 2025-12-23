import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const hasCalledComplete = useRef(false);
  const hasAttemptedPlay = useRef(false);

  // Local video path - place your video file in public/intro.mp4
  const VIDEO_PATH = '/intro.mp4';

  const handleComplete = useCallback(() => {
    if (!hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [onComplete]);

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

  // Handle video playback - runs once on mount
  useEffect(() => {
    if (hasAttemptedPlay.current) return;
    hasAttemptedPlay.current = true;

    const video = videoRef.current;
    if (!video) {
      setShowFallback(true);
      return;
    }

    // Try to play the video
    const playVideo = async () => {
      try {
        // iOS requires muted for autoplay, then we can try to unmute
        video.muted = true;
        await video.play();
        // Video is playing successfully
        setVideoLoaded(true);
        // Try to unmute after user interaction context
        setTimeout(() => {
          if (video) video.muted = false;
        }, 100);
      } catch {
        // Video failed to play, show fallback
        setShowFallback(true);
      }
    };

    playVideo();

    // Safety timeout - navigate after video duration or 15 seconds max
    const safetyTimer = setTimeout(() => {
      handleComplete();
    }, 15000);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [handleComplete]);

  const handleVideoEnded = () => {
    handleComplete();
  };

  const handleVideoError = () => {
    setShowFallback(true);
    // Also trigger complete after a delay so user isn't stuck
    setTimeout(handleComplete, 4000);
  };

  return (
    <div
      className="flex flex-col relative overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        touchAction: 'none',
        overscrollBehavior: 'none',
        backgroundColor: '#0f1729'
      }}
    >
      {/* Cosmic background */}
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
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top left, rgba(59, 130, 246, 0.15) 0%, transparent 40%, rgba(6, 182, 212, 0.1) 100%)'
          }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Video Player - Full screen - only visible when video is loaded */}
      <div
        className="absolute inset-0 z-10"
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          opacity: videoLoaded && !showFallback ? 1 : 0,
          pointerEvents: videoLoaded && !showFallback ? 'auto' : 'none',
          backgroundColor: '#000',
        }}
      >
        <video
          ref={videoRef}
          src={VIDEO_PATH}
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            display: 'block',
          }}
          playsInline
          autoPlay
          muted
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        />
      </div>

      {/* Fallback Animation - Shows while video is loading or when it fails */}
      {(showFallback || !videoLoaded) && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          {/* Animated Logo */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.8 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                filter: 'blur(20px)',
                transform: 'scale(2)',
              }}
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1.8, 2.2, 1.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Logo container */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-1">
              <div className="w-full h-full rounded-full bg-black/90 flex items-center justify-center backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="introLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    fill="url(#introLogoGradient)"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                  <motion.path
                    d="M2 17L12 22L22 17"
                    stroke="url(#introLogoGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />
                  <motion.path
                    d="M2 12L12 17L22 12"
                    stroke="url(#introLogoGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.h1
            className="text-4xl font-bold mt-8"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Suprik
          </motion.h1>

          {/* Loading dots */}
          <motion.div
            className="mt-8 flex space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>

          {/* Auto-advance fallback after 4 seconds */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            onAnimationComplete={handleComplete}
          />
        </motion.div>
      )}

    </div>
  );
}