// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'

export default defineConfig({
  plugins: [react()],
  // OneDrive 폴더에서 권한 문제 해결을 위해 캐시 디렉토리를 임시 폴더로 변경
  cacheDir: path.join(os.tmpdir(), 'vite-cache'),
  server: {
    port: 5173, // 포트 5173으로 고정
    strictPort: true, // 포트가 사용 중이면 에러 발생 (자동으로 다른 포트 사용 안함)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})


