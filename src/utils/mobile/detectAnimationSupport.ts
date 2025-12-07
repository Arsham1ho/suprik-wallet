/**
 * Animation Support Detection
 * Detect and ensure animations work on mobile
 */

/**
 * Check if CSS animations are supported
 */
export function supportsAnimations(): boolean {
  const el = document.createElement('div');
  const animations = [
    'animation',
    'webkitAnimation',
    'MozAnimation',
    'msAnimation',
    'OAnimation',
  ];
  
  for (const prop of animations) {
    if (el.style[prop as any] !== undefined) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if CSS transforms are supported
 */
export function supportsTransforms(): boolean {
  const el = document.createElement('div');
  const transforms = [
    'transform',
    'webkitTransform',
    'MozTransform',
    'msTransform',
    'OTransform',
  ];
  
  for (const prop of transforms) {
    if (el.style[prop as any] !== undefined) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if 3D transforms are supported
 */
export function supports3DTransforms(): boolean {
  const el = document.createElement('div');
  
  if (!supportsTransforms()) {
    return false;
  }
  
  // Test for 3D transform support
  el.style.transform = 'translate3d(1px, 1px, 1px)';
  const has3D = el.style.transform !== '';
  
  return has3D;
}

/**
 * Check if GPU acceleration is available
 */
export function supportsGPUAcceleration(): boolean {
  return supports3DTransforms();
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Get optimal animation config for device
 */
export function getOptimalAnimationConfig() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  const hasGPU = supportsGPUAcceleration();
  const reducedMotion = prefersReducedMotion();
  
  return {
    isMobile,
    hasGPU,
    reducedMotion,
    // Recommended settings
    duration: reducedMotion ? 0 : isMobile ? 0.3 : 0.4,
    springDamping: isMobile ? 30 : 25,
    springStiffness: isMobile ? 250 : 300,
    useGPU: hasGPU,
  };
}

/**
 * Force enable hardware acceleration
 */
export function enableHardwareAcceleration(element: HTMLElement) {
  element.style.transform = 'translateZ(0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  element.style.willChange = 'transform';
}

/**
 * Disable hardware acceleration
 */
export function disableHardwareAcceleration(element: HTMLElement) {
  element.style.transform = '';
  element.style.backfaceVisibility = '';
  element.style.perspective = '';
  element.style.willChange = 'auto';
}

/**
 * Test animation performance
 */
export async function testAnimationPerformance(): Promise<{
  fps: number;
  smooth: boolean;
}> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      top: -100px;
      left: -100px;
      width: 10px;
      height: 10px;
      background: red;
    `;
    document.body.appendChild(el);
    
    let frames = 0;
    let lastTime = performance.now();
    const duration = 1000; // Test for 1 second
    
    function animate() {
      frames++;
      const now = performance.now();
      
      if (now - lastTime >= duration) {
        const fps = Math.round(frames);
        document.body.removeChild(el);
        resolve({
          fps,
          smooth: fps >= 55, // Consider 55+ fps as smooth
        });
      } else {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  });
}

/**
 * Debug animation issues
 */
export function debugAnimations() {
  console.log('🎨 Animation Support Check:');
  console.log('✅ Animations:', supportsAnimations());
  console.log('✅ Transforms:', supportsTransforms());
  console.log('✅ 3D Transforms:', supports3DTransforms());
  console.log('✅ GPU Acceleration:', supportsGPUAcceleration());
  console.log('⚠️ Reduced Motion:', prefersReducedMotion());
  
  const config = getOptimalAnimationConfig();
  console.log('⚙️ Optimal Config:', config);
  
  testAnimationPerformance().then(result => {
    console.log('📊 Performance Test:', result);
  });
}

/**
 * Initialize animations with optimal settings
 */
export function initAnimations() {
  const config = getOptimalAnimationConfig();
  
  // Add class to document for CSS targeting
  if (config.reducedMotion) {
    document.documentElement.classList.add('reduce-motion');
  }
  
  if (config.isMobile) {
    document.documentElement.classList.add('is-mobile');
  }
  
  if (config.hasGPU) {
    document.documentElement.classList.add('has-gpu');
  }
  
  // Set CSS variables
  document.documentElement.style.setProperty('--animation-duration', `${config.duration}s`);
  document.documentElement.style.setProperty('--spring-damping', `${config.springDamping}`);
  document.documentElement.style.setProperty('--spring-stiffness', `${config.springStiffness}`);
  
  return config;
}

/**
 * Fix iOS animation bugs
 */
export function fixIOSAnimations() {
  if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return;
  }
  
  // Force repaint to fix iOS animation bugs
  document.body.style.display = 'none';
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = '';
}

/**
 * Optimize animations for device
 */
export function optimizeAnimationsForDevice() {
  const config = getOptimalAnimationConfig();
  
  // Add global style optimizations
  const style = document.createElement('style');
  style.textContent = `
    ${config.reducedMotion ? `
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    ` : ''}
    
    ${config.hasGPU ? `
      .animate-gpu {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
    ` : ''}
    
    ${config.isMobile ? `
      /* Optimize mobile animations */
      .mobile-optimize {
        animation-timing-function: ease-out;
        transition-timing-function: ease-out;
      }
    ` : ''}
  `;
  document.head.appendChild(style);
  
  return config;
}
