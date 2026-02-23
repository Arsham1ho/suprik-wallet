import { useEffect, useRef, useCallback } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCalledComplete = useRef(false);
  const hasAttemptedPlay = useRef(false);

  const VIDEO_PATH = '/A_sleek_motion_202602200108_6kahy.mp4';

  const handleComplete = useCallback(() => {
    if (!hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    if (hasAttemptedPlay.current) return;
    hasAttemptedPlay.current = true;

    const video = videoRef.current;
    if (!video) {
      handleComplete();
      return;
    }

    const playVideo = async () => {
      try {
        video.muted = true;
        video.load();

        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            video.removeEventListener('canplaythrough', onCanPlay);
            video.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            video.removeEventListener('canplaythrough', onCanPlay);
            video.removeEventListener('error', onError);
            reject(new Error('Video load error'));
          };
          video.addEventListener('canplaythrough', onCanPlay);
          video.addEventListener('error', onError);
          setTimeout(() => {
            video.removeEventListener('canplaythrough', onCanPlay);
            video.removeEventListener('error', onError);
            reject(new Error('Video load timeout'));
          }, 5000);
        });

        await video.play();
      } catch {
        handleComplete();
      }
    };

    playVideo();

    const safetyTimer = setTimeout(() => {
      handleComplete();
    }, 15000);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [handleComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        zIndex: 9999,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .intro-video { object-fit: cover !important; }
        }
      `}</style>
      <video
        ref={videoRef}
        src={VIDEO_PATH}
        className="intro-video"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.15)',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: '100%',
          display: 'block',
        }}
        playsInline
        autoPlay
        muted
        preload="auto"
        onEnded={handleComplete}
        onError={() => handleComplete()}
        {...{ "webkit-playsinline": "true" }}
      />
    </div>
  );
}
