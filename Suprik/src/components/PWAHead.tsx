/**
 * PWA Head - Meta tags and manifest for Progressive Web App
 * This component should be included in the document head
 */

export function PWAHead() {
  return (
    <>
      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#9333EA" />
      <meta name="msapplication-TileColor" content="#9333EA" />
      
      {/* Apple Touch Icons */}
      <link rel="apple-touch-icon" sizes="180x180" href="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      
      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="512x512" href="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      
      {/* iOS Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Suprik Wallet" />
      
      {/* Mobile Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
      
      {/* App Description */}
      <meta name="description" content="Suprik Wallet - Your Web3 Solana Wallet. Fast, Secure, Beautiful." />
      <meta name="keywords" content="crypto, wallet, solana, web3, defi, nft" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Suprik Wallet" />
      <meta property="og:description" content="Your Web3 Solana Wallet - Fast, Secure, Beautiful" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Suprik Wallet" />
      <meta name="twitter:description" content="Your Web3 Solana Wallet - Fast, Secure, Beautiful" />
      <meta name="twitter:image" content="https://i.ibb.co/zWTXB2nZ/cropped-circle-image.png" />
    </>
  );
}