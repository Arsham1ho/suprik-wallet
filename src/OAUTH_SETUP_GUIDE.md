# 🔐 OAuth Setup Guide - Saturn Wallet

## ✅ Current Status

Your Saturn Wallet app is **90% ready** for Google/Apple OAuth! You've already:

- ✅ Created Google OAuth Client ID
- ✅ Enabled Google provider in Supabase Dashboard
- ✅ Configured Client ID & Secret in Supabase

## 🎯 Final Steps (5 minutes)

### Step 1: Configure Redirect URI in Google Cloud Console

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

2. **Find Your OAuth 2.0 Client:**
   - Look for: `373210276344-c23pf930m8r85dao892q0djp2q5l9ja2.apps.googleusercontent.com`
   - Click on the **client name** to edit

3. **Add Redirect URI:**
   - Scroll to **"Authorized redirect URIs"**
   - Click **"+ ADD URI"**
   - Paste this **exact URL**:
     ```
     https://qagsgxsaxspomcysaesa.supabase.co/auth/v1/callback
     ```
   - Click **"SAVE"**

---

### Step 2: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen:**
   - https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type:**
   - **For Testing:** Select "External" → Add yourself as Test User
   - **For Production:** Select "External" → Publish App (requires Google verification)

3. **Add Test Users (Important!):**
   - Click **"+ ADD USERS"**
   - Enter the Gmail address you want to test with
   - Click **"SAVE"**

4. **Fill Basic Information:**
   - **App name:** Saturn Wallet
   - **User support email:** Your email
   - **Developer contact:** Your email
   - Click **"SAVE AND CONTINUE"**

---

### Step 3: Test Google Sign-In

1. **Clear Browser Cache** (or use Incognito Mode)
2. **Go to Saturn Wallet** and click **"Continue with Google"**
3. **You should see:**
   - Google sign-in page
   - Account selection
   - Permission consent
   - Redirect back to Saturn with your wallet created! 🎉

---

## 🍎 Apple Sign-In Setup (Optional)

To enable Apple Sign-In, follow these additional steps:

1. **Enable Apple Provider in Supabase:**
   - Go to: https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa/auth/providers
   - Click **"Apple"**
   - Toggle **"Enable Sign in with Apple"**
   - Follow Supabase's Apple setup guide

2. **Configure Apple Developer Account:**
   - You need an Apple Developer Account ($99/year)
   - Follow: https://supabase.com/docs/guides/auth/social-login/auth-apple

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- **Fix:** Make sure the redirect URI in Google Cloud Console **exactly matches**:
  ```
  https://qagsgxsaxspomcysaesa.supabase.co/auth/v1/callback
  ```
- No extra spaces, no http (must be https)

### Error: "403 - You do not have access to this page"
- **Fix:** Add your Gmail to **Test Users** in OAuth Consent Screen
- Or **Publish the app** (if ready for production)

### Error: "provider is not enabled"
- **Fix:** Check Supabase Dashboard → Authentication → Providers → Google is **Enabled** (toggle green)

### Google Sign-In opens but shows blank page
- **Fix:** Clear browser cache or use Incognito Mode
- Check browser console for errors (F12)

---

## 📧 Email Sign-In Already Works!

Don't want to setup OAuth right now? **Email sign-in is fully functional:**

1. Enter your email
2. Get verification code (displayed on screen in demo mode)
3. Create password
4. Start using Saturn! 🪐

---

## 🎯 Summary Checklist

- [ ] Added Redirect URI to Google Cloud Console
- [ ] Added yourself as Test User in OAuth Consent Screen
- [ ] Tested Google Sign-In successfully
- [ ] (Optional) Setup Apple Sign-In

---

## 💬 Need Help?

If you're stuck, here are helpful resources:

- 📖 **Supabase Google Auth Guide:** https://supabase.com/docs/guides/auth/social-login/auth-google
- 🔧 **Google OAuth Setup:** https://developers.google.com/identity/protocols/oauth2
- 💬 **Supabase Discord:** https://discord.supabase.com/

---

**Happy building! 🚀✨**

*Saturn Wallet - Your crypto journey starts here 🪐*
