# 🚀 Saturn Wallet - Optimization & Performance Guide

## 🎯 هدف: صفر Rebuild، انیمیشن‌های Smooth 60fps

---

## 📊 مشکلات رایج و راه‌حل‌ها

### ❌ مشکل 1: Component بیهوده Re-render میشه

```tsx
// ❌ Bad - هر بار parent render میشه، این component هم render میشه
function MyComponent({ data }) {
  return <div>{data.title}</div>;
}

// ✅ Good - فقط وقتی props تغییر کنه render میشه
import { memo } from 'react';

const MyComponent = memo(({ data }) => {
  return <div>{data.title}</div>;
});
```

### ❌ مشکل 2: Callback ها باعث Re-render میشن

```tsx
// ❌ Bad - هر render یک function جدید ساخته میشه
function Parent() {
  const handleClick = () => console.log('clicked');
  return <Child onClick={handleClick} />;
}

// ✅ Good - function reference ثابت میمونه
import { useCallback } from 'react';

function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // Empty deps = never changes
  
  return <Child onClick={handleClick} />;
}
```

### ❌ مشکل 3: Object/Array props باعث Re-render میشن

```tsx
// ❌ Bad - هر render یک object جدید
function Parent() {
  return <Child config={{ theme: 'dark' }} />;
}

// ✅ Good - object reference ثابت میمونه
import { useMemo } from 'react';

function Parent() {
  const config = useMemo(() => ({ theme: 'dark' }), []);
  return <Child config={config} />;
}
```

### ❌ مشکل 4: Expensive calculations در هر render

```tsx
// ❌ Bad - محاسبه سنگین در هر render
function Component({ items }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <div>{total}</div>;
}

// ✅ Good - فقط وقتی items تغییر کنه محاسبه میشه
import { useMemo } from 'react';

function Component({ items }) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  return <div>{total}</div>;
}
```

---

## 🎨 بهینه‌سازی انیمیشن‌ها

### 1. استفاده از Motion Variants (بهینه)

```tsx
// ✅ Good - تعریف variants خارج از component
import { fadeInVariants } from '@/utils/performance/animations';

const MyComponent = () => (
  <motion.div variants={fadeInVariants} initial="hidden" animate="visible">
    Content
  </motion.div>
);

// ❌ Bad - تعریف variants داخل component
const MyComponent = () => {
  const variants = { // این هر بار ساخته میشه!
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  
  return <motion.div variants={variants}>Content</motion.div>;
};
```

### 2. GPU Acceleration

```tsx
// ✅ Transform properties برای GPU acceleration
<motion.div
  animate={{ 
    x: 100,        // ✅ GPU-accelerated
    y: 100,        // ✅ GPU-accelerated
    scale: 1.2,    // ✅ GPU-accelerated
    rotate: 45,    // ✅ GPU-accelerated
    opacity: 0.5,  // ✅ GPU-accelerated
  }}
/>

// ❌ Layout properties (Trigger reflow)
<motion.div
  animate={{ 
    width: 100,    // ❌ Causes reflow
    height: 100,   // ❌ Causes reflow
    top: 100,      // ❌ Causes reflow
    left: 100,     // ❌ Causes reflow
  }}
/>
```

### 3. Layout Animation با layoutId

```tsx
// ✅ Smooth shared element transitions
<motion.div layoutId="card-1">
  <Card />
</motion.div>

// در صفحه دیگه:
<motion.div layoutId="card-1">
  <ExpandedCard />
</motion.div>
```

---

## 🔥 Context Optimization

### ❌ مشکل: Context باعث re-render همه consumers میشه

```tsx
// ❌ Bad - تغییر یک value باعث render همه میشه
const AppContext = createContext({ user, theme, settings });

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [settings, setSettings] = useState({});
  
  return (
    <AppContext.Provider value={{ user, theme, settings }}>
      <Children />
    </AppContext.Provider>
  );
}
```

### ✅ راه حل: Context های جداگانه

```tsx
// ✅ Good - هر context مستقل
const UserContext = createContext(null);
const ThemeContext = createContext('dark');
const SettingsContext = createContext({});

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [settings, setSettings] = useState({});
  
  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <SettingsContext.Provider value={settings}>
          <Children />
        </SettingsContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

### ✅ یا استفاده از useMemo

```tsx
const AppContext = createContext({ user, theme, settings });

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [settings, setSettings] = useState({});
  
  const value = useMemo(
    () => ({ user, theme, settings }),
    [user, theme, settings]
  );
  
  return (
    <AppContext.Provider value={value}>
      <Children />
    </AppContext.Provider>
  );
}
```

---

## 📱 List Optimization

### 1. Virtual List برای لیست‌های بلند

```tsx
import { VirtualList } from '@/components/optimization/VirtualList';

<VirtualList
  items={transactions} // 10,000 items
  itemHeight={80}
  containerHeight={600}
  renderItem={(item) => <TransactionCard transaction={item} />}
/>
```

### 2. Key های صحیح

```tsx
// ❌ Bad - index به عنوان key
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ✅ Good - unique ID
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### 3. Memo کردن List Items

```tsx
// ✅ هر item مستقل re-render میشه
const ListItem = memo(({ item }) => {
  return <div>{item.name}</div>;
});

{items.map((item) => (
  <ListItem key={item.id} item={item} />
))}
```

---

## 🖼️ Image Optimization

### 1. Lazy Loading

```tsx
import { LazyImage } from '@/components/optimization/LazyImage';

<LazyImage
  src="/large-image.jpg"
  alt="Description"
  width={400}
  height={300}
  priority={false} // false برای lazy load
  blur={true}      // blur effect تا load بشه
/>
```

### 2. Intersection Observer

```tsx
import { useIntersectionObserver } from '@/utils/performance/optimization';

const ref = useRef(null);
const isVisible = useIntersectionObserver(ref);

return (
  <div ref={ref}>
    {isVisible && <HeavyComponent />}
  </div>
);
```

---

## ⚡ Performance Hooks

### 1. useStableCallback

```tsx
import { useStableCallback } from '@/utils/performance/optimization';

// Reference هیچوقت تغییر نمی‌کنه
const handleClick = useStableCallback(() => {
  console.log('clicked');
});
```

### 2. useDebounce (برای Search)

```tsx
import { useDebounce } from '@/utils/performance/optimization';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // API call فقط بعد 300ms توقف typing
  searchAPI(debouncedSearch);
}, [debouncedSearch]);
```

### 3. useThrottle (برای Scroll)

```tsx
import { useThrottle } from '@/utils/performance/optimization';

const [scrollY, setScrollY] = useState(0);
const throttledScroll = useThrottle(scrollY, 100);

useEffect(() => {
  // Update UI هر 100ms یکبار
  updateHeader(throttledScroll);
}, [throttledScroll]);
```

### 4. useBatchedState (برای Multiple Updates)

```tsx
import { useBatchedState } from '@/utils/performance/optimization';

const [state, setState, flush] = useBatchedState({
  count: 0,
  items: [],
});

// Multiple updates batched در یک frame
setState(prev => ({ ...prev, count: prev.count + 1 }));
setState(prev => ({ ...prev, items: [...prev.items, newItem] }));
```

---

## 🎯 Component Patterns

### 1. Compound Components

```tsx
// ✅ فقط بخش‌هایی که تغییر می‌کنن render میشن
const Card = memo(({ children }) => (
  <div className="card">{children}</div>
));

const CardHeader = memo(({ children }) => (
  <div className="card-header">{children}</div>
));

const CardBody = memo(({ children }) => (
  <div className="card-body">{children}</div>
));

// Usage:
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

### 2. Render Props با Memo

```tsx
const DataProvider = memo(({ render, data }) => {
  return render(data);
});

// Usage:
<DataProvider
  data={data}
  render={useCallback((data) => (
    <Display data={data} />
  ), [])}
/>
```

---

## 🔧 Development Tools

### 1. React DevTools Profiler

```bash
# نصب extension:
# Chrome: React Developer Tools
# Firefox: React Developer Tools

# استفاده:
1. باز کردن DevTools
2. تب Profiler
3. Start recording
4. انجام action
5. Stop recording
6. بررسی flame graph
```

### 2. Performance Monitoring

```tsx
import { useMeasureRender } from '@/utils/performance/optimization';

function MyComponent() {
  useMeasureRender('MyComponent'); // Log render time to console
  
  return <div>Content</div>;
}
```

### 3. Why Did You Render

```tsx
// Install: npm install @welldone-software/why-did-you-render

import whyDidYouRender from '@welldone-software/why-did-you-render';

if (process.env.NODE_ENV === 'development') {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}

// در component:
MyComponent.whyDidYouRender = true;
```

---

## 📋 Checklist برای هر Component

```tsx
/**
 * ✅ Optimization Checklist
 */

// 1. ✅ Component wrapped با memo?
const MyComponent = memo(({ prop1, prop2 }) => {
  
  // 2. ✅ Expensive calculations wrapped با useMemo?
  const expensiveValue = useMemo(() => {
    return heavyCalculation(prop1);
  }, [prop1]);
  
  // 3. ✅ Callbacks wrapped با useCallback?
  const handleClick = useCallback(() => {
    doSomething(prop2);
  }, [prop2]);
  
  // 4. ✅ Child components با memo?
  const ChildComponent = memo(({ data }) => {
    return <div>{data}</div>;
  });
  
  // 5. ✅ Lists با virtual scrolling اگر بلند هستن?
  // 6. ✅ Images با lazy loading?
  // 7. ✅ Animations با GPU acceleration?
  
  return (
    <motion.div
      variants={fadeInVariants} // ✅ Variants خارج از component
      initial="hidden"
      animate="visible"
    >
      <LazyImage src="..." /> {/* ✅ Lazy loading */}
      <ChildComponent data={expensiveValue} /> {/* ✅ Memoized */}
      <button onClick={handleClick}>Click</button> {/* ✅ Stable callback */}
    </motion.div>
  );
});

export default MyComponent;
```

---

## 🎨 Animation Best Practices

### ✅ استفاده از Pre-defined Variants

```tsx
import { 
  fadeInVariants,
  slideUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/utils/performance/animations';

// Container با stagger
<motion.div variants={staggerContainerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItemVariants}>
      {item.title}
    </motion.div>
  ))}
</motion.div>
```

### ✅ Accessibility - Reduced Motion

```tsx
import { getAnimationVariants } from '@/utils/performance/animations';

// به صورت خودکار برای کاربران با prefers-reduced-motion ساده می‌شه
<motion.div variants={getAnimationVariants(slideUpVariants)}>
  Content
</motion.div>
```

---

## 🚀 Production Checklist

قبل از production این موارد رو چک کن:

```
[ ] همه components بزرگ memo شدن
[ ] همه callbacks با useCallback
[ ] همه expensive calculations با useMemo
[ ] لیست‌های بلند virtual scrolling دارن
[ ] عکس‌ها lazy load میشن
[ ] انیمیشن‌ها GPU-accelerated هستن
[ ] Context ها split شدن
[ ] Keys درست برای lists
[ ] Lighthouse score > 90
[ ] React DevTools Profiler چک شده
[ ] Memory leaks نداره
[ ] Bundle size optimization شده
[ ] Code splitting برای routes
[ ] Images optimized و compressed
[ ] Fonts preloaded
```

---

## 📊 Performance Metrics

### Target Metrics:

```
First Contentful Paint (FCP): < 1.5s
Largest Contentful Paint (LCP): < 2.5s
Time to Interactive (TTI): < 3.5s
Cumulative Layout Shift (CLS): < 0.1
First Input Delay (FID): < 100ms
```

### چک کردن:

```bash
# Lighthouse
npm run build
npx lighthouse http://localhost:3000

# Bundle Analyzer
npm install --save-dev @next/bundle-analyzer
# یا
npm install --save-dev webpack-bundle-analyzer
```

---

**با این optimizations، Saturn Wallet می‌تونه 60fps smooth animation داشته باشه و هیچ unnecessary re-render نداشته باشه! 🚀✨**
