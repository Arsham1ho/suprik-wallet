# 📱 Saturn Wallet - Mobile Optimization Guide

## 🎯 Overview

Saturn Wallet حالا کاملاً برای موبایل بهینه شده با:
- ✅ PWA (Progressive Web App)
- ✅ Touch Gestures
- ✅ Native-like UX
- ✅ Offline Support
- ✅ Install to Home Screen
- ✅ Haptic Feedback
- ✅ Safe Area Support (Notch/Dynamic Island)

---

## 📦 فایل‌های ایجاد شده

### 1. PWA Configuration
```
/public/manifest.json       - PWA manifest
/public/sw.js              - Service worker
```

### 2. Mobile Utilities
```
/utils/mobile/gestures.ts  - Touch gestures & haptic
/utils/mobile/pwa.ts       - PWA management
```

### 3. Mobile Components
```
/components/mobile/BottomSheet.tsx     - Native bottom sheet
/components/mobile/PullToRefresh.tsx   - Pull to refresh
/components/mobile/InstallPWA.tsx      - Install prompt
```

### 4. Styles
```
/styles/globals.css        - Mobile optimizations & safe area
```

---

## 🎨 Features

### 1. Touch Gestures

#### Swipe Detection
```tsx
import { useSwipe } from '@/utils/mobile/gestures';

function MyComponent() {
  const ref = useRef(null);
  
  useSwipe(ref, {
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
  });
  
  return <div ref={ref}>Swipe me!</div>;
}
```

#### Pull to Refresh
```tsx
import { PullToRefresh } from '@/components/mobile/PullToRefresh';

function MyPage() {
  const handleRefresh = async () => {
    // Refresh data
    await fetchData();
  };
  
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <YourContent />
    </PullToRefresh>
  );
}
```

#### Long Press
```tsx
import { useLongPress } from '@/utils/mobile/gestures';

function MyButton() {
  const longPressHandlers = useLongPress(() => {
    console.log('Long pressed!');
  }, 500); // 500ms duration
  
  return (
    <button {...longPressHandlers}>
      Hold me
    </button>
  );
}
```

---

### 2. Haptic Feedback

```tsx
import { haptic } from '@/utils/mobile/gestures';

// Light tap
haptic.light();

// Medium tap
haptic.medium();

// Heavy tap
haptic.heavy();

// Success pattern
haptic.success();

// Error pattern
haptic.error();

// Selection change
haptic.selection();
```

استفاده در کامپوننت:
```tsx
function SendButton() {
  const handleSend = async () => {
    try {
      haptic.medium(); // User pressed button
      await send();
      haptic.success(); // Transaction successful
    } catch (error) {
      haptic.error(); // Transaction failed
    }
  };
  
  return <Button onClick={handleSend}>Send</Button>;
}
```

---

### 3. Bottom Sheet (Native-like)

```tsx
import { BottomSheet } from '@/components/mobile/BottomSheet';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Sheet
      </Button>
      
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Option"
        height="half" // 'auto' | 'half' | 'full'
        showHandle={true}
        closeOnBackdrop={true}
      >
        <YourContent />
      </BottomSheet>
    </>
  );
}
```

**Features:**
- ✅ Draggable to close
- ✅ Backdrop blur
- ✅ Auto height
- ✅ Spring animations
- ✅ Safe area support

---

### 4. PWA Installation

```tsx
import { InstallPWA } from '@/components/mobile/InstallPWA';

function App() {
  return (
    <div>
      <YourApp />
      <InstallPWA />
    </div>
  );
}
```

**Functions:**
```tsx
import { 
  canInstallPWA, 
  showPWAInstall, 
  isRunningAsPWA 
} from '@/utils/mobile/pwa';

// Check if can install
if (canInstallPWA()) {
  // Show custom install UI
}

// Trigger install
const installed = await showPWAInstall();

// Check if running as PWA
if (isRunningAsPWA()) {
  // Hide browser UI elements
}
```

---

### 5. Safe Area (Notch/Dynamic Island)

```tsx
import { useSafeArea } from '@/utils/mobile/gestures';

function MyComponent() {
  const insets = useSafeArea();
  
  return (
    <div style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      Content safe from notch!
    </div>
  );
}
```

**CSS Variables:**
```css
.my-header {
  padding-top: var(--sat); /* safe-area-inset-top */
}

.my-bottom-nav {
  padding-bottom: var(--sab); /* safe-area-inset-bottom */
}
```

---

## 🚀 PWA Setup

### 1. Initialize PWA in App

```tsx
// App.tsx or _app.tsx
import { useEffect } from 'react';
import { 
  initPWAInstall, 
  registerServiceWorker 
} from '@/utils/mobile/pwa';

function App() {
  useEffect(() => {
    // Initialize PWA
    initPWAInstall();
    
    // Register service worker
    registerServiceWorker();
  }, []);
  
  return <YourApp />;
}
```

### 2. Add to index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#9333EA">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Saturn">
  
  <!-- PWA Icons -->
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  
  <!-- Splash Screens (iOS) -->
  <link rel="apple-touch-startup-image" href="/splash/iphone5.png" media="(device-width: 320px)">
  <link rel="apple-touch-startup-image" href="/splash/iphone6.png" media="(device-width: 375px)">
  <link rel="apple-touch-startup-image" href="/splash/iphoneplus.png" media="(device-width: 414px)">
  <link rel="apple-touch-startup-image" href="/splash/iphonex.png" media="(device-width: 375px) and (device-height: 812px)">
  <link rel="apple-touch-startup-image" href="/splash/iphonexr.png" media="(device-width: 414px) and (device-height: 896px)">
  <link rel="apple-touch-startup-image" href="/splash/iphonexsmax.png" media="(device-width: 414px) and (device-height: 896px)">
  <link rel="apple-touch-startup-image" href="/splash/ipad.png" media="(device-width: 768px)">
  <link rel="apple-touch-startup-image" href="/splash/ipadpro1.png" media="(device-width: 834px)">
  <link rel="apple-touch-startup-image" href="/splash/ipadpro2.png" media="(device-width: 1024px)">
  
  <title>Saturn Wallet</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

---

## 📐 Responsive Design Best Practices

### 1. Mobile-First Tailwind
```tsx
// ✅ Good - Mobile first
<div className="text-sm md:text-base lg:text-lg">

// ❌ Bad - Desktop first
<div className="text-lg md:text-base sm:text-sm">
```

### 2. Touch-Friendly Buttons
```tsx
// ✅ Minimum 44x44px tap target
<button className="min-h-[44px] min-w-[44px] p-3">

// ❌ Too small
<button className="p-1">
```

### 3. Fixed Bottom Navigation
```tsx
<nav className="fixed bottom-0 left-0 right-0 pb-safe-bottom">
  {/* Navigation items */}
</nav>
```

### 4. Prevent Zoom on Input Focus (iOS)
```html
<input 
  type="text" 
  className="text-base" 
  style={{ fontSize: '16px' }}
/>
```

---

## 🎯 Performance Optimizations

### 1. Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 2. Image Optimization
```tsx
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

<ImageWithFallback
  src="image.jpg"
  alt="Description"
  loading="lazy"
  className="w-full h-auto"
/>
```

### 3. Virtualized Lists (for long lists)
```tsx
// For very long lists, consider using react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>Item {index}</div>
  )}
</FixedSizeList>
```

---

## 🔧 Mobile-Specific Utilities

### Check Device Type
```tsx
import { isMobile, isPWA } from '@/utils/mobile/gestures';

if (isMobile()) {
  // Show mobile UI
}

if (isPWA()) {
  // Hide "Install App" prompt
}
```

### Get Device Info
```tsx
import { getDeviceInfo } from '@/utils/mobile/pwa';

const info = getDeviceInfo();
console.log(info);
// {
//   isMobile: true,
//   isIOS: true,
//   isAndroid: false,
//   isPWA: true,
//   hasNotch: true,
//   screenWidth: 390,
//   screenHeight: 844,
//   viewport: { width: 390, height: 844 }
// }
```

### Prevent Double-Tap Zoom (iOS)
```tsx
import { preventDoubleTabZoom } from '@/utils/mobile/gestures';

useEffect(() => {
  const element = document.body;
  preventDoubleTabZoom(element);
}, []);
```

---

## 🎨 Mobile UI Patterns

### 1. Action Sheet
```tsx
function ActionSheet() {
  return (
    <BottomSheet isOpen={true} onClose={() => {}}>
      <div className="space-y-2">
        <button className="w-full text-left p-4 hover:bg-slate-800 rounded-xl">
          Share
        </button>
        <button className="w-full text-left p-4 hover:bg-slate-800 rounded-xl">
          Copy Link
        </button>
        <button className="w-full text-left p-4 hover:bg-slate-800 rounded-xl text-red-400">
          Delete
        </button>
      </div>
    </BottomSheet>
  );
}
```

### 2. Floating Action Button
```tsx
function FAB() {
  return (
    <button className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center z-50">
      <Plus className="w-6 h-6 text-white" />
    </button>
  );
}
```

### 3. Toast Notifications (Mobile-Optimized)
```tsx
import { toast } from 'sonner@2.0.3';

toast.success('Transaction sent!', {
  position: 'top-center',
  duration: 3000,
});
```

### 4. Loading Skeleton
```tsx
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-slate-800 rounded-xl" />
      <div className="h-20 bg-slate-800 rounded-xl" />
      <div className="h-20 bg-slate-800 rounded-xl" />
    </div>
  );
}
```

---

## 📱 Testing Checklist

### Before Launch:

#### PWA
- [ ] PWA manifest valid
- [ ] Service worker registered
- [ ] Icons all sizes present
- [ ] Splash screens configured
- [ ] Offline mode works
- [ ] Install prompt appears

#### Gestures
- [ ] Swipe navigation works
- [ ] Pull to refresh works
- [ ] Long press works
- [ ] Haptic feedback works

#### UI/UX
- [ ] Safe area respected (notch)
- [ ] Bottom nav accessible
- [ ] Touch targets 44x44px min
- [ ] No zoom on input focus
- [ ] Smooth animations
- [ ] Bottom sheet draggable

#### Performance
- [ ] Fast load time (<3s)
- [ ] Smooth scrolling (60fps)
- [ ] No layout shifts
- [ ] Images optimized
- [ ] Lazy loading works

#### Compatibility
- [ ] iOS Safari works
- [ ] Android Chrome works
- [ ] PWA install works
- [ ] Offline works
- [ ] Push notifications work

---

## 🐛 Common Issues & Solutions

### Issue: Double-tap zoom on iOS
```tsx
// Solution: Add to globals.css
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
```

### Issue: Input zoom on iOS
```tsx
// Solution: Use 16px font size
<input className="text-base" style={{ fontSize: '16px' }} />
```

### Issue: Keyboard covers input
```tsx
// Solution: Scroll input into view
useEffect(() => {
  inputRef.current?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
}, [isFocused]);
```

### Issue: Pull to refresh conflicts
```css
/* Solution: Disable default pull-to-refresh */
html, body {
  overscroll-behavior-y: none;
}
```

### Issue: Notch covers content
```tsx
// Solution: Use safe area
<div className="pt-safe-top pb-safe-bottom">
  {content}
</div>
```

---

## 🎯 Next Steps

1. **Generate PWA Icons**
   ```bash
   # Use a tool like:
   # https://realfavicongenerator.net/
   # Or PWA Asset Generator
   npx pwa-asset-generator logo.svg ./public/icons
   ```

2. **Test on Real Devices**
   - iPhone (Safari)
   - Android (Chrome)
   - iPad
   - Various screen sizes

3. **Add Push Notifications**
   ```tsx
   import { requestNotificationPermission } from '@/utils/mobile/pwa';
   
   const permission = await requestNotificationPermission();
   if (permission === 'granted') {
     // Subscribe to push
   }
   ```

4. **Add Offline Sync**
   ```tsx
   // Queue transactions when offline
   // Sync when back online
   ```

5. **Add Share API**
   ```tsx
   if (navigator.share) {
     await navigator.share({
       title: 'Saturn Wallet',
       text: 'Check out my wallet!',
       url: window.location.href,
     });
   }
   ```

---

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [iOS Safe Area](https://developer.apple.com/design/human-interface-guidelines/foundations/layout/)
- [Android Guidelines](https://developer.android.com/guide)
- [Touch Gestures](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

---

**Saturn Wallet حالا یک Native-like Mobile Experience داره! 🚀📱**
