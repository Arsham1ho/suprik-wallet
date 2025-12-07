// Email verification endpoints for Saturn Wallet
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export function setupEmailVerification(app: Hono, retryWithBackoff: any) {
  
  // Send verification code endpoint
  app.post("/make-server-e5bc10d1/send-verification-code", async (c) => {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code with 10 minute expiration
      const codeKey = `verification:${email.toLowerCase()}`;
      await retryWithBackoff(() => kv.set(codeKey, {
        code,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      }));

      // 🎯 VERIFIED EMAIL - Can send real emails
      const VERIFIED_EMAIL = 'arsham7hosseini10@gmail.com';
      const isVerifiedEmail = email.toLowerCase() === VERIFIED_EMAIL;

      // Try to send email via Resend (only for verified email)
      if (isVerifiedEmail) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          console.error('⚠️  RESEND_API_KEY not configured');
          console.log('📧 DEMO MODE - Verification code for', email, ':', code);
          return c.json({
            success: true,
            message: 'Verification code sent',
            demoMode: true,
            code, // در حالت Demo، کد را برمی‌گردونیم
          });
        }

        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Saturn Wallet <onboarding@resend.dev>',
              to: [email],
              subject: 'Your Saturn Wallet Verification Code',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; text-align: center;">
                      <h1 style="color: white; margin: 0 0 20px 0; font-size: 28px;">🪐 Saturn Wallet</h1>
                      <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 30px 0; font-size: 16px;">Your verification code is:</p>
                      <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 20px; margin: 0 0 30px 0;">
                        <div style="color: white; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                      </div>
                      <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 14px;">This code will expire in 10 minutes.</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                      <p style="color: #64748b; font-size: 13px; margin: 0;">If you didn't request this code, please ignore this email.</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            console.error('❌ Resend API error:', errorData);
            console.log('📧 DEMO MODE - Verification code for', email, ':', code);
            return c.json({
              success: true,
              message: 'Verification code sent',
              demoMode: true,
              code,
            });
          }

          console.log('✅ Real email sent to:', email);
          return c.json({
            success: true,
            message: 'Verification code sent',
            demoMode: false,
          });
        } catch (emailError) {
          console.error('❌ Email sending failed:', emailError);
          console.log('📧 DEMO MODE - Verification code for', email, ':', code);
          return c.json({
            success: true,
            message: 'Verification code sent',
            demoMode: true,
            code,
          });
        }
      } else {
        // 📧 DEMO MODE for non-verified emails
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 DEMO MODE - Verification Code');
        console.log('───────────────────────────────────────────────────────────');
        console.log('Email:', email);
        console.log('Code:', code);
        console.log('Expires:', new Date(Date.now() + 10 * 60 * 1000).toLocaleString());
        console.log('═══════════════════════════════════════════════════════════');
        console.log('💡 Tip: To send real emails, use verified email:', VERIFIED_EMAIL);
        console.log('═══════════════════════════════════════════════════════════');
        
        return c.json({
          success: true,
          message: 'Verification code sent',
          demoMode: true,
          code, // در حالت Demo، کد را برمی‌گردونیم تا Frontend نشان دهد
        });
      }

    } catch (error: any) {
      console.error('Send verification code error:', error);
      return c.json({ error: error.message || 'Failed to send verification code' }, 500);
    }
  });

  // Verify email signup endpoint
  app.post("/make-server-e5bc10d1/verify-email-signup", async (c) => {
    try {
      const { email, password, code } = await c.req.json();

      if (!email || !password || !code) {
        return c.json({ error: "Email, password, and code are required" }, 400);
      }

      // Verify code
      const codeKey = `verification:${email.toLowerCase()}`;
      const storedCode = await retryWithBackoff(() => kv.get(codeKey));

      if (!storedCode) {
        return c.json({ error: "Verification code expired or invalid" }, 400);
      }

      if (storedCode.code !== code) {
        return c.json({ error: "Invalid verification code" }, 400);
      }

      // Check if code expired
      if (new Date(storedCode.expiresAt) < new Date()) {
        await retryWithBackoff(() => kv.del(codeKey));
        return c.json({ error: "Verification code expired" }, 400);
      }

      // Delete used code
      await retryWithBackoff(() => kv.del(codeKey));

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return c.json({ error: "Invalid email format" }, 400);
      }

      // Validate password length
      if (password.length < 8) {
        return c.json({ error: "Password must be at least 8 characters" }, 400);
      }

      // Check if email already exists
      const existingUser = await retryWithBackoff(() => kv.get(`email:${email.toLowerCase()}`));
      if (existingUser) {
        return c.json({ error: "Email already registered" }, 400);
      }

      // Generate a unique wallet ID from email
      const encoder = new TextEncoder();
      const data = encoder.encode(email.toLowerCase() + Date.now());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const walletId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

      // Generate default username with @ prefix
      const defaultUsername = `@User${walletId.substring(0, 6)}`;

      // Hash password
      const passwordData = encoder.encode(password + walletId);
      const passwordHashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
      const passwordHashArray = Array.from(new Uint8Array(passwordHashBuffer));
      const passwordHash = passwordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Generate a recovery phrase for the wallet (BIP39 word list subset)
      const wordList = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
        'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
        'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
        'adult', 'advance', 'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
        'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
        'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
        'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
        'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
        'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area',
        'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive',
        'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
        'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
        'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
        'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag',
        'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel',
        'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef',
        'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best',
        'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird',
        'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind',
        'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil',
      ];
      
      const seedPhrase: string[] = [];
      for (let i = 0; i < 12; i++) {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        seedPhrase.push(wordList[randomIndex]);
      }
      const seedPhraseString = seedPhrase.join(' ');

      // Create wallet data
      const walletData = {
        walletId,
        email: email.toLowerCase(),
        passwordHash,
        username: defaultUsername,
        authMethod: 'email',
        seedPhrase: seedPhraseString,
        createdAt: new Date().toISOString(),
        walletName: 'Saturn Wallet',
      };

      // Store wallet and email mapping
      await retryWithBackoff(() => kv.set(`wallet:${walletId}`, walletData));
      await retryWithBackoff(() => kv.set(`email:${email.toLowerCase()}`, { walletId }));

      console.log('User created successfully with email:', email);

      return c.json({
        success: true,
        walletId,
      });
    } catch (error: any) {
      console.error('Email signup verification error:', error);
      return c.json({ error: error.message || 'Failed to create account' }, 500);
    }
  });

  // Verify email signin endpoint
  app.post("/make-server-e5bc10d1/verify-email-signin", async (c) => {
    try {
      const { email, password, code } = await c.req.json();

      if (!email || !password || !code) {
        return c.json({ error: "Email, password, and code are required" }, 400);
      }

      // Verify code
      const codeKey = `verification:${email.toLowerCase()}`;
      const storedCode = await retryWithBackoff(() => kv.get(codeKey));

      if (!storedCode) {
        return c.json({ error: "Verification code expired or invalid" }, 400);
      }

      if (storedCode.code !== code) {
        return c.json({ error: "Invalid verification code" }, 400);
      }

      // Check if code expired
      if (new Date(storedCode.expiresAt) < new Date()) {
        await retryWithBackoff(() => kv.del(codeKey));
        return c.json({ error: "Verification code expired" }, 400);
      }

      // Delete used code
      await retryWithBackoff(() => kv.del(codeKey));

      // Get wallet ID from email
      const emailMapping = await retryWithBackoff(() => kv.get(`email:${email.toLowerCase()}`));
      if (!emailMapping || !emailMapping.walletId) {
        return c.json({ error: "Invalid email or password" }, 401);
      }

      const walletId = emailMapping.walletId;

      // Get wallet data
      const wallet = await retryWithBackoff(() => kv.get(`wallet:${walletId}`));
      if (!wallet) {
        return c.json({ error: "Invalid email or password" }, 401);
      }

      // Hash provided password and verify
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password + walletId);
      const passwordHashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
      const passwordHashArray = Array.from(new Uint8Array(passwordHashBuffer));
      const passwordHash = passwordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (wallet.passwordHash !== passwordHash) {
        return c.json({ error: "Invalid email or password" }, 401);
      }

      console.log('User signed in successfully with email:', email);

      return c.json({
        success: true,
        walletId,
      });
    } catch (error: any) {
      console.error('Email signin verification error:', error);
      return c.json({ error: error.message || 'Failed to sign in' }, 500);
    }
  });
}