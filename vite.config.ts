import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 프로젝트 페이지(<계정>.github.io/ATOMIC/)에 올리므로 서브경로를 기준으로 삼는다.
// 개발·preview 서버도 같은 경로를 쓴다 — http://localhost:5173/ATOMIC/
const BASE = '/ATOMIC/'

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'ATOMIC — 주기율표 마스터',
        short_name: 'ATOMIC',
        description: '118개 원소를 게임처럼 익히는 주기율표 학습 게임',
        lang: 'ko',
        start_url: BASE,
        scope: BASE,
        id: BASE,
        display: 'standalone',
        orientation: 'any',
        background_color: '#060b16',
        theme_color: '#0ea5e9',
        categories: ['education', 'games'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: `${BASE}index.html`,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
