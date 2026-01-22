/**
 * Scroll to top utility that works on both mobile and desktop
 * On desktop, the wallet-container is the scrollable element
 * On mobile, the window/document is the scrollable element
 */
function doScrollToTop(): void {
  // Scroll window (mobile)
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Scroll wallet-container (desktop)
  const walletContainer = document.querySelector('.wallet-container');
  if (walletContainer) {
    walletContainer.scrollTop = 0;
  }

  // Also try scrolling #root
  const root = document.getElementById('root');
  if (root) {
    root.scrollTop = 0;
  }
}

export function scrollToTop(): void {
  // Scroll immediately
  doScrollToTop();

  // Also scroll after a microtask to ensure DOM has updated
  requestAnimationFrame(() => {
    doScrollToTop();
  });
}
