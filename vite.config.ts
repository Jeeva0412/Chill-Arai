import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['.tunne.gg', '.tunnl.gg', '.pinggy.io', 'tunne.gg', 'tunnl.gg', 'free.pinggy.io']
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app_icon.png'],
      manifest: {
        name: 'Chill-Arai',
        short_name: 'Chill-Arai',
        description: 'Track your personal money flow, expenses, and lent money.',
        theme_color: '#ffffff',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'app_icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
