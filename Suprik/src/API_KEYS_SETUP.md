# راهنمای تنظیم API Keys

این راهنما نحوه تنظیم API keys مورد نیاز برای اتصال اپلیکیشن Saturn به شبکه‌های بلاکچین را توضیح می‌دهد.

## API های مورد نیاز

### 1. Helius API (Solana) ⭐ اولویت بالا
برای چک کردن موجودی Solana و SPL tokens

**مراحل:**
1. به https://www.helius.dev بروید
2. حساب ایجاد کنید
3. یک API Key جدید بسازید
4. در Supabase Edge Functions Secrets اضافه کنید:
   - Name: `HELIUS_API_KEY`
   - Value: کلید دریافت شده از Helius

**پلن رایگان:** 100,000 request در ماه

---

### 2. Alchemy API (Ethereum) ⭐ اولویت متوسط
برای چک کردن موجودی Ethereum و ERC-20 tokens

**مراحل:**
1. به https://www.alchemy.com بروید
2. حساب ایجاد کنید
3. یک App جدید با Chain: Ethereum بسازید
4. API Key را کپی کنید
5. در Supabase Edge Functions Secrets اضافه کنید:
   - Name: `ALCHEMY_API_KEY`
   - Value: کلید دریافت شده از Alchemy

**پلن رایگان:** 300M Compute Units در ماه

**راهنمای کامل:** [ALCHEMY_SETUP.md](./ALCHEMY_SETUP.md)

---

### 3. کیف پول کارمزد (Fee Collection)
برای دریافت کارمزدهای تراکنش‌ها

**مراحل:**
1. یک کیف پول Solana جدید ایجاد کنید
2. آدرس عمومی کیف پول را یادداشت کنید
3. در Supabase Edge Functions Secrets اضافه کنید:
   - Name: `APP_FEE_WALLET`
   - Value: آدرس عمومی کیف پول

**نکته:** این آدرس فقط برای دریافت کارمزد است و نیازی به کلید خصوصی ندارد.

---

## چک کردن تنظیمات

پس از تنظیم API keys:

1. به اپلیکیشن بروید
2. Settings > Dev Mode را فعال کنید
3. به Blockchain Setup بروید
4. آدرس‌های بلاکچین را تنظیم کنید
5. موجودی‌ها باید به صورت خودکار به‌روزرسانی شوند

## خطاهای رایج

### "Must be authenticated" (Alchemy)
✅ API key نادرست یا خالی است
✅ مطمئن شوید network صحیح است (mainnet/testnet)
✅ دوباره API key را در Supabase بررسی کنید

### "401 Unauthorized" (Helius)
✅ API key منقضی شده یا نادرست است
✅ به داشبورد Helius بروید و API key جدید بسازید

### موجودی به‌روز نمی‌شود
✅ مطمئن شوید API keys را در Supabase Secrets تنظیم کرده‌اید، نه در متغیرهای محیطی معمولی
✅ Edge Function را restart کنید (deploy مجدد)
✅ چند دقیقه صبر کنید - update ها هر 30 ثانیه اتفاق می‌افتند

## اختیاری: بدون API Keys

اگر API key ندارید، اپلیکیشن به این شکل کار می‌کند:

| ویژگی | بدون API | با API |
|------|----------|--------|
| ایجاد کیف پول | ✅ | ✅ |
| ارسال تراکنش | ✅ | ✅ |
| موجودی Solana | ❌ | ✅ |
| موجودی Ethereum | ❌ | ✅ |
| SPL Tokens | ❌ | ✅ |
| ERC-20 Tokens | ❌ | ✅ |

**توصیه:** حداقل Helius API را تنظیم کنید چون بیشتر ویژگی‌های اپ به Solana متصل است.

## لاگ‌های مفید

برای دیباگ، لاگ‌های Edge Function را بررسی کنید:

```bash
# در لاگ‌ها دنبال این پیام‌ها بگردید:
[Blockchain Check] Checking Solana balance
[Blockchain Check] Helius API key length: XX
[Blockchain Check] ✅ Updated SOL balance

[Blockchain Check] Checking Ethereum balance  
[Blockchain Check] Alchemy API key length: XX
[Blockchain Check] ✅ Updated ETH balance
```

اگر می‌بینید "⚠️ Skipping X check: No API key configured" یعنی API key تنظیم نشده است.

## امنیت

⚠️ **هیچ‌وقت API keys را در کد frontend قرار ندهید**
✅ همیشه از Supabase Edge Functions Secrets استفاده کنید
✅ API keys فقط در سرور استفاده می‌شوند
✅ هیچ‌گاه API keys را در git commit نکنید
