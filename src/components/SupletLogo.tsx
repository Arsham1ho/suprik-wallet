// Dynamic Suprik Logo - No external assets needed
// This works in all environments including Vercel

interface SuprikLogoProps {
  size?: number;
  className?: string;
}

export function SuprikLogo({ size = 120, className = '' }: SuprikLogoProps) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for planet */}
          <radialGradient id="planetGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
          </radialGradient>
          
          {/* Gradient for ring */}
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer glow */}
        <circle 
          cx="100" 
          cy="100" 
          r="70" 
          fill="url(#planetGradient)" 
          opacity="0.2"
          filter="url(#glow)"
        />
        
        {/* Main planet body */}
        <circle 
          cx="100" 
          cy="100" 
          r="55" 
          fill="url(#planetGradient)"
        />
        
        {/* Planet surface details */}
        <circle 
          cx="85" 
          cy="90" 
          r="12" 
          fill="#7c3aed" 
          opacity="0.4"
        />
        <circle 
          cx="115" 
          cy="105" 
          r="8" 
          fill="#7c3aed" 
          opacity="0.3"
        />
        <circle 
          cx="100" 
          cy="115" 
          r="6" 
          fill="#7c3aed" 
          opacity="0.35"
        />
        
        {/* Rings (back part) */}
        <ellipse
          cx="100"
          cy="100"
          rx="85"
          ry="25"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="6"
          opacity="0.6"
          transform="rotate(-20 100 100)"
        />
        
        {/* Ring shadow on planet */}
        <ellipse
          cx="100"
          cy="95"
          rx="50"
          ry="8"
          fill="#000000"
          opacity="0.2"
          transform="rotate(-20 100 95)"
        />
        
        {/* Rings (front part) */}
        <ellipse
          cx="100"
          cy="100"
          rx="85"
          ry="25"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="6"
          opacity="0.8"
          transform="rotate(-20 100 100)"
          strokeDasharray="0,270,200"
        />
        
        {/* Highlight on planet */}
        <circle 
          cx="90" 
          cy="85" 
          r="15" 
          fill="white" 
          opacity="0.15"
        />
      </svg>
    </div>
  );
}

// For backward compatibility - export as an image URL
export function getSuprikLogoSVGDataUrl(): string {
  const svg = `
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="planetGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#a855f7" stop-opacity="1" />
          <stop offset="50%" stop-color="#8b5cf6" stop-opacity="1" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="1" />
        </radialGradient>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ec4899" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#d946ef" stop-opacity="1" />
          <stop offset="100%" stop-color="#ec4899" stop-opacity="0.8" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="55" fill="url(#planetGradient)"/>
      <circle cx="85" cy="90" r="12" fill="#7c3aed" opacity="0.4"/>
      <circle cx="115" cy="105" r="8" fill="#7c3aed" opacity="0.3"/>
      <circle cx="100" cy="115" r="6" fill="#7c3aed" opacity="0.35"/>
      <ellipse cx="100" cy="100" rx="85" ry="25" fill="none" stroke="url(#ringGradient)" stroke-width="6" opacity="0.6" transform="rotate(-20 100 100)"/>
      <ellipse cx="100" cy="95" rx="50" ry="8" fill="#000000" opacity="0.2" transform="rotate(-20 100 95)"/>
      <ellipse cx="100" cy="100" rx="85" ry="25" fill="none" stroke="url(#ringGradient)" stroke-width="6" opacity="0.8" transform="rotate(-20 100 100)" stroke-dasharray="0,270,200"/>
      <circle cx="90" cy="85" r="15" fill="white" opacity="0.15"/>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
