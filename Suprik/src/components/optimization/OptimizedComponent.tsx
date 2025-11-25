/**
 * Optimized Component Wrapper
 * Prevents unnecessary re-renders
 */

import { memo, ReactNode } from 'react';
import { deepEqual } from '../../utils/performance/optimization';

interface OptimizedComponentProps {
  children: ReactNode;
  deps?: any[];
  name?: string;
}

/**
 * Wrapper component with deep comparison
 */
export const OptimizedComponent = memo(
  ({ children }: OptimizedComponentProps) => {
    return <>{children}</>;
  },
  (prevProps, nextProps) => {
    return deepEqual(prevProps, nextProps);
  }
);

OptimizedComponent.displayName = 'OptimizedComponent';

/**
 * HOC for optimizing components
 */
export function withOptimization<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const OptimizedComp = memo(Component, (prevProps, nextProps) => {
    return deepEqual(prevProps, nextProps);
  });
  
  OptimizedComp.displayName = displayName || `Optimized(${Component.displayName || Component.name})`;
  
  return OptimizedComp;
}

/**
 * Example usage:
 * 
 * const MyComponent = ({ data, onAction }) => {
 *   return <div>{data.title}</div>;
 * };
 * 
 * export default withOptimization(MyComponent, 'MyComponent');
 */
