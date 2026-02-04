import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@docs': path.resolve(__dirname, './docs'),
    },
  },
  assetsInclude: ['**/*.md'],
  server: {
    https: true,
    // 如果需要自定义证书和密钥，取消下面的注释
    // key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
    // cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
  },
})
