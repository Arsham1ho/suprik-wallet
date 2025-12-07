/**
 * Lazy Loading Optimized Image
 * Prevents layout shift and optimizes loading
 */

import { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionObserver, useOptimizedImage } from '../../utils/performance/optimization';
import { motion, AnimatePresence } from 'motion/react';
import { fadeInVariants } from '../../utils/performance/animations';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  blur?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  blur = true,
  fallback,
  onLoad,
  onError,
}: LazyImageProps) {
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(imgRef, {
    threshold: 0.01,
    rootMargin: '50px',
  });

  const { loaded, error } = useOptimizedImage(shouldLoad ? src : '', { priority });

  useEffect(() => {
    if (isVisible || priority) {
      setShouldLoad(true);
    }
  }, [isVisible, priority]);

  useEffect(() => {
    if (loaded && onLoad) {
      onLoad();
    }
    if (error && onError) {
      onError();
    }
  }, [loaded, error, onLoad, onError]);

  const displaySrc = error && fallback ? fallback : src;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!loaded && shouldLoad && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}

      {/* Image */}
      <AnimatePresence>
        {loaded && (
          <motion.img
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            src={displaySrc}
            alt={alt}
            className={`w-full h-full object-cover ${blur && !loaded ? 'blur-sm' : ''}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
      </AnimatePresence>

      {/* Error fallback */}
      {error && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400 text-sm">
          Failed to load
        </div>
      )}
    </div>
  );
});
