# 🎨 Saturn Wallet - Animation Fix Guide

## ✅ مشکل حل شد!

مشکلی که باعث می‌شد انیمیشن‌ها توی موبایل نمایش داده نشن (مثل چرخش لوگو) **حل شد**.

---

## 🐛 مشکل چی بود؟

توی فایل `/styles/globals.css` یک CSS rule اضافه شده بود که:

```css
/* ❌ BAD - این باعث می‌شد همه انیمیشن‌ها خیلی سریع بشن */
@media (max-width: 768px) {
  * {
    animation-duration: 0.3s !important;
    transition-duration: 0.2s !important;
  }
}
```

این rule باعث می‌شد:
- همه انیمیشن‌ها روی موبایل فقط 0.3 ثانیه طول بکشن
- انیمیشن‌هایی که باید infinite بچرخن، خیلی سریع تموم بشن
- لوگو نچرخه چون duration override میشه

---

## ✅ چه کاری انجام دادم؟

### 1. حذف CSS Rule مشکل‌دار

```css
/* ✅ FIXED - حذف شد */
```

### 2. Hardware Acceleration برای همه دستگاه‌ها

```css
/* ✅ حالا روی همه دستگاه‌ها فعاله (نه فقط desktop) */
@layer utilities {
  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
}
```

### 3. Animation Detection Utilities

ساختم utilities برای detect کردن و debug کردن انیمیشن‌ها:

```tsx
// Check animation support
import { 
  supportsAnimations,
  supports3DTransforms,
  supportsGPUAcceleration,
  debugAnimations 
} from '@/utils/mobile/detectAnimationSupport';

// Debug در console
debugAnimations();
```

### 4. Animation Debugger Component

یک component برای test و debug انیمیشن‌ها:

```tsx
import { AnimationDebugger } from '@/components/mobile/AnimationDebugger';

// اضافه کن به App
<AnimationDebugger />
```

---

## 🎯 چطور مطمئن بشم انیمیشن‌ها کار می‌کنن؟

### روش 1: استفاده از AnimationDebugger

```tsx
// در App.tsx یا هر صفحه‌ای
import { AnimationDebugger } from '@/components/mobile/AnimationDebugger';

function App() {
  return (
    <>
      <YourApp />
      {/* فقط برای development */}
      {process.env.NODE_ENV === 'development' && <AnimationDebugger />}
    </>
  );
}
```

بعد روی موبایل:
1. دکمه "🎨 Debug" رو بزن
2. تمام تست‌ها رو ببین:
   - ✅ Browser Support
   - ✅ Device Configuration  
   - ✅ Performance Test
   - ✅ Animation Tests (Rotation, Fade, Scale, Slide)

### روش 2: Console Debug

```tsx
import { debugAnimations } from '@/utils/mobile/detectAnimationSupport';

// در useEffect یا هر جا
useEffect(() => {
  debugAnimations();
}, []);
```

این اطلاعات زیر رو توی console نشون میده:
```
🎨 Animation Support Check:
✅ Animations: true
✅ Transforms: true
✅ 3D Transforms: true
✅ GPU Acceleration: true
⚠️ Reduced Motion: false
⚙️ Optimal Config: { ... }
📊 Performance Test: { fps: 60, smooth: true }
```

---

## 🔧 چطور انیمیشن‌هایم رو optimize کنم؟

### 1. استفاده از GPU-Accelerated Properties

```tsx
// ✅ GOOD - GPU accelerated
<motion.div
  animate={{
    x: 100,        // ✅ transform: translateX
    y: 100,        // ✅ transform: translateY
    scale: 1.2,    // ✅ transform: scale
    rotate: 45,    // ✅ transform: rotate
    opacity: 0.5,  // ✅ opacity
  }}
/>

// ❌ BAD - Causes reflow
<motion.div
  animate={{
    width: 100,    // ❌ Layout change
    height: 100,   // ❌ Layout change
    top: 100,      // ❌ Layout change
    left: 100,     // ❌ Layout change
  }}
/>
```

### 2. اضافه کردن GPU Acceleration Manual

```tsx
// برای component‌هایی که انیمیشن دارن
<div className="gpu-accelerated">
  <AnimatedContent />
</div>

// یا inline
<div style={{
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  perspective: '1000px',
}}>
  <AnimatedContent />
</div>
```

### 3. استفاده از Pre-defined Variants

```tsx
import { 
  fadeInVariants,
  slideUpVariants,
  scaleVariants,
} from '@/utils/performance/animations';

// ✅ Optimized variants
<motion.div variants={fadeInVariants} initial="hidden" animate="visible">
  Content
</motion.div>
```

---

## 🪐 مثال: چرخش لوگو

### قبل (ممکنه کار نکنه):

```tsx
function Logo() {
  return (
    <div
      style={{
        animation: 'spin 2s linear infinite',
      }}
    >
      🪐
    </div>
  );
}

// CSS
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### بعد (کار می‌کنه):

```tsx
import { motion } from 'motion/react';

function Logo() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="gpu-accelerated" // اضافه کن برای بهتر شدن
    >
      🪐
    </motion.div>
  );
}
```

یا با CSS (بعد از fix):

```tsx
function Logo() {
  return (
    <div
      className="animate-spin gpu-accelerated"
      style={{
        animation: 'spin 2s linear infinite',
        // مطمئن شو duration override نمیشه
      }}
    >
      🪐
    </div>
  );
}
```

---

## 📱 تست روی موبایل

### 1. Chrome DevTools Mobile Emulation

```
1. F12 برای باز کردن DevTools
2. Ctrl+Shift+M برای Mobile Emulation
3. انتخاب device (iPhone, Android)
4. تست انیمیشن‌ها
```

### 2. Remote Debugging (Android)

```
1. USB Debugging روی گوشی فعال کن
2. chrome://inspect در Chrome
3. گوشی رو ببین و inspect کن
```

### 3. Safari Developer (iOS)

```
1. Settings > Safari > Advanced > Web Inspector (روی iPhone)
2. Develop > [Your iPhone] در Safari desktop
3. انتخاب صفحه و inspect
```

---

## 🚀 Performance Tips

### 1. Reduce Motion برای Accessibility

```tsx
import { getAnimationVariants } from '@/utils/performance/animations';

// به صورت خودکار برای کاربرانی که prefers-reduced-motion دارن ساده میشه
<motion.div variants={getAnimationVariants(slideUpVariants)}>
  Content
</motion.div>
```

### 2. Lazy Load انیمیشن‌های سنگین

```tsx
import { useState, useEffect } from 'react';

function HeavyAnimation() {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    // فقط بعد از mount انیمیشن شروع بشه
    const timer = setTimeout(() => setShouldAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      animate={shouldAnimate ? { rotate: 360 } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Content
    </motion.div>
  );
}
```

### 3. Disable انیمیشن‌ها در Low Performance

```tsx
import { useEffect, useState } from 'react';
import { testAnimationPerformance } from '@/utils/mobile/detectAnimationSupport';

function App() {
  const [enableAnimations, setEnableAnimations] = useState(true);
  
  useEffect(() => {
    testAnimationPerformance().then(result => {
      if (!result.smooth) {
        setEnableAnimations(false);
        console.warn('Animations disabled due to poor performance');
      }
    });
  }, []);
  
  return (
    <div className={enableAnimations ? '' : 'reduce-motion'}>
      <YourApp />
    </div>
  );
}
```

---

## 🎨 Common Animation Patterns

### 1. Rotating Logo/Icon

```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  }}
  className="gpu-accelerated"
>
  🪐
</motion.div>
```

### 2. Pulsing Effect

```tsx
<motion.div
  animate={{
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
  Content
</motion.div>
```

### 3. Floating Effect

```tsx
<motion.div
  animate={{
    y: [0, -10, 0],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
  Content
</motion.div>
```

### 4. Shimmer Loading

```tsx
<motion.div
  animate={{
    backgroundPosition: ['200% 0', '-200% 0'],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  }}
  style={{
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200% 100%',
  }}
  className="gpu-accelerated"
>
  Content
</motion.div>
```

---

## ✅ Checklist

قبل از production، مطمئن شو:

```
[ ] همه انیمیشن‌ها روی موبایل تست شدن
[ ] AnimationDebugger رو تست کردی
[ ] GPU acceleration فعاله
[ ] Reduced motion support داره
[ ] Performance test > 55 FPS
[ ] لوگو می‌چرخه ✅
[ ] Fade animations کار می‌کنه ✅
[ ] Scale animations کار می‌کنه ✅
[ ] Slide animations کار می‌کنه ✅
[ ] Infinite animations کار می‌کنن ✅
```

---

## 🎉 نتیجه

**همه انیمیشن‌ها حالا روی موبایل کار می‌کنن!**

✅ لوگو می‌چرخه  
✅ انیمیشن‌ها smooth هستن  
✅ GPU acceleration فعاله  
✅ Performance بهینه  
✅ Mobile-friendly  

**اگر هنوز مشکلی هست، AnimationDebugger رو استفاده کن! 🚀**
