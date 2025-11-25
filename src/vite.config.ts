import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { Buffer } from 'buffer';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      '@scure/bip39',
      '@scure/bip32',
      '@noble/hashes',
      'tweetnacl',
      'bs58',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [],
    },
    // Exclude backend/server files
    exclude: ['supabase'],
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'crypto-libs': [
            '@scure/bip39',
            '@scure/bip32',
            '@noble/hashes',
            'tweetnacl',
            'bs58',
          ],
        },
      },
      // Exclude backend files from bundle
      external: [/^\/supabase\//],
    },
  },
});