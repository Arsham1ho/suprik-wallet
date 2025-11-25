/**
 * Animation Optimization Utilities
 * Smooth 60fps animations with GPU acceleration
 */

/**
 * Common animation variants for Framer Motion
 */
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // Custom easing
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

export const slideUpVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    }
  }
};

export const slideDownVariants = {
  hidden: { 
    opacity: 0, 
    y: -20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: { 
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

export const scaleVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

export const slideLeftVariants = {
  hidden: { 
    opacity: 0, 
    x: 50,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: { 
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

export const slideRightVariants = {
  hidden: { 
    opacity: 0, 
    x: -50,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: { 
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

/**
 * Staggered children animation
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    }
  }
};

export const staggerItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    }
  }
};

/**
 * Page transition variants
 */
export const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    }
  }
};

/**
 * Modal/Dialog variants
 */
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
    }
  }
};

/**
 * Bottom sheet variants (mobile)
 */
export const bottomSheetVariants = {
  hidden: { 
    y: '100%',
  },
  visible: { 
    y: 0,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
    }
  },
  exit: { 
    y: '100%',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    }
  }
};

/**
 * Card hover variants
 */
export const cardHoverVariants = {
  rest: { 
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  hover: { 
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 0.2, 1],
    }
  }
};

/**
 * Loading spinner variants
 */
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    }
  }
};

/**
 * Pulse animation variants
 */
export const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }
  }
};

/**
 * Shimmer loading variants
 */
export const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    }
  }
};

/**
 * Bounce variants
 */
export const bounceVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    }
  }
};

/**
 * Slide notification variants
 */
export const notificationVariants = {
  initial: { 
    opacity: 0, 
    y: -50,
    scale: 0.95,
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  }
};

/**
 * Expand/Collapse variants
 */
export const expandVariants = {
  collapsed: { 
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  expanded: { 
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  }
};

/**
 * Tab switch variants
 */
export const tabContentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }
  })
};

/**
 * Spring animation config
 */
export const springConfig = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
  mass: 0.5,
};

export const softSpringConfig = {
  type: 'spring',
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

export const stiffSpringConfig = {
  type: 'spring',
  damping: 20,
  stiffness: 400,
  mass: 0.3,
};

/**
 * Custom easing functions
 */
export const customEasing = {
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInOutQuart: [0.76, 0, 0.24, 1],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  smooth: [0.4, 0, 0.2, 1],
};

/**
 * GPU-accelerated animation properties
 */
export const gpuAcceleratedProps = {
  style: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    perspective: 1000,
    willChange: 'transform',
  }
};

/**
 * Reduce motion for accessibility
 */
export function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAnimationVariants(variants: any) {
  if (getReducedMotion()) {
    // Return simplified variants without motion
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    };
  }
  return variants;
}
