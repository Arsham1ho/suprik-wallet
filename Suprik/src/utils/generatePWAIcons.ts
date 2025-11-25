/**
 * PWA Icon Generator
 * Generates placeholder icons for PWA installation
 * In production, replace with proper brand icons
 */

export function generatePWAIcon(size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create gradient background (purple to pink - Saturn theme)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#9333EA');  // Purple
  gradient.addColorStop(0.5, '#A855F7'); // Purple-500
  gradient.addColorStop(1, '#EC4899');  // Pink
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw Saturn logo (ring with planet)
  const centerX = size / 2;
  const centerY = size / 2;
  const planetRadius = size * 0.25;
  const ringWidth = size * 0.45;
  const ringHeight = size * 0.15;
  
  // Draw ring (behind planet)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, ringWidth, ringHeight, -0.3, 0, Math.PI);
  ctx.stroke();
  
  // Draw planet
  const planetGradient = ctx.createRadialGradient(
    centerX - planetRadius * 0.3,
    centerY - planetRadius * 0.3,
    0,
    centerX,
    centerY,
    planetRadius
  );
  planetGradient.addColorStop(0, '#FFF');
  planetGradient.addColorStop(0.7, '#E9D5FF');
  planetGradient.addColorStop(1, '#C084FC');
  
  ctx.fillStyle = planetGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw ring (in front of planet)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, ringWidth, ringHeight, -0.3, Math.PI, Math.PI * 2);
  ctx.stroke();
  
  // Add "S" text for smaller icons
  if (size <= 128) {
    ctx.fillStyle = '#5B21B6';
    ctx.font = `bold ${size * 0.25}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', centerX, centerY);
  }
  
  return canvas.toDataURL('image/png');
}

/**
 * Create and download all required PWA icons
 */
export async function generateAllPWAIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons: { [key: string]: string } = {};
  
  for (const size of sizes) {
    const dataUrl = generatePWAIcon(size);
    icons[`icon-${size}x${size}.png`] = dataUrl;
    console.log(`✓ Generated ${size}x${size} icon`);
  }
  
  return icons;
}

/**
 * Install icons to browser cache
 * This is a fallback when /public/icons/ doesn't exist
 */
export function installPWAIconsToCache() {
  if ('caches' in window) {
    generateAllPWAIcons().then(async (icons) => {
      const cache = await caches.open('saturn-pwa-icons-v1');
      
      for (const [filename, dataUrl] of Object.entries(icons)) {
        const response = new Response(
          await (await fetch(dataUrl)).blob(),
          {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000',
            },
          }
        );
        
        await cache.put(`/icons/${filename}`, response);
        console.log(`✓ Cached /icons/${filename}`);
      }
      
      console.log('✅ All PWA icons installed to cache');
    });
  }
}
