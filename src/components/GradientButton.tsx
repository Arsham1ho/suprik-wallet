import { ReactNode } from 'react';
import { Button } from './ui/button';
import { useTheme } from '../utils/ThemeContext';
import { cn } from './ui/utils';

export interface GradientButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'solid' | 'outline';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export function GradientButton({
  children,
  className = '',
  variant = 'default',
  disabled,
  type,
  onClick,
}: GradientButtonProps) {
  const { gradient } = useTheme();

  const baseClasses = 'text-white shadow-lg transition-all duration-300 font-semibold';

  const variantClasses = {
    default: `bg-gradient-to-r ${gradient} hover:opacity-90`,
    solid: `bg-gradient-to-r ${gradient}`,
    outline: `border-2 border-theme-accent bg-transparent hover:bg-gradient-to-r hover:${gradient}`,
  };

  return (
    <Button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </Button>
  );
}
