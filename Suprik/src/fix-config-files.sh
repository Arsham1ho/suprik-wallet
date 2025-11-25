#!/bin/bash

# این script فایل‌های config را به درستی می‌سازد
# برای استفاده: bash fix-config-files.sh

echo "🔧 Fixing configuration files..."
echo ""

# پاک کردن فایل‌های اشتباه (اگر وجود دارند)
echo "1️⃣ Removing incorrect folders..."
rm -rf _redirects/ 2>/dev/null
rm -rf public/_headers/ 2>/dev/null
echo "   ✅ Cleaned up incorrect folders"
echo ""

# ساخت فایل _redirects
echo "2️⃣ Creating _redirects file..."
cat > _redirects << 'EOF'
/* /index.html 200
EOF
echo "   ✅ Created _redirects"
echo ""

# ساخت فایل public/_headers
echo "3️⃣ Creating public/_headers file..."
mkdir -p public
cat > public/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
EOF
echo "   ✅ Created public/_headers"
echo ""

# چک کردن که فایل‌ها درست ساخته شدند
echo "4️⃣ Verifying files..."
echo ""

if [ -f "_redirects" ]; then
  echo "   ✅ _redirects is a FILE (correct!)"
  echo "   📄 Type: $(file _redirects | cut -d: -f2)"
  echo "   📝 Content:"
  cat _redirects | sed 's/^/      /'
else
  echo "   ❌ _redirects is NOT a file!"
fi
echo ""

if [ -f "public/_headers" ]; then
  echo "   ✅ public/_headers is a FILE (correct!)"
  echo "   📄 Type: $(file public/_headers | cut -d: -f2)"
  echo "   📝 First 3 lines:"
  head -n 3 public/_headers | sed 's/^/      /'
  echo "      ..."
else
  echo "   ❌ public/_headers is NOT a file!"
fi
echo ""

# خلاصه
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done! Configuration files are ready."
echo ""
echo "Next steps:"
echo "  1. Restart dev server: Ctrl+C then 'npm run dev'"
echo "  2. Hard refresh browser: Ctrl+Shift+R"
echo "  3. Test the app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
