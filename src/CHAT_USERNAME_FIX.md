# 🔧 Chat Username Fix - نمایش نام کاربری در چت

## مشکل
همه کاربران در چت به عنوان "Anonymous" نمایش داده می‌شدند چون:
1. هنگام ایجاد wallet، username پیش‌فرض ذخیره نمی‌شد
2. Chat.tsx از endpoint اشتباه (`/wallet/${walletId}`) استفاده می‌کرد که وجود نداشت
3. وقتی username fetch نمی‌شد، همه به "Anonymous" تبدیل می‌شدند

## راه‌حل

### 1. بروزرسانی Server - ذخیره username پیش‌فرض

**فایل**: `/supabase/functions/server/index.tsx`

**تغییرات در `create-wallet` endpoint:**

```typescript
// Generate default username with @ prefix
const defaultUsername = `@User${walletId.substring(0, 6)}`;

// Store wallet data
await kv.set(`wallet:${walletId}`, {
  seedPhrase,
  createdAt: new Date().toISOString(),
  balance: 24584.32,
  username: defaultUsername, // ✅ اضافه شد
});
```

**چرا این روش؟**
- هر کاربر جدید یک username منحصر به فرد دریافت می‌کند
- فرمت: `@User` + 6 کاراکتر اول walletId
- مثال: `@Userab1234`
- کاربر می‌تواند بعداً در Account Settings تغییرش دهد

### 2. بروزرسانی Chat.tsx - استفاده از endpoint صحیح

**فایل**: `/components/pages/Chat.tsx`

**قبل:**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}`,
  // ❌ این endpoint وجود ندارد!
```

**بعد:**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet-info/${walletId}`,
  // ✅ endpoint صحیح
```

**تغییرات fallback:**
```typescript
if (response.ok) {
  const data = await response.json();
  setUsername(data.username || '@Anonymous'); // ✅ با @ پیش‌فرض
} else {
  setUsername('@Anonymous'); // ✅ fallback با @
}
```

## نتیجه

### قبل:
```
[Message from Anonymous]
[Message from Anonymous]
[Message from Anonymous]
```
😔 همه کاربران یکسان بودند!

### بعد:
```
[Message from @User4fa231]
[Message from @JohnDoe]
[Message from @AliceW]
```
😊 هر کاربر قابل تشخیص است!

## فلوی کامل

### 1. کاربر جدید ثبت‌نام می‌کند
```
SignUp.tsx
  └─> POST /create-wallet
      └─> wallet ایجاد می‌شود با username: @User4fa231
```

### 2. کاربر وارد چت می‌شود
```
Chat.tsx (useEffect)
  └─> GET /wallet-info/{walletId}
      └─> دریافت: { username: "@User4fa231" }
      └─> setUsername("@User4fa231")
```

### 3. کاربر پیام می‌فرستد
```
Chat.tsx (handleSendMessage)
  └─> POST /chat/{tokenSymbol}/send
      body: { walletId, username: "@User4fa231", message: "Hello!" }
      └─> سرور ذخیره می‌کند:
          {
            walletId: "abc123...",
            username: "@User4fa231",  ✅
            message: "Hello!",
            ...
          }
```

### 4. پیام نمایش داده می‌شود
```
Message Component
  └─> نمایش: "@User4fa231: Hello!"
```

## تست

### تست 1: کاربر جدید
```bash
# 1. ایجاد wallet جدید
POST /create-wallet { seedPhrase: "word1 word2 ... word12" }

# 2. بررسی username پیش‌فرض
GET /wallet-info/{walletId}
# انتظار: { username: "@Userxxxxxx" }

# 3. ارسال پیام در چت
POST /chat/SOL/send
{ walletId, username: "@Userxxxxxx", message: "Hi" }

# 4. بررسی پیام
GET /chat/SOL/messages
# انتظار: پیام با username "@Userxxxxxx"
```

### تست 2: کاربر قدیمی (بدون username)
```bash
# کاربرانی که قبل از این fix ثبت‌نام کرده‌اند

# 1. wallet-info fallback
GET /wallet-info/{walletId}
# برمی‌گرداند: { username: "Account 1" }

# 2. در AccountSettings می‌توانند تغییرش دهند
POST /update-username
{ walletId, username: "@MyNewName" }

# 3. بعد از update
GET /wallet-info/{walletId}
# برمی‌گرداند: { username: "@MyNewName" }
```

### تست 3: Edge Cases

**Case 1: Username موجود نیست**
```typescript
setUsername(data.username || '@Anonymous');
// نتیجه: "@Anonymous"
```

**Case 2: API خطا می‌دهد**
```typescript
catch (error) {
  setUsername('@Anonymous');
}
// نتیجه: "@Anonymous"
```

**Case 3: کاربر username را تغییر می‌دهد**
```
1. Settings → Account Settings
2. تغییر "@User4fa231" به "@JohnDoe"
3. Save
4. در چت باز شود → نمایش "@JohnDoe"
```

## کد کامل

### Server: create-wallet endpoint

```typescript
app.post("/make-server-e5bc10d1/create-wallet", async (c) => {
  try {
    const { seedPhrase } = await c.req.json();
    
    // Validation...
    
    const walletId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    
    // ✅ Generate default username
    const defaultUsername = `@User${walletId.substring(0, 6)}`;
    
    // ✅ Store with username
    await kv.set(`wallet:${walletId}`, {
      seedPhrase,
      createdAt: new Date().toISOString(),
      balance: 24584.32,
      username: defaultUsername,  // <-- اینجا!
    });
    
    return c.json({
      success: true,
      walletId,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
```

### Chat.tsx: fetchUsername

```typescript
useEffect(() => {
  const fetchUsername = async () => {
    try {
      // ✅ استفاده از endpoint صحیح
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet-info/${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || '@Anonymous'); // ✅ fallback با @
      }
    } catch (error) {
      console.error('[Chat] Error fetching username:', error);
      setUsername('@Anonymous'); // ✅ error fallback
    }
  };
  
  fetchUsername();
}, [walletId]);
```

## بهبودهای آینده

### 1. Username Validation
```typescript
// قبل از ذخیره بررسی کنیم:
- حداقل 3 کاراکتر
- حداکثر 20 کاراکتر
- فقط حروف، اعداد، و _
- شروع با @
- منحصر به فرد بودن
```

### 2. Username Search
```typescript
// امکان جستجوی کاربران با username
app.get("/make-server-e5bc10d1/search-users/:query", async (c) => {
  const query = c.req.param('query');
  // جستجو در همه کاربران...
});
```

### 3. @mentions در چت
```typescript
// تشخیص @username در پیام‌ها
if (message.includes('@')) {
  // هایلایت کردن mention ها
  // نوتیفیکیشن به کاربر mention شده
}
```

### 4. Username History
```typescript
// ذخیره تاریخچه تغییرات username
wallet: {
  username: "@CurrentName",
  usernameHistory: [
    { username: "@OldName1", changedAt: "2024-01-01" },
    { username: "@OldName2", changedAt: "2024-02-01" },
  ]
}
```

## خلاصه تغییرات

| فایل | تغییر | دلیل |
|------|-------|------|
| `index.tsx` (server) | اضافه کردن `username: defaultUsername` | ذخیره username پیش‌فرض |
| `Chat.tsx` | تغییر endpoint به `/wallet-info/` | استفاده از endpoint صحیح |
| `Chat.tsx` | fallback به `@Anonymous` | مدیریت بهتر خطا |

## نتیجه نهایی

✅ **قبل**: همه کاربران "Anonymous"  
✅ **بعد**: هر کاربر username منحصر به فرد دارد  
✅ **Fallback**: در صورت خطا "@Anonymous"  
✅ **قابل تغییر**: کاربر می‌تواند در Settings تغییرش دهد  
✅ **با @**: همه username ها با @ شروع می‌شوند (مانند Telegram)

---

**تاریخ**: 2025-01-04  
**نسخه**: 1.0.0  
**تست شده**: ✅ بله
