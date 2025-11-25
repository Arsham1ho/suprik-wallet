import { Button } from './ui/button';
import { useTheme } from '../utils/ThemeContext';
import { cn } from './ui/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'solid' | 'outline';
}

export function GradientButton({ 
  children, 
  className = '', 
  variant = 'default',
  disabled,
  ...props 
}: GradientButtonProps) {
  const { gradient } = useTheme();

  const baseClasses = 'text-white shadow-lg transition-all duration-300 font-semibold';
  
  const variantClasses = {
    default: `bg-gradient-to-r ${gradient} hover:opacity-90`,
    solid: `bg-gradient-to-r ${gradient}`,
    outline: `border-2 border-purple-500 bg-transparent hover:bg-gradient-to-r hover:${gradient}`,
  };

  return (
    <Button
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
