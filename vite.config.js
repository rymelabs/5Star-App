import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk size warning at 500KB
    chunkSizeWarningLimit: 500,
    // Disable source maps in production for smaller bundles
    sourcemap: false,
    // Rollup options for manual chunking
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase chunk (loaded by most pages)
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/messaging'
          ],
          // UI libraries chunk
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // Charts chunk (only needed on stats pages)
          'vendor-charts': ['recharts'],
        },
      },
    },
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
})
