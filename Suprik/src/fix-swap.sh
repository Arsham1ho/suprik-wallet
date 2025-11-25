#!/bin/bash

# Replace all occurrences of Raydium-related variables with Jupiter

sed -i 's/useRaydium/useJupiter/g' /components/pages/Swap.tsx
sed -i 's/raydiumQuote/jupiterQuote/g' /components/pages/Swap.tsx
sed -i 's/getRaydiumQuoteData/getJupiterQuoteData/g' /components/pages/Swap.tsx
sed -i 's/handleRaydiumSwap/handleJupiterSwap/g' /components/pages/Swap.tsx
sed -i 's/Raydium/Jupiter/g' /components/pages/Swap.tsx

echo "✅ All replacements completed!"
