import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',  // Phase 6: relative paths for Vercel/Netlify
  server: {
    allowedHosts: ['.tunne.gg', '.tunnl.gg', '.pinggy.io', 'tunne.gg', 'tunnl.gg', 'free.pinggy.io']
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app_icon.png'],
      workbox: {
        // Phase 5: Cache app shell for instant offline loading
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'Chill-Arai',
        short_name: 'Chill-Arai',
        description: 'Your private, offline-first personal finance tracker.',
        theme_color: '#FDF7EC',
        background_color: '#12110D',
        display: 'standalone',
        orientation: 'portrait',
        // Phase 5: App Shortcuts
        shortcuts: [
          {
            name: 'Add Expense',
            short_name: 'Expense',
            description: 'Quickly record a new expense',
            url: '/?action=add-expense',
            icons: [{ src: 'app_icon.png', sizes: '96x96' }],
          },
          {
            name: 'Split Bill',
            short_name: 'Split',
            description: 'Split a bill with friends',
            url: '/?action=split-bill',
            icons: [{ src: 'app_icon.png', sizes: '96x96' }],
          },
        ],
        icons: [
          {
            src: 'app_icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'app_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
