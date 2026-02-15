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

      // Generate cryptographically secure 6-digit code
      const randomBytes = crypto.getRandomValues(new Uint32Array(1));
      const code = (100000 + (randomBytes[0] % 900000)).toString();

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
          // RESEND_API_KEY not configured - fail securely
          return c.json({
            success: true,
            message: 'Verification code sent',
            demoMode: true,
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
            // Email sending failed - still return success to not leak info
            return c.json({
              success: true,
              message: 'Verification code sent',
              demoMode: true,
            });
          }

          return c.json({
            success: true,
            message: 'Verification code sent',
            demoMode: false,
          });
        } catch {
          // Email sending failed - still return success to not leak info
          return c.json({
            success: true,
            message: 'Verification code sent',
            demoMode: true,
          });
        }
      } else {
        // Non-verified email - code stored but not sent
        // NEVER return the code to the client
        return c.json({
          success: true,
          message: 'Verification code sent',
          demoMode: true,
        });
      }

    } catch {
      return c.json({ error: 'Failed to send verification code' }, 500);
    }
  });

  // DISABLED: Seed phrase generation must happen client-side only (web3 security)
  app.post("/make-server-e5bc10d1/verify-email-signup", (c) => {
    return c.json({ error: 'Endpoint disabled — wallet creation is client-side only' }, 410);
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

      return c.json({
        success: true,
        walletId,
      });
    } catch {
      return c.json({ error: 'Failed to sign in' }, 500);
    }
  });
}