import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // ב-dev הדפדפן פונה ל-/api באותו origin ו-Vite מעביר לשרת ה-C#.
  // כך אין צורך ב-CORS בשרת בזמן פיתוח.
  const target = env.API_PROXY_TARGET || 'https://localhost:7000'

  return {
    resolve: { alias: { '~': path.resolve(__dirname, 'src') } },
    server: {
      proxy: {
        '/api': { target, changeOrigin: true, secure: false },
      },
    },
    plugins: [
      tanstackStart(), // חייב לבוא לפני react()
      viteReact(),
      tailwindcss(),
    ],
  }
})
