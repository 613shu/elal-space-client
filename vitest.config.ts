import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// קובץ נפרד מ-vite.config.ts: הבדיקות לא צריכות את תוספי TanStack Start
export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
