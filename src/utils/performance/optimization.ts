/**
 * Performance Optimization Utilities
 * Prevent unnecessary re-renders and optimize animations
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Deep comparison for objects
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Use previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Use debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Use throttled value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);
  
  return throttledValue;
}

/**
 * Use stable callback (never changes reference)
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}

/**
 * Use mounted state
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return useCallback(() => isMounted.current, []);
}

/**
 * Use animation frame
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, deps: any[] = []) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, deps);
}

/**
 * Lazy load component
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(factory);
  let factoryPromise: Promise<{ default: T }> | undefined;
  
  const load = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
    return factoryPromise;
  };
  
  return Object.assign(LazyComponent, { preload: load });
}

/**
 * Use intersection observer (for lazy loading)
 */
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.root, options.rootMargin]);
  
  return isIntersecting;
}

/**
 * Measure component render time
 */
export function useMeasureRender(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      console.log(`[${componentName}] Render #${renderCount.current}: ${duration.toFixed(2)}ms`);
    };
  });
}

/**
 * Batch state updates
 */
export function useBatchedState<T>(
  initialState: T
): [T, (updater: (prev: T) => T) => void, () => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Array<(prev: T) => T>>([]);
  const rafId = useRef<number>();
  
  const flush = useCallback(() => {
    if (pendingUpdates.current.length > 0) {
      setState((prev) => {
        let next = prev;
        for (const updater of pendingUpdates.current) {
          next = updater(next);
        }
        return next;
      });
      pendingUpdates.current = [];
    }
    rafId.current = undefined;
  }, []);
  
  const batchedSetState = useCallback(
    (updater: (prev: T) => T) => {
      pendingUpdates.current.push(updater);
      
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );
  
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);
  
  return [state, batchedSetState, flush];
}

/**
 * Prevent layout shift
 */
export function usePreventLayoutShift(elementRef: RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [elementRef]);
  
  return dimensions;
}

/**
 * Virtual list hook (for long lists)
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );
  
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

/**
 * Memoize expensive computations
 */
export function useMemoCompare<T>(
  factory: () => T,
  deps: any[],
  compare: (a: any[], b: any[]) => boolean = deepEqual
): T {
  const ref = useRef<{ deps: any[]; value: T }>();
  
  if (!ref.current || !compare(deps, ref.current.deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }
  
  return ref.current.value;
}

/**
 * Optimize image loading
 */
export function useOptimizedImage(src: string, options?: {
  blur?: boolean;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    
    if (options?.priority) {
      img.loading = 'eager';
    } else {
      img.loading = 'lazy';
    }
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, options?.priority]);
  
  return { loaded, error };
}

import { useState } from 'react';
import { lazy, RefObject } from 'react';
