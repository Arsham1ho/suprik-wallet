# 👤 Chat User Profile Enhancement

## نمای کلی
اطلاعات کاربری (عکس پروفایل و نام کاربری) به صفحه چت اضافه شد و کاربران می‌توانند با کلیک روی avatar یا username، پروفایل یکدیگر را مشاهده کنند.

## تغییرات انجام شده

### 1. کامپوننت جدید: UserProfileCard

**مسیر**: `/components/UserProfileCard.tsx`

ویژگی‌ها:
- 🎨 کارت پروفایل زیبا با gradient header
- 🌍 نمایش Planet Avatar بزرگ
- ℹ️ اطلاعات کامل کاربر:
  - نام کاربری
  - Wallet ID (فرمت کوتاه شده)
  - تاریخ عضویت (محاسبه شده از walletId)
  - موجودی توکن (اگر موجود باشد)
- 🏆 Badge های خاص:
  - **You** - برای پروفایل خودتان (بنفش)
  - **Whale** - دارندگان +100 توکن (طلایی)
  - **Holder** - دارندگان +10 توکن (آبی)
- 💫 انیمیشن‌های smooth با Framer Motion
- 📱 Responsive و mobile-friendly

### 2. بروزرسانی Chat.tsx

#### تغییرات کلیدی:

**A. State جدید**
```typescript
const [selectedUserProfile, setSelectedUserProfile] = useState<{
  walletId: string;
  username: string;
} | null>(null);
```

**B. قابل کلیک شدن Avatar در پیام‌ها**
- Avatar هر پیام حالا یک button است
- با کلیک روی avatar، پروفایل کاربر نمایش داده می‌شود
- با hover، opacity کم می‌شود

**C. قابل کلیک شدن Username در پیام‌ها**
- Username هر پیام حالا یک button است
- با hover، رنگ آن تغییر می‌کند
- با کلیک، همان پروفایل باز می‌شود

**D. نمایش پروفایل کاربر در صفحه انتخاب توکن**
```
┌────────────────────────────────┐
│  Chat                          │
│  Select a token community     │
├────────────────────────────────┤
│  [Avatar] Your Name      [You] │
│           Tap to view profile  │
└────────────────────────────────┘
```

**E. نمایش Avatar کاربر در Header چت**
```
┌────────────────────────────────┐
│ [←] [Token] Community    [●●●] │
│             123 members online │
└────────────────────────────────┘
```

#### کد جدید:

**Import UserProfileCard:**
```typescript
import { UserProfileCard } from '../UserProfileCard';
```

**Avatar قابل کلیک در پیام‌ها:**
```typescript
<button
  onClick={() => setSelectedUserProfile({ 
    walletId: msg.walletId, 
    username: msg.username 
  })}
  className="flex-shrink-0 pt-1 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
>
  <PlanetAvatar size="sm" walletId={msg.walletId} />
</button>
```

**Username قابل کلیک:**
```typescript
<button
  onClick={() => setSelectedUserProfile({ 
    walletId: msg.walletId, 
    username: msg.username 
  })}
  className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
>
  {msg.username}
</button>
```

**نمایش UserProfileCard:**
```typescript
<AnimatePresence>
  {selectedUserProfile && (
    <UserProfileCard
      walletId={selectedUserProfile.walletId}
      username={selectedUserProfile.username}
      onClose={() => setSelectedUserProfile(null)}
      isOwnProfile={selectedUserProfile.walletId === walletId}
      tokenBalance={selectedToken?.amount}
      tokenSymbol={selectedToken?.symbol}
    />
  )}
</AnimatePresence>
```

## نحوه استفاده

### برای کاربران:

#### 1. مشاهده پروفایل خودتان
```
صفحه انتخاب توکن → کلیک روی کارت پروفایل خودتان
یا
هدر چت → کلیک روی avatar سمت راست
```

#### 2. مشاهده پروفایل دیگران
```
در چت → کلیک روی avatar هر پیام
یا
در چت → کلیک روی username هر پیام
```

#### 3. بستن پروفایل
```
کلیک روی backdrop (بیرون کارت)
یا
دکمه × در بالای راست
یا
دکمه Close در پایین
```

## مثال‌های بصری

### 1. Profile Card Layout
```
┌─────────────────────────────┐
│  [Purple Gradient Header]  ×│
│          ┌─────┐            │
│          │  🌍  │ ●          │
│          └─────┘            │
│                             │
│  Username            [Badge]│
│  Member of SOL community    │
│                             │
│  ┌─────────────────────────┐│
│  │ 💼 Wallet ID            ││
│  │ 4Qs2a...8dF2            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 📅 Member since         ││
│  │ Jan 15, 2024            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🛡️  Token Balance        ││
│  │ 125.50 SOL              ││
│  └─────────────────────────┘│
│                             │
│      [Close Button]         │
└─────────────────────────────┘
```

### 2. Badge Types

**You Badge (پروفایل خودتان)**
```html
<div class="bg-purple-500/20 text-purple-300">
  👑 You
</div>
```

**Whale Badge (+100 tokens)**
```html
<div class="bg-yellow-500/20 text-yellow-300">
  🛡️ Whale
</div>
```

**Holder Badge (+10 tokens)**
```html
<div class="bg-blue-500/20 text-blue-300">
  🛡️ Holder
</div>
```

## جزئیات فنی

### PlanetAvatar Component
کامپوننت PlanetAvatar قبلاً موجود بود و ویژگی‌های زیر را دارد:
- Gradient رنگی منحصر به فرد بر اساس walletId
- 6 نوع gradient مختلف
- Texture overlay و shine effect
- Globe icon در وسط

### Wallet ID Hash
برای ایجاد تنوع در gradient ها:
```typescript
const getGradientFromWalletId = (id?: string) => {
  if (!id) return gradients[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return gradients[Math.abs(hash) % gradients.length];
};
```

### تاریخ عضویت
تاریخ pseudo-random بر اساس walletId:
```typescript
const formatDate = (walletId: string) => {
  let hash = 0;
  for (let i = 0; i < walletId.length; i++) {
    hash = ((hash << 5) - hash) + walletId.charCodeAt(i);
    hash = hash & hash;
  }
  
  const days = Math.abs(hash % 365);
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  });
};
```

## انیمیشن‌ها

### ورود Profile Card
```typescript
initial={{ opacity: 0, scale: 0.9, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.9, y: 20 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### Backdrop
```typescript
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
```

## Accessibility

- ✅ Keyboard navigation ready
- ✅ Touch-friendly button sizes
- ✅ Clear hover states
- ✅ Proper semantic HTML
- ✅ Screen reader friendly

## بهبودهای آینده

### پیشنهادات:
1. **نمایش آمار بیشتر**
   - تعداد پیام‌های ارسال شده
   - آخرین فعالیت
   - تعداد reaction های دریافت شده

2. **Profile Picture واقعی**
   - آپلود عکس پروفایل
   - ذخیره در Supabase Storage
   - Fallback به PlanetAvatar

3. **Bio متن**
   - اجازه به کاربران برای نوشتن bio
   - حداکثر 150 کاراکتر
   - ذخیره در database

4. **قابلیت‌های اجتماعی**
   - Follow/Unfollow
   - لیست دوستان
   - Direct Message

5. **Achievement Badges**
   - First Message
   - Active Trader
   - Community Leader
   - Early Adopter

## مثال کامل کد

```typescript
// استفاده از UserProfileCard در هر جا
import { UserProfileCard } from './components/UserProfileCard';

function MyComponent() {
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <>
      <button onClick={() => {
        setSelectedUser({ walletId: 'xxx', username: '@john' });
        setShowProfile(true);
      }}>
        View Profile
      </button>

      <AnimatePresence>
        {showProfile && selectedUser && (
          <UserProfileCard
            walletId={selectedUser.walletId}
            username={selectedUser.username}
            onClose={() => setShowProfile(false)}
            isOwnProfile={false}
            tokenBalance={100.5}
            tokenSymbol="SOL"
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

## تست

### تست Manual:
1. ✅ کلیک روی avatar در پیام - باید پروفایل باز شود
2. ✅ کلیک روی username - باید پروفایل باز شود
3. ✅ کلیک روی backdrop - باید بسته شود
4. ✅ کلیک روی دکمه × - باید بسته شود
5. ✅ مشاهده badge های مختلف با موجودی‌های متفاوت
6. ✅ مشاهده پروفایل خودتان با badge "You"
7. ✅ انیمیشن ورود و خروج smooth است

### Edge Cases:
- ✅ Wallet ID خیلی طولانی - truncate می‌شود
- ✅ Username خیلی طولانی - truncate می‌شود
- ✅ بدون tokenBalance - قسمت balance نمایش داده نمی‌شود
- ✅ Multiple profile cards - فقط یکی باز می‌شود

## خلاصه

این بروزرسانی تجربه کاربری چت را با نمایش اطلاعات کاربری و قابلیت مشاهده پروفایل بهبود می‌دهد:

**قبل:**
- ❌ فقط username متنی
- ❌ Avatar غیرقابل کلیک
- ❌ هیچ راهی برای دیدن اطلاعات بیشتر

**بعد:**
- ✅ Avatar قابل کلیک
- ✅ Username قابل کلیک
- ✅ کارت پروفایل کامل با badge ها
- ✅ نمایش موجودی توکن
- ✅ طراحی زیبا و consistent با تم Saturn

---

**تاریخ**: 2025-01-04  
**نسخه**: 1.0.0  
**مخصوص**: Saturn Wallet Chat Feature
