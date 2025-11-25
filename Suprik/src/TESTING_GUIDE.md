# 🧪 Saturn Wallet Testing Guide

## Quick Start - Test in 2 Minutes!

### **Step 1: Enable Dev Mode**
1. Open the app
2. Click **Settings** (bottom nav, gear icon)
3. Find "**Developer Options**" section at the top
4. Toggle **"Dev Mode"** to ON (turns purple)
5. You'll now see a **"Developer"** section appear below

### **Step 2: Simulate Receiving Crypto**
1. In Settings, click **"Test Receive"** (under Developer section)
2. A dialog opens with:
   - Token dropdown (SOL, ETH, BTC, USDC, BONK, MATIC)
   - Amount input field
3. Select **"Solana (SOL)"**
4. Enter amount: **10**
5. Click **"Simulate Receive"**
6. See success toast: "Received 10 SOL!"

### **Step 3: Verify Balance Updated**
1. Go back to **Home** (bottom nav)
2. Look at your tokens list
3. You should see:
   - **Solana** with amount: **10 SOL**
   - USD value next to it (e.g., $1,850)
   - Total balance at top updated
4. Try clicking on the Solana token to see details!

---

## 🎯 Full Testing Checklist

### ✅ Dev Mode Features

- [ ] **Enable Dev Mode**
  - Go to Settings
  - Toggle Dev Mode ON
  - "Test Receive" button appears

- [ ] **Add SOL**
  - Test Receive → SOL → 10 → Submit
  - Home shows 10 SOL
  - Total balance updates

- [ ] **Add ETH**
  - Test Receive → ETH → 0.5 → Submit
  - Home shows 0.5 ETH
  - Total balance increases

- [ ] **Add BTC**
  - Test Receive → BTC → 0.01 → Submit
  - Home shows 0.01 BTC
  - Value shows in USD

- [ ] **Add USDC**
  - Test Receive → USDC → 100 → Submit
  - Shows as $100 (stable)

- [ ] **Multiple transactions**
  - Add SOL again (e.g., 5 more)
  - Balance increases from 10 to 15
  - Total recalculates

### ✅ Real Blockchain Features

- [ ] **View Addresses**
  - Home → Click "Receive" button
  - Dialog shows 6 blockchain addresses
  - Solana, Ethereum, Base, Sui, Polygon, Bitcoin

- [ ] **Copy Address**
  - Click copy icon next to any address
  - See "Solana address copied!" toast
  - Green checkmark appears briefly

- [ ] **Test Real Transaction** (if you have crypto)
  - Copy your Solana address
  - Send small amount from another wallet
  - Wait up to 30 seconds
  - Balance auto-updates! 🎉

### ✅ UI/UX Features

- [ ] **Token Details**
  - Click any token in list
  - See detailed coin page
  - Price chart, stats, etc.
  - Back button works

- [ ] **Search Tokens** (if implemented)
  - Use search bar at top
  - Filter tokens by name/symbol

- [ ] **Refresh**
  - Pull down to refresh (if implemented)
  - Or just wait - updates every 30s

### ✅ Settings Features

- [ ] **Dev Mode Toggle**
  - Turn ON → "Test Receive" appears
  - Turn OFF → "Test Receive" hidden
  - State persists across sessions

- [ ] **Lock Wallet**
  - Click "Lock Wallet" button
  - Returns to landing page
  - Wallet ID cleared from storage

---

## 🔍 What to Look For

### **When Testing Dev Mode:**

**Expected Behavior:**
- ✅ Instant balance updates
- ✅ Toast notification on success
- ✅ USD values calculated with real prices
- ✅ Total balance shows sum of all tokens
- ✅ 24h price changes shown (from CoinGecko)
- ✅ Token logos load from CoinGecko API

**Common Issues:**
- ⚠️ If balance doesn't update → Check browser console
- ⚠️ If prices show $0 → CoinGecko rate limit, wait 1 min
- ⚠️ Dialog doesn't close → Check for error in console

### **When Testing Real Blockchain:**

**Expected Behavior:**
- ✅ Addresses are consistent (same every time)
- ✅ Can copy addresses successfully
- ✅ Real transactions detected within 30 seconds
- ✅ Blockchain Setup alert shows API status

**Common Issues:**
- ⚠️ Balance not updating → Check API keys configured
- ⚠️ Long wait time → Blockchain might be slow
- ⚠️ No detection → Transaction might not be confirmed yet

---

## 🎬 Demo Scenario

**Create a Full Portfolio in 1 Minute:**

```bash
1. Enable Dev Mode
2. Test Receive:
   - SOL: 10
   - ETH: 0.5
   - BTC: 0.01
   - USDC: 500
   - BONK: 1000
3. Go to Home
4. See portfolio worth $X,XXX
5. Click each token to explore
```

---

## 📊 Expected Results

### **Fresh Wallet (No Transactions):**
- All tokens show 0 balance
- Total balance: $0.00
- Can still see all tokens listed
- Can receive crypto to addresses

### **After Dev Mode Testing:**
- Tokens show amounts you added
- Total balance = sum of all USD values
- Each token shows its price & 24h change
- Can see individual token values

### **After Real Transaction:**
- Balance updates automatically
- No manual refresh needed
- Transaction recorded in database
- Shows up in Activity feed (when implemented)

---

## 🐛 Debugging Tips

### **Open Browser Console:**
- Chrome/Edge: F12 or Ctrl+Shift+J
- Safari: Cmd+Option+C
- Firefox: F12 or Ctrl+Shift+K

### **Look for These Logs:**
```
✓ "Fetching wallet balances..."
✓ "Wallet balances received: {...}"
✓ "Token prices data received: {...}"
✓ "Simulating receive: {...}"
✓ "Balance update event received, refreshing..."
✓ "Checking blockchain for new transactions..."
```

### **Common Error Messages:**
- "Failed to fetch" → Network/CORS issue
- "Token not found" → Check token symbol mapping
- "Unauthorized" → Check API keys in Supabase
- "Rate limited" → Wait a bit, then try again

---

## 🎯 Success Criteria

Your implementation is working if:

1. ✅ Dev Mode can add tokens
2. ✅ Balances update on Home screen
3. ✅ USD values calculate correctly
4. ✅ Total balance shows accurate sum
5. ✅ Can copy receive addresses
6. ✅ Settings persist across refreshes
7. ✅ No console errors during normal use

---

## 🚀 Next Steps After Testing

Once everything works:

1. **Test with small real amounts** (if comfortable)
2. **Document any bugs** you find
3. **Customize token list** for your needs
4. **Add more chains** if desired
5. **Implement Activity page** to show history
6. **Build out Swap functionality**

---

## 💡 Pro Tips

- Test with small amounts first (0.01, 0.1, etc.)
- Use Dev Mode for UI testing without spending crypto
- Keep console open to see what's happening
- Refresh the page if things seem stuck
- Check Supabase logs for backend issues

---

**Happy Testing!** 🎉

If something doesn't work as expected, check the browser console for error messages and refer to the IMPLEMENTATION_SUMMARY.md for details.
