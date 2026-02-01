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
  const { colors } = useTheme();

  const baseClasses = 'text-white shadow-lg transition-all duration-300 font-semibold';

  const isOutline = variant === 'outline';

  const style: React.CSSProperties = isOutline
    ? { borderColor: colors.accent }
    : { background: `linear-gradient(to right, ${colors.primaryDark}, ${colors.primary})` };

  return (
    <Button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        baseClasses,
        isOutline ? 'border-2 bg-transparent hover:opacity-90' : 'hover:opacity-90',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={style}
    >
      {children}
    </Button>
  );
}
