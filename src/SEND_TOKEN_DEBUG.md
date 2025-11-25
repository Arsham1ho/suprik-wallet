# Send Token Debugging Guide

## ✅ What's Been Fixed

### 1. Enhanced Server Logging
Added detailed console logs in `/supabase/functions/server/index.tsx`:
- `[Balance Update]` - Shows old balance → new balance → deducted amount
- `[Activity Update]` - Shows activity count before and after save

### 2. Enhanced Client Logging
Added detailed console logs in:
- **Send.tsx**: `[Send]` prefix for transaction flow
- **Home.tsx**: `[Home]` prefix for balance updates
- **Activity.tsx**: `[Activity]` prefix for activity updates

### 3. Event Dispatch Timing
- Added 100ms delay before dispatching `walletBalanceUpdated` event
- Ensures server completes all database writes before frontend refreshes

## 🧪 How to Test

### Step 1: Open Browser Console (F12)

### Step 2: Send a Transaction
1. Go to Home page
2. Click Send button
3. Select SOL token
4. Enter a valid Solana address (or use test address: `CWvFSW6gFYi7KaSpAWA1DvWJvxkCrMV1ZdMphBKXhPdX`)
5. Enter amount (e.g., 0.01)
6. Review and click "Confirm & Send"

### Step 3: Monitor Console Logs

You should see this sequence:

```
[Send] Starting transaction: {walletId, tokenSymbol, amount, ...}
[Send] Server response: {success, signature, newBalance, ...}
[Send] Transaction successful: {...}
[Send] New balance from server: X.XXXXXX
[Send] Dispatching walletBalanceUpdated event...
[Home] Balance update event received, refreshing...
[Home] Fetching wallet balances for wallet: xxx
[Home] Wallet balances received: X tokens
[Home] Token balances: {SOL: {...}, ...}
[Activity] Balance update event received, refreshing activities...
[Activity] Fetching activities for wallet: xxx
[Activity] Activities loaded, count: X
```

### Step 4: Verify Updates

Check three things:
1. **Balance decreased** - SOL balance on Home page should decrease by (amount + fee)
2. **Activity added** - New transaction appears in Activity tab
3. **Total balance updated** - Total portfolio value at top should decrease

## 🔍 Server-Side Logs

Check your Supabase Edge Function logs for:

```
Send token request: {walletId, tokenSymbol, recipientAddress, amount}
Transaction breakdown: Amount=X SOL, App Fee=Y SOL (0.5%)
Sending Solana transaction...
Transaction successful! Signature: xxxxx
[Balance Update] SOL: X.XXX -> Y.YYY (deducted: Z.ZZZ)
[Balance Update] Tokens saved to database
[Activity Update] Current activities count: N
[Activity Update] Activities saved to database. New count: N+1
```

## 🐛 Common Issues & Solutions

### Issue 1: Balance Not Updating
**Symptoms**: Transaction succeeds but balance stays same

**Debug Steps**:
1. Check console for `[Home] Balance update event received`
2. Check console for `[Home] Token balances:` - verify new amount
3. Check server logs for `[Balance Update] Tokens saved to database`

**Solution**: The event is being dispatched. Check if Home component is mounted.

### Issue 2: Activity Not Showing
**Symptoms**: Transaction succeeds but not in Activity tab

**Debug Steps**:
1. Check console for `[Activity] Balance update event received`
2. Check console for `[Activity] Activities loaded, count:`
3. Check server logs for `[Activity Update] Activities saved to database`

**Solution**: Make sure you're checking the Activity tab AFTER the event is dispatched.

### Issue 3: Server Error
**Symptoms**: Transaction fails with error message

**Debug Steps**:
1. Check console for `[Send] Transaction error:`
2. Check the error message in the red overlay
3. Check server logs for `Solana transaction error:` or `Send token error:`

**Common Errors**:
- `Insufficient balance` - Not enough SOL (need amount + 0.5% fee + 0.000005 network fee)
- `Invalid address` - Address validation failed
- `Transaction failed: insufficient funds for rent` - Wallet has less than 0.001 SOL
- `Wallet not found` - WalletId doesn't exist in database

## 📊 Expected Flow

### Mainnet Mode (Settings > Network = Mainnet)
1. Real Solana transaction sent to blockchain
2. 0.5% app fee collected (minimum 0.001 SOL)
3. ~0.000005 SOL network fee
4. Balance updated in database
5. Activity logged with real signature
6. Can view on Solscan: `https://solscan.io/tx/{signature}`

### Devnet Mode (Settings > Network = Devnet)
1. Transaction simulated (no blockchain)
2. No fees collected
3. Balance updated in database
4. Activity logged with simulated ID (sim-xxxxx)
5. Useful for testing without spending real SOL

## 🎯 Success Criteria

A successful send transaction should:
- ✅ Show "Processing Transaction" animation
- ✅ Show "Transaction Successful! 🎉" animation
- ✅ Return to Home page after 3 seconds
- ✅ Balance decreased by (amount + fee)
- ✅ Total balance updated
- ✅ New activity appears in Activity tab
- ✅ Activity shows correct amount, fee, and signature

## 🔧 Manual Verification

### 1. Check Database Directly (Advanced)
If you have access to Supabase Dashboard:
```sql
-- Check token balance
SELECT * FROM kv_store_e5bc10d1 
WHERE key LIKE 'wallet:%:tokens';

-- Check activities
SELECT * FROM kv_store_e5bc10d1 
WHERE key LIKE 'wallet:%:activities';
```

### 2. Check Real Blockchain (Mainnet Only)
Visit: `https://solscan.io/tx/{signature}`
- Should show successful transaction
- Should show recipient received funds
- Should show app fee wallet received fee

## 📝 Notes

- **Mainnet transactions are REAL** - You're sending actual SOL
- **App fee**: 0.5% of amount, minimum 0.001 SOL
- **Network fee**: ~0.000005 SOL (very small)
- **Total deducted**: amount + app fee + network fee
- **Activities**: Stored up to 100 most recent transactions

## 🚀 Next Steps After Fix

If everything works:
1. Test with different amounts
2. Test with different tokens (when supported)
3. Test send to multiple addresses
4. Test edge cases (exactly 0 balance after send, very small amounts, etc.)

If something doesn't work:
1. Copy all console logs (both browser and server)
2. Note exact steps to reproduce
3. Check which log message is missing in the expected sequence
4. Report with specific error message
