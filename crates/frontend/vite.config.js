import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: isDev ? {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      } : undefined,
      // Enable HMR
      hmr: {
        overlay: true,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
