#!/bin/bash

# Suprik Deployment Readiness Check
# این script بررسی می‌کند که آیا پروژه آماده deploy است یا نه

echo "🔍 Checking Suprik Deployment Readiness..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# 1. Check critical files
echo "📂 Checking critical files..."

FILES=(
  "package.json"
  "vite.config.ts"
  "tsconfig.json"
  "index.html"
  "vercel.json"
  ".env.example"
  "App.tsx"
  "src/main.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${RED}✗${NC} $file is missing!"
    ISSUES=$((ISSUES + 1))
  fi
done

echo ""

# 2. Check package.json scripts
echo "📦 Checking package.json scripts..."

if grep -q '"build".*"vite build"' package.json; then
  echo -e "${GREEN}✓${NC} Build script configured"
else
  echo -e "${RED}✗${NC} Build script missing or incorrect!"
  ISSUES=$((ISSUES + 1))
fi

if grep -q '"preview".*"vite preview"' package.json; then
  echo -e "${GREEN}✓${NC} Preview script configured"
else
  echo -e "${YELLOW}⚠${NC} Preview script missing (optional)"
fi

echo ""

# 3. Check dependencies
echo "📚 Checking key dependencies..."

KEY_DEPS=(
  "react"
  "react-dom"
  "vite"
  "@solana/web3.js"
  "@supabase/supabase-js"
)

for dep in "${KEY_DEPS[@]}"; do
  if grep -q "\"$dep\"" package.json; then
    echo -e "${GREEN}✓${NC} $dep installed"
  else
    echo -e "${RED}✗${NC} $dep missing!"
    ISSUES=$((ISSUES + 1))
  fi
done

echo ""

# 4. Check node_modules
echo "🗂️  Checking dependencies installation..."

if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules exists"
else
  echo -e "${YELLOW}⚠${NC} node_modules not found. Run: npm install"
fi

echo ""

# 5. Check .env setup
echo "🔐 Checking environment variables..."

if [ -f ".env" ]; then
  echo -e "${GREEN}✓${NC} .env file exists"
  
  # Check for required variables
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL configured"
  else
    echo -e "${RED}✗${NC} VITE_SUPABASE_URL missing!"
    ISSUES=$((ISSUES + 1))
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY configured"
  else
    echo -e "${RED}✗${NC} VITE_SUPABASE_ANON_KEY missing!"
    ISSUES=$((ISSUES + 1))
  fi
else
  echo -e "${YELLOW}⚠${NC} .env file not found (OK for deployment, but needed for local dev)"
  echo -e "   ${YELLOW}→${NC} Copy .env.example to .env and fill in values"
fi

echo ""

# 6. Check Git setup
echo "🔧 Checking Git setup..."

if [ -d ".git" ]; then
  echo -e "${GREEN}✓${NC} Git repository initialized"
  
  # Check if remote is set
  if git remote -v | grep -q "origin"; then
    REMOTE=$(git remote get-url origin)
    echo -e "${GREEN}✓${NC} Git remote configured: $REMOTE"
  else
    echo -e "${YELLOW}⚠${NC} Git remote not configured"
    echo -e "   ${YELLOW}→${NC} Run: git remote add origin YOUR_REPO_URL"
  fi
else
  echo -e "${YELLOW}⚠${NC} Git not initialized"
  echo -e "   ${YELLOW}→${NC} Run: git init"
fi

echo ""

# 7. Try a test build
echo "🏗️  Testing build process..."

if [ -d "node_modules" ]; then
  echo "Running: npm run build"
  if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build successful!"
    
    # Check dist folder
    if [ -d "dist" ]; then
      SIZE=$(du -sh dist | cut -f1)
      echo -e "${GREEN}✓${NC} Build output: dist/ ($SIZE)"
    fi
  else
    echo -e "${RED}✗${NC} Build failed! Run 'npm run build' to see errors"
    ISSUES=$((ISSUES + 1))
  fi
else
  echo -e "${YELLOW}⚠${NC} Skipping build test (node_modules not found)"
  echo -e "   ${YELLOW}→${NC} Run: npm install && npm run build"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final summary
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ SUCCESS!${NC} Your project is ready for deployment! 🚀"
  echo ""
  echo "Next steps:"
  echo "  1. Push to GitHub: git push origin main"
  echo "  2. Deploy to Vercel: See /DEPLOY_NOW_VERCEL.md"
  echo "  3. Configure env variables in Vercel dashboard"
  echo ""
else
  echo -e "${RED}❌ ISSUES FOUND:${NC} $ISSUES issue(s) need to be fixed"
  echo ""
  echo "Please fix the issues above before deploying."
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "  - Full guide: /DEPLOYMENT_COMPLETE_GUIDE.md"
echo "  - Quick start: /DEPLOY_NOW_VERCEL.md"
echo "  - Environment: .env.example"
echo ""

exit $ISSUES
