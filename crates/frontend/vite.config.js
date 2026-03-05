import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: isDev ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
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
